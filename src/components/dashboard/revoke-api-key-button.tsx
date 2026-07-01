"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { revokeApiKey } from "@/app/actions/api-keys";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

type Props = { keyId: string };

export default function RevokeApiKeyButton({ keyId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRevoke() {
    if (!confirm("Revoke this API key? Any services using it will stop working immediately.")) return;
    startTransition(async () => {
      const result = await revokeApiKey(keyId);
      if (result.success) {
        toast.success("API key revoked");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRevoke}
      disabled={isPending}
      className="text-red-600 hover:text-red-700 hover:bg-red-50"
    >
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
    </Button>
  );
}
