"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import type { Link } from "@/types/database";

export type CreateLinkInput = {
  workspaceId: string;
  destinationUrl: string;
  slug?: string;
  title?: string;
  tags?: string[];
  domainId?: string;
  password?: string;
  expiresAt?: string;
  maxClicks?: number;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
};

export type UpdateLinkInput = Partial<CreateLinkInput> & { active?: boolean };

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createLink(
  input: CreateLinkInput
): Promise<ActionResult<Link>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const slug = input.slug || nanoid(7);

  // Validate slug format
  if (!/^[a-zA-Z0-9_-]{3,64}$/.test(slug)) {
    return { success: false, error: "Slug must be 3-64 characters (letters, numbers, - _)" };
  }

  // Check slug collision
  const slugQuery = supabase.from("links").select("id").eq("slug", slug);
  const { data: existing } = input.domainId
    ? await slugQuery.eq("domain_id", input.domainId).maybeSingle()
    : await slugQuery.is("domain_id", null).maybeSingle();

  if (existing) {
    return { success: false, error: "This alias is already taken. Try another one." };
  }

  let passwordHash: string | null = null;
  if (input.password) {
    passwordHash = await bcrypt.hash(input.password, 10);
  }

  const { data, error } = await supabase
    .from("links")
    .insert({
      workspace_id: input.workspaceId,
      domain_id: input.domainId ?? null,
      slug,
      destination_url: input.destinationUrl,
      title: input.title ?? null,
      tags: input.tags ?? [],
      password_hash: passwordHash,
      expires_at: input.expiresAt ?? null,
      max_clicks: input.maxClicks ?? null,
      utm_source: input.utmSource ?? null,
      utm_medium: input.utmMedium ?? null,
      utm_campaign: input.utmCampaign ?? null,
      utm_term: input.utmTerm ?? null,
      utm_content: input.utmContent ?? null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  return { success: true, data };
}

export async function updateLink(
  linkId: string,
  input: UpdateLinkInput
): Promise<ActionResult<Link>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const passwordHash = input.password !== undefined
    ? (input.password ? await bcrypt.hash(input.password, 10) : null)
    : undefined;

  const updates = {
    updated_at: new Date().toISOString(),
    ...(input.destinationUrl !== undefined && { destination_url: input.destinationUrl }),
    ...(input.title !== undefined && { title: input.title }),
    ...(input.tags !== undefined && { tags: input.tags }),
    ...(input.active !== undefined && { active: input.active }),
    ...(input.expiresAt !== undefined && { expires_at: input.expiresAt }),
    ...(input.maxClicks !== undefined && { max_clicks: input.maxClicks }),
    ...(input.utmSource !== undefined && { utm_source: input.utmSource }),
    ...(input.utmMedium !== undefined && { utm_medium: input.utmMedium }),
    ...(input.utmCampaign !== undefined && { utm_campaign: input.utmCampaign }),
    ...(input.utmTerm !== undefined && { utm_term: input.utmTerm }),
    ...(input.utmContent !== undefined && { utm_content: input.utmContent }),
    ...(passwordHash !== undefined && { password_hash: passwordHash }),
  };

  const { data, error } = await supabase
    .from("links")
    .update(updates)
    .eq("id", linkId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/links/${linkId}`);
  return { success: true, data };
}

export async function deleteLink(linkId: string): Promise<ActionResult<void>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase.from("links").delete().eq("id", linkId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

export async function toggleLinkActive(
  linkId: string,
  active: boolean
): Promise<ActionResult<void>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("links")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", linkId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

export async function getLinks(workspaceId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("links")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getLinkWithClicks(linkId: string) {
  const supabase = await createClient();
  const { data: link, error } = await supabase
    .from("links")
    .select("*")
    .eq("id", linkId)
    .single();

  if (error) throw new Error(error.message);

  const { data: clicks } = await supabase
    .from("clicks")
    .select("*")
    .eq("link_id", linkId)
    .order("clicked_at", { ascending: false })
    .limit(1000);

  return { link, clicks: clicks ?? [] };
}
