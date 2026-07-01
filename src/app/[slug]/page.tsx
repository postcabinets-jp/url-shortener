import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PasswordGate from "./password-gate";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ pw?: string }>;
};

export const runtime = "edge";

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

    // Verify password server-side via API route
    const valid = await verifyPassword(passwordAttempt, link.password_hash);
    if (!valid) {
      return <PasswordGate slug={slug} error="Incorrect password" />;
    }
  }

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

  // Record click asynchronously (fire-and-forget via API)
  // The actual click tracking is done in the redirect API route
  // to capture request headers (IP, UA, referrer)

  redirect(finalUrl);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // bcrypt in edge runtime: use a web crypto based approach
  // For now, check via API call to avoid bcrypt in edge
  try {
    const { compare } = await import("bcryptjs");
    return compare(password, hash);
  } catch {
    return false;
  }
}
