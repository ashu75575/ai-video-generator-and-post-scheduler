"use client";

import { motion } from "framer-motion";
import { Calendar, Clock } from "lucide-react";
import { useDashboard } from "@/hooks/use-dashboard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function SchedulePage() {
  const { scheduledPosts } = useDashboard();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 max-w-[1200px] mx-auto"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-white tracking-tight">
            Post Delivery Pipeline
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Auto-schedule and coordinate direct publications to social channels.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Scheduled queue timeline */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-white/[0.025] border border-white/5 rounded-[20px] p-6">
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-base font-bold text-white mb-5">
              Delivery Queue
            </h2>

            {scheduledPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-white/20 border border-dashed border-white/5 rounded-2xl bg-white/[0.005]">
                <Calendar
                  size={32}
                  className="stroke-[1.5] mb-2.5 text-white/10"
                />
                <span className="text-sm font-semibold text-white/40">
                  Delivery Queue is empty
                </span>
                <span className="text-xs mt-1 max-w-xs mx-auto leading-relaxed">
                  No social posts have been scheduled yet. Forge a clip and
                  schedule it to see your timeline here.
                </span>
                <Link href="/dashboard/clips">
                  <Button className="mt-4 h-8 rounded-lg bg-forge-accent hover:bg-forge-accent/90 px-4 text-xs font-bold text-white cursor-pointer">
                    Go to Clips Workspace
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-6 relative border-l border-white/10 pl-6 ml-3">
                {scheduledPosts.map((post) => (
                  <div key={post.id} className="relative space-y-2">
                    {/* Glowing bullet on timeline */}
                    <span className="absolute -left-[30px] top-1.5 h-3 w-3 rounded-full bg-forge-accent shadow-[0_0_8px_#7c6afa] ring-4 ring-forge-bg" />

                    <div className="p-4 rounded-xl bg-white/[0.015] border border-white/5 hover:border-white/10 hover:bg-white/[0.025] transition-all duration-300">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-forge-accent-2/10 border-forge-accent-2/20 text-forge-accent-2 font-mono text-[9px] uppercase tracking-wider">
                            {post.platform}
                          </Badge>
                          <span className="font-mono text-[10px] text-white/40 flex items-center gap-1">
                            <Clock size={10} />
                            {post.time}
                          </span>
                        </div>
                        <Badge className="bg-amber-500/10 border-amber-500/20 text-amber-400 font-mono text-[9px]">
                          {post.status}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-sm text-white mb-1.5">
                        {post.title}
                      </h3>
                      <p className="text-xs text-white/50 italic leading-relaxed font-[family-name:var(--font-dm-sans)]">
                        "{post.caption}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Connection accounts status */}
        <div className="space-y-6">
          <Card className="bg-white/[0.025] border border-white/5 rounded-[20px] p-6">
            <h3 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-white mb-4">
              Connected Accounts
            </h3>

            <div className="space-y-3">
              {[
                {
                  name: "TikTok Account",
                  handle: "@devin_creations",
                  status: "Connected",
                  action: "Manage",
                  active: true,
                },
                {
                  name: "YouTube Shorts",
                  handle: "Devin Innovations",
                  status: "Connected",
                  action: "Manage",
                  active: true,
                },
                {
                  name: "Instagram Reels",
                  handle: "@devin_tech",
                  status: "Connected",
                  action: "Manage",
                  active: true,
                },
                {
                  name: "X / Twitter Videos",
                  handle: "Not linked",
                  status: "Disconnected",
                  action: "Link",
                  active: false,
                },
              ].map((acc, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-white/[0.015] border border-white/5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-0.5">
                    <span className="block font-semibold text-xs text-white">
                      {acc.name}
                    </span>
                    <span className="block font-mono text-[10px] text-white/35 truncate">
                      {acc.handle}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${acc.active ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" : "bg-white/10"}`}
                    />
                    <button className="font-mono text-[10px] font-bold text-white/50 hover:text-white cursor-pointer hover:underline">
                      {acc.action}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
