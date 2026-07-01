"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=/dashboard/settings`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md px-8 py-10 bg-white rounded-2xl border border-zinc-200 shadow-sm">
        <div className="mb-8">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <span className="text-xl font-bold tracking-tight text-zinc-900">snip.link</span>
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900">Reset your password</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Enter your email and we&apos;ll send a reset link.
          </p>
        </div>

        {sent ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
            Check your inbox — we sent a reset link to <strong>{email}</strong>.
            <p className="mt-2 text-green-600">Didn&apos;t receive it? Check your spam folder.</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-zinc-500">
          Remember it?{" "}
          <Link href="/login" className="font-medium text-zinc-900 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
