"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Bell, 
  Menu, 
  Plus, 
  Sparkles,
  Scissors,
  Video,
  Flame,
  Calendar,
  Layers,
  ChevronDown
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sidebar } from "./Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDashboard } from "@/hooks/use-dashboard";

export function Header() {
  const { user } = useUser();
  const { setIsUploadOpen } = useDashboard();
  const [notifications, setNotifications] = useState([
    { id: 1, title: "AI Clip Generated Successfully", desc: "Your video 'How to build SaaS' has 3 new clips.", time: "2 min ago", unread: true },
    { id: 2, title: "Instagram Post Scheduled", desc: "Reel scheduled for today at 6:00 PM.", time: "1 hr ago", unread: true },
    { id: 3, title: "Analytics Spike Alert!", desc: "TikTok video views increased by +124% in 24h.", time: "4 hr ago", unread: false },
  ]);

  const hasUnread = notifications.some(n => n.unread);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-white/5 bg-[#05050a]/60 backdrop-blur-xl px-4 md:px-8">
      {/* Mobile Sidebar Sheet Trigger & Brand */}
      <div className="flex items-center gap-3 md:hidden">
        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg border border-white/10 bg-white/[0.03] text-white/70 hover:text-white cursor-pointer"
              />
            }
          >
            <Menu size={18} />
          </SheetTrigger>
          <SheetContent side="left" className="w-[270px] bg-[#05050a] border-r border-white/5 p-0">
            <div className="h-full pt-4">
              <Sidebar />
            </div>
          </SheetContent>
        </Sheet>
        
        <div className="flex items-center gap-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-forge shadow-[0_0_10px_rgba(124,106,250,0.4)]">
            <Scissors size={12} className="text-white" />
          </div>
          <span className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold tracking-tight text-white">
            ClipForge
          </span>
        </div>
      </div>

      {/* Search Bar Container */}
      <div className="relative hidden w-80 md:block">
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-white/30">
          <Search size={14} />
        </div>
        <Input
          type="text"
          placeholder="Quick search clips, posts... (⌘K)"
          className="h-9 w-full rounded-xl border border-white/8 bg-white/[0.03] pl-9 pr-12 font-[family-name:var(--font-dm-sans)] text-xs text-white placeholder-white/35 transition-all duration-300 focus:border-forge-accent/50 focus:bg-white/[0.05] focus:ring-0"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-white/10 bg-white/[0.05] px-1.5 py-0.5 font-mono text-[9px] text-white/30">
          ⌘K
        </div>
      </div>

      {/* Actions and Notification */}
      <div className="flex items-center gap-3">
        {/* Quick Action button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => setIsUploadOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-gradient-forge px-4 font-[family-name:var(--font-dm-sans)] text-xs font-bold text-white shadow-md cursor-pointer"
          >
            <Plus size={14} className="stroke-[2.5]" />
            <span>Create Clip</span>
          </Button>
        </motion.div>

        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] text-white/60 hover:text-white cursor-pointer transition-colors"
              />
            }
          >
            <Bell size={15} />
            {hasUnread && (
              <span className="absolute right-2.5 top-2.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-forge-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-forge-accent"></span>
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-80 rounded-2xl border border-white/8 bg-[#0d0d18]/95 backdrop-blur-2xl p-2 text-white shadow-xl shadow-black/60"
          >
            <div className="flex items-center justify-between px-3 py-2">
              <DropdownMenuLabel className="font-[family-name:var(--font-space-grotesk)] text-xs font-bold text-white">
                Notifications
              </DropdownMenuLabel>
              {hasUnread && (
                <button
                  onClick={markAllRead}
                  className="font-[family-name:var(--font-dm-sans)] text-[10px] font-semibold text-forge-accent hover:underline cursor-pointer"
                >
                  Mark all read
                </button>
              )}
            </div>
            <DropdownMenuSeparator className="bg-white/5" />
            <div className="max-h-72 overflow-y-auto py-1">
              {notifications.map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className="flex flex-col items-start gap-1 rounded-xl p-3 text-xs transition-colors hover:bg-white/[0.04] focus:bg-white/[0.04] cursor-pointer"
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <span className="font-[family-name:var(--font-dm-sans)] font-semibold text-white">
                      {n.title}
                    </span>
                    {n.unread && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-forge-accent mt-1" />
                    )}
                  </div>
                  <span className="text-white/45 font-normal leading-relaxed">{n.desc}</span>
                  <span className="mt-1 font-mono text-[9px] text-white/30">{n.time}</span>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Small profile button for mobile */}
        <div className="md:hidden">
          <Avatar className="h-8 w-8 border border-white/10 ring-1 ring-forge-accent/20">
            <AvatarImage src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" />
            <AvatarFallback className="bg-forge-accent/10 text-forge-accent font-bold text-[10px]">
              CF
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
