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
          variant="default"
          className="rounded-xl px-4 py-2 text-xs font-bold cursor-pointer"
        >
          Forge More Clips
        </Button>
      </div>

      <div className="space-y-4">
        {/* Left Column: Clips List Grid */}
        <div className="space-y-4">
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
                variant="default"
                className="mt-4 h-8 rounded-lg px-4 text-xs font-bold cursor-pointer"
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
                        variant="default"
                        size="icon-sm"
                        className="h-8 w-8 rounded-full cursor-pointer"
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
                          variant="outline"
                          className="h-8 rounded-lg px-3 text-xs font-semibold cursor-pointer"
                        >
                          Inspect AI
                        </Button>
                        <Button
                          onClick={() => triggerScheduleDialog(clip)}
                          variant="default"
                          className="h-8 rounded-lg px-3.5 text-xs font-bold cursor-pointer"
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
      </div>
    </motion.div>
  );
}
