"use client";

import { useRef, useState, type ReactNode } from "react";
import { motion, useInView } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { FORGE_ACCENT } from "./tokens";

type BentoCardProps = {
  title: string;
  desc: string;
  icon: LucideIcon;
  color?: string;
  large?: boolean;
  tall?: boolean;
  children?: ReactNode;
  delay?: number;
};

export function BentoCard({
  title,
  desc,
  icon: Icon,
  color = FORGE_ACCENT,
  large = false,
  tall = false,
  children,
  delay = 0,
}: BentoCardProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative cursor-default overflow-hidden min-h-fit rounded-[18px] p-7 transition-[background,border-color,box-shadow] duration-300",
        large ? "col-span-2" : "col-span-1",
        tall ? "row-span-2" : "row-span-1",
        hovered
          ? "border-white/12 bg-white/[0.04]"
          : "border-white/7 bg-white/[0.025]",
        "border",
      )}
      style={{
        boxShadow: hovered ? `0 0 40px ${color}18` : "none",
      }}
    >
      {hovered && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${color}10 0%, transparent 60%)`,
          }}
        />
      )}
      <div
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] border"
        style={{
          background: `${color}18`,
          borderColor: `${color}30`,
        }}
      >
        <Icon size={18} color={color} />
      </div>
      <div className="mb-2 font-[family-name:var(--font-space-grotesk)] text-[17px] font-bold text-white">
        {title}
      </div>
      <div className="font-[family-name:var(--font-dm-sans)] text-sm leading-relaxed text-white/45">
        {desc}
      </div>
      {children}
    </motion.div>
  );
}
