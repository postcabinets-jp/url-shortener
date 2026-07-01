"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./links";
import type { Workspace, WorkspaceMember } from "@/types/database";

export async function getWorkspace(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", userId)
    .order("joined_at", { ascending: true })
    .limit(1)
    .single();

  if (error || !data) return null;

  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", data.workspace_id)
    .single();

  if (wsError || !workspace) return null;

  return {
    workspace,
    role: data.role,
  };
}

export type MemberWithProfile = WorkspaceMember & {
  profile: { full_name: string | null; avatar_url: string | null } | null;
};

export async function getWorkspaceMembers(workspaceId: string): Promise<MemberWithProfile[]> {
  const supabase = await createClient();
  const { data: members, error } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("joined_at", { ascending: true });

  if (error) throw new Error(error.message);
  if (!members || members.length === 0) return [];

  const userIds = members.map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", userIds);

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

  return members.map((m) => ({
    ...m,
    profile: profileMap.get(m.user_id) ?? null,
  }));
}

export async function updateWorkspaceName(
  workspaceId: string,
  name: string
): Promise<ActionResult<Workspace>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data, error } = await supabase
    .from("workspaces")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", workspaceId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: true, data };
}

export async function inviteMember(
  _workspaceId: string,
  _email: string,
  _role: "editor" | "viewer"
): Promise<ActionResult<void>> {
  return {
    success: false,
    error: "Email invitations require a configured email provider (Resend). Add RESEND_API_KEY to enable this feature.",
  };
}

export async function updateMemberRole(
  memberId: string,
  role: "editor" | "viewer"
): Promise<ActionResult<WorkspaceMember>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data, error } = await supabase
    .from("workspace_members")
    .update({ role })
    .eq("id", memberId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/team");
  return { success: true, data };
}

export async function removeMember(memberId: string): Promise<ActionResult<void>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("id", memberId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/team");
  return { success: true, data: undefined };
}
