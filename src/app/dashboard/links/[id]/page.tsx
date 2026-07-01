import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getLinkWithClicks } from "@/app/actions/links";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Copy, ExternalLink, QrCode, Shield, Clock, MousePointerClick } from "lucide-react";
import ClickChart from "@/components/charts/click-chart";
import QrCodeDisplay from "@/components/dashboard/qr-code-display";
import EditLinkForm from "@/components/forms/edit-link-form";
import type { Click } from "@/types/database";

type Props = { params: Promise<{ id: string }> };

function groupByDay(clicks: Click[]) {
  const groups: Record<string, number> = {};
  const last30 = new Date();
  last30.setDate(last30.getDate() - 30);

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    groups[key] = 0;
  }

  for (const click of clicks) {
    if (new Date(click.clicked_at) >= last30) {
      const key = click.clicked_at.split("T")[0];
      if (key in groups) groups[key]++;
    }
  }

  return Object.entries(groups).map(([date, count]) => ({ date, count }));
}

function countBy<T>(items: T[], key: keyof T): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const val = String(item[key] ?? "Unknown");
    counts[val] = (counts[val] ?? 0) + 1;
  }
  return counts;
}

export default async function LinkDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let data;
  try {
    data = await getLinkWithClicks(id);
  } catch {
    notFound();
  }

  const { link, clicks } = data;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const shortUrl = `${appUrl}/${link.slug}`;
  const dailyClicks = groupByDay(clicks);
  const deviceCounts = countBy(clicks, "device_type");
  const countryCounts = countBy(clicks, "country");
  const referrerCounts = countBy(clicks, "referrer");
  const topCountries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topReferrers = Object.entries(referrerCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/dashboard/links" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 mb-4">
          <ChevronLeft className="h-4 w-4" />
          Back to Links
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-zinc-900 truncate">
              {link.title || link.slug}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-zinc-500 font-mono">{shortUrl}</span>
              <button
                onClick={undefined}
                className="text-zinc-400 hover:text-zinc-700 transition-colors"
                title="Copy"
              >
                <CopyButton shortUrl={shortUrl} />
              </button>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <a href={shortUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                Open
              </Button>
            </a>
          </div>
        </div>
        {link.tags.length > 0 && (
          <div className="flex gap-1 mt-2">
            {link.tags.map((t) => (
              <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
            ))}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <MousePointerClick className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-zinc-500">Total clicks</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900 mt-1">{clicks.length.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 text-green-500">📱</span>
            <span className="text-xs text-zinc-500">Mobile</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900 mt-1">
            {deviceCounts["mobile"] ?? 0}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            {link.password_hash ? (
              <><Shield className="h-4 w-4 text-amber-500" /><span className="text-xs text-zinc-500">Password</span></>
            ) : (
              <><Clock className="h-4 w-4 text-zinc-400" /><span className="text-xs text-zinc-500">Expires</span></>
            )}
          </div>
          <p className="text-sm font-medium text-zinc-900 mt-1">
            {link.password_hash ? "Protected" : link.expires_at ? new Date(link.expires_at).toLocaleDateString() : "Never"}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Status</span>
          </div>
          <p className="text-sm font-medium mt-1">
            {link.active ? (
              <span className="text-green-600">Active</span>
            ) : (
              <span className="text-zinc-400">Inactive</span>
            )}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analytics */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-zinc-900 mb-4">Clicks — last 30 days</h2>
            <ClickChart data={dailyClicks} />
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-zinc-900 mb-3">Top countries</h3>
              {topCountries.length === 0 ? (
                <p className="text-xs text-zinc-400">No data yet</p>
              ) : (
                <ul className="space-y-2">
                  {topCountries.map(([country, count]) => (
                    <li key={country} className="flex items-center justify-between">
                      <span className="text-sm text-zinc-700">{country === "Unknown" ? "Unknown" : country}</span>
                      <span className="text-sm font-medium text-zinc-900">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-semibold text-zinc-900 mb-3">Top referrers</h3>
              {topReferrers.length === 0 ? (
                <p className="text-xs text-zinc-400">No data yet</p>
              ) : (
                <ul className="space-y-2">
                  {topReferrers.map(([ref, count]) => (
                    <li key={ref} className="flex items-center justify-between">
                      <span className="text-sm text-zinc-700 truncate max-w-[140px]">{ref === "Unknown" ? "Direct" : ref}</span>
                      <span className="text-sm font-medium text-zinc-900">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <QrCodeDisplay url={shortUrl} />
          <EditLinkForm link={link} />
        </div>
      </div>
    </div>
  );
}

function CopyButton({ shortUrl }: { shortUrl: string }) {
  return (
    <button
      onClick={() => navigator.clipboard.writeText(shortUrl)}
      className="ml-1 text-zinc-400 hover:text-zinc-700"
    >
      <Copy className="h-3.5 w-3.5" />
    </button>
  );
}
