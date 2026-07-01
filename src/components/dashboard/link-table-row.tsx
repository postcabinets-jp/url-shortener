"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleLinkActive, deleteLink } from "@/app/actions/links";
import type { Link as LinkType } from "@/types/database";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Copy, ExternalLink, BarChart2, Trash2 } from "lucide-react";

type Props = {
  link: LinkType;
  clicks: number;
  appUrl: string;
};

export default function LinkTableRow({ link, clicks, appUrl }: Props) {
  const router = useRouter();
  const [active, setActive] = useState(link.active);
  const [isPending, startTransition] = useTransition();

  const shortUrl = `${appUrl}/${link.slug}`;

  function handleToggle() {
    const next = !active;
    setActive(next);
    startTransition(async () => {
      const result = await toggleLinkActive(link.id, next);
      if (!result.success) {
        setActive(!next); // revert
        toast.error(result.error);
      }
    });
  }

  function handleCopy() {
    navigator.clipboard.writeText(shortUrl);
    toast.success("Copied!");
  }

  function handleDelete() {
    if (!confirm("Delete this link? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await deleteLink(link.id);
      if (!result.success) toast.error(result.error);
      else toast.success("Link deleted");
    });
  }

  return (
    <div className="flex items-center gap-4 px-4 py-3.5 hover:bg-zinc-50 transition-colors">
      {/* Active toggle */}
      <Switch
        checked={active}
        onCheckedChange={handleToggle}
        disabled={isPending}
        aria-label="Toggle link active"
        className="shrink-0"
      />

      {/* Link info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-900 truncate">
            {link.slug}
          </span>
          {link.tags.length > 0 && (
            <Badge variant="secondary" className="text-xs shrink-0">
              {link.tags[0]}
            </Badge>
          )}
          {link.password_hash && (
            <Badge variant="outline" className="text-xs shrink-0">🔒 pw</Badge>
          )}
        </div>
        <p className="text-xs text-zinc-400 truncate mt-0.5">{link.destination_url}</p>
      </div>

      {/* Clicks */}
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-zinc-900">{clicks.toLocaleString()}</p>
        <p className="text-xs text-zinc-400">clicks</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={handleCopy}
          className="p-1.5 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          title="Copy short URL"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <a
          href={shortUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          title="Open link"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <DropdownMenu>
          <DropdownMenuTrigger className="p-1.5 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/dashboard/links/${link.id}`)}>
              <BarChart2 className="h-4 w-4 mr-2" />
              View analytics
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
