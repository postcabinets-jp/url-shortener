"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, ChevronDown } from "lucide-react";

type Props = {
  userEmail: string;
  userName?: string | null;
  workspaceName: string;
};

export default function Header({ userEmail, userName, workspaceName }: Props) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = userName
    ? userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : userEmail[0].toUpperCase();

  return (
    <header className="h-16 border-b border-zinc-200 bg-white flex items-center justify-between px-6">
      <div className="text-sm text-zinc-500">
        <span className="font-medium text-zinc-900">{workspaceName}</span>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors">
          <Bell className="h-4 w-4" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-zinc-100 transition-colors outline-none">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs bg-zinc-900 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-zinc-700">
              {userName || userEmail.split("@")[0]}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-3 py-2">
              <p className="text-xs font-medium text-zinc-900">{userName || "Account"}</p>
              <p className="text-xs text-zinc-500 truncate">{userEmail}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-red-600 focus:text-red-600"
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
