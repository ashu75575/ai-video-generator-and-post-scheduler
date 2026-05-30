"use client";

import { motion } from "framer-motion";
import {
  Menu,
  Plus,
  Sparkles,
  Scissors,
  Video,
  Flame,
  Calendar,
  Layers,
  ChevronDown,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDashboard } from "@/hooks/use-dashboard";

export function Header() {
  const { user } = useUser();
  const { setIsUploadOpen } = useDashboard();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-white/15 bg-forge-bg/60 backdrop-blur-xl px-4 md:px-8">
      {/* Mobile Sidebar Sheet Trigger & Brand */}
      <div className="flex items-center gap-3 md:hidden">
        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg border border-white/10 bg-white/3 text-white/70 hover:text-white cursor-pointer"
              />
            }
          >
            <Menu size={18} />
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[270px] bg-forge-bg border-r border-white/15 p-0"
          >
            <div className="h-full pt-4">
              <Sidebar />
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-forge shadow-[0_0_10px_rgba(124,106,250,0.4)]">
            <Scissors size={12} className="text-white" />
          </div>
          <span className="font-heading text-sm font-bold tracking-tight text-white">
            ClipForge
          </span>
        </div>
      </div>

      {/* Search removed - layout remains balanced */}
      <div className="hidden md:block" />

      {/* Actions (Notifications removed) */}
      <div className="flex items-center gap-3">
        {/* Quick Action button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => setIsUploadOpen(true)}
            variant="default"
            className="flex h-9 items-center gap-1.5 rounded-xl px-4 font-sans text-xs font-bold cursor-pointer"
          >
            <Plus size={14} className="stroke-[2.5]" />
            <span>Create Clip</span>
          </Button>
        </motion.div>

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
