"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addDomain } from "@/app/actions/domains";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Props = { workspaceId: string };

export default function AddDomainForm({ workspaceId }: Props) {
  const router = useRouter();
  const [hostname, setHostname] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await addDomain(workspaceId, hostname);
      if (result.success) {
        toast.success("Domain added! Complete DNS verification to activate.");
        setHostname("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="text"
        placeholder="links.yourdomain.com"
        value={hostname}
        onChange={(e) => setHostname(e.target.value)}
        className="flex-1"
        required
      />
      <Button type="submit" disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Domain"}
      </Button>
    </form>
  );
}
