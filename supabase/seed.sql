-- ============================================================
-- Seed Data — Realistic sample data for url-shortener
-- Note: Run after creating auth users via Supabase dashboard
-- These UUIDs are placeholders — replace with real auth.users IDs
-- ============================================================

-- Demo workspace
INSERT INTO workspaces (id, name, slug, plan) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Acme Marketing', 'acme-marketing', 'free'),
  ('00000000-0000-0000-0000-000000000002', 'TechStartup Inc.', 'techstartup', 'free');

-- Sample links (workspace 1 — Acme Marketing)
-- Note: created_by must reference real auth.users IDs
-- These are left as comments to show the data structure

/*
INSERT INTO links (workspace_id, slug, destination_url, title, tags, utm_source, utm_medium, utm_campaign, active) VALUES
  ('00000000-0000-0000-0000-000000000001', 'summer24', 'https://acme.com/products/summer-collection-2024', 'Summer Collection 2024', ARRAY['campaign', 'email'], 'newsletter', 'email', 'summer_sale_2024', true),
  ('00000000-0000-0000-0000-000000000001', 'tw-blog', 'https://acme.com/blog/growth-hacking-tips-q3-2024', 'Growth Hacking Tips Blog', ARRAY['social', 'content'], 'twitter', 'social', 'content_marketing', true),
  ('00000000-0000-0000-0000-000000000001', 'signup', 'https://app.acme.com/register?ref=shortlink', 'User Registration Page', ARRAY['acquisition'], 'google', 'cpc', 'brand_search', true),
  ('00000000-0000-0000-0000-000000000001', 'demo-req', 'https://acme.com/request-demo', 'Request Demo Form', ARRAY['sales', 'b2b'], 'linkedin', 'social', 'b2b_outreach', true),
  ('00000000-0000-0000-0000-000000000001', 'pricing', 'https://acme.com/pricing#enterprise', 'Enterprise Pricing Page', ARRAY['sales'], NULL, NULL, NULL, true),
  ('00000000-0000-0000-0000-000000000001', 'g2-review', 'https://www.g2.com/products/acme/reviews', 'G2 Review Page', ARRAY['social-proof'], 'email', 'nurture', 'review_request', true),
  ('00000000-0000-0000-0000-000000000001', 'job-swe', 'https://jobs.acme.com/software-engineer-fullstack-2024', 'Full Stack Engineer Opening', ARRAY['hiring'], 'linkedin', 'organic', 'hiring_q4', true);
*/

-- Custom domains (sample)
INSERT INTO domains (id, workspace_id, hostname, verified, verification_token) VALUES
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'links.acme.co', false, 'verify-token-abc123def456'),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', 'go.acme.co', true, 'verify-token-xyz789uvw012');
