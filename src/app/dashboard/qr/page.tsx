import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "@/app/actions/workspace";
import { getLinks } from "@/app/actions/links";
import { Card } from "@/components/ui/card";
import { QrCode } from "lucide-react";
import QrCodeDisplay from "@/components/dashboard/qr-code-display";

export default async function QrPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspaceData = await getWorkspace(user.id);
  if (!workspaceData) redirect("/dashboard");

  const links = await getLinks(workspaceData.workspace.id);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">QR Codes</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Download QR codes for all your links</p>
      </div>

      {links.length === 0 ? (
        <Card className="p-16 text-center">
          <QrCode className="h-10 w-10 text-zinc-300 mx-auto mb-4" />
          <p className="text-sm text-zinc-500">No links yet. Create a link to generate QR codes.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {links.map((link) => (
            <div key={link.id} className="space-y-2">
              <div className="text-sm font-medium text-zinc-900 truncate">{link.title || link.slug}</div>
              <p className="text-xs text-zinc-400 truncate">{appUrl}/{link.slug}</p>
              <QrCodeDisplay url={`${appUrl}/${link.slug}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
