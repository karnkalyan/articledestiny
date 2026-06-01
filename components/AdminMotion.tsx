"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";

export const panelMotion = {
  initial: { opacity: 0, y: 18, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.35, ease: "easeOut" as const },
};

export const listMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { staggerChildren: 0.045, delayChildren: 0.05 },
};

export const rowMotion = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.22, ease: "easeOut" as const },
};

export function AdminAnimatedBackground() {
  const bandOneRef = useRef<HTMLDivElement>(null);
  const bandTwoRef = useRef<HTMLDivElement>(null);
  const bandThreeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(bandOneRef.current, {
        x: 42,
        y: 24,
        scale: 1.08,
        duration: 8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      gsap.to(bandTwoRef.current, {
        x: -36,
        y: 30,
        scale: 1.12,
        duration: 9,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      gsap.to(bandThreeRef.current, {
        x: 28,
        y: -18,
        opacity: 0.85,
        duration: 7,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        ref={bandOneRef}
        className="absolute -top-24 left-0 h-64 w-[72rem] rotate-[-8deg] bg-gradient-to-r from-fuchsia-400/18 via-cyan-300/18 to-transparent blur-3xl dark:from-fuchsia-600/14 dark:via-cyan-500/12"
      />
      <div
        ref={bandTwoRef}
        className="absolute top-52 right-0 h-56 w-[64rem] rotate-[10deg] bg-gradient-to-r from-transparent via-emerald-300/14 to-violet-400/18 blur-3xl dark:via-emerald-500/10 dark:to-violet-600/14"
      />
      <div
        ref={bandThreeRef}
        className="absolute bottom-[-6rem] left-[-8rem] h-52 w-[68rem] rotate-[6deg] bg-gradient-to-r from-amber-300/20 via-rose-300/12 to-transparent blur-3xl dark:from-amber-500/10 dark:via-rose-500/10"
      />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.45)_1px,transparent_1px)] bg-[size:56px_56px] opacity-30 dark:opacity-10" />
    </div>
  );
}

export const MotionPanel = motion.section;
export const MotionDiv = motion.div;
export const MotionForm = motion.form;
