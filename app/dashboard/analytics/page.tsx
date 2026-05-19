"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Cell } from "recharts";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip
} from "recharts";

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const weeklyViewsData = [
    { day: "Mon", tiktok: 45000, shorts: 32000, reels: 28000 },
    { day: "Tue", tiktok: 52000, shorts: 38000, reels: 31000 },
    { day: "Wed", tiktok: 68000, shorts: 42000, reels: 39000 },
    { day: "Thu", tiktok: 89000, shorts: 54000, reels: 48000 },
    { day: "Fri", tiktok: 110000, shorts: 75000, reels: 62000 },
    { day: "Sat", tiktok: 145000, shorts: 98000, reels: 88000 },
    { day: "Sun", tiktok: 168000, shorts: 124000, reels: 105000 },
  ];

  const viralityIndexData = [
    { name: "Hook", score: 96 },
    { name: "Pacing", score: 92 },
    { name: "Retention", score: 90 },
    { name: "Visuals", score: 88 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 max-w-[1200px] mx-auto"
    >
      <div>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-white tracking-tight">
          Platform Performance
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Consolidated view counts, growth dynamics, and engagement indicators.
        </p>
      </div>

      {/* Growth charts and data panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Multi-channel view count AreaChart */}
        <Card className="lg:col-span-2 bg-white/[0.025] border border-white/5 rounded-[20px] p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-white">
                Weekly Views Analytics
              </h3>
              <p className="text-[10px] text-white/30">Average multi-channel impressions.</p>
            </div>
            <div className="flex items-center gap-3 font-mono text-[10px]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-forge-accent" />
                TikTok
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-forge-accent-2" />
                YouTube
              </span>
            </div>
          </div>

          {/* Area Chart Rendering */}
          <div className="h-64 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyViewsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTikTok" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c6afa" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7c6afa" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorShorts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3ecfcf" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3ecfcf" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#ffffff" opacity={0.2} fontSize={10} tickLine={false} />
                  <YAxis stroke="#ffffff" opacity={0.2} fontSize={10} tickLine={false} />
                  <ChartTooltip
                    contentStyle={{
                      backgroundColor: "#0d0d18",
                      borderColor: "rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                      fontSize: "11px",
                      color: "#ffffff"
                    }}
                  />
                  <Area type="monotone" dataKey="tiktok" stroke="#7c6afa" strokeWidth={2} fillOpacity={1} fill="url(#colorTikTok)" />
                  <Area type="monotone" dataKey="shorts" stroke="#3ecfcf" strokeWidth={2} fillOpacity={1} fill="url(#colorShorts)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-white/[0.02] animate-pulse rounded-xl" />
            )}
          </div>
        </Card>

        {/* Virality Factors bar chart */}
        <Card className="bg-white/[0.025] border border-white/5 rounded-[20px] p-6">
          <div className="mb-6">
            <h3 className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-white">
              Success Factors Analysis
            </h3>
            <p className="text-[10px] text-white/30">Average metrics of high-performing clips.</p>
          </div>

          <div className="h-64 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={viralityIndexData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#ffffff" opacity={0.2} fontSize={10} tickLine={false} />
                  <YAxis stroke="#ffffff" opacity={0.2} fontSize={10} tickLine={false} />
                  <ChartTooltip
                    contentStyle={{
                      backgroundColor: "#0d0d18",
                      borderColor: "rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                      fontSize: "11px",
                      color: "#ffffff"
                    }}
                  />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                    {viralityIndexData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#7c6afa" : "#3ecfcf"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-white/[0.02] animate-pulse rounded-xl" />
            )}
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
