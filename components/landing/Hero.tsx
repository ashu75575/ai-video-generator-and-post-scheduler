"use client";

import { motion } from "framer-motion";
import { ArrowRight, ChevronDown, Play, Sparkles } from "lucide-react";
import { fadeUp, stagger } from "./animations";
import { GridBG } from "./GridBG";
import { HeroVisual } from "./HeroVisual";
import { FORGE_GLOW } from "./tokens";

const STATS = [
  ["10k+", "Creators"],
  ["98M", "Clips made"],
  ["4.9★", "App Store"],
] as const;

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden px-6 pt-[100px] pb-20">
      <GridBG />
      <div className="relative z-10 mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-20 lg:grid-cols-2">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-7 inline-flex items-center gap-1.5 rounded-full border border-forge-accent/25 bg-forge-accent/12 px-3.5 py-1.25"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            >
              <Sparkles size={12} className="text-forge-accent" />
            </motion.div>
            <span className="font-[family-name:var(--font-dm-sans)] text-xs font-medium text-forge-accent">
              Powered by GPT-4o Vision · v2.1
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mb-6 font-[family-name:var(--font-space-grotesk)] text-[clamp(40px,5vw,64px)] leading-[1.08] font-extrabold tracking-[-2px] text-white"
          >
            Turn long videos
            <br />
            into viral clips
            <br />
            <span className="text-gradient-forge">automatically.</span>
          </motion.h1>

          <motion.p
            variants={stagger(0.15)}
            initial="hidden"
            animate="show"
            className="mb-9 max-w-[440px] font-[family-name:var(--font-dm-sans)] text-[17px] leading-relaxed text-white/50"
          >
            ClipForge AI analyzes your content, detects viral moments with AI,
            generates captions, and schedules posts across every platform — in
            seconds.
          </motion.p>

          <motion.div
            variants={stagger(0.25)}
            initial="hidden"
            animate="show"
            className="mb-11 flex flex-wrap gap-3"
          >
            <motion.button
              type="button"
              whileHover={{ scale: 1.04, boxShadow: `0 0 40px ${FORGE_GLOW}` }}
              whileTap={{ scale: 0.97 }}
              className="flex cursor-pointer items-center gap-2 rounded-[10px] bg-gradient-forge px-[26px] py-3.5 font-[family-name:var(--font-dm-sans)] text-[15px] font-bold text-white"
            >
              Start clipping free <ArrowRight size={16} />
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="flex cursor-pointer items-center gap-2 rounded-[10px] border border-white/12 bg-white/[0.04] px-6 py-3.5 font-[family-name:var(--font-dm-sans)] text-[15px] font-semibold text-white/75"
            >
              <Play size={15} fill="currentColor" /> Watch demo
            </motion.button>
          </motion.div>

          <motion.div
            variants={stagger(0.35)}
            initial="hidden"
            animate="show"
            className="flex gap-7"
          >
            {STATS.map(([val, label]) => (
              <div key={label}>
                <div className="font-[family-name:var(--font-space-grotesk)] text-xl font-extrabold text-white">
                  {val}
                </div>
                <div className="font-[family-name:var(--font-dm-sans)] text-xs text-white/40">
                  {label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="flex justify-center">
          <HeroVisual />
        </div>
      </div>

      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5"
      >
        <span className="font-mono text-[11px] tracking-widest text-white/25">
          SCROLL
        </span>
        <ChevronDown size={16} className="text-white/25" />
      </motion.div>
    </section>
  );
}
