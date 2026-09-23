"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/src/context/AuthContext";
import { ArrowRight, Lock, Mail, User, AlertCircle, Loader2 } from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const { register, isAuthenticated, loading: authLoading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setErrorMessage("Full Name is required.");
      return;
    }

    if (!trimmedEmail) {
      setErrorMessage("Work Email is required.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Send registration payload without privileged role (backend defaults to DEVELOPER)
      await register({
        name: trimmedName,
        email: trimmedEmail,
        password,
      });

      // Redirect to dashboard on successful token generation
      router.replace("/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Registration failed. Please verify your information.";
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
            <h2 className="text-base font-bold text-stone-900">Create your account</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Join your engineering team workspace
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
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sarah Chen"
                  disabled={isSubmitting}
                  className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-emerald-500 disabled:opacity-60 transition-colors"
                />
              </div>
            </div>

            {/* Email */}
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

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  disabled={isSubmitting}
                  className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-emerald-500 disabled:opacity-60 transition-colors"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
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
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-stone-100 text-center text-xs text-stone-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Sign in
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

export default function RegisterPage() {
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
      <RegisterForm />
    </Suspense>
  );
}
