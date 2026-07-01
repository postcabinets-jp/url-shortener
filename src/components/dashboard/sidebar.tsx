"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Link2,
  QrCode,
  Globe,
  Users,
  Key,
  Settings,
  ExternalLink,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/links", label: "Links", icon: Link2 },
  { href: "/dashboard/qr", label: "QR Codes", icon: QrCode },
  { href: "/dashboard/domains", label: "Domains", icon: Globe },
  { href: "/dashboard/team", label: "Team", icon: Users },
  { href: "/dashboard/api-keys", label: "API Keys", icon: Key },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-zinc-200 bg-white flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-zinc-200">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-zinc-900 flex items-center justify-center">
            <Link2 className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-zinc-900 tracking-tight">snip.link</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-zinc-100 text-zinc-900 font-medium"
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-200">
        <a
          href="https://github.com/postcabinets-jp/url-shortener"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          GitHub · Open Source
        </a>
      </div>
    </aside>
  );
}
