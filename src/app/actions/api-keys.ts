"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import type { ActionResult } from "./links";
import type { ApiKey } from "@/types/database";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createApiKeySchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().min(1, "Name is required").max(100),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CreateApiKeyResult = {
  apiKey: ApiKey;
  rawKey: string; // only shown once
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function createApiKey(
  workspaceId: string,
  name: string
): Promise<ActionResult<CreateApiKeyResult>> {
  const parsed = createApiKeySchema.safeParse({ workspaceId, name });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // Generate a secure random key: sl_live_<64 hex chars>
  const rawKey = `sl_live_${randomBytes(32).toString("hex")}`;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      workspace_id: parsed.data.workspaceId,
      name: parsed.data.name,
      key_hash: keyHash,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/api-keys");
  return { success: true, data: { apiKey: data, rawKey } };
}

export async function revokeApiKey(keyId: string): Promise<ActionResult<void>> {
  const idParsed = z.string().uuid().safeParse(keyId);
  if (!idParsed.success) return { success: false, error: "Invalid key ID" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase.from("api_keys").delete().eq("id", keyId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/api-keys");
  return { success: true, data: undefined };
}

export async function getApiKeys(workspaceId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("api_keys")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}
