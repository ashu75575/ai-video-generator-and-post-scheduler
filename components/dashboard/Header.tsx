"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  Scissors,
  ChevronDown,
  Settings,
  LogOut,
} from "lucide-react";
import { useUser, useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function Header() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const userDisplayName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      user.username ||
      "Creator"
    : "Alex Vance";
  const userFirstName = user?.firstName || "Alex";
  const userEmail = user
    ? user.primaryEmailAddress?.emailAddress
    : "alex@clipforge.ai";
  const userAvatar = user?.imageUrl || "";

  // Extract initials for fallback
  const userInitials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : userDisplayName.slice(0, 2).toUpperCase();

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

      {/* Actions / User Account Section */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/2 hover:bg-white/5 px-3 py-1.5 transition-all text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-forge-accent/40"
          >
            <Avatar className="h-7 w-7 border border-white/10 ring-1 ring-forge-accent/10 shrink-0">
              {userAvatar ? (
                <AvatarImage src={userAvatar} alt={userDisplayName} />
              ) : (
                <AvatarImage src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" />
              )}
              <AvatarFallback className="bg-forge-accent/10 text-forge-accent font-semibold text-[10px]">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline font-sans text-xs font-semibold text-white/90 max-w-[100px] truncate">
              {userFirstName}
            </span>
            <ChevronDown
              size={13}
              className={cn(
                "text-white/40 transition-transform duration-200 shrink-0",
                isDropdownOpen && "transform rotate-180"
              )}
            />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <>
                {/* Backdrop overlay to close the dropdown on clicking outside */}
                <div
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setIsDropdownOpen(false)}
                />
                
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 mt-2 z-50 w-56 origin-top-right rounded-xl border border-white/12 bg-[#0d0d18]/95 backdrop-blur-2xl p-2.5 shadow-xl shadow-black/60 focus:outline-none"
                >
                  {/* User info header */}
                  <div className="flex items-center gap-3 px-2.5 py-2 border-b border-white/8 mb-2">
                    <Avatar className="h-8 w-8 border border-white/10 shrink-0">
                      {userAvatar ? (
                        <AvatarImage src={userAvatar} alt={userDisplayName} />
                      ) : (
                        <AvatarImage src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" />
                      )}
                      <AvatarFallback className="bg-forge-accent/10 text-forge-accent font-semibold text-[10px]">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="font-sans text-xs font-bold text-white truncate leading-none">
                        {userDisplayName}
                      </span>
                      <span className="mt-1 font-mono text-[9px] text-white/35 truncate">
                        {userEmail}
                      </span>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="space-y-0.5">
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-white/70 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                    >
                      <Settings size={13} className="text-white/40" />
                      <span>Settings</span>
                    </Link>

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        signOut({ redirectUrl: "/" });
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all text-left cursor-pointer"
                    >
                      <LogOut size={13} className="text-red-400/70" />
                      <span>Logout</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
