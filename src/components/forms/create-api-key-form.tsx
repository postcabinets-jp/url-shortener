"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createApiKey } from "@/app/actions/api-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Copy, CheckCircle } from "lucide-react";

type Props = { workspaceId: string };

export default function CreateApiKeyForm({ workspaceId }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createApiKey(workspaceId, name);
      if (result.success) {
        setNewKey(result.data.rawKey);
        setName("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleCopy() {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="space-y-3">
      {newKey && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs font-semibold text-green-800 mb-2">
            API key created — copy it now. It won't be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono bg-white border border-green-200 rounded px-2 py-1.5 text-green-900 break-all">
              {newKey}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 p-1.5 rounded text-green-700 hover:bg-green-100 transition-colors"
            >
              {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          placeholder="Key name (e.g. Production API)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1"
          required
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate"}
        </Button>
      </form>
    </div>
  );
}
