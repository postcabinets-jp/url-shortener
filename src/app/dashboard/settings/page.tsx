import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "@/app/actions/workspace";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import UpdateWorkspaceNameForm from "@/components/forms/update-workspace-name-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspaceData = await getWorkspace(user.id);
  if (!workspaceData) redirect("/dashboard");

  const isOwner = workspaceData.role === "owner";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Settings</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Manage your workspace configuration</p>
      </div>

      {/* Workspace name */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-4">Workspace</h2>
        <div className="space-y-4">
          <UpdateWorkspaceNameForm
            workspaceId={workspaceData.workspace.id}
            currentName={workspaceData.workspace.name}
            isOwner={isOwner}
          />
          <div>
            <p className="text-xs text-zinc-500 mb-1">Workspace ID</p>
            <code className="text-xs font-mono bg-zinc-50 border border-zinc-200 rounded px-2 py-1">
              {workspaceData.workspace.id}
            </code>
          </div>
        </div>
      </Card>

      {/* Plan */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-3">Plan</h2>
        <div className="flex items-center gap-2">
          <Badge className="bg-zinc-900 text-white capitalize">
            {workspaceData.workspace.plan}
          </Badge>
          <span className="text-sm text-zinc-500">
            — Unlimited links, unlimited custom domains, free forever
          </span>
        </div>
      </Card>

      {/* Account */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-3">Account</h2>
        <div className="space-y-2">
          <p className="text-sm text-zinc-500">
            Email: <span className="text-zinc-900 font-medium">{user.email}</span>
          </p>
          <p className="text-sm text-zinc-500">
            Role: <span className="text-zinc-900 font-medium capitalize">{workspaceData.role}</span>
          </p>
        </div>
      </Card>

      {/* Danger zone */}
      {isOwner && (
        <>
          <Separator />
          <Card className="p-5 border-red-200 bg-red-50">
            <h2 className="text-sm font-semibold text-red-900 mb-2">Danger Zone</h2>
            <p className="text-sm text-red-700 mb-3">
              Deleting your workspace will permanently remove all links, domains, and analytics. This cannot be undone.
            </p>
            <button
              className="text-sm font-medium text-red-600 underline hover:text-red-800 transition-colors"
              onClick={() => alert("Contact support to delete your workspace: support@snip.link")}
            >
              Delete workspace
            </button>
          </Card>
        </>
      )}
    </div>
  );
}
