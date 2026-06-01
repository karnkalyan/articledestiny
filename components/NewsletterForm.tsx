"use client";

import React, { useState } from "react";
import { Mail, CheckCircle } from "lucide-react";
import { subscribeToNewsletter } from "@/actions/public";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");
    const res = await subscribeToNewsletter(email);
    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      setSubscribed(true);
      setEmail("");
      setLoading(false);
    }
  };

  return (
    <div className="bg-transparent rounded-2xl">
      {subscribed ? (
        <div className="flex flex-col items-center text-center gap-2 py-4">
          <CheckCircle className="h-10 w-10 text-teal-500 animate-bounce" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider font-mono">Subscribed!</h4>
          <p className="text-xs text-gray-405 max-w-[260px] leading-relaxed">
            Welcome to ArticleDestiny! You will receive high-quality digest articles straight to your inbox.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <p className="text-xs text-gray-400 font-medium leading-relaxed">
            Subscribe to our weekly curated articles for developers, philosophers, and creatives.
          </p>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 z-10">
              <Mail className="h-4 w-4" />
            </span>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="karl@destiny.com"
              className="pl-9"
              required
              disabled={loading}
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-10 uppercase tracking-wider"
          >
            {loading ? "Joining..." : "Subscribe Now"}
          </Button>
          {error && <p className="text-[10px] text-rose-500 font-semibold">{error}</p>}
        </form>
      )}
    </div>
  );
}
