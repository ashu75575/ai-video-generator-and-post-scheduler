"use client";

import { motion } from "framer-motion";
import { Sparkles, Video, Play, Eye, ThumbsUp } from "lucide-react";
import { useDashboard } from "@/hooks/use-dashboard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ClipsPage() {
  const {
    clips,
    setIsUploadOpen,
    triggerInspectDialog,
    triggerScheduleDialog,
  } = useDashboard();

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
          <h1 className="font-heading text-2xl font-bold text-white tracking-tight">
            AI Clips Workspace
          </h1>
          <p className="text-sm text-white/40 mt-1">
            View, edit, inspect, and export your high-scoring viral video
            snippets.
          </p>
        </div>
        <Button
          onClick={() => setIsUploadOpen(true)}
          className="rounded-xl bg-gradient-forge px-4 py-2 text-xs font-bold text-white shadow-md cursor-pointer hover:shadow-forge-glow transition-shadow duration-300"
        >
          Forge More Clips
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Clips List Grid */}
        <div className="lg:col-span-2 space-y-4">
          {clips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-white/20 border border-dashed border-white/5 bg-white/0.5 rounded-2xl p-6 min-h-[350px]">
              <Video size={36} className="stroke-[1.5] mb-3 text-white/10" />
              <span className="text-sm font-semibold text-white/40">
                Your clips library is empty
              </span>
              <span className="text-xs mt-1 max-w-xs mx-auto leading-relaxed">
                Upload a raw video or paste a YouTube URL to let the AI
                isolation engine forge dynamic viral shorts.
              </span>
              <Button
                onClick={() => setIsUploadOpen(true)}
                className="mt-4 h-8 rounded-lg bg-forge-accent hover:bg-forge-accent/90 px-4 text-xs font-bold text-white cursor-pointer"
              >
                Forge First Clip
              </Button>
            </div>
          ) : (
            clips.map((clip) => (
              <Card
                key={clip.id}
                className="bg-white/2 border border-white/5 hover:border-white/10 p-5 rounded-2xl transition-all duration-300 group relative overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row gap-5">
                  {/* Thumbnail container */}
                  <div className="relative aspect-video sm:w-44 shrink-0 rounded-xl overflow-hidden border border-white/8 bg-black">
                    <img
                      src={clip.thumbnail}
                      alt={clip.title}
                      className="h-full w-full object-cover group-hover:scale-102 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button
                        onClick={() => triggerInspectDialog(clip)}
                        size="icon-sm"
                        className="h-8 w-8 rounded-full bg-forge-accent hover:bg-forge-accent/90 text-white cursor-pointer"
                      >
                        <Play size={12} className="fill-white ml-0.5" />
                      </Button>
                    </div>
                    <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1 py-0.5 font-mono text-[9px] text-white">
                      {clip.duration}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-forge-accent-2/15 border-forge-accent-2/20 text-forge-accent-2 font-mono text-[9px]">
                          {clip.viralityScore}% Virality Potential
                        </Badge>
                        <span className="font-mono text-[9px] text-white/35 truncate max-w-[150px]">
                          {clip.sourceVideo}
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-white group-hover:text-forge-accent transition-colors">
                        {clip.title}
                      </h3>
                      <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">
                        {clip.transcript}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-3 border-t border-white/5">
                      <div className="flex gap-3 text-white/40 font-mono text-[10px]">
                        <span className="flex items-center gap-1">
                          <Eye size={11} className="text-white/20" />
                          {clip.views !== "0" ? clip.views : "Ready"}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp size={11} className="text-white/20" />
                          {clip.likes !== "0" ? clip.likes : "Ready"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => triggerInspectDialog(clip)}
                          variant="ghost"
                          className="h-8 rounded-lg border border-white/5 bg-white/1 hover:bg-white/6 px-3 text-xs font-semibold text-white/70 hover:text-white cursor-pointer"
                        >
                          Inspect AI
                        </Button>
                        <Button
                          onClick={() => triggerScheduleDialog(clip)}
                          className="h-8 rounded-lg bg-gradient-forge px-3.5 text-xs font-bold text-white shadow hover:shadow-forge-glow cursor-pointer"
                        >
                          Schedule
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Right Column: AI Auto Captions presets */}
        <div className="space-y-6">
          <Card className="bg-white/2.5 border border-white/5 rounded-[20px] p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-forge-accent-2" />
              <h3 className="font-heading text-sm font-bold text-white">
                Subtitles Presets (Auto-Captions)
              </h3>
            </div>
            <p className="text-xs text-white/40 leading-relaxed mb-4">
              Apply modern social media caption presets instantly before export.
            </p>

            <div className="space-y-3">
              {[
                {
                  name: "Devin-Glass Style",
                  tags: "Pop, Neon, Fast",
                  example: "THE #1 RULE",
                },
                {
                  name: "Hermonzi Impact",
                  tags: "Bold, Yellow/Red, Dynamic",
                  example: "NEVER WRITE",
                },
                {
                  name: "Minimalist Sans",
                  tags: "Clean, Bottom-centered",
                  example: "building a saas",
                },
                {
                  name: "Karaoke Highlighter",
                  tags: "Word-by-word active glow",
                  example: "a single line",
                },
              ].map((style, i) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 hover:bg-white/3 ${
                    i === 0
                      ? "border-forge-accent bg-forge-accent/5"
                      : "border-white/5 bg-white/1"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="font-semibold text-xs text-white">
                      {style.name}
                    </span>
                    <Badge className="bg-white/5 text-white/40 hover:bg-white/5 font-mono text-[8px] uppercase tracking-wide px-1">
                      {style.tags}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-center h-14 bg-black/60 rounded-lg border border-white/5 font-heading text-sm font-extrabold tracking-tight text-gradient-forge shadow-inner">
                    {style.example}
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
