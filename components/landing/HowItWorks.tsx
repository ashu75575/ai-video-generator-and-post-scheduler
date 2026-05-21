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
      {/* Subtle divider */}
      <div className="mx-auto mb-[80px] max-w-[1200px]">
        <div
          className="h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(62,207,207,0.12), rgba(124,106,250,0.1), transparent)",
          }}
        />
      </div>

      <div className="mx-auto max-w-[1200px]">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-[70px]"
        >
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-forge-accent/20 bg-forge-accent/8 px-3.5 py-1.5">
            <div
              className="h-1.5 w-1.5 rounded-full bg-forge-accent"
              style={{ boxShadow: "0 0 6px #7C6AFA" }}
            />
            <span className="font-sans text-xs font-medium text-forge-accent">
              Process
            </span>
          </div>
          <h2 className="font-heading text-[clamp(30px,4vw,48px)] leading-tight font-extrabold tracking-[-1.5px] text-white">
            From raw footage to
            <br />
            <span className="text-gradient-forge">viral content</span> in 4
            steps.
          </h2>
        </motion.div>

        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="absolute top-8 right-14 left-14 z-0 hidden h-px lg:block">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : {}}
              transition={{
                duration: 1.2,
                delay: 0.3,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{ originX: 0, willChange: "transform" }}
              className="h-full bg-linear-to-r from-[#FF6B6B]/30 via-forge-accent/30 to-[#F6C90E]/30"
            />
          </div>

          <div className="relative z-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {STEPS.map((step, i) => (
              <motion.article
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.7,
                  delay: i * 0.13,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {/* Icon circle */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 350, damping: 20 }}
                  style={{
                    willChange: "transform",
                    background: `${step.color}15`,
                    borderColor: `${step.color}30`,
                    boxShadow: `0 0 30px ${step.color}18`,
                  }}
                  className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-full border"
                >
                  <step.icon size={24} color={step.color} />

                  {/* Step number as small badge */}
                  <div
                    className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border text-[9px] font-bold font-mono"
                    style={{
                      background: `${step.color}20`,
                      borderColor: `${step.color}40`,
                      color: step.color,
                    }}
                  >
                    {i + 1}
                  </div>
                </motion.div>

                <p className="mb-2.5 font-mono text-xs tracking-widest text-white/20">
                  {step.num}
                </p>
                <h3 className="mb-2.5 font-heading text-lg font-bold tracking-tight text-white">
                  {step.title}
                </h3>
                <p className="font-sans text-sm leading-relaxed text-white/45">
                  {step.desc}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
