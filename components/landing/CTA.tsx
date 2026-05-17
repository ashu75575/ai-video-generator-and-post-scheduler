"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Check, Zap } from "lucide-react";
import { FORGE_ACCENT, FORGE_GLOW } from "./tokens";

const FEATURES = [
  "Free 5 videos/month",
  "No credit card",
  "Cancel anytime",
  "GDPR compliant",
];

export function CTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative overflow-hidden px-6 py-[100px]">
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(124,106,250,0.15)_0%,transparent_70%)]" />

      <div className="relative mx-auto max-w-[760px] text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <div className="mb-7 inline-flex items-center gap-1.5 rounded-full border border-forge-accent/20 bg-forge-accent/10 px-3.5 py-1.25">
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Zap size={12} className="text-forge-accent" fill={FORGE_ACCENT} />
            </motion.div>
            <span className="font-[family-name:var(--font-dm-sans)] text-xs font-medium text-forge-accent">
              No credit card required
            </span>
          </div>

          <h2 className="mb-5 font-[family-name:var(--font-space-grotesk)] text-[clamp(36px,5vw,64px)] leading-[1.05] font-extrabold tracking-[-2px] text-white">
            Start creating viral
            <br />
            <span className="text-gradient-forge">clips today. For free.</span>
          </h2>

          <p className="mb-11 font-[family-name:var(--font-dm-sans)] text-[17px] leading-relaxed text-white/45">
            Join 10,000+ creators who use ClipForge AI to grow faster.
            <br />
            Process your first 5 videos for free, no setup required.
          </p>

          <div className="mb-8 flex flex-wrap justify-center gap-3.5">
            <motion.button
              type="button"
              whileHover={{ scale: 1.05, boxShadow: `0 0 60px ${FORGE_GLOW}` }}
              whileTap={{ scale: 0.97 }}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-gradient-forge px-8 py-4 font-[family-name:var(--font-dm-sans)] text-base font-bold text-white"
            >
              Get started free <ArrowRight size={18} />
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-7 py-4 font-[family-name:var(--font-dm-sans)] text-base font-semibold text-white/60"
            >
              Schedule a demo
            </motion.button>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-1.5">
                <Check size={13} className="text-forge-accent-2" />
                <span className="font-[family-name:var(--font-dm-sans)] text-[13px] text-white/40">
                  {f}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
