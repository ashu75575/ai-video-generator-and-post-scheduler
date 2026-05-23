"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FORGE_ACCENT, FORGE_ACCENT_2 } from "./tokens";

type ClipItem = {
  label: string;
  time: string;
  score: number;
  color: string;
};

const CLIP_DATA: ClipItem[] = [
  { label: "🔥 Viral moment", time: "0:32", score: 98, color: "#FF6B6B" },
  { label: "⚡ Peak energy", time: "1:14", score: 91, color: FORGE_ACCENT },
  {
    label: "😂 High engagement",
    time: "2:47",
    score: 87,
    color: FORGE_ACCENT_2,
  },
  { label: "💡 Key insight", time: "3:59", score: 83, color: "#F6C90E" },
];

const SCHEDULED_POSTS = [
  { platform: "TikTok", time: "Today 3PM", dot: "#FF0050" },
  { platform: "Instagram", time: "Today 6PM", dot: "#E1306C" },
  { platform: "YouTube", time: "Tomorrow 9AM", dot: "#FF0000" },
];

/** Precomputed with fixed precision so SSR and client produce identical SVG attributes. */
const WAVE_POINTS = Array.from({ length: 80 }, (_, i) => {
  const x = ((i / 79) * 100).toFixed(2);
  const y = (
    50 +
    Math.sin(i * 0.4) * 15 +
    Math.sin(i * 0.13) * 10 +
    Math.cos(i * 0.7) * 7
  ).toFixed(2);
  return `${x},${y}`;
}).join(" ");

const emptySubscribe = () => () => {};

export function HeroVisual() {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const [scanPos, setScanPos] = useState(30);
  const [clips, setClips] = useState<ClipItem[]>([]);

  useEffect(() => {
    if (!mounted) return;

    let pos = 10;
    const interval = setInterval(() => {
      pos = (pos + 0.4) % 90;
      setScanPos(pos);
    }, 30);
    return () => clearInterval(interval);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;

    const timeouts = CLIP_DATA.map((clip, i) =>
      setTimeout(() => setClips((prev) => [...prev, clip]), i * 700 + 400),
    );
    return () => timeouts.forEach(clearTimeout);
  }, [mounted]);

  return (
    <motion.div className="relative w-full max-w-[580px]">
      <motion.div
        initial={mounted ? { opacity: 0, y: 30, rotateX: 8 } : false}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-[20px] border border-white/10 bg-white/3 p-5 shadow-forge-panel backdrop-blur-xl"
      >
        <div className="mb-4 flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F56]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#27C93F]" />
          <span className="ml-auto font-mono text-[11px] text-white/40">
            source_video.mp4 · 47:23
          </span>
        </div>

        <div className="relative mb-3.5 overflow-hidden rounded-xl bg-black/50 px-4 py-3.5">
          <div className="mb-2 font-mono text-[11px] tracking-wider text-white/35">
            WAVEFORM ANALYSIS
          </div>
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="block h-[52px] w-full"
            suppressHydrationWarning
          >
            <polyline
              points={WAVE_POINTS}
              fill="none"
              stroke={`${FORGE_ACCENT}55`}
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
            <polyline
              points={WAVE_POINTS}
              fill="none"
              stroke={FORGE_ACCENT}
              strokeWidth="0.7"
              vectorEffect="non-scaling-stroke"
            />
            <rect
              x="20"
              y="0"
              width="12"
              height="100"
              fill="rgba(255,107,107,0.15)"
            />
            <rect
              x="42"
              y="0"
              width="10"
              height="100"
              fill={`${FORGE_ACCENT}20`}
            />
            <rect
              x="65"
              y="0"
              width="11"
              height="100"
              fill={`${FORGE_ACCENT_2}20`}
            />
            <rect
              x="82"
              y="0"
              width="9"
              height="100"
              fill="rgba(246,201,14,0.15)"
            />
          </svg>
          {mounted && (
            <motion.div
              className="absolute top-9 bottom-3.5 w-0.5 rounded-sm bg-linear-to-b from-transparent via-forge-accent-2 to-transparent shadow-[0_0_8px_#3ECFCF]"
              style={{ left: `${scanPos}%` }}
            />
          )}
          <div className="mt-1.5 flex justify-between">
            {["0:00", "11:50", "23:40", "35:30", "47:23"].map((t) => (
              <span key={t} className="font-mono text-[10px] text-white/30">
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-2.5 flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-white/35">
          {mounted ? (
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="h-1.5 w-1.5 rounded-full bg-[#27C93F]"
            />
          ) : (
            <div className="h-1.5 w-1.5 rounded-full bg-[#27C93F]" />
          )}
          AI DETECTING VIRAL MOMENTS
        </div>

        <div className="grid grid-cols-2 gap-2">
          {CLIP_DATA.map((clip) => (
            <AnimatePresence key={clip.label}>
              {clips.some((c) => c.label === clip.label) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="relative cursor-pointer overflow-hidden rounded-[10px] border border-white/8 bg-white/4 px-3 py-2.5 hover:bg-white/[0.07]"
                >
                  <div
                    className="absolute top-0 bottom-0 left-0 w-0.5 rounded-l-sm"
                    style={{ background: clip.color }}
                  />
                  <p className="mb-1 font-sans text-xs font-semibold text-white/85">
                    {clip.label}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-white/40">
                      {clip.time}
                    </span>
                    <span
                      className="font-mono text-[11px] font-bold"
                      style={{ color: clip.color }}
                    >
                      {clip.score}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-[3px] rounded-sm bg-white/8">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${clip.score}%` }}
                      transition={{
                        duration: 0.8,
                        delay: 0.2,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="h-full rounded-sm"
                      style={{ background: clip.color }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={mounted ? { opacity: 0, x: 30 } : false}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="absolute right-[-50px] bottom-[30px] rounded-[14px] border border-white/10 bg-[rgba(5,5,15,0.9)] px-4 py-3 shadow-[0_20px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl"
      >
        <motion.div
          animate={mounted ? { y: [-4, 4, -4] } : undefined}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        >
          <div className="mb-2 font-mono text-[11px] text-white/40">
            SCHEDULED POSTS
          </div>
          {SCHEDULED_POSTS.map((p) => (
            <div key={p.platform} className="mb-1.5 flex items-center gap-2">
              <div
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: p.dot }}
              />
              <span className="min-w-[70px] font-sans text-xs text-white/70">
                {p.platform}
              </span>
              <span className="font-mono text-[11px] text-white/35">
                {p.time}
              </span>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        initial={mounted ? { opacity: 0, x: -20 } : false}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 1.5 }}
        className="absolute top-10 left-[-40px]"
      >
        <motion.div
          animate={mounted ? { y: [-5, 5, -5] } : undefined}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          className="rounded-[10px] border border-forge-accent-2/30 bg-[rgba(5,5,15,0.9)] px-3.5 py-2 shadow-[0_0_20px_rgba(62,207,207,0.15)] backdrop-blur-xl"
        >
          <p className="mb-0.5 font-mono text-[11px] text-forge-accent-2">
            ✦ AUTO CAPTIONS
          </p>
          <p className="font-sans text-xs text-white/70">
            &quot;This changes everything—&quot;
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
