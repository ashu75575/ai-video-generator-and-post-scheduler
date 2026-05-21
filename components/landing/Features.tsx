"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  AudioWaveformIcon,
  BarChart2,
  Calendar,
  Cpu,
  Film,
  Share2,
  Zap,
} from "lucide-react";
import { BentoCard } from "./BentoCard";
import { FORGE_ACCENT, FORGE_ACCENT_2 } from "./tokens";

const PLATFORMS = [
  { name: "TikTok", c: "#FF0050" },
  { name: "Instagram", c: "#E1306C" },
  { name: "YouTube", c: "#FF0000" },
  { name: "Twitter", c: "#1DA1F2" },
  { name: "LinkedIn", c: "#0A66C2" },
];

export function Features() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" className="relative px-6 py-[100px]">
      {/* Section divider top */}
      <div className="mx-auto mb-[100px] max-w-[1200px]">
        <div
          className="h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(124,106,250,0.15), rgba(62,207,207,0.1), transparent)",
          }}
        />
      </div>

      <div className="mx-auto max-w-[1200px]">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-16"
        >
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-forge-accent-2/20 bg-forge-accent-2/8 px-3.5 py-1.5">
            <div
              className="h-1.5 w-1.5 rounded-full bg-forge-accent-2"
              style={{ boxShadow: "0 0 6px #3ECFCF" }}
            />
            <span className="font-[family-name:var(--font-dm-sans)] text-xs font-medium text-forge-accent-2">
              Capabilities
            </span>
          </div>
          <h2 className="max-w-[560px] font-[family-name:var(--font-space-grotesk)] text-[clamp(30px,4vw,48px)] leading-tight font-extrabold tracking-[-1.5px] text-white">
            Everything you need
            <br />
            to go viral, <span className="text-gradient-forge">automated.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <BentoCard
            delay={0}
            title="AI Viral Detection"
            icon={Zap}
            color="#FF6B6B"
            desc="GPT-4o Vision scans every frame, identifying moments with the highest engagement potential using social psychology signals."
          >
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {["Hook score", "Energy spike", "Sentiment", "Pacing"].map(
                (tag) => (
                  <motion.span
                    key={tag}
                    whileHover={{ scale: 1.05, y: -1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="rounded-md border border-[#FF6B6B]/20 bg-[#FF6B6B]/10 px-2 py-0.5 font-mono text-[11px] text-[#FF6B6B] cursor-default"
                  >
                    {tag}
                  </motion.span>
                ),
              )}
            </div>
          </BentoCard>

          <BentoCard
            delay={0.08}
            title="Smart Reframing"
            icon={Film}
            color={FORGE_ACCENT}
            desc="Automatically reframes horizontal video to 9:16 portrait, tracking subjects with cinematic precision."
          />

          <BentoCard
            delay={0.16}
            title="Auto Captions & Subtitles"
            icon={AudioWaveformIcon}
            color={FORGE_ACCENT_2}
            desc="Generates styled animated captions with 99.4% accuracy across 40+ languages."
          >
            <motion.div
              animate={{ width: ["0%", "100%", "0%"] }}
              transition={{
                repeat: Infinity,
                duration: 3.5,
                ease: "easeInOut",
              }}
              style={{ willChange: "transform" }}
              className="mt-4 h-0.5 rounded-sm bg-gradient-to-r from-transparent via-forge-accent-2 to-transparent"
            />
            <div className="mt-2.5 flex gap-1.5">
              {["EN", "ES", "FR", "DE", "ZH", "+35"].map((lang) => (
                <span
                  key={lang}
                  className="rounded border border-forge-accent-2/15 bg-forge-accent-2/8 px-1.5 py-0.5 font-mono text-[10px] text-forge-accent-2/70"
                >
                  {lang}
                </span>
              ))}
            </div>
          </BentoCard>

          <BentoCard
            delay={0.04}
            title="Multi-Platform Publishing"
            icon={Share2}
            color="#F6C90E"
            large
            desc="One click posts to TikTok, Instagram Reels, YouTube Shorts, Twitter/X, and LinkedIn simultaneously."
          >
            <div className="mt-4 flex gap-2.5">
              {PLATFORMS.map((p, i) => (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, y: 8 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.4 + i * 0.07, duration: 0.4 }}
                  whileHover={{ y: -4, scale: 1.1 }}
                  style={{
                    willChange: "transform",
                    background: `${p.c}18`,
                    borderColor: `${p.c}35`,
                    boxShadow: `0 0 12px ${p.c}20`,
                  }}
                  className="flex h-[34px] w-[34px] items-center justify-center rounded-lg border text-[13px] font-bold cursor-default select-none"
                >
                  <span style={{ color: p.c }}>{p.name[0]}</span>
                </motion.div>
              ))}
            </div>
          </BentoCard>

          <BentoCard
            delay={0.12}
            title="Smart Scheduler"
            icon={Calendar}
            color="#A78BFA"
            desc="AI analyzes your audience's peak engagement times and auto-schedules for maximum reach."
          />

          <BentoCard
            delay={0.2}
            title="Analytics Dashboard"
            icon={BarChart2}
            color="#34D399"
            desc="Real-time metrics on views, engagement rate, and virality score per clip."
          />

          <BentoCard
            delay={0.06}
            title="B-roll & Music"
            icon={Cpu}
            color="#F472B6"
            desc="Automatically sources royalty-free background music matched to clip tone and pacing."
          />
        </div>
      </div>
    </section>
  );
}
