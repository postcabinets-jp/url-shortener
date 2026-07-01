-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Workspaces
-- ============================================================
CREATE TABLE workspaces (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  plan        text NOT NULL DEFAULT 'free',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_members_select"
  ON workspaces FOR SELECT
  USING (
    id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "workspace_owner_update"
  ON workspaces FOR UPDATE
  USING (
    id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "workspace_owner_delete"
  ON workspaces FOR DELETE
  USING (
    id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Allow insert for authenticated users (creating their first workspace on register)
CREATE POLICY "workspace_authenticated_insert"
  ON workspaces FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- Workspace Members
-- ============================================================
CREATE TABLE workspace_members (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role          text NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_by    uuid REFERENCES auth.users(id),
  joined_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_members_self_select"
  ON workspace_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "workspace_members_same_workspace_select"
  ON workspace_members FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "workspace_members_owner_insert"
  ON workspace_members FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm
      WHERE wm.user_id = auth.uid() AND wm.role = 'owner'
    )
    OR
    -- Allow inserting self as owner when creating new workspace
    (user_id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "workspace_members_owner_update"
  ON workspace_members FOR UPDATE
  USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm
      WHERE wm.user_id = auth.uid() AND wm.role = 'owner'
    )
  );

CREATE POLICY "workspace_members_owner_delete"
  ON workspace_members FOR DELETE
  USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM workspace_members wm
      WHERE wm.user_id = auth.uid() AND wm.role = 'owner'
    )
    AND user_id != auth.uid() -- owner cannot remove themselves
  );

-- ============================================================
-- Profiles (extends auth.users)
-- ============================================================
CREATE TABLE profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_self_select"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles_self_insert"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_self_update"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- ============================================================
-- Domains
-- ============================================================
CREATE TABLE domains (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id       uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  hostname           text UNIQUE NOT NULL,
  verified           boolean NOT NULL DEFAULT false,
  verification_token text NOT NULL DEFAULT encode(gen_random_bytes(20), 'hex'),
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX domains_workspace_id_idx ON domains(workspace_id);

ALTER TABLE domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "domains_workspace_member_select"
  ON domains FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "domains_workspace_editor_insert"
  ON domains FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  );

CREATE POLICY "domains_workspace_editor_update"
  ON domains FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  );

CREATE POLICY "domains_workspace_editor_delete"
  ON domains FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  );

-- ============================================================
-- Links
-- ============================================================
CREATE TABLE links (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  domain_id       uuid REFERENCES domains(id) ON DELETE SET NULL,
  slug            text NOT NULL,
  destination_url text NOT NULL,
  title           text,
  tags            text[] NOT NULL DEFAULT '{}',
  password_hash   text,
  expires_at      timestamptz,
  max_clicks      integer,
  active          boolean NOT NULL DEFAULT true,
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  utm_term        text,
  utm_content     text,
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (domain_id, slug),
  CONSTRAINT slug_format CHECK (slug ~ '^[a-zA-Z0-9_-]{3,64}$')
);

CREATE INDEX links_workspace_id_idx ON links(workspace_id);
CREATE INDEX links_slug_idx ON links(slug);
CREATE INDEX links_created_at_idx ON links(created_at DESC);
CREATE INDEX links_domain_id_slug_idx ON links(domain_id, slug);

ALTER TABLE links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "links_workspace_member_select"
  ON links FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "links_workspace_editor_insert"
  ON links FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  );

CREATE POLICY "links_workspace_editor_update"
  ON links FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  );

CREATE POLICY "links_workspace_editor_delete"
  ON links FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  );

-- Public select for redirect (no auth required for slug lookup)
CREATE POLICY "links_public_active_select"
  ON links FOR SELECT
  USING (active = true);

-- ============================================================
-- Clicks (insert-only analytics)
-- ============================================================
CREATE TABLE clicks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id     uuid NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  clicked_at  timestamptz NOT NULL DEFAULT now(),
  country     text,
  city        text,
  referrer    text,
  device_type text CHECK (device_type IN ('mobile', 'desktop', 'tablet', 'bot', 'unknown')),
  browser     text,
  os          text,
  ip_hash     text
);

CREATE INDEX clicks_link_id_clicked_at_idx ON clicks(link_id, clicked_at DESC);
CREATE INDEX clicks_clicked_at_idx ON clicks(clicked_at DESC);

ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clicks_workspace_member_select"
  ON clicks FOR SELECT
  USING (
    link_id IN (
      SELECT l.id FROM links l
      JOIN workspace_members wm ON wm.workspace_id = l.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

-- Service role or anon can insert (for edge function redirect handler)
CREATE POLICY "clicks_insert_all"
  ON clicks FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- API Keys
-- ============================================================
CREATE TABLE api_keys (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name          text NOT NULL,
  key_hash      text NOT NULL UNIQUE,
  last_used_at  timestamptz,
  created_by    uuid NOT NULL REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz
);

CREATE INDEX api_keys_workspace_id_idx ON api_keys(workspace_id);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_keys_owner_only"
  ON api_keys FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================================
-- Auto-update updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_links_updated_at
  BEFORE UPDATE ON links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Auto-create profile on user signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
