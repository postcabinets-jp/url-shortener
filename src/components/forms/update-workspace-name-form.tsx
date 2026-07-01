"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateWorkspaceName } from "@/app/actions/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Props = { workspaceId: string; currentName: string; isOwner: boolean };

export default function UpdateWorkspaceNameForm({ workspaceId, currentName, isOwner }: Props) {
  const router = useRouter();
  const [name, setName] = useState(currentName);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateWorkspaceName(workspaceId, name);
      if (result.success) {
        toast.success("Workspace name updated");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="workspace-name">Workspace name</Label>
        <Input
          id="workspace-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!isOwner}
          required
        />
      </div>
      {isOwner && (
        <Button type="submit" size="sm" disabled={isPending || name === currentName}>
          {isPending ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Saving…</> : "Save"}
        </Button>
      )}
    </form>
  );
}
