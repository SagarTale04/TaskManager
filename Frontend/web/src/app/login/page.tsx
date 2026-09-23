"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/src/context/AuthContext";
import { ArrowRight, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  // If already authenticated, redirect to target page or dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace(redirectUrl);
    }
  }, [isAuthenticated, authLoading, router, redirectUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await login({ email: email.trim(), password });
      router.replace(redirectUrl);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Invalid credentials. Please verify your email and password.";
      setErrorMessage(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f6f2] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs tracking-tight shadow-2xs mb-2">
            SS
          </div>
          <h1 className="text-xl font-bold tracking-tight text-stone-900">
            Sync<span className="text-emerald-600">Sprint</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Engineering sprint & issue tracker
          </p>
        </div>

        {/* Clean Rounded Card */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-6 sm:p-7 shadow-none">
          <div className="mb-5">
            <h2 className="text-base font-bold text-stone-900">Sign in to workspace</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Enter your credentials to continue
            </p>
          </div>

          {/* Error Alert Message */}
          {errorMessage && (
            <div className="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  disabled={isSubmitting}
                  className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-emerald-500 disabled:opacity-60 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-stone-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-emerald-500 disabled:opacity-60 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-full py-2 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-stone-100 text-center text-xs text-stone-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Sign up
            </Link>
          </div>
        </div>

        <p className="text-center text-[11px] text-stone-400 mt-4">
          SyncSprint Enterprise • v0.1.0
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f7f6f2] flex items-center justify-center p-4">
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs tracking-tight animate-pulse">
            SS
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
