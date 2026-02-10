"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const emailTrim = email.trim();
    const passwordTrim = password.trim();
    if (!emailTrim || !passwordTrim) {
      setError("Email and password are required.");
      return;
    }
    if (passwordTrim.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailTrim,
          password: passwordTrim,
          name: name.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Registration failed.");
        return;
      }
      router.push("/login?registered=1");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="font-brand text-2xl font-semibold text-pokemon-dark dark:text-stone-100 mb-6 text-center">
        Create an account
      </h1>
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
              autoComplete="new-password"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-pokemon-dark focus:ring-2 focus:ring-pokemon-yellow focus:border-pokemon-yellow"
              required
              minLength={8}
            />
            <p className="text-xs text-stone-500 mt-1">At least 8 characters</p>
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-stone-700 mb-1">
              Name <span className="text-stone-400">(optional)</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-pokemon-dark focus:ring-2 focus:ring-pokemon-yellow focus:border-pokemon-yellow"
            />
          </div>
          <Button type="submit" variant="primary" disabled={loading} className="w-full">
            {loading ? "Creating account…" : "Register"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-stone-600">
          Already have an account?{" "}
          <Link href="/login" className="text-pokemon-yellow font-medium hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
