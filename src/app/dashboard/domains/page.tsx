import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "@/app/actions/workspace";
import { getDomains } from "@/app/actions/domains";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, CheckCircle, Clock } from "lucide-react";
import AddDomainForm from "@/components/forms/add-domain-form";
import DomainActions from "@/components/dashboard/domain-actions";

export default async function DomainsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspaceData = await getWorkspace(user.id);
  if (!workspaceData) redirect("/dashboard");

  const domains = await getDomains(workspaceData.workspace.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Custom Domains</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Use your own domain for shortened links — free and unlimited</p>
      </div>

      {/* Add domain form */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-3">Add a domain</h2>
        <AddDomainForm workspaceId={workspaceData.workspace.id} />
      </Card>

      {/* Domain list */}
      {domains.length > 0 && (
        <div className="space-y-3">
          {domains.map((domain) => (
            <Card key={domain.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Globe className="h-4 w-4 text-zinc-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-900 text-sm">{domain.hostname}</p>
                    {!domain.verified && (
                      <div className="mt-1.5 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                        <p className="font-medium">DNS verification required</p>
                        <p className="mt-0.5">Add this TXT record to your DNS:</p>
                        <code className="block mt-1 bg-amber-100 px-2 py-1 rounded font-mono">
                          _sniplink.{domain.hostname} → {domain.verification_token}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {domain.verified ? (
                    <Badge variant="outline" className="gap-1 text-green-700 border-green-200 bg-green-50">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-amber-700 border-amber-200 bg-amber-50">
                      <Clock className="h-3 w-3" />
                      Pending
                    </Badge>
                  )}
                  <DomainActions domainId={domain.id} verified={domain.verified} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {domains.length === 0 && (
        <Card className="p-12 text-center">
          <Globe className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">No custom domains yet.</p>
          <p className="text-xs text-zinc-400 mt-1">Add a domain above to use it for your links.</p>
        </Card>
      )}
    </div>
  );
}
