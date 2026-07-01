"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLink } from "@/app/actions/links";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Link2, Loader2 } from "lucide-react";

type Props = { workspaceId: string };

export default function QuickCreateForm({ workspaceId }: Props) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isPending, startTransition] = useTransition();
  const [shortUrl, setShortUrl] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url) return;

    startTransition(async () => {
      const result = await createLink({ workspaceId, destinationUrl: url });
      if (result.success) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
        const short = `${appUrl}/${result.data.slug}`;
        setShortUrl(short);
        setUrl("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function copyToClipboard() {
    if (shortUrl) {
      navigator.clipboard.writeText(shortUrl);
      toast.success("Copied to clipboard");
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            type="url"
            placeholder="https://your-long-url.com/path/to/page"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="pl-9"
            required
          />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Shorten"}
        </Button>
      </form>

      {shortUrl && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <span className="flex-1 text-sm font-medium text-green-800 truncate">{shortUrl}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={copyToClipboard}
            className="shrink-0 border-green-300 text-green-700 hover:bg-green-100"
          >
            Copy
          </Button>
        </div>
      )}
    </div>
  );
}
