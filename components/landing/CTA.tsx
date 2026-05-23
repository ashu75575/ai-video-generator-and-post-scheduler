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
    <section ref={ref} className="relative overflow-hidden px-6 py-[120px]">
      {/* Gradient divider top */}
      <div className="mx-auto mb-[80px] max-w-[1200px]">
        <div
          className="h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(152, 61, 22,0.2), rgba(161,136,125,0.12), transparent)",
          }}
        />
      </div>

      {/* Central radial glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[900px] rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(ellipse, rgba(152, 61, 22,0.18) 0%, rgba(161,136,125,0.06) 50%, transparent 75%)",
          filter: "blur(40px)",
        }}
      />

      {/* Decorative rings */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full border border-forge-accent/5"
        style={{ transform: "translate(-50%, -50%)" }}
      />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full border border-forge-accent/8"
        style={{ transform: "translate(-50%, -50%)" }}
      />

      <div className="relative mx-auto max-w-[760px] text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          {/* Badge */}
          <div className="mb-7 inline-flex items-center gap-1.5 rounded-full border border-forge-accent/20 bg-forge-accent/10 px-3.5 py-1.5">
            <motion.div
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              style={{ willChange: "transform" }}
            >
              <Zap
                size={12}
                className="text-forge-accent"
                fill={FORGE_ACCENT}
              />
            </motion.div>
            <span className="font-sans text-xs font-medium text-forge-accent">
              No credit card required
            </span>
          </div>

          {/* Headline */}
          <h2 className="mb-5 font-heading text-[clamp(36px,5vw,64px)] leading-[1.05] font-extrabold tracking-[-2px] text-white">
            Start creating viral
            <br />
            <span className="text-gradient-forge">clips today. For free.</span>
          </h2>

          <p className="mb-11 font-sans text-[17px] leading-relaxed text-white/45">
            Join 10,000+ creators who use ClipForge AI to grow faster.
            <br />
            Process your first 5 videos for free, no setup required.
          </p>

          {/* Buttons */}
          <div className="mb-10 flex flex-wrap justify-center gap-3.5">
            <motion.button
              type="button"
              whileHover={{ scale: 1.05, boxShadow: `0 0 70px ${FORGE_GLOW}` }}
              whileTap={{ scale: 0.97 }}
              style={{ willChange: "transform" }}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-gradient-forge px-8 py-4 font-sans text-base font-bold text-[#e5dad4] shadow-[0_0_30px_rgba(152, 61, 22,0.3)] transition-shadow duration-300"
            >
              Get started free <ArrowRight size={18} />
            </motion.button>
            <motion.button
              type="button"
              whileHover={{
                scale: 1.04,
                backgroundColor: "rgba(255,255,255,0.07)",
              }}
              whileTap={{ scale: 0.97 }}
              style={{ willChange: "transform" }}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/4 px-7 py-4 font-sans text-base font-semibold text-white/60 transition-colors duration-200"
            >
              Schedule a demo
            </motion.button>
          </div>

          {/* Feature list */}
          <motion.div
            className="flex flex-wrap justify-center gap-6"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-1.5">
                <div
                  className="flex h-4 w-4 items-center justify-center rounded-full"
                  style={{ background: "rgba(161,136,125,0.15)" }}
                >
                  <Check size={10} className="text-forge-accent-2" />
                </div>
                <span className="font-sans text-[13px] text-white/40">{f}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
