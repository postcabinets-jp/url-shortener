"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMemberRole, removeMember } from "@/app/actions/workspace";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { MoreHorizontal } from "lucide-react";

type Props = { memberId: string; currentRole: string };

export default function TeamMemberActions({ memberId, currentRole }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRoleChange(role: "editor" | "viewer") {
    startTransition(async () => {
      const result = await updateMemberRole(memberId, role);
      if (result.success) {
        toast.success(`Role updated to ${role}`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleRemove() {
    if (!confirm("Remove this member from the workspace?")) return;
    startTransition(async () => {
      const result = await removeMember(memberId);
      if (result.success) {
        toast.success("Member removed");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center justify-center rounded-md px-2 py-1 text-sm font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
        disabled={isPending}
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {currentRole !== "editor" && (
          <DropdownMenuItem onClick={() => handleRoleChange("editor")}>
            Make Editor
          </DropdownMenuItem>
        )}
        {currentRole !== "viewer" && (
          <DropdownMenuItem onClick={() => handleRoleChange("viewer")}>
            Make Viewer
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleRemove}
          className="text-red-600 focus:text-red-600"
        >
          Remove from workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
