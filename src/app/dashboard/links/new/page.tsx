import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "@/app/actions/workspace";
import { getDomains } from "@/app/actions/domains";
import CreateLinkForm from "@/components/forms/create-link-form";

export default async function NewLinkPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspaceData = await getWorkspace(user.id);
  if (!workspaceData) redirect("/dashboard");

  const domains = await getDomains(workspaceData.workspace.id);
  const verifiedDomains = domains.filter((d) => d.verified);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">New Link</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Shorten a URL and configure tracking options</p>
      </div>

      <CreateLinkForm
        workspaceId={workspaceData.workspace.id}
        domains={verifiedDomains}
        appUrl={process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}
      />
    </div>
  );
}
