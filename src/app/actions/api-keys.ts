"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createHash, randomBytes } from "crypto";
import type { ActionResult } from "./links";
import type { ApiKey } from "@/types/database";

export type CreateApiKeyResult = {
  apiKey: ApiKey;
  rawKey: string; // only shown once
};

export async function createApiKey(
  workspaceId: string,
  name: string
): Promise<ActionResult<CreateApiKeyResult>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // Generate a secure random key: sl_live_<64 hex chars>
  const rawKey = `sl_live_${randomBytes(32).toString("hex")}`;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      workspace_id: workspaceId,
      name,
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
