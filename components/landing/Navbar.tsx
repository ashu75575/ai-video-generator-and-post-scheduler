"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Scissors } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = ["Features", "How it works", "Open source", "Pricing"];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "fixed top-0 right-0 left-0 z-[100] transition-[background,backdrop-filter,border-color] duration-400",
        scrolled
          ? "border-b border-white/7 bg-forge-bg/82 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <motion.div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-gradient-forge">
            <Scissors size={15} className="text-white" />
          </div>
          <span className="font-[family-name:var(--font-space-grotesk)] text-[17px] font-bold tracking-tight text-white">
            ClipForge<span className="text-forge-accent">AI</span>
          </span>
        </div>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((label) => (
            <a
              key={label}
              href="#"
              className="font-[family-name:var(--font-dm-sans)] text-sm text-white/55 transition-colors hover:text-white"
            >
              {label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="#"
            className="font-[family-name:var(--font-dm-sans)] text-sm text-white/60 no-underline"
          >
            Sign in
          </a>
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="cursor-pointer rounded-lg bg-gradient-forge px-[18px] py-2.25 font-[family-name:var(--font-dm-sans)] text-sm font-semibold tracking-wide text-white"
          >
            Get started free
          </motion.button>
        </div>
      </motion.div>
    </motion.nav>
  );
}
