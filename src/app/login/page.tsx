"use client";

import { useState } from "react";
import { login } from "@/app/actions/auth-actions";
import Link from "next/link";

export default function LoginPage() {
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    const result = await login(formData);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="bg-level min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ background: "var(--color-primary)" }}>
            A
          </div>
          <span className="font-bold text-2xl tracking-tight" style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>
            Academic OS
          </span>
        </div>

        <div className="rounded-3xl border p-8 shadow-lg" style={{ background: "var(--color-surface-container-low)" }}>
          <h2 className="text-2xl font-bold mb-2 text-center" style={{ color: "var(--color-on-surface)" }}>Welcome back</h2>
          <p className="text-sm mb-8 text-center" style={{ color: "var(--color-on-surface-variant)" }}>
            Sign in to continue to your workspace.
          </p>

          {error && (
            <div className="mb-6 p-3 rounded-xl text-sm border text-red-600 bg-red-50" style={{ borderColor: "var(--color-error)" }}>
              {error}
            </div>
          )}

          <a
            href="/api/drive/auth"
            className="mb-5 w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl text-base font-bold transition-all hover:opacity-90 active:scale-95 border"
            style={{ background: "white", color: "var(--color-on-surface)", borderColor: "var(--color-outline-variant)" }}
          >
            <span className="text-lg">G</span>
            Login with Google
          </a>

          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1" style={{ background: "var(--color-outline-variant)" }} />
            <span className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>or email</span>
            <div className="h-px flex-1" style={{ background: "var(--color-outline-variant)" }} />
          </div>

          <form action={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-on-surface-variant)" }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                className="w-full rounded-xl border p-3.5 text-sm outline-none transition-all focus:ring-2"
                style={{ borderColor: "var(--color-outline-variant)", background: "white", color: "var(--color-on-surface)" }}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-on-surface-variant)" }}>
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                className="w-full rounded-xl border p-3.5 text-sm outline-none transition-all focus:ring-2"
                style={{ borderColor: "var(--color-outline-variant)", background: "white", color: "var(--color-on-surface)" }}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-base font-bold transition-all hover:opacity-90 active:scale-95"
              style={{ background: "var(--color-primary)", color: "var(--color-on-primary)" }}
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center text-sm" style={{ color: "var(--color-on-surface-variant)" }}>
            Don't have an account?{" "}
            <Link href="/register" className="font-bold underline hover:opacity-80" style={{ color: "var(--color-primary)" }}>
              Create one
            </Link>
          </div>
        </div>

        <p className="mt-6 text-xs text-center" style={{ color: "var(--color-on-surface-variant)" }}>
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
