"use client";

import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Link2,
  BarChart2,
  Globe,
  QrCode,
  Shield,
  Zap,
  Lock,
  Users,
  Key,
  Clock,
  Check,
  X,
  GitBranch,
  ArrowRight,
} from "lucide-react";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

const GITHUB_URL = "https://github.com/postcabinets-jp/url-shortener";

function Feature({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="mt-0.5 flex-shrink-0 h-8 w-8 rounded-lg bg-zinc-100 flex items-center justify-center">
        <Icon className="h-4 w-4 text-zinc-700" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
        <p className="text-sm text-zinc-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

type CompareRow = { label: string; bitly: string | boolean; us: string | boolean };

function CompareCell({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="h-4 w-4 text-green-600 mx-auto" />
    ) : (
      <X className="h-4 w-4 text-red-400 mx-auto" />
    );
  }
  return <span>{value}</span>;
}

export default function LandingPage() {
  const compareRows: CompareRow[] = [
    { label: "Links per month", bitly: "5 (free)", us: "Unlimited" },
    { label: "Custom domains", bitly: false, us: true },
    { label: "Click analytics", bitly: "Basic", us: "Real-time" },
    { label: "QR codes", bitly: "Paid only", us: true },
    { label: "Team members", bitly: "Paid only", us: true },
    { label: "REST API access", bitly: "Paid only", us: true },
    { label: "Self-hostable", bitly: false, us: true },
    { label: "Ads on free links", bitly: true, us: false },
    { label: "Monthly price", bitly: "$10–$199", us: "$0" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-zinc-100 sticky top-0 bg-white/80 backdrop-blur-sm z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-zinc-900 flex items-center justify-center">
              <Link2 className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-zinc-900">snip.link</span>
            <Badge variant="secondary" className="text-xs font-medium">OSS</Badge>
          </Link>
          <div className="flex items-center gap-3">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              <GithubIcon className="h-4 w-4" />
              GitHub
            </a>
            <Link href="/login">
              <Button size="sm" variant="outline">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get started free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <Badge variant="outline" className="mb-6 text-xs">
          Open source alternative to Bitly
        </Badge>
        <h1 className="text-5xl font-bold text-zinc-900 tracking-tight leading-tight">
          URL shortener with<br />
          <span className="text-zinc-400">no limits, no ads, no lock-in</span>
        </h1>
        <p className="mt-6 text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed">
          Custom domains, real-time analytics, QR codes, and team management — all free.
          Self-host in 5 minutes or use our cloud version.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <Link href="/register">
            <Button size="lg" className="gap-2">
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
            <Button size="lg" variant="outline" className="gap-2">
              <GithubIcon className="h-4 w-4" />
              View on GitHub
            </Button>
          </a>
        </div>
        <p className="mt-4 text-xs text-zinc-400">No credit card required. MIT license.</p>
      </section>

      {/* Demo URL shortener */}
      <section className="max-w-2xl mx-auto px-6 pb-20">
        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
          <p className="text-xs font-medium text-zinc-500 mb-3 text-center uppercase tracking-wider">
            Try it — create a free account
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="Paste your long URL here…"
              className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 cursor-pointer"
              readOnly
              onClick={() => { window.location.href = "/register"; }}
            />
            <Link href="/register">
              <Button>Shorten</Button>
            </Link>
          </div>
          <p className="text-xs text-zinc-400 text-center mt-3">
            Create a free account to shorten your first link
          </p>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-zinc-900">Everything Bitly charges for — free</h2>
          <p className="text-zinc-500 mt-3">
            Bitly&apos;s free plan limits you to 5 links/month and shows ads on them. We don&apos;t.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Feature
            icon={Link2}
            title="Unlimited short links"
            desc="No monthly caps. Create as many links as you need, with custom aliases or auto-generated 7-character slugs."
          />
          <Feature
            icon={Globe}
            title="Custom domains — free"
            desc="Use your own domain (links.yourbrand.com) without paying $29/month. CNAME setup with instant DNS verification."
          />
          <Feature
            icon={BarChart2}
            title="Real-time click analytics"
            desc="Daily click charts, country breakdown, device type, referrer tracking — updated live, not on a 24-hour delay."
          />
          <Feature
            icon={QrCode}
            title="QR code generation"
            desc="Every link gets an auto-generated QR code. Download PNG instantly. No separate paid plan needed."
          />
          <Feature
            icon={Lock}
            title="Password-protected links"
            desc="Lock links behind a password for sensitive content. bcrypt-hashed, never stored in plaintext."
          />
          <Feature
            icon={Clock}
            title="Link expiration & click limits"
            desc="Set links to expire at a date/time, or auto-disable after N clicks. Great for limited-time offers."
          />
          <Feature
            icon={Users}
            title="Team workspaces"
            desc="Invite teammates with Owner / Editor / Viewer roles. All links and domains shared within a workspace."
          />
          <Feature
            icon={Key}
            title="REST API with API keys"
            desc="Full CRUD API with Bearer token auth. Swagger docs included. Automate link creation or build integrations."
          />
          <Feature
            icon={Shield}
            title="Privacy-first analytics"
            desc="IPs are SHA-256 hashed before storage — raw IPs never persisted. GDPR-compatible by default."
          />
          <Feature
            icon={Zap}
            title="Edge-powered redirects"
            desc="Redirects run on Vercel Edge Network, under 5ms globally. No cold starts, no noticeable redirect delay."
          />
        </div>
      </section>

      {/* Comparison table */}
      <section className="bg-zinc-50 py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-zinc-900">vs Bitly</h2>
            <p className="text-zinc-500 mt-2">
              In 2025, Bitly inserted ads into existing free user links — without notice.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left px-5 py-3.5 text-zinc-500 font-medium">Feature</th>
                  <th className="text-center px-5 py-3.5 text-zinc-500 font-medium">Bitly Free</th>
                  <th className="text-center px-5 py-3.5 text-zinc-900 font-semibold">snip.link</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? "bg-zinc-50" : ""}>
                    <td className="px-5 py-3 text-zinc-700">{row.label}</td>
                    <td className="px-5 py-3 text-center text-zinc-400">
                      <CompareCell value={row.bitly} />
                    </td>
                    <td className="px-5 py-3 text-center font-medium text-zinc-900">
                      <CompareCell value={row.us} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Deploy section */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-zinc-900 mb-3">Deploy your own instance</h2>
        <p className="text-zinc-500 mb-8">
          One-click deploy to Vercel + Supabase. You own your data, your domain, your links.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <a
            href={`https://vercel.com/new/clone?repository-url=${GITHUB_URL}&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,NEXT_PUBLIC_APP_URL&project-name=url-shortener&repo-name=url-shortener`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://vercel.com/button"
              alt="Deploy with Vercel"
              className="h-8"
            />
          </a>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="gap-2">
              <GithubIcon className="h-4 w-4" />
              View source
            </Button>
          </a>
        </div>
        <p className="text-xs text-zinc-400 mt-4">
          Requires a free Supabase project. Full setup in about 5 minutes.
        </p>
      </section>

      {/* CTA */}
      <section className="bg-zinc-900 py-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Start for free today</h2>
          <p className="text-zinc-400 mb-8">
            No credit card. No usage limits. No ads. Ever.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-zinc-900 hover:bg-zinc-100 gap-2">
              Create your account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-sm text-zinc-400 flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-zinc-900 flex items-center justify-center">
              <Link2 className="h-2.5 w-2.5 text-white" />
            </div>
            <span>snip.link</span>
            <span>·</span>
            <span>MIT License</span>
          </div>
          <div className="flex items-center gap-4">
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-700 transition-colors">
              GitHub
            </a>
            <a href="/api/docs" className="hover:text-zinc-700 transition-colors">
              API Docs
            </a>
            <span>Built by{" "}
              <a href="https://postcabinets.co.jp" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-700 underline">
                POST CABINETS
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
