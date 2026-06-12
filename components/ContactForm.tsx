"use client";

import React, { useState } from "react";
import { Mail, CheckCircle } from "lucide-react";
import { submitContactMessage } from "@/actions/public";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleMessageSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await submitContactMessage({
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      subject: String(form.get("subject") || ""),
      message: String(form.get("message") || ""),
    });
    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      setSubmitted(true);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 dark:bg-zinc-950 dark:border-zinc-900 rounded-2xl p-8 shadow-sm">
      {submitted ? (
        <div className="flex flex-col items-center text-center gap-4 py-8">
          <CheckCircle className="h-14 w-14 text-teal-500 animate-bounce" />
          <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider font-mono">Message Sent Successfully</h3>
          <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
            Thank you for writing! Karl and the ArticleDestiny editorial board will review your feedback and get back to you within 48 business hours.
          </p>
          <Button
            onClick={() => setSubmitted(false)}
            variant="outline"
            className="mt-2"
          >
            Send Another Message
          </Button>
        </div>
      ) : (
        <form onSubmit={handleMessageSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest font-mono mb-1.5">
                Your Name
              </label>
              <Input
                name="name"
                type="text"
                placeholder="Karl Destiny"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest font-mono mb-1.5">
                Email Address
              </label>
              <Input
                name="email"
                type="email"
                placeholder="karl@destiny.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest font-mono mb-1.5">
              Topic Subject
            </label>
            <Input
              name="subject"
              type="text"
              placeholder="Editorial submission pitch"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest font-mono mb-1.5">
              Your Details
            </label>
            <Textarea
              name="message"
              placeholder="Write your beautiful message or critique here..."
              rows={5}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 uppercase tracking-wider"
          >
            <Mail className="h-4 w-4" />
            <span>{loading ? "Sending..." : "Send Message"}</span>
          </Button>
          {error && <p className="text-xs text-rose-500 font-semibold">{error}</p>}
        </form>
      )}
    </div>
  );
}
