"use client";

import { motion } from "framer-motion";
import { Upload, Video, CheckCircle2 } from "lucide-react";
import { useDashboard } from "@/hooks/use-dashboard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function VideosPage() {
  const {
    rawVideos,
    setIsUploadOpen,
    setSelectedFile
  } = useDashboard();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 max-w-[1200px] mx-auto"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-white tracking-tight">
            My Uploaded Library
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Manage your raw source videos and start new clipping jobs.
          </p>
        </div>
        <Button
          onClick={() => setIsUploadOpen(true)}
          className="rounded-xl bg-gradient-forge px-4 py-2 text-xs font-bold text-white shadow-md cursor-pointer hover:shadow-forge-glow transition-shadow duration-300"
        >
          <Upload size={14} className="mr-1.5" />
          Upload Raw Video
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rawVideos.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-20 text-center text-white/20 border border-dashed border-white/5 bg-white/[0.005] rounded-2xl p-6 min-h-[300px]">
            <Video size={40} className="stroke-[1.5] mb-3 text-white/10" />
            <span className="text-sm font-semibold text-white/40">Your uploaded library is empty</span>
            <span className="text-xs mt-1 max-w-sm mx-auto leading-relaxed">
              You haven't uploaded any long-form source videos yet. Get started by uploading a raw file or YouTube link.
            </span>
            <Button
              onClick={() => setIsUploadOpen(true)}
              className="mt-4 h-8 rounded-lg bg-forge-accent hover:bg-forge-accent/90 px-4 text-xs font-bold text-white cursor-pointer"
            >
              Upload Source Video
            </Button>
          </div>
        ) : (
          rawVideos.map((video) => (
            <Card key={video.id} className="bg-white/[0.025] border border-white/5 rounded-2xl overflow-hidden group hover:border-white/10 transition-colors duration-300 flex flex-col h-full justify-between">
              <div className="relative aspect-video bg-black overflow-hidden border-b border-white/5">
                <img
                  src={video.img}
                  alt={video.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-102"
                />
                <div className="absolute top-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 font-mono text-[9px] text-white">
                  {video.duration}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm text-white group-hover:text-forge-accent transition-colors">
                    {video.title}
                  </h3>
                  <div className="flex gap-3 font-mono text-[9px] text-white/35">
                    <span>Uploaded: {video.date}</span>
                    <span>•</span>
                    <span>{video.size}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 mt-6 pt-3 border-t border-white/5">
                  <span className="font-mono text-[9px] text-white/40 flex items-center gap-1.5">
                    <CheckCircle2 size={11} className="text-emerald-400" />
                    Clips active: {video.clips}
                  </span>

                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedFile({ name: video.title } as any);
                      setIsUploadOpen(true);
                    }}
                    className="h-7 rounded-lg bg-white/[0.04] border border-white/8 hover:bg-white/[0.08] px-2.5 text-[10px] font-bold text-white cursor-pointer"
                  >
                    Forge Again
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </motion.div>
  );
}
