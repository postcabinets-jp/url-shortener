"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./links";
import type { Domain } from "@/types/database";

export async function addDomain(
  workspaceId: string,
  hostname: string
): Promise<ActionResult<Domain>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // Basic hostname validation
  const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!hostnameRegex.test(hostname)) {
    return { success: false, error: "Invalid hostname format" };
  }

  const { data, error } = await supabase
    .from("domains")
    .insert({ workspace_id: workspaceId, hostname: hostname.toLowerCase() })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "This domain is already registered" };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/domains");
  return { success: true, data };
}

export async function verifyDomain(domainId: string): Promise<ActionResult<Domain>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: domain } = await supabase
    .from("domains")
    .select("*")
    .eq("id", domainId)
    .single();

  if (!domain) return { success: false, error: "Domain not found" };

  // In production: check DNS TXT record via a DNS lookup service
  // For demo purposes, we simulate verification
  const dnsVerified = await simulateDnsVerification(domain.hostname, domain.verification_token);

  if (!dnsVerified) {
    return {
      success: false,
      error: `DNS verification failed. Add a TXT record: _sniplink.${domain.hostname} → ${domain.verification_token}`,
    };
  }

  const { data, error } = await supabase
    .from("domains")
    .update({ verified: true })
    .eq("id", domainId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/domains");
  return { success: true, data };
}

async function simulateDnsVerification(_hostname: string, _token: string): Promise<boolean> {
  // In production: use dns.promises.resolve or a DNS API
  // For development, return false to show the verification flow
  return false;
}

export async function deleteDomain(domainId: string): Promise<ActionResult<void>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase.from("domains").delete().eq("id", domainId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/domains");
  return { success: true, data: undefined };
}

export async function getDomains(workspaceId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("domains")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}
