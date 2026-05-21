"use client";

import { useRef, useState, type MouseEvent, type ReactNode } from "react";
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
  const cardRef = useRef<HTMLDivElement>(null);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50, visible: false });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setSpotlight({ x, y, visible: true });
  };

  const handleMouseLeave = () =>
    setSpotlight((s) => ({ ...s, visible: false }));

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        large ? "col-span-2" : "col-span-1",
        tall ? "row-span-2" : "row-span-1",
      )}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={{ y: -3 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        style={{
          willChange: "transform",
          boxShadow: spotlight.visible ? `0 0 40px ${color}15` : "none",
          transition: "box-shadow 0.3s ease",
        }}
        className={cn(
          "group relative cursor-default overflow-hidden rounded-[18px] border border-white/[0.07] bg-white/2.5 p-7 min-h-fit",
          "hover:border-white/12",
          "[transition:border-color_300ms]",
        )}
      >
        {/* Mouse-tracking spotlight */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[18px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(200px circle at ${spotlight.x}% ${spotlight.y}%, ${color}12 0%, transparent 70%)`,
          }}
        />

        {/* Top edge accent line */}
        <div
          className="pointer-events-none absolute top-0 left-0 right-0 h-px rounded-t-[18px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `linear-gradient(90deg, transparent, ${color}40, transparent)`,
          }}
        />

        {/* Icon */}
        <motion.div
          whileHover={{ scale: 1.1, rotate: 3 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] border"
          style={{
            background: `${color}18`,
            borderColor: `${color}30`,
            boxShadow: `0 0 16px ${color}15`,
          }}
        >
          <Icon size={18} color={color} />
        </motion.div>

        {/* Title */}
        <div className="mb-2 font-heading text-[17px] font-bold text-white">
          {title}
        </div>

        {/* Description */}
        <div className="font-sans text-sm leading-relaxed text-white/45">
          {desc}
        </div>

        {children}
      </motion.div>
    </motion.div>
  );
}
