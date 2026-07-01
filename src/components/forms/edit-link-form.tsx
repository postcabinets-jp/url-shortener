"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLink } from "@/app/actions/links";
import type { Link } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Props = { link: Link };

export default function EditLinkForm({ link }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [destinationUrl, setDestinationUrl] = useState(link.destination_url);
  const [title, setTitle] = useState(link.title ?? "");
  const [active, setActive] = useState(link.active);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateLink(link.id, {
        destinationUrl,
        title: title || undefined,
        active,
      });
      if (result.success) {
        toast.success("Link updated");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-zinc-900 mb-4">Edit Link</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="edit-url">Destination URL</Label>
          <Input
            id="edit-url"
            type="url"
            value={destinationUrl}
            onChange={(e) => setDestinationUrl(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-title">Title</Label>
          <Input
            id="edit-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Link title"
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="edit-active">Active</Label>
          <Switch
            id="edit-active"
            checked={active}
            onCheckedChange={setActive}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
          ) : (
            "Save Changes"
          )}
        </Button>
      </form>
    </Card>
  );
}
