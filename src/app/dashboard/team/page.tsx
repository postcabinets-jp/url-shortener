import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace, getWorkspaceMembers } from "@/app/actions/workspace";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import TeamMemberActions from "@/components/dashboard/team-member-actions";

export default async function TeamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspaceData = await getWorkspace(user.id);
  if (!workspaceData) redirect("/dashboard");

  const members = await getWorkspaceMembers(workspaceData.workspace.id);
  const isOwner = workspaceData.role === "owner";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Team</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Manage members of <strong>{workspaceData.workspace.name}</strong></p>
      </div>

      <Card className="divide-y divide-zinc-100">
        {members.map((member) => {
          const name = member.profile?.full_name ?? "Unknown";
          const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
          const isCurrentUser = member.user_id === user.id;

          return (
            <div key={member.id} className="flex items-center gap-4 px-5 py-4">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-sm bg-zinc-100 text-zinc-700">
                  {initials || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900">
                  {name}
                  {isCurrentUser && <span className="ml-2 text-xs text-zinc-400">(you)</span>}
                </p>
                <p className="text-xs text-zinc-400">
                  Joined {new Date(member.joined_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <Badge
                variant="outline"
                className={
                  member.role === "owner"
                    ? "border-zinc-900 text-zinc-900"
                    : member.role === "editor"
                    ? "border-blue-200 text-blue-700 bg-blue-50"
                    : "border-zinc-200 text-zinc-500"
                }
              >
                {member.role}
              </Badge>
              {isOwner && !isCurrentUser && (
                <TeamMemberActions memberId={member.id} currentRole={member.role} />
              )}
            </div>
          );
        })}
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-2">Invite a member</h2>
        <p className="text-sm text-zinc-500">
          Email invitations require a configured email provider. Add{" "}
          <code className="text-xs bg-zinc-100 px-1 py-0.5 rounded">RESEND_API_KEY</code>{" "}
          to your environment to enable invitations.
        </p>
      </Card>
    </div>
  );
}
