"use client";

import { motion } from "framer-motion";
import {
  Home,
  Film,
  Calendar,
  Sparkles,
  Scissors,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Link from "next/link";

export function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/dashboard/clips", label: "AI Clips", icon: Sparkles },
    { href: "/dashboard/my-videos", label: "My Videos", icon: Film },
    {
      href: "/dashboard/social-connections",
      label: "Social Connections",
      icon: Share2,
    },
    { href: "/dashboard/schedule", label: "Schedule Posts", icon: Calendar },
  ] as const;


  return (
    <aside className="fixed bottom-0 left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-white/15 bg-forge-bg/90 backdrop-blur-xl px-4 py-6 md:flex">
      {/* Sidebar Logo */}
      <div className="mb-8 flex items-center gap-2.5 px-3">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-forge shadow-[0_0_15px_rgba(124,106,250,0.5)]"
        >
          <Scissors size={14} className="text-white" />
        </motion.div>
        <span className="font-heading text-lg font-bold tracking-tight text-white">
          ClipForge
          <span className="text-gradient-forge font-extrabold">AI</span>
        </span>
      </div>

      {/* Menu List */}
      <nav className="flex-1 space-y-1 px-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 font-sans text-sm font-medium transition-all duration-300 cursor-pointer select-none",
                isActive
                  ? "text-white"
                  : "text-white/45 hover:bg-white/3 hover:text-white/80",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 z-0 rounded-xl bg-white/4 border border-white/6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                  transition={{ type: "spring", bounce: 0.18, duration: 0.5 }}
                />
              )}

              {/* Sidebar Active Left Glow Line */}
              {isActive && (
                <span className="absolute -left-1 top-1/4 h-1/2 w-1 rounded-r bg-forge-accent shadow-[0_0_8px_#7c6afa]" />
              )}

              <Icon
                size={18}
                className={cn(
                  "relative z-10 transition-colors duration-300",
                  isActive
                    ? "text-forge-accent"
                    : "text-white/40 group-hover:text-white/70",
                )}
              />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}
