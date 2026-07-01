import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "@/app/actions/workspace";
import { getApiKeys } from "@/app/actions/api-keys";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Key, ExternalLink } from "lucide-react";
import CreateApiKeyForm from "@/components/forms/create-api-key-form";
import RevokeApiKeyButton from "@/components/dashboard/revoke-api-key-button";

export default async function ApiKeysPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspaceData = await getWorkspace(user.id);
  if (!workspaceData) redirect("/dashboard");

  if (workspaceData.role !== "owner") {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-zinc-500">Only workspace owners can manage API keys.</p>
      </div>
    );
  }

  const apiKeys = await getApiKeys(workspaceData.workspace.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">API Keys</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Use API keys to access the{" "}
          <a href="/api/docs" className="underline hover:text-zinc-900 inline-flex items-center gap-0.5">
            REST API <ExternalLink className="h-3 w-3" />
          </a>
        </p>
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-3">Create new key</h2>
        <CreateApiKeyForm workspaceId={workspaceData.workspace.id} />
      </Card>

      {apiKeys.length > 0 && (
        <Card className="divide-y divide-zinc-100">
          {apiKeys.map((key) => (
            <div key={key.id} className="flex items-center gap-4 px-5 py-4">
              <Key className="h-4 w-4 text-zinc-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900">{key.name}</p>
                <p className="text-xs text-zinc-400">
                  Created {new Date(key.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  {key.last_used_at && (
                    <> · Last used {new Date(key.last_used_at).toLocaleDateString()}</>
                  )}
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-mono text-zinc-500 shrink-0">
                sl_live_••••
              </Badge>
              {key.expires_at && new Date(key.expires_at) < new Date() && (
                <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Expired</Badge>
              )}
              <RevokeApiKeyButton keyId={key.id} />
            </div>
          ))}
        </Card>
      )}

      {apiKeys.length === 0 && (
        <Card className="p-12 text-center">
          <Key className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">No API keys yet.</p>
        </Card>
      )}
    </div>
  );
}
