"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const registered = searchParams.get("registered") === "1";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
        callbackUrl,
      });
      if (result?.error) {
        setError("Invalid email or password.");
        return;
      }
      if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
        return;
      }
      setError("Invalid email or password.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="font-brand text-2xl font-semibold text-pokemon-dark dark:text-stone-100 mb-6 text-center">
        Log in
      </h1>
      {registered && (
        <p className="text-center text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
          Account created. Please log in.
        </p>
      )}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-pokemon-dark focus:ring-2 focus:ring-pokemon-yellow focus:border-pokemon-yellow"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-pokemon-dark focus:ring-2 focus:ring-pokemon-yellow focus:border-pokemon-yellow"
              required
            />
          </div>
          <Button type="submit" variant="primary" disabled={loading} className="w-full">
            {loading ? "Logging in…" : "Log in"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-stone-600">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-pokemon-yellow font-medium hover:underline">
            Register
          </Link>
        </p>
      </Card>
    </div>
  );
}
