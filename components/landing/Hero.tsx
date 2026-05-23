"use client";

import { motion } from "framer-motion";
import { ArrowRight, ChevronDown, Play, Sparkles } from "lucide-react";
import { GridBG } from "./GridBG";
import { HeroVisual } from "./HeroVisual";
import { FORGE_GLOW } from "./tokens";

const STATS = [
  { val: "10k+", label: "Creators" },
  { val: "98M", label: "Clips made" },
  { val: "4.9★", label: "App Store" },
] as const;

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden px-6 pt-[100px] pb-20">
      <GridBG />

      {/* Large central glow blob */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[700px] rounded-full opacity-40"
        style={{
          background:
            "radial-gradient(circle, rgba(124,106,250,0.18) 0%, rgba(62,207,207,0.06) 50%, transparent 75%)",
          filter: "blur(60px)",
        }}
      />

      <div className="relative z-10 mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-16 lg:grid-cols-2">
        {/* Left column */}
        <motion.div variants={container} initial="hidden" animate="show">
          {/* Badge */}
          <motion.div variants={item}>
            <div className="mb-7 inline-flex items-center gap-1.5 rounded-full border border-forge-accent/25 bg-forge-accent/10 px-3.5 py-1.5 backdrop-blur-sm">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                style={{ willChange: "transform" }}
              >
                <Sparkles size={12} className="text-forge-accent" />
              </motion.div>
              <span className="font-sans text-xs font-medium text-forge-accent">
                Powered by GPT-4o Vision · v2.1
              </span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={item}
            className="mb-6 font-heading text-[clamp(38px,5vw,64px)] leading-[1.07] font-extrabold tracking-[-2px] text-white"
          >
            Turn long videos
            <br />
            into viral clips
            <br />
            <span className="text-gradient-forge">automatically.</span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            variants={item}
            className="mb-9 max-w-[440px] font-sans text-[17px] leading-relaxed text-white/50"
          >
            ClipForge AI analyzes your content, detects viral moments with AI,
            generates captions, and schedules posts across every platform — in
            seconds.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={item} className="mb-11 flex flex-wrap gap-3">
            <motion.button
              type="button"
              whileHover={{ scale: 1.04, boxShadow: `0 0 50px ${FORGE_GLOW}` }}
              whileTap={{ scale: 0.97 }}
              style={{ willChange: "transform" }}
              className="flex cursor-pointer items-center gap-2 rounded-[10px] bg-gradient-forge px-[26px] py-3.5 font-sans text-[15px] font-bold text-white shadow-[0_0_24px_rgba(124,106,250,0.3)] transition-shadow duration-300"
            >
              Start clipping free <ArrowRight size={16} />
            </motion.button>
            <motion.button
              type="button"
              whileHover={{
                scale: 1.04,
                backgroundColor: "rgba(255,255,255,0.07)",
              }}
              whileTap={{ scale: 0.97 }}
              style={{ willChange: "transform" }}
              className="flex cursor-pointer items-center gap-2 rounded-[10px] border border-white/12 bg-white/4 px-6 py-3.5 font-sans text-[15px] font-semibold text-white/75 transition-colors duration-200"
            >
              <Play size={15} fill="currentColor" /> Watch demo
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div variants={item} className="flex gap-8">
            {STATS.map(({ val, label }, i) => (
              <div key={label} className="flex flex-col gap-0.5">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: 0.6 + i * 0.1,
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="font-heading text-xl font-extrabold text-white"
                >
                  {val}
                </motion.div>
                <div className="font-sans text-xs text-white/35">{label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right column — hero visual */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center"
          style={{ willChange: "transform" }}
        >
          <HeroVisual />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 7, 0] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        style={{ willChange: "transform" }}
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5"
      >
        <span className="font-mono text-[10px] tracking-[0.2em] text-white/20">
          SCROLL
        </span>
        <ChevronDown size={15} className="text-white/20" />
      </motion.div>
    </section>
  );
}
