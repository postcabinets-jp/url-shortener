"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Link } from "@/types/database";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const slugSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_-]{3,64}$/, "Slug must be 3-64 characters (letters, numbers, - _)");

const createLinkSchema = z.object({
  workspaceId: z.string().uuid(),
  destinationUrl: z.string().url("Invalid URL"),
  slug: slugSchema.optional(),
  title: z.string().max(280).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  domainId: z.string().uuid().optional(),
  password: z.string().min(1).max(128).optional(),
  expiresAt: z.string().optional(),
  maxClicks: z.coerce.number().int().positive().optional(),
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
  utmTerm: z.string().max(200).optional(),
  utmContent: z.string().max(200).optional(),
});

const updateLinkSchema = z.object({
  destinationUrl: z.string().url("Invalid URL").optional(),
  title: z.string().max(280).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  active: z.boolean().optional(),
  domainId: z.string().uuid().optional(),
  password: z.string().max(128).optional(),
  expiresAt: z.string().optional(),
  maxClicks: z.coerce.number().int().positive().optional(),
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
  utmTerm: z.string().max(200).optional(),
  utmContent: z.string().max(200).optional(),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function createLink(
  input: CreateLinkInput
): Promise<ActionResult<Link>> {
  const parsed = createLinkSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const slug = data.slug || nanoid(7);

  if (!/^[a-zA-Z0-9_-]{3,64}$/.test(slug)) {
    return { success: false, error: "Slug must be 3-64 characters (letters, numbers, - _)" };
  }

  // Check slug collision
  const slugQuery = supabase.from("links").select("id").eq("slug", slug);
  const { data: existing } = data.domainId
    ? await slugQuery.eq("domain_id", data.domainId).maybeSingle()
    : await slugQuery.is("domain_id", null).maybeSingle();

  if (existing) {
    return { success: false, error: "This alias is already taken. Try another one." };
  }

  let passwordHash: string | null = null;
  if (data.password) {
    passwordHash = await bcrypt.hash(data.password, 10);
  }

  const { data: link, error } = await supabase
    .from("links")
    .insert({
      workspace_id: data.workspaceId,
      domain_id: data.domainId ?? null,
      slug,
      destination_url: data.destinationUrl,
      title: data.title ?? null,
      tags: data.tags ?? [],
      password_hash: passwordHash,
      expires_at: data.expiresAt ?? null,
      max_clicks: data.maxClicks ?? null,
      utm_source: data.utmSource ?? null,
      utm_medium: data.utmMedium ?? null,
      utm_campaign: data.utmCampaign ?? null,
      utm_term: data.utmTerm ?? null,
      utm_content: data.utmContent ?? null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  return { success: true, data: link };
}

export async function updateLink(
  linkId: string,
  input: UpdateLinkInput
): Promise<ActionResult<Link>> {
  const idParsed = z.string().uuid().safeParse(linkId);
  if (!idParsed.success) {
    return { success: false, error: "Invalid link ID" };
  }

  const parsed = updateLinkSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const passwordHash = data.password !== undefined
    ? (data.password ? await bcrypt.hash(data.password, 10) : null)
    : undefined;

  const updates = {
    updated_at: new Date().toISOString(),
    ...(data.destinationUrl !== undefined && { destination_url: data.destinationUrl }),
    ...(data.title !== undefined && { title: data.title }),
    ...(data.tags !== undefined && { tags: data.tags }),
    ...(data.active !== undefined && { active: data.active }),
    ...(data.expiresAt !== undefined && { expires_at: data.expiresAt }),
    ...(data.maxClicks !== undefined && { max_clicks: data.maxClicks }),
    ...(data.utmSource !== undefined && { utm_source: data.utmSource }),
    ...(data.utmMedium !== undefined && { utm_medium: data.utmMedium }),
    ...(data.utmCampaign !== undefined && { utm_campaign: data.utmCampaign }),
    ...(data.utmTerm !== undefined && { utm_term: data.utmTerm }),
    ...(data.utmContent !== undefined && { utm_content: data.utmContent }),
    ...(passwordHash !== undefined && { password_hash: passwordHash }),
  };

  const { data: link, error } = await supabase
    .from("links")
    .update(updates)
    .eq("id", linkId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/links/${linkId}`);
  return { success: true, data: link };
}

export async function deleteLink(linkId: string): Promise<ActionResult<void>> {
  const idParsed = z.string().uuid().safeParse(linkId);
  if (!idParsed.success) return { success: false, error: "Invalid link ID" };

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
  const idParsed = z.string().uuid().safeParse(linkId);
  if (!idParsed.success) return { success: false, error: "Invalid link ID" };

  const activeParsed = z.boolean().safeParse(active);
  if (!activeParsed.success) return { success: false, error: "Invalid value" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("links")
    .update({ active: activeParsed.data, updated_at: new Date().toISOString() })
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
