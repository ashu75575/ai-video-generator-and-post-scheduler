"use client";

import { motion } from "framer-motion";
import { Scissors } from "lucide-react";

const COLS = [
  {
    heading: "Product",
    links: ["Features", "How it works", "Pricing", "Changelog", "Roadmap"],
  },
  {
    heading: "Developers",
    links: [
      "Documentation",
      "SDK Reference",
      "API Status",
      "GitHub",
      "Examples",
    ],
  },
  {
    heading: "Company",
    links: ["About", "Blog", "Careers", "Press kit", "Contact"],
  },
];

const SOCIAL_LINKS = [
  { label: "Twitter / X", href: "#" },
  { label: "GitHub", href: "#" },
  { label: "Discord", href: "#" },
];

export function Footer() {
  return (
    <footer className="relative border-t border-white/[0.05] px-6 pt-[60px] pb-10">
      {/* Subtle top glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-px w-[600px]"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(124,106,250,0.25), transparent)",
        }}
      />

      <div className="mx-auto max-w-[1200px]">
        <div className="mb-14 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] lg:gap-12">
          {/* Brand column */}
          <div>
            <motion.div
              className="mb-4 flex items-center gap-2 select-none"
              whileHover={{ x: 2 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-gradient-forge shadow-[0_0_10px_rgba(124,106,250,0.3)]">
                <Scissors size={13} className="text-white" />
              </div>
              <span className="font-[family-name:var(--font-space-grotesk)] text-base font-bold text-white">
                ClipForge<span className="text-forge-accent">AI</span>
              </span>
            </motion.div>
            <p className="max-w-[260px] font-[family-name:var(--font-dm-sans)] text-sm leading-relaxed text-white/30">
              Turn any long-form video into viral short clips with AI. Built for
              creators.
            </p>

            {/* Social links */}
            <div className="mt-6 flex gap-3">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="rounded-md border border-white/8 bg-white/[0.03] px-3 py-1.5 font-[family-name:var(--font-dm-sans)] text-xs text-white/30 transition-all duration-200 hover:border-white/15 hover:bg-white/[0.06] hover:text-white/60"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {COLS.map((col) => (
            <div key={col.heading}>
              <div className="mb-4 font-[family-name:var(--font-dm-sans)] text-xs font-bold tracking-wider text-white/40 uppercase">
                {col.heading}
              </div>
              {col.links.map((link) => (
                <a
                  key={link}
                  href="#"
                  className="group mb-2.5 flex items-center gap-1.5 font-[family-name:var(--font-dm-sans)] text-sm text-white/30 no-underline transition-colors duration-200 hover:text-white/70"
                >
                  <span className="h-px w-0 bg-forge-accent transition-all duration-200 group-hover:w-3 rounded-full" />
                  {link}
                </a>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.05] pt-7">
          <span className="font-[family-name:var(--font-dm-sans)] text-[13px] text-white/20">
            © 2026 ClipForge AI Inc. All rights reserved.
          </span>
          <div className="flex gap-6">
            {["Privacy Policy", "Terms of Service", "Cookie Settings"].map(
              (label) => (
                <a
                  key={label}
                  href="#"
                  className="font-[family-name:var(--font-dm-sans)] text-[13px] text-white/20 no-underline transition-colors duration-200 hover:text-white/45"
                >
                  {label}
                </a>
              ),
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
