"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Calendar, Cpu, Scissors, Upload } from "lucide-react";
import { FORGE_ACCENT, FORGE_ACCENT_2 } from "./tokens";

const STEPS = [
  {
    num: "01",
    title: "Upload your video",
    desc: "Drop any long-form video — podcast, webinar, lecture, stream. We accept MP4, MOV, AVI up to 10GB.",
    icon: Upload,
    color: "#FF6B6B",
  },
  {
    num: "02",
    title: "AI analyzes content",
    desc: "Our vision model scans every second for viral triggers: emotional peaks, key insights, humor, quotable moments.",
    icon: Cpu,
    color: FORGE_ACCENT,
  },
  {
    num: "03",
    title: "Clips are generated",
    desc: "The best moments are extracted, reframed, captioned, and polished. You review and customize any clip.",
    icon: Scissors,
    color: FORGE_ACCENT_2,
  },
  {
    num: "04",
    title: "Schedule & publish",
    desc: "Set your posting calendar or let AI decide. Posts go live automatically across all your connected platforms.",
    icon: Calendar,
    color: "#F6C90E",
  },
];

export function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="how-it-works" className="relative px-6 py-[100px]">
      <div className="mx-auto max-w-[1200px]">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-[70px]"
        >
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-forge-accent/20 bg-forge-accent/8 px-3.5 py-1.25">
            <span className="font-[family-name:var(--font-dm-sans)] text-xs font-medium text-forge-accent">
              Process
            </span>
          </div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-[clamp(30px,4vw,48px)] leading-tight font-extrabold tracking-[-1.5px] text-white">
            From raw footage to
            <br />
            viral content in 4 steps.
          </h2>
        </motion.div>

        <motion.div className="relative">
          <div className="absolute top-14 right-14 left-14 z-0 hidden h-px bg-gradient-to-r from-transparent via-white/8 to-transparent lg:block" />

          <div className="relative z-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {STEPS.map((step, i) => (
              <motion.article
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.7,
                  delay: i * 0.12,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border"
                  style={{
                    background: `${step.color}15`,
                    borderColor: `${step.color}30`,
                    boxShadow: `0 0 30px ${step.color}15`,
                  }}
                >
                  <step.icon size={24} color={step.color} />
                </motion.div>
                <p className="mb-2.5 font-mono text-xs tracking-widest text-white/20">
                  {step.num}
                </p>
                <h3 className="mb-2.5 font-[family-name:var(--font-space-grotesk)] text-lg font-bold tracking-tight text-white">
                  {step.title}
                </h3>
                <p className="font-[family-name:var(--font-dm-sans)] text-sm leading-relaxed text-white/45">
                  {step.desc}
                </p>
              </motion.article>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
