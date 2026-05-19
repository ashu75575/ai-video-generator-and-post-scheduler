"use client";

import { motion } from "framer-motion";
import {
  Home,
  Film,
  Calendar,
  BarChart3,
  Sparkles,
  Settings,
  LogOut,
  Scissors,
  User
} from "lucide-react";
import { useUser, useClerk } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Link from "next/link";

export function Sidebar() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const pathname = usePathname();

  const menuItems = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/dashboard/clips", label: "AI Clips", icon: Sparkles },
    { href: "/dashboard/videos", label: "My Videos", icon: Film },
    { href: "/dashboard/schedule", label: "Schedule Posts", icon: Calendar },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  ] as const;

  const userDisplayName = isLoaded && user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "Creator" : "Alex Vance";
  const userEmail = isLoaded && user ? user.primaryEmailAddress?.emailAddress : "alex@clipforge.ai";
  const userAvatar = isLoaded && user ? user.imageUrl : "";

  return (
    <aside className="fixed bottom-0 left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-white/5 bg-[#05050a]/90 backdrop-blur-xl px-4 py-6 md:flex">
      {/* Sidebar Logo */}
      <div className="mb-8 flex items-center gap-2.5 px-3">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-forge shadow-[0_0_15px_rgba(124,106,250,0.5)]"
        >
          <Scissors size={14} className="text-white" />
        </motion.div>
        <span className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold tracking-tight text-white">
          ClipForge<span className="text-gradient-forge font-extrabold">AI</span>
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
                "group relative flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 font-[family-name:var(--font-dm-sans)] text-sm font-medium transition-all duration-300 cursor-pointer select-none",
                isActive
                  ? "text-white"
                  : "text-white/45 hover:bg-white/[0.03] hover:text-white/80"
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 z-0 rounded-xl bg-white/[0.04] border border-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
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
                  isActive ? "text-forge-accent" : "text-white/40 group-hover:text-white/70"
                )}
              />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer Area */}
      <div className="mt-auto space-y-4 border-t border-white/5 pt-4">
        {/* User profile section */}
        <div className="flex items-center gap-3 px-3 py-1.5">
          <Avatar className="h-9 w-9 border border-white/10 ring-1 ring-forge-accent/20">
            {userAvatar ? (
              <AvatarImage src={userAvatar} alt={userDisplayName} />
            ) : (
              <AvatarImage src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" />
            )}
            <AvatarFallback className="bg-forge-accent/10 text-forge-accent">
              <User size={14} />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="font-[family-name:var(--font-dm-sans)] text-xs font-semibold text-white truncate leading-none">
              {userDisplayName}
            </span>
            <span className="mt-1 font-mono text-[10px] text-white/35 truncate">
              {userEmail}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="ghost"
            className="flex items-center justify-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.04] px-2 py-2 text-xs font-medium text-white/60 hover:text-white cursor-pointer transition-colors"
          >
            <Settings size={13} className="text-white/40" />
            <span>Settings</span>
          </Button>

          <Button
            onClick={() => signOut({ redirectUrl: "/" })}
            variant="ghost"
            className="flex items-center justify-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-red-500/10 px-2 py-2 text-xs font-medium text-white/60 hover:text-red-400 cursor-pointer transition-colors"
          >
            <LogOut size={13} className="text-white/40 group-hover:text-red-400" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </aside>
  );
}
