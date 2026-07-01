"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { verifyDomain, deleteDomain } from "@/app/actions/domains";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";

type Props = { domainId: string; verified: boolean };

export default function DomainActions({ domainId, verified }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleVerify() {
    startTransition(async () => {
      const result = await verifyDomain(domainId);
      if (result.success) {
        toast.success("Domain verified!");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete() {
    if (!confirm("Remove this domain? All links using it will fall back to the default domain.")) return;
    startTransition(async () => {
      const result = await deleteDomain(domainId);
      if (result.success) {
        toast.success("Domain removed");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      {!verified && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleVerify}
          disabled={isPending}
          className="gap-1.5"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Verify
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        onClick={handleDelete}
        disabled={isPending}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
