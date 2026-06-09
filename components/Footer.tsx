import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer id="app-footer" className="bg-slate-50 border-t border-gray-100 dark:bg-zinc-950 dark:border-zinc-900 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Bio */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center" aria-label="ArticleDestiny home">
              <img
                src="/logo/mainlogo.png"
                alt="ArticleDestiny"
                className="h-10 w-auto max-w-[200px] object-contain"
              />
            </Link>
            <p className="text-xs text-gray-500 dark:text-zinc-400 max-w-sm leading-relaxed">
              ArticleDestiny is a high-fidelity publishing ecosystem exploring technology, design ideas, and creative essays. Read curated articles or sign up to join the interactive community.
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-150 uppercase tracking-widest font-mono mb-4">Ecosystem</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/" className="text-gray-450 hover:text-indigo-650 transition-colors">
                  Home Catalog
                </Link>
              </li>
              <li>
                <Link href="/history" className="text-gray-450 hover:text-indigo-650 transition-colors">
                  Reading History
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-450 hover:text-indigo-650 transition-colors">
                  About Editorial
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-150 uppercase tracking-widest font-mono mb-4">Support & Care</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/contact" className="text-gray-450 hover:text-indigo-650 transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <span className="text-gray-450 cursor-not-allowed">Terms of Service</span>
              </li>
              <li>
                <span className="text-gray-450 cursor-not-allowed">Privacy Policy</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-zinc-900 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] font-medium font-mono text-gray-400">
            &copy; {new Date().getFullYear()} ArticleDestiny Inc. All rights reserved.
          </p>
          <div className="flex gap-4.5 text-[10px] font-mono text-gray-400">
            <span className="hover:text-indigo-600 cursor-pointer">Twitter</span>
            <span className="hover:text-indigo-600 cursor-pointer text-gray-300">|</span>
            <span className="hover:text-indigo-600 cursor-pointer">GitHub</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
