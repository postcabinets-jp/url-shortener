import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { trackClick } from "@/app/actions/analytics";
import PasswordGate from "./password-gate";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ pw?: string }>;
};

export default async function RedirectPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { pw: passwordAttempt } = await searchParams;

  const supabase = await createClient();

  const { data: link } = await supabase
    .from("links")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .is("domain_id", null) // default domain only
    .maybeSingle();

  if (!link) {
    notFound();
  }

  // Check expiry
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900">Link Expired</h1>
          <p className="mt-2 text-zinc-500">This link is no longer available.</p>
        </div>
      </div>
    );
  }

  // Check max clicks
  if (link.max_clicks) {
    const { count } = await supabase
      .from("clicks")
      .select("id", { count: "exact", head: true })
      .eq("link_id", link.id);

    if (count && count >= link.max_clicks) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-zinc-900">Link Limit Reached</h1>
            <p className="mt-2 text-zinc-500">This link has reached its maximum click limit.</p>
          </div>
        </div>
      );
    }
  }

  // Password protected
  if (link.password_hash) {
    if (!passwordAttempt) {
      return <PasswordGate slug={slug} />;
    }

    const valid = await verifyPassword(passwordAttempt, link.password_hash);
    if (!valid) {
      return <PasswordGate slug={slug} error="Incorrect password" />;
    }
  }

  // Record click before redirect
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") ?? "";
  const referrer = headersList.get("referer") ?? undefined;
  const forwardedFor = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0]?.trim() ?? realIp ?? undefined;

  const deviceType = parseDeviceType(userAgent);
  const browser = parseBrowser(userAgent);
  const os = parseOS(userAgent);

  // Hash IP for privacy (SHA-256 via simple hash)
  let ipHash: string | undefined;
  if (ip) {
    const encoder = new TextEncoder();
    const data = encoder.encode(ip + link.id); // salt with link ID
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    ipHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Fire-and-forget: don't await, don't block redirect
  trackClick({
    linkId: link.id,
    referrer: referrer || undefined,
    deviceType,
    browser,
    os,
    ipHash,
  }).catch(() => {
    // Silently ignore tracking failures -- never block redirect
  });

  // Build final URL with UTM params
  let finalUrl = link.destination_url;
  const utmParams = new URLSearchParams();
  if (link.utm_source) utmParams.set("utm_source", link.utm_source);
  if (link.utm_medium) utmParams.set("utm_medium", link.utm_medium);
  if (link.utm_campaign) utmParams.set("utm_campaign", link.utm_campaign);
  if (link.utm_term) utmParams.set("utm_term", link.utm_term);
  if (link.utm_content) utmParams.set("utm_content", link.utm_content);

  if (utmParams.toString()) {
    const separator = finalUrl.includes("?") ? "&" : "?";
    finalUrl += separator + utmParams.toString();
  }

  redirect(finalUrl);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const { compare } = await import("bcryptjs");
    return compare(password, hash);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// UA parsing helpers (lightweight, no external deps)
// ---------------------------------------------------------------------------

function parseDeviceType(ua: string): "mobile" | "desktop" | "tablet" | "bot" | "unknown" {
  const lower = ua.toLowerCase();
  if (/bot|crawl|spider|slurp|googlebot|bingbot|yandex/i.test(lower)) return "bot";
  if (/ipad|tablet|playbook|silk/i.test(lower)) return "tablet";
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(lower)) return "mobile";
  if (/mozilla|chrome|safari|firefox|edge|opera|msie/i.test(lower)) return "desktop";
  return "unknown";
}

function parseBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\//i.test(ua) || /opera/i.test(ua)) return "Opera";
  if (/firefox\//i.test(ua)) return "Firefox";
  if (/chrome\//i.test(ua) && !/edg/i.test(ua)) return "Chrome";
  if (/safari\//i.test(ua) && !/chrome/i.test(ua)) return "Safari";
  if (/msie|trident/i.test(ua)) return "IE";
  return "Other";
}

function parseOS(ua: string): string {
  if (/windows/i.test(ua)) return "Windows";
  if (/macintosh|mac os/i.test(ua)) return "macOS";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/android/i.test(ua)) return "Android";
  if (/linux/i.test(ua)) return "Linux";
  if (/cros/i.test(ua)) return "ChromeOS";
  return "Other";
}
