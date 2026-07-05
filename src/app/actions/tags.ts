"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { ActionResult } from "./links";
import type { Link } from "@/types/database";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const tagSchema = z.string().min(1).max(50).trim();

const addTagSchema = z.object({
  linkId: z.string().uuid(),
  tag: tagSchema,
});

const removeTagSchema = z.object({
  linkId: z.string().uuid(),
  tag: tagSchema,
});

const renameTagSchema = z.object({
  workspaceId: z.string().uuid(),
  oldTag: tagSchema,
  newTag: tagSchema,
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TagWithCount = {
  tag: string;
  count: number;
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Get all unique tags across a workspace with link counts.
 */
export async function getWorkspaceTags(workspaceId: string): Promise<TagWithCount[]> {
  const idParsed = z.string().uuid().safeParse(workspaceId);
  if (!idParsed.success) return [];

  const supabase = await createClient();
  const { data: links, error } = await supabase
    .from("links")
    .select("tags")
    .eq("workspace_id", workspaceId);

  if (error || !links) return [];

  const tagCounts: Record<string, number> = {};
  for (const link of links) {
    for (const tag of link.tags) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  }

  return Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count }));
}

/**
 * Add a tag to a link.
 */
export async function addTagToLink(
  linkId: string,
  tag: string
): Promise<ActionResult<Link>> {
  const parsed = addTagSchema.safeParse({ linkId, tag });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // Get current tags
  const { data: link, error: fetchError } = await supabase
    .from("links")
    .select("tags")
    .eq("id", parsed.data.linkId)
    .single();

  if (fetchError || !link) return { success: false, error: "Link not found" };

  const currentTags = link.tags ?? [];
  if (currentTags.includes(parsed.data.tag)) {
    return { success: false, error: "Tag already exists on this link" };
  }

  if (currentTags.length >= 20) {
    return { success: false, error: "Maximum 20 tags per link" };
  }

  const { data: updated, error } = await supabase
    .from("links")
    .update({
      tags: [...currentTags, parsed.data.tag],
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.linkId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  return { success: true, data: updated };
}

/**
 * Remove a tag from a link.
 */
export async function removeTagFromLink(
  linkId: string,
  tag: string
): Promise<ActionResult<Link>> {
  const parsed = removeTagSchema.safeParse({ linkId, tag });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: link, error: fetchError } = await supabase
    .from("links")
    .select("tags")
    .eq("id", parsed.data.linkId)
    .single();

  if (fetchError || !link) return { success: false, error: "Link not found" };

  const newTags = (link.tags ?? []).filter((t: string) => t !== parsed.data.tag);

  const { data: updated, error } = await supabase
    .from("links")
    .update({
      tags: newTags,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.linkId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  return { success: true, data: updated };
}

/**
 * Rename a tag across all links in a workspace.
 */
export async function renameTag(
  workspaceId: string,
  oldTag: string,
  newTag: string
): Promise<ActionResult<{ updatedCount: number }>> {
  const parsed = renameTagSchema.safeParse({ workspaceId, oldTag, newTag });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  if (parsed.data.oldTag === parsed.data.newTag) {
    return { success: false, error: "New tag name must be different" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // Get all links with the old tag
  const { data: links, error: fetchError } = await supabase
    .from("links")
    .select("id, tags")
    .eq("workspace_id", parsed.data.workspaceId)
    .contains("tags", [parsed.data.oldTag]);

  if (fetchError) return { success: false, error: fetchError.message };
  if (!links || links.length === 0) {
    return { success: false, error: "No links found with this tag" };
  }

  let updatedCount = 0;
  for (const link of links) {
    const newTags = link.tags.map((t: string) =>
      t === parsed.data.oldTag ? parsed.data.newTag : t
    );

    const { error } = await supabase
      .from("links")
      .update({ tags: newTags, updated_at: new Date().toISOString() })
      .eq("id", link.id);

    if (!error) updatedCount++;
  }

  revalidatePath("/dashboard");
  return { success: true, data: { updatedCount } };
}

/**
 * Delete a tag from all links in a workspace.
 */
export async function deleteTag(
  workspaceId: string,
  tag: string
): Promise<ActionResult<{ updatedCount: number }>> {
  const parsed = z.object({
    workspaceId: z.string().uuid(),
    tag: tagSchema,
  }).safeParse({ workspaceId, tag });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: links, error: fetchError } = await supabase
    .from("links")
    .select("id, tags")
    .eq("workspace_id", parsed.data.workspaceId)
    .contains("tags", [parsed.data.tag]);

  if (fetchError) return { success: false, error: fetchError.message };
  if (!links || links.length === 0) {
    return { success: true, data: { updatedCount: 0 } };
  }

  let updatedCount = 0;
  for (const link of links) {
    const newTags = link.tags.filter((t: string) => t !== parsed.data.tag);

    const { error } = await supabase
      .from("links")
      .update({ tags: newTags, updated_at: new Date().toISOString() })
      .eq("id", link.id);

    if (!error) updatedCount++;
  }

  revalidatePath("/dashboard");
  return { success: true, data: { updatedCount } };
}

/**
 * Get all links with a specific tag.
 */
export async function getLinksByTag(workspaceId: string, tag: string) {
  const parsed = z.object({
    workspaceId: z.string().uuid(),
    tag: tagSchema,
  }).safeParse({ workspaceId, tag });

  if (!parsed.success) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("links")
    .select("*")
    .eq("workspace_id", parsed.data.workspaceId)
    .contains("tags", [parsed.data.tag])
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}
