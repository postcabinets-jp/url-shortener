import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "@/app/actions/workspace";
import { getLinks } from "@/app/actions/links";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Link2 } from "lucide-react";
import LinkTableRow from "@/components/dashboard/link-table-row";

export default async function LinksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspaceData = await getWorkspace(user.id);
  if (!workspaceData) redirect("/dashboard");

  const links = await getLinks(workspaceData.workspace.id);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Get click counts
  let clicksByLink: Record<string, number> = {};
  if (links.length > 0) {
    const { data: clicks } = await supabase
      .from("clicks")
      .select("link_id")
      .in("link_id", links.map((l) => l.id));

    if (clicks) {
      for (const c of clicks) {
        clicksByLink[c.link_id] = (clicksByLink[c.link_id] ?? 0) + 1;
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Links</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{links.length} link{links.length !== 1 ? "s" : ""} total</p>
        </div>
        <Link href="/dashboard/links/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Link
          </Button>
        </Link>
      </div>

      {links.length === 0 ? (
        <Card className="p-16 text-center">
          <Link2 className="h-10 w-10 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-zinc-900">No links yet</h3>
          <p className="text-sm text-zinc-500 mt-1 mb-4">Create your first shortened link to get started.</p>
          <Link href="/dashboard/links/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Link
            </Button>
          </Link>
        </Card>
      ) : (
        <Card className="divide-y divide-zinc-100">
          {links.map((link) => (
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
  );
}
