"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Upload,
  Play,
  FileText,
  Share2,
  Download,
  Calendar,
  Clock,
  Loader2,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";
import { useDashboard } from "@/hooks/use-dashboard";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const {
    isUploadOpen,
    setIsUploadOpen,
    isForging,
    dragActive,
    handleDrag,
    handleDrop,
    handleFileSelect,
    selectedFile,
    setSelectedFile,
    startAIForger,
    forgePhase,
    forgeProgress,
    forgeLogs,
    isDetailOpen,
    setIsDetailOpen,
    selectedClip,
    handleDownload,
    triggerScheduleDialog,
    isScheduleOpen,
    setIsScheduleOpen,
    clipToSchedule,
    schedulePlatform,
    setSchedulePlatform,
    scheduleTime,
    setScheduleTime,
    scheduleCaption,
    setScheduleCaption,
    handleScheduleSubmit,
    socialAccounts,
    isLoadingAccounts,
  } = useDashboard();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-forge-bg font-sans text-white overflow-x-hidden selection:bg-forge-accent/30 relative">
      {/* Premium Ambient Glow Background Elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Dot pattern */}
        <svg className="absolute inset-0 h-full w-full opacity-35" aria-hidden>
          <defs>
            <pattern
              id="dashboard-grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(124, 106, 250, 0.15)"
                strokeWidth="0.5"
              />
            </pattern>
            <radialGradient id="dashboard-fade" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="50%" stopColor="white" stopOpacity="0.4" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <mask id="dashboard-mask">
              <rect width="100%" height="100%" fill="url(#dashboard-fade)" />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="url(#dashboard-grid)"
            mask="url(#dashboard-mask)"
          />
        </svg>

        {/* Glowing Blobs */}
        <div className="absolute left-[20%] top-[10%] h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(124,106,250,0.12)_0%,transparent_70%)] blur-[60px]" />
        <div className="absolute right-[5%] top-[30%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(62,207,207,0.07)_0%,transparent_70%)] blur-[50px]" />
      </div>

      {/* Main Layout Grid */}
      <div className="flex min-h-screen w-full">
        {/* Fixed Left Sidebar */}
        <Sidebar />

        {/* Right content view area */}
        <div className="flex-1 flex flex-col md:pl-64 min-w-0">
          {/* Top Navbar / Header */}
          <Header />

          {/* Dynamic Content Views */}
          <main className="flex-1 p-6 md:p-8">{children}</main>
        </div>
      </div>

      {/* ========================================================
          DIALOG: FORGE CLIPS (INTERACTIVE MULTI-STAGE UPLOADER)
          ======================================================== */}
      <Dialog
        open={isUploadOpen}
        onOpenChange={(open) => {
          if (!isForging) {
            setIsUploadOpen(open);
            setSelectedFile(null);
          }
        }}
      >
        <DialogContent className="max-w-md rounded-2xl border border-white/10 bg-[#0d0d18]/95 backdrop-blur-2xl p-6 text-white shadow-xl shadow-black/80">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-forge-accent" />
              Forge Viral Clips
            </DialogTitle>
            <DialogDescription className="text-xs text-white/40">
              Select or drop your long-form video. Our AI model isolates
              highlights, crops speaker faces, and structures subtitles.
            </DialogDescription>
          </DialogHeader>

          {!isForging ? (
            <div className="space-y-5">
              {/* Drag/Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  dragActive
                    ? "border-forge-accent bg-forge-accent/5"
                    : "border-white/8 hover:border-white/15 bg-white/1"
                }`}
              >
                <input
                  type="file"
                  id="dialog-file-input"
                  className="hidden"
                  accept="video/*"
                  onChange={handleFileSelect}
                />
                <label
                  htmlFor="dialog-file-input"
                  className="cursor-pointer block"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload
                      size={22}
                      className="text-white/40 hover:text-white transition-colors duration-200"
                    />
                    {selectedFile ? (
                      <div className="space-y-1">
                        <span className="block font-semibold text-xs text-forge-accent-2 truncate max-w-[280px]">
                          {selectedFile.name}
                        </span>
                        <span className="block text-[10px] text-white/30">
                          Ready to forge. Click button below.
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <span className="block font-semibold text-xs text-white/80">
                          Choose long-form video file
                        </span>
                        <span className="block text-[10px] text-white/30">
                          MP4, MOV, or WEBM up to 2GB
                        </span>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              {/* YouTube Link Option */}
              <div className="relative">
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="w-full border-t border-white/5"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-widest text-white/20">
                  <span className="bg-[#0d0d18] px-2">OR IMPORT URL</span>
                </div>
              </div>

              <Input
                type="text"
                placeholder="Paste YouTube, Zoom, or Twitch recording URL..."
                className="h-9 w-full rounded-xl border border-white/8 bg-white/2 text-xs text-white placeholder-white/25 focus:border-forge-accent/50 focus:ring-0 focus:bg-white/4"
                onChange={(e) => {
                  if (e.target.value.trim() !== "") {
                    setSelectedFile({ name: "YouTube Import Link" } as any);
                  } else {
                    setSelectedFile(null);
                  }
                }}
              />

              <DialogFooter className="mt-4">
                <Button
                  onClick={() => setIsUploadOpen(false)}
                  variant="ghost"
                  className="rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 text-xs font-semibold text-white/60 hover:text-white cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  disabled={!selectedFile}
                  onClick={startAIForger}
                  className="rounded-xl bg-gradient-forge px-4 font-sans text-xs font-bold text-white shadow-md disabled:opacity-40 cursor-pointer"
                >
                  Forge Shorts
                </Button>
              </DialogFooter>
            </div>
          ) : (
            /* ACTIVE SIMULATED FORGING ENGINE PIPELINE */
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-white/80 animate-pulse">
                    {forgePhase}
                  </span>
                  <span className="font-mono font-bold text-forge-accent-2">
                    {forgeProgress}%
                  </span>
                </div>
                <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full bg-gradient-forge shadow-[0_0_8px_rgba(124,106,250,0.6)] transition-all duration-100 rounded-full"
                    style={{ width: `${forgeProgress}%` }}
                  />
                </div>
              </div>

              {/* LIVE AI SYSTEM TERMINAL CONSOLE LOGS */}
              <div className="h-44 rounded-xl border border-white/5 bg-black/60 p-3 font-mono text-[10px] text-white/45 overflow-y-auto space-y-2 select-none shadow-inner leading-relaxed animate-in fade-in duration-300">
                <div className="text-[10px] text-forge-accent border-b border-white/5 pb-1 font-bold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-forge-accent animate-ping" />
                  CF_AI SYSTEM LOGGER: RUNNING ACTIVE JOBS
                </div>
                <AnimatePresence>
                  {forgeLogs.map((log, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-white/60"
                    >
                      {log}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================
          DIALOG: INSPECT CLIP DETAILS & TRANSCRIPT
          ======================================================== */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl rounded-2xl border border-white/10 bg-[#0d0d18]/95 backdrop-blur-2xl p-6 text-white shadow-xl shadow-black/80">
          {selectedClip && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge className="bg-forge-accent-2/15 border-forge-accent-2/20 text-forge-accent-2 font-mono text-[10px]">
                    {selectedClip.viralityScore}% Match Potential
                  </Badge>
                  <span className="font-mono text-[10px] text-white/30">
                    Source: {selectedClip.sourceVideo}
                  </span>
                </div>
                <DialogTitle className="font-heading text-lg font-bold text-white mt-1.5">
                  {selectedClip.title}
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {/* 9:16 Video player mockup on left */}
                <div className="md:col-span-2 relative aspect-9/16 max-h-[340px] mx-auto rounded-xl overflow-hidden border border-white/10 bg-black flex flex-col justify-between p-4">
                  <img
                    src={selectedClip.thumbnail}
                    alt="clip preview"
                    className="absolute inset-0 h-full w-full object-cover opacity-50 blur-[2px] pointer-events-none"
                  />

                  {/* Aspect crop placeholder */}
                  <div className="absolute inset-0 z-10 flex flex-col justify-between p-4">
                    <Badge className="bg-black/60 border-white/10 text-white font-mono text-[8px] tracking-wide self-start">
                      ACTIVE RENDER (9:16)
                    </Badge>
                    <div className="flex h-12 w-12 rounded-full bg-forge-accent/90 border border-white/10 items-center justify-center text-white self-center cursor-pointer shadow-lg hover:scale-105 transition-transform duration-300">
                      <Play size={16} className="fill-white ml-0.5" />
                    </div>
                    {/* Mock dynamic glass subtitle overlay */}
                    <div className="bg-black/60 border border-white/5 backdrop-blur-md px-3 py-2 rounded-lg text-center font-heading text-xs font-extrabold tracking-tight text-white leading-tight shadow-md">
                      THE ABSOLUTE{" "}
                      <span className="text-forge-accent-2">#1 RULE</span>
                    </div>
                  </div>
                </div>

                {/* AI transcript & metadata on right */}
                <div className="md:col-span-3 flex flex-col justify-between gap-5">
                  <div className="space-y-4">
                    {/* Transcript block */}
                    <div className="space-y-1.5">
                      <span className="font-mono text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-1.5">
                        <FileText size={11} />
                        AI Transcript (Auto-Spliced)
                      </span>
                      <ScrollArea className="h-28 rounded-xl border border-white/5 bg-white/1.5 p-3 text-xs leading-relaxed text-white/70 italic select-all">
                        {selectedClip.transcript}
                      </ScrollArea>
                    </div>

                    {/* Social Media Copy Box */}
                    <div className="space-y-1.5">
                      <span className="font-mono text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-1.5">
                        <Share2 size={11} />
                        Suggested Post Caption
                      </span>
                      <ScrollArea className="h-20 rounded-xl border border-white/5 bg-white/1.5 p-3 text-xs leading-relaxed text-white/70 select-all">
                        {selectedClip.description}
                      </ScrollArea>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-4 border-t border-white/5">
                    <Button
                      onClick={() => handleDownload(selectedClip.title)}
                      variant="ghost"
                      className="rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 text-xs font-semibold text-white/70 cursor-pointer"
                    >
                      <Download size={13} className="mr-1.5" />
                      Download MP4
                    </Button>
                    <Button
                      onClick={() => {
                        setIsDetailOpen(false);
                        triggerScheduleDialog(selectedClip);
                      }}
                      className="rounded-xl bg-gradient-forge px-4 text-xs font-bold text-white shadow hover:shadow-forge-glow cursor-pointer"
                    >
                      Schedule Publication
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================
          DIALOG: SCHEDULE POST CONFIGURATION
          ======================================================== */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="max-w-md rounded-2xl border border-white/10 bg-[#0d0d18]/95 backdrop-blur-2xl p-6 text-white shadow-xl shadow-black/80">
          {clipToSchedule && (
            <div className="space-y-5">
              <DialogHeader>
                <DialogTitle className="font-heading text-lg font-bold text-white flex items-center gap-2">
                  <Calendar size={16} className="text-forge-accent" />
                  Schedule Publication
                </DialogTitle>
                <DialogDescription className="text-xs text-white/40">
                  Choose which platform and time you want ClipForge AI to
                  auto-schedule your post.
                </DialogDescription>
              </DialogHeader>

              {isLoadingAccounts ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <Loader2 className="animate-spin text-forge-accent" size={24} />
                  <span className="text-xs text-white/40">Loading connected accounts...</span>
                </div>
              ) : socialAccounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 border border-dashed border-white/10 rounded-2xl bg-white/1.5 space-y-4">
                  <div className="p-3 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/15">
                    <AlertCircle size={24} />
                  </div>
                  <div className="space-y-1 text-center">
                    <span className="block font-semibold text-sm text-white">
                      No connected social channels
                    </span>
                    <span className="block text-xs text-white/40 max-w-xs mx-auto leading-relaxed">
                      You need to authorize at least one social media channel to schedule automatic postings.
                    </span>
                  </div>
                  <Button
                    onClick={() => {
                      setIsScheduleOpen(false);
                      router.push("/dashboard/social-connections");
                    }}
                    className="rounded-xl bg-gradient-forge px-4 h-9 text-xs font-bold text-white shadow hover:shadow-forge-glow cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Connect Social Account</span>
                    <ArrowUpRight size={13} />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {/* Platform Selector */}
                    <div className="space-y-1.5">
                      <span className="block font-mono text-[9px] font-bold text-white/40 uppercase tracking-wider">
                        Social Account Channel
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {socialAccounts.map((acc) => {
                          const mapPlatformName = (p: string) => {
                            const lower = p.toLowerCase();
                            if (lower === "tiktok") return "TikTok";
                            if (lower === "youtube") return "YouTube Shorts";
                            if (lower === "instagram") return "Instagram Reels";
                            if (lower === "twitter" || lower === "x") return "Twitter / X";
                            if (lower === "linkedin") return "LinkedIn";
                            if (lower === "bluesky") return "Bluesky";
                            if (lower === "facebook") return "Facebook Reels";
                            return p;
                          };
                          const displayPlatform = mapPlatformName(acc.platform);
                          const isSelected = schedulePlatform === displayPlatform;
                          return (
                            <button
                              key={acc._id}
                              onClick={() => setSchedulePlatform(displayPlatform)}
                              className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all duration-300 ${
                                isSelected
                                  ? "border-forge-accent bg-forge-accent/5"
                                  : "border-white/5 bg-white/1 hover:bg-white/3"
                              }`}
                            >
                              <span className="block font-semibold text-xs text-white truncate">
                                {displayPlatform}
                              </span>
                              <span className="block font-mono text-[8px] text-white/30 truncate mt-0.5">
                                {acc.handle || acc.name || "Connected"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Scheduled Time Field */}
                    <div className="space-y-1.5">
                      <span className="block font-mono text-[9px] font-bold text-white/40 uppercase tracking-wider">
                        Delivery Time
                      </span>
                      <Input
                        type="text"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="h-9 w-full rounded-xl border border-white/8 bg-white/2 text-xs text-white focus:border-forge-accent/50 focus:ring-0 focus:bg-white/4"
                      />
                    </div>

                    {/* Customize Caption */}
                    <div className="space-y-1.5">
                      <span className="block font-mono text-[9px] font-bold text-white/40 uppercase tracking-wider">
                        Customize Caption & Tags
                      </span>
                      <textarea
                        rows={4}
                        value={scheduleCaption}
                        onChange={(e) => setScheduleCaption(e.target.value)}
                        className="w-full rounded-xl border border-white/8 bg-white/2 p-3 text-xs text-white focus:border-forge-accent/50 focus:ring-0 focus:bg-white/4 leading-relaxed resize-none"
                      />
                    </div>
                  </div>
                </>
              )}

              <DialogFooter className="mt-4">
                <Button
                  onClick={() => setIsScheduleOpen(false)}
                  variant="ghost"
                  className="rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 text-xs font-semibold text-white/60 hover:text-white cursor-pointer"
                >
                  Cancel
                </Button>
                {!isLoadingAccounts && socialAccounts.length > 0 && (
                  <Button
                    onClick={handleScheduleSubmit}
                    className="rounded-xl bg-gradient-forge px-4 font-sans text-xs font-bold text-white shadow cursor-pointer hover:shadow-forge-glow"
                  >
                    Schedule Post
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
