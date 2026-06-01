"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, UserPlus, AlertCircle } from "lucide-react";
import { registerUser } from "@/actions/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const result = await registerUser(formData);

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
            Join ArticleDestiny
          </h2>
          <p className="text-xs text-gray-400 mt-1.5 max-w-[260px]">
            Create a free credentials account to join discussions and track your customized reading history.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 flex items-center gap-2 p-3.5 bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450 border border-rose-200 dark:border-rose-900/65 rounded-xl text-xs font-semibold">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest font-mono mb-1.5">
              Full Name
            </label>
            <Input
              name="name"
              type="text"
              placeholder="Karl Destiny"
              required
            />
          </div>

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
            <UserPlus className="h-3.5 w-3.5" />
            <span>{loading ? "Creating Account..." : "Create Account"}</span>
          </Button>
        </form>

        <div className="mt-6 text-center text-xs">
          <p className="text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-indigo-600 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
