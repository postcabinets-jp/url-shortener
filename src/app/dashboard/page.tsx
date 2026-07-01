import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "@/app/actions/workspace";
import { getLinks } from "@/app/actions/links";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Link2, MousePointerClick, TrendingUp, Copy, ExternalLink, ToggleLeft } from "lucide-react";
import LinkTableRow from "@/components/dashboard/link-table-row";
import QuickCreateForm from "@/components/dashboard/quick-create-form";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspaceData = await getWorkspace(user.id);
  if (!workspaceData) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-zinc-500">No workspace found. Please contact support.</p>
      </div>
    );
  }

  const links = await getLinks(workspaceData.workspace.id);

  // Aggregate click counts
  const linkIds = links.map((l) => l.id);
  let totalClicks = 0;
  let clicksByLink: Record<string, number> = {};

  if (linkIds.length > 0) {
    const { data: clickCounts } = await supabase
      .from("clicks")
      .select("link_id")
      .in("link_id", linkIds);

    if (clickCounts) {
      for (const c of clickCounts) {
        clicksByLink[c.link_id] = (clicksByLink[c.link_id] ?? 0) + 1;
        totalClicks++;
      }
    }
  }

  const activeLinks = links.filter((l) => l.active).length;
  const recentLinks = links.slice(0, 5);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Overview</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Track and manage your shortened links</p>
        </div>
        <Link href="/dashboard/links/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Link
          </Button>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Link2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-zinc-500">Total Links</p>
              <p className="text-2xl font-bold text-zinc-900">{links.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50">
              <MousePointerClick className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-zinc-500">Total Clicks</p>
              <p className="text-2xl font-bold text-zinc-900">{totalClicks.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-zinc-500">Active Links</p>
              <p className="text-2xl font-bold text-zinc-900">{activeLinks}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick create */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-3">Quick shorten</h2>
        <QuickCreateForm workspaceId={workspaceData.workspace.id} />
      </Card>

      {/* Recent links */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-900">Recent links</h2>
          {links.length > 5 && (
            <Link href="/dashboard/links" className="text-xs text-zinc-500 hover:text-zinc-900">
              View all →
            </Link>
          )}
        </div>

        {links.length === 0 ? (
          <Card className="p-10 text-center">
            <Link2 className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">No links yet. Create your first one above.</p>
          </Card>
        ) : (
          <Card className="divide-y divide-zinc-100">
            {recentLinks.map((link) => (
              <LinkTableRow
                key={link.id}
                link={link}
                clicks={clicksByLink[link.id] ?? 0}
                appUrl={appUrl}
              />
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
