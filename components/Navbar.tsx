"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass, Sparkles, BookOpen, User, LogOut, Menu, X, ShieldAlert, History } from "lucide-react";
import { logoutUser } from "@/actions/auth";
import { SafeUser } from "@/types";

interface NavbarProps {
  user: SafeUser | null;
}

export function Navbar({ user }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();

  const handleSignout = async () => {
    await logoutUser();
    router.refresh();
    router.push("/");
  };

  return (
    <nav id="app-navbar" className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md dark:border-zinc-850 dark:bg-zinc-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="p-2 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-xl shadow-md shadow-indigo-100 dark:shadow-none group-hover:scale-105 transition-transform">
                <Sparkles className="h-4.5 w-4.5 text-white animate-pulse" />
              </span>
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-slate-900 to-indigo-950 bg-clip-text text-transparent dark:from-white dark:to-zinc-300">
                Article<span className="text-indigo-600 dark:text-indigo-400">Destiny</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-5">
              <Link
                href="/about"
                className="text-xs font-semibold text-gray-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="text-xs font-semibold text-gray-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
              >
                Contact
              </Link>
              <Link
                href="/history"
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
              >
                <History className="h-3.5 w-3.5" />
                <span>Reading History</span>
              </Link>
            </div>
          </div>

          {/* Right Area -> Dynamic controls */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 dark:border-zinc-800 dark:hover:bg-zinc-900 transition-colors"
                >
                  <div className="h-5 w-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center dark:bg-zinc-800 dark:text-zinc-300">
                    {user.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-gray-700 dark:text-zinc-300 select-none">
                    {user.name}
                  </span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 origin-top-right rounded-2xl border border-gray-100 bg-white/95 p-1.5 shadow-xl backdrop-blur-md dark:border-zinc-850 dark:bg-zinc-950/95">
                    <div className="px-3.5 py-2 border-b border-gray-100 dark:border-zinc-900">
                      <p className="text-xs font-bold text-gray-900 dark:text-zinc-100 truncate">{user.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono truncate">{user.email}</p>
                    </div>

                    {(user.role === "ADMIN" || user.role === "AUTHOR") && (
                      <Link
                        href="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 dark:text-zinc-300 dark:hover:bg-zinc-900/60 transition-all mt-1"
                      >
                        <ShieldAlert className="h-4 w-4 text-indigo-500" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}

                    <Link
                      href="/history"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 dark:text-zinc-300 dark:hover:bg-zinc-900/60 transition-all"
                    >
                      <History className="h-4 w-4 text-indigo-500" />
                      <span>Reading History</span>
                    </Link>

                    <button
                      onClick={handleSignout}
                      className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20 transition-all mt-1 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 text-xs font-bold text-gray-700 hover:text-indigo-650 dark:text-zinc-300 dark:hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold tracking-wide shadow-md shadow-indigo-200 dark:shadow-none transition-all hover:scale-[1.02]"
                >
                  Join Destiny
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-gray-200 text-gray-550 hover:bg-gray-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Collapse */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white/95 px-4 py-4 dark:border-zinc-850 dark:bg-zinc-950/95 space-y-4">
          <div className="flex flex-col gap-2.5">
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-gray-600 dark:text-zinc-300 hover:text-indigo-600 p-1 rounded transition-colors"
            >
              About
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-gray-600 dark:text-zinc-300 hover:text-indigo-600 p-1 rounded transition-colors"
            >
              Contact
            </Link>
            <Link
              href="/history"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-1.5 text-sm font-bold text-indigo-600 p-1 rounded transition-colors"
            >
              <History className="h-4 w-4" />
              <span>Reading History</span>
            </Link>
          </div>

          <div className="border-t border-gray-100 pt-4 dark:border-zinc-850">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 pl-1 mb-2">
                  <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center dark:bg-zinc-800 dark:text-zinc-300">
                    {user.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-bold text-gray-700 dark:text-zinc-300">{user.name}</span>
                </div>

                {(user.role === "ADMIN" || user.role === "AUTHOR") && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  >
                    <ShieldAlert className="h-4 w-4 text-indigo-500" />
                    <span>Admin Dashboard</span>
                  </Link>
                )}

                <button
                  onClick={handleSignout}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 border border-gray-205 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-md shadow-indigo-100 dark:shadow-none"
                >
                  Join Destiny
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
