import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/dashboard/sidebar";
import Header from "@/components/dashboard/header";
import { getWorkspace } from "@/app/actions/workspace";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const workspaceData = await getWorkspace(user.id);
  const workspaceName = workspaceData?.workspace?.name ?? "My Workspace";

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="flex h-screen bg-zinc-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          userEmail={user.email ?? ""}
          userName={profile?.full_name}
          workspaceName={workspaceName}
        />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
