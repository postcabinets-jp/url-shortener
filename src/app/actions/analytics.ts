"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { ActionResult } from "./links";
import type { Click } from "@/types/database";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const trackClickSchema = z.object({
  linkId: z.string().uuid(),
  referrer: z.string().max(2048).optional(),
  country: z.string().max(100).optional(),
  city: z.string().max(200).optional(),
  deviceType: z.enum(["mobile", "desktop", "tablet", "bot", "unknown"]).optional(),
  browser: z.string().max(200).optional(),
  os: z.string().max(200).optional(),
  ipHash: z.string().max(128).optional(),
});

const analyticsQuerySchema = z.object({
  linkId: z.string().uuid(),
  days: z.coerce.number().int().min(1).max(365).default(30),
});

const workspaceAnalyticsSchema = z.object({
  workspaceId: z.string().uuid(),
  days: z.coerce.number().int().min(1).max(365).default(30),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TrackClickInput = z.infer<typeof trackClickSchema>;

export type ClickTimeseries = { date: string; count: number }[];

export type LinkAnalytics = {
  totalClicks: number;
  clicksByDay: ClickTimeseries;
  topReferrers: { referrer: string; count: number }[];
  topCountries: { country: string; count: number }[];
  deviceBreakdown: { device: string; count: number }[];
  topBrowsers: { browser: string; count: number }[];
  topOS: { os: string; count: number }[];
  recentClicks: Click[];
};

export type WorkspaceAnalytics = {
  totalClicks: number;
  totalLinks: number;
  activeLinks: number;
  clicksByDay: ClickTimeseries;
  topLinks: { linkId: string; slug: string; title: string | null; clicks: number }[];
  topReferrers: { referrer: string; count: number }[];
  topCountries: { country: string; count: number }[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countAndSort<T>(items: T[], keyFn: (item: T) => string, limit = 10) {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const val = keyFn(item) || "Unknown";
    counts[val] = (counts[val] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => ({ key, count }));
}

function buildTimeseries(clicks: { clicked_at: string }[], days: number): ClickTimeseries {
  const series: Record<string, number> = {};
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    series[d.toISOString().split("T")[0]] = 0;
  }

  for (const click of clicks) {
    const day = click.clicked_at.split("T")[0];
    if (day in series) {
      series[day]++;
    }
  }

  return Object.entries(series).map(([date, count]) => ({ date, count }));
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Record a click event. Uses service client to bypass RLS for insert.
 * Called from the redirect page (server component).
 */
export async function trackClick(
  input: TrackClickInput
): Promise<ActionResult<void>> {
  const parsed = trackClickSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }
  const data = parsed.data;

  // Use service client for insert -- clicks_insert_all policy allows anon,
  // but service client avoids auth requirements entirely for the redirect path
  const supabase = await createServiceClient();

  const { error } = await supabase.from("clicks").insert({
    link_id: data.linkId,
    referrer: data.referrer ?? null,
    country: data.country ?? null,
    city: data.city ?? null,
    device_type: data.deviceType ?? "unknown",
    browser: data.browser ?? null,
    os: data.os ?? null,
    ip_hash: data.ipHash ?? null,
  });

  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

/**
 * Get analytics for a single link. Requires workspace membership via RLS.
 */
export async function getLinkAnalytics(
  linkId: string,
  days = 30
): Promise<ActionResult<LinkAnalytics>> {
  const parsed = analyticsQuerySchema.safeParse({ linkId, days });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const since = new Date();
  since.setDate(since.getDate() - parsed.data.days);

  const { data: clicks, error } = await supabase
    .from("clicks")
    .select("*")
    .eq("link_id", parsed.data.linkId)
    .gte("clicked_at", since.toISOString())
    .order("clicked_at", { ascending: false });

  if (error) return { success: false, error: error.message };

  const allClicks = clicks ?? [];

  return {
    success: true,
    data: {
      totalClicks: allClicks.length,
      clicksByDay: buildTimeseries(allClicks, parsed.data.days),
      topReferrers: countAndSort(allClicks, (c) => c.referrer ?? "Direct").map(
        ({ key, count }) => ({ referrer: key, count })
      ),
      topCountries: countAndSort(allClicks, (c) => c.country ?? "Unknown").map(
        ({ key, count }) => ({ country: key, count })
      ),
      deviceBreakdown: countAndSort(allClicks, (c) => c.device_type ?? "unknown").map(
        ({ key, count }) => ({ device: key, count })
      ),
      topBrowsers: countAndSort(allClicks, (c) => c.browser ?? "Unknown").map(
        ({ key, count }) => ({ browser: key, count })
      ),
      topOS: countAndSort(allClicks, (c) => c.os ?? "Unknown").map(
        ({ key, count }) => ({ os: key, count })
      ),
      recentClicks: allClicks.slice(0, 50),
    },
  };
}

/**
 * Get analytics aggregated across all links in a workspace.
 */
export async function getWorkspaceAnalytics(
  workspaceId: string,
  days = 30
): Promise<ActionResult<WorkspaceAnalytics>> {
  const parsed = workspaceAnalyticsSchema.safeParse({ workspaceId, days });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // Get workspace links
  const { data: links, error: linksError } = await supabase
    .from("links")
    .select("id, slug, title, active")
    .eq("workspace_id", parsed.data.workspaceId);

  if (linksError) return { success: false, error: linksError.message };
  if (!links || links.length === 0) {
    return {
      success: true,
      data: {
        totalClicks: 0,
        totalLinks: 0,
        activeLinks: 0,
        clicksByDay: buildTimeseries([], parsed.data.days),
        topLinks: [],
        topReferrers: [],
        topCountries: [],
      },
    };
  }

  const linkIds = links.map((l) => l.id);
  const since = new Date();
  since.setDate(since.getDate() - parsed.data.days);

  const { data: clicks, error: clicksError } = await supabase
    .from("clicks")
    .select("*")
    .in("link_id", linkIds)
    .gte("clicked_at", since.toISOString())
    .order("clicked_at", { ascending: false });

  if (clicksError) return { success: false, error: clicksError.message };

  const allClicks = clicks ?? [];

  // Count clicks per link
  const clicksPerLink: Record<string, number> = {};
  for (const c of allClicks) {
    clicksPerLink[c.link_id] = (clicksPerLink[c.link_id] ?? 0) + 1;
  }

  const topLinks = links
    .map((l) => ({
      linkId: l.id,
      slug: l.slug,
      title: l.title,
      clicks: clicksPerLink[l.id] ?? 0,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  return {
    success: true,
    data: {
      totalClicks: allClicks.length,
      totalLinks: links.length,
      activeLinks: links.filter((l) => l.active).length,
      clicksByDay: buildTimeseries(allClicks, parsed.data.days),
      topLinks,
      topReferrers: countAndSort(allClicks, (c) => c.referrer ?? "Direct").map(
        ({ key, count }) => ({ referrer: key, count })
      ),
      topCountries: countAndSort(allClicks, (c) => c.country ?? "Unknown").map(
        ({ key, count }) => ({ country: key, count })
      ),
    },
  };
}

/**
 * Get click count for a single link. Lightweight alternative to full analytics.
 */
export async function getClickCount(linkId: string): Promise<number> {
  const idParsed = z.string().uuid().safeParse(linkId);
  if (!idParsed.success) return 0;

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("clicks")
    .select("id", { count: "exact", head: true })
    .eq("link_id", linkId);

  if (error) return 0;
  return count ?? 0;
}
