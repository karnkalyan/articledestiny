"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, Sparkles, AlertCircle } from "lucide-react";
import { loginUser } from "@/actions/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const result = await loginUser(formData);

    if (result.error) {
      setErrorMsg(result.error);
      setLoading(false);
    } else {
      router.refresh();
      router.push("/");
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-gray-100 dark:bg-zinc-950 dark:border-zinc-850 rounded-2xl p-8 shadow-xl">
        <div className="flex flex-col items-center mb-8 text-center">
          <span className="p-3 bg-indigo-50 dark:bg-zinc-900 rounded-2xl mb-4 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight">
            Welcome back to Destiny
          </h2>
          <p className="text-xs text-gray-400 mt-1.5 max-w-[260px]">
            Please sign in with your email to participate in forums, submit comments, and track reading history.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 flex items-center gap-2 p-3.5 bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450 border border-rose-200 dark:border-rose-900/65 rounded-xl text-xs font-semibold">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest font-mono mb-1.5">
              Email Address
            </label>
            <Input
              name="email"
              type="email"
              placeholder="karl@destiny.com"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest font-mono mb-1.5">
              Password
            </label>
            <Input
              name="password"
              type="password"
              placeholder="••••••••••••"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-2 h-11 uppercase tracking-wider"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>{loading ? "Signing In..." : "Sign In"}</span>
          </Button>
        </form>

        <div className="mt-6 text-center text-xs">
          <p className="text-gray-400">
            New to ArticleDestiny?{" "}
            <Link href="/register" className="font-bold text-indigo-600 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
