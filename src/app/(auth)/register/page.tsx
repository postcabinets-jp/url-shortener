"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      setError("Registration failed. Please try again.");
      setLoading(false);
      return;
    }

    // Create workspace
    const wsSlug = slugify(workspaceName || fullName || email.split("@")[0]);
    const { data: workspace, error: wsError } = await supabase
      .from("workspaces")
      .insert({ name: workspaceName || `${fullName}'s Workspace`, slug: wsSlug })
      .select()
      .single();

    if (wsError) {
      // Workspace creation failed — still continue to dashboard
      console.error("Workspace creation error:", wsError);
    }

    if (workspace) {
      await supabase.from("workspace_members").insert({
        workspace_id: workspace.id,
        user_id: authData.user.id,
        role: "owner",
      });
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md px-8 py-10 bg-white rounded-2xl border border-zinc-200 shadow-sm">
        <div className="mb-8">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <span className="text-xl font-bold tracking-tight text-zinc-900">snip.link</span>
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900">Create your account</h1>
          <p className="mt-1 text-sm text-zinc-500">Free forever. No credit card required.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Alex Johnson"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              type="email"
              placeholder="alex@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="8+ characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="workspaceName">
              Workspace name <span className="text-zinc-400 font-normal">(optional)</span>
            </Label>
            <Input
              id="workspaceName"
              type="text"
              placeholder="Acme Marketing"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              autoComplete="organization"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-zinc-900 hover:underline">
            Sign in
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-zinc-400">
          By creating an account you agree to our{" "}
          <Link href="#" className="underline">Terms</Link> and{" "}
          <Link href="#" className="underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
