"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  RefreshCw,
  ArrowLeft,
  FileText,
  Clock,
  Play,
  Download,
  Calendar,
  Flame,
  ChevronDown,
  ChevronUp,
  Volume2,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useDashboard } from "@/hooks/use-dashboard";
import RemotionPlayer from "@/components/RemotionPlayer";

interface CaptionWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

interface ShortVideo {
  id: string;
  projectId: string;
  title: string;
  startTime: number;
  endTime: number;
  whyBest: string;
  seoRanking: number;
  captions: CaptionWord[] | null;
  createdAt: string;
  updatedAt: string;
}

interface ProjectStatus {
  id: string;
  name: string;
  status:
    | "pending"
    | "uploading"
    | "completed"
    | "failed"
    | "transcribing"
    | "generating_shorts"
    | "ready";
  progress: number;
  videoUrl: string | null;
  transcript: string | null;
  captions: CaptionWord[] | null;
  shortVideos?: ShortVideo[] | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { triggerScheduleDialog, handleDownload } = useDashboard();

  const [project, setProject] = useState<ProjectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track playing clip ID separately to isolate playback inside the grid
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);

  // Accordion state for technical details (transcript and raw captions)
  const [showTechnicalDetails, setShowTechnicalDetails] =
    useState<boolean>(false);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/status`);
        if (!response.ok) {
          throw new Error("Failed to fetch project status");
        }
        const data = await response.json();
        setProject(data);
        setLoading(false);

        // Stop polling if completed successfully or failed
        if (data.status === "ready" || data.status === "failed") {
          clearInterval(pollInterval);
        }
      } catch (err: any) {
        console.error("Error fetching project status:", err);
        setError(err.message || "Failed to load project details");
        clearInterval(pollInterval);
        setLoading(false);
      }
    };

    fetchStatus();
    pollInterval = setInterval(fetchStatus, 1500);

    return () => clearInterval(pollInterval);
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07050f] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 text-violet-500 animate-spin" />
          <p className="text-xs text-white/40 font-mono uppercase tracking-widest">
            Loading Pipeline...
          </p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#07050f] text-white flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-red-400 font-mono text-sm">
            ❌ Error: {error || "Project not found"}
          </p>
          <Button
            onClick={() => router.push("/dashboard")}
            className="bg-white/10 hover:bg-white/20 text-xs"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Determine current active pipeline stage for non-ready states
  const getStageStatus = (stage: "upload" | "transcription" | "complete") => {
    const status = project.status;

    if (stage === "upload") {
      return "completed";
    }

    if (stage === "transcription") {
      if (status === "ready" || status === "generating_shorts")
        return "completed";
      if (status === "transcribing") return "active";
      return "pending";
    }

    if (stage === "complete") {
      if (status === "ready") return "completed";
      if (status === "generating_shorts") return "active";
      return "pending";
    }
  };

  // Format short video model into Dashboard Clip model for scheduler integration
  const handleScheduleClick = (clip: ShortVideo) => {
    const mappedClip = {
      id: clip.id,
      title: clip.title,
      sourceVideo: project.name,
      duration: `${Math.round(clip.endTime - clip.startTime)}s`,
      viralityScore: clip.seoRanking,
      views: "Ready",
      likes: "Ready",
      platform: "Multi-Platform" as const,
      thumbnail:
        "https://images.unsplash.com/photo-1542744094-2ab25be78b90?auto=format&fit=crop&w=400&q=80",
      status: "Ready" as const,
      transcript: clip.whyBest,
      description: `${clip.title} - ${clip.whyBest}`,
      tags: ["#viral", "#ai", "#short"],
      metrics: {
        hookStrength: clip.seoRanking,
        retentionPotential: Math.min(100, clip.seoRanking + 2),
        pacingScore: Math.min(100, clip.seoRanking - 3),
        visualEngagement: Math.min(100, clip.seoRanking + 1),
      },
    };
    triggerScheduleDialog(mappedClip);
  };

  return (
    <div className="min-h-screen bg-[#07050f] text-white py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background radial overlays */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[15%] top-[5%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.08)_0%,transparent_70%)] blur-[50px]" />
        <div className="absolute right-[10%] top-[25%] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.05)_0%,transparent_70%)] blur-[40px]" />
      </div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Header Navigation */}
        <div className="flex justify-between items-center">
          <Button
            onClick={() => router.push("/dashboard")}
            variant="ghost"
            className="text-white/60 hover:text-white hover:bg-white/5 text-xs rounded-xl"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Dashboard
          </Button>

          <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
            Project ID: {project.id}
          </span>
        </div>

        {/* Project Name Header */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-[family-name:var(--font-space-grotesk)] font-bold bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
              {project.name}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono border uppercase tracking-wider ${
                project.status === "ready"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : project.status === "failed"
                    ? "bg-red-500/10 text-red-400 border-red-500/20"
                    : "bg-violet-500/10 text-violet-400 border-violet-500/20 animate-pulse"
              }`}
            >
              {project.status.replace("_", " ")}
            </span>
          </div>
          <p className="text-xs text-white/40 font-mono">
            Original Source:{" "}
            {project.videoUrl
              ? "AWS S3 Cloud Storage"
              : "Local Workspace Cache"}
          </p>
        </div>

        {/* ==========================================
            PIPELINE STATUS VIEW (Active during processing)
            ========================================== */}
        {project.status !== "ready" && (
          <Card className="border border-white/10 bg-white/[0.01] backdrop-blur-xl p-6 rounded-2xl max-w-2xl mx-auto shadow-2xl shadow-violet-950/20">
            <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-white/60 mb-6 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-500 animate-pulse" />
              ClipForge Processing Pipeline
            </h2>

            <div className="space-y-6">
              {/* Step 1: Video Ingestion */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-7 w-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs">
                    <Check size={14} className="stroke-[2.5]" />
                  </div>
                  <div className="w-0.5 h-12 bg-emerald-500/30" />
                </div>
                <div className="space-y-1 mt-0.5">
                  <h3 className="text-xs font-bold text-white/90">
                    Video Ingestion & S3 Upload
                  </h3>
                  <p className="text-[11px] text-white/45 font-mono">
                    Video successfully uploaded and registered in database.
                  </p>
                </div>
              </div>

              {/* Step 2: Audio Transcription */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  {getStageStatus("transcription") === "completed" ? (
                    <div className="h-7 w-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs">
                      <Check size={14} className="stroke-[2.5]" />
                    </div>
                  ) : getStageStatus("transcription") === "active" ? (
                    <div className="h-7 w-7 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30 flex items-center justify-center text-xs">
                      <RefreshCw
                        size={12}
                        className="animate-spin text-violet-400"
                      />
                    </div>
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-white/5 text-white/35 border border-white/10 flex items-center justify-center text-xs font-mono">
                      2
                    </div>
                  )}
                  <div
                    className={`w-0.5 h-12 ${getStageStatus("transcription") === "completed" ? "bg-emerald-500/30" : "bg-white/5"}`}
                  />
                </div>
                <div className="space-y-1.5 mt-0.5 flex-1">
                  <h3
                    className={`text-xs font-bold ${getStageStatus("transcription") !== "pending" ? "text-white/90" : "text-white/30"}`}
                  >
                    Deepgram Transcription Engine
                  </h3>
                  <p
                    className={`text-[11px] font-mono ${getStageStatus("transcription") !== "pending" ? "text-white/45" : "text-white/20"}`}
                  >
                    {project.status === "transcribing"
                      ? "Transcribing voice vectors and converting to text..."
                      : project.status === "generating_shorts"
                        ? "Completed converting voice segments to text."
                        : "Awaiting start signal."}
                  </p>

                  {project.status === "transcribing" && (
                    <div className="space-y-1.5 max-w-sm mt-1 animate-in fade-in duration-300">
                      <div className="flex justify-between items-center text-[10px] font-mono text-violet-400">
                        <span>Transcribing progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-300"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3: Clip Isolation */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  {getStageStatus("complete") === "completed" ? (
                    <div className="h-7 w-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs">
                      <Check size={14} className="stroke-[2.5]" />
                    </div>
                  ) : getStageStatus("complete") === "active" ? (
                    <div className="h-7 w-7 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30 flex items-center justify-center text-xs">
                      <RefreshCw
                        size={12}
                        className="animate-spin text-violet-400"
                      />
                    </div>
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-white/5 text-white/35 border border-white/10 flex items-center justify-center text-xs font-mono">
                      3
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 mt-0.5 flex-1">
                  <h3
                    className={`text-xs font-bold ${getStageStatus("complete") !== "pending" ? "text-white/90" : "text-white/30"}`}
                  >
                    Short Clips & Captions Isolation
                  </h3>
                  <p
                    className={`text-[11px] font-mono ${getStageStatus("complete") !== "pending" ? "text-white/45" : "text-white/20"}`}
                  >
                    {project.status === "generating_shorts"
                      ? "AI isolating hooks, calculating SEO score and matching timestamps..."
                      : "Awaiting transcription completion."}
                  </p>

                  {project.status === "generating_shorts" && (
                    <div className="space-y-1.5 max-w-sm mt-1 animate-in fade-in duration-300">
                      <div className="flex justify-between items-center text-[10px] font-mono text-cyan-400">
                        <span>Clips extraction active</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400 rounded-full transition-all duration-300 animate-pulse"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* ==========================================
            RESULTS SHOWCASE VIEW (Grid of Short Videos)
            ========================================== */}
        <AnimatePresence mode="wait">
          {project.status === "ready" &&
            project.shortVideos &&
            project.shortVideos.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-10"
              >
                <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                  <Flame className="h-5 w-5 text-violet-500" />
                  <h2 className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-white uppercase tracking-wider">
                    Isolated AI Clips Grid ({project.shortVideos.length})
                  </h2>
                </div>

                {/* Grid Layout of cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {project.shortVideos.map((clip, index) => {
                    const isCurrentPlaying = playingClipId === clip.id;
                    const durationSeconds = Math.round(
                      clip.endTime - clip.startTime,
                    );

                    return (
                      <Card
                        key={clip.id}
                        className="border border-white/10 bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/15 backdrop-blur-xl p-5 rounded-3xl flex flex-col justify-between gap-5 transition-all duration-300 shadow-xl overflow-hidden group relative"
                      >
                        {/* Top: Video Player Panel */}
                        <div className="w-full aspect-[9/16] relative rounded-2xl overflow-hidden border border-white/10 bg-black/60 shadow-[0_0_20px_rgba(0,0,0,0.4)]">
                          <RemotionPlayer
                            videoUrl={project.videoUrl || ""}
                            startTime={clip.startTime}
                            endTime={clip.endTime}
                            captions={clip.captions || []}
                          />

                          {isCurrentPlaying && (
                            <button
                              onClick={() => setPlayingClipId(null)}
                              className="absolute top-3 right-3 z-30 bg-black/60 hover:bg-black/80 border border-white/10 px-2.5 py-1 rounded-xl text-[9px] font-mono text-white/70 hover:text-white cursor-pointer"
                            >
                              Close Player
                            </button>
                          )}
                        </div>

                        {/* Middle: Content Info */}
                        <div className="space-y-4 flex-1 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="text-sm font-bold text-white font-[family-name:var(--font-space-grotesk)] leading-tight flex-1">
                                {clip.title}
                              </h3>

                              {/* SEO ranking indicator */}
                              <div className="flex items-center gap-1 text-[11px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full shrink-0">
                                <Trophy size={11} className="text-violet-400" />
                                {clip.seoRanking}%
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] text-white/35 font-mono">
                              <Volume2 size={10} className="text-violet-400" />
                              <span>Auto-aligned transcript</span>
                            </div>
                          </div>

                          {/* Why Best explanation */}
                          <div className="bg-violet-950/10 border border-violet-900/25 p-3.5 rounded-xl text-[11px] text-white/70 leading-relaxed font-sans select-text">
                            <span className="font-mono text-[9px] font-bold text-violet-400 uppercase tracking-wide block mb-1">
                              AI Explanation:
                            </span>
                            {clip.whyBest}
                          </div>
                        </div>

                        {/* Bottom: Action Buttons */}
                        <div className="flex gap-3 pt-2 border-t border-white/[0.04]">
                          <Button
                            onClick={() => handleDownload(clip.title)}
                            className="bg-white/5 hover:bg-white/10 text-white border border-white/5 text-[10px] h-9 px-3 rounded-xl font-semibold flex-1 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Download size={12} className="text-white/60" />{" "}
                            Download
                          </Button>
                          <Button
                            onClick={() => handleScheduleClick(clip)}
                            className="bg-gradient-to-r from-violet-600 to-indigo-500 text-white text-[10px] h-9 px-3 rounded-xl font-bold flex-1 flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(124,106,250,0.3)] hover:shadow-[0_0_20px_rgba(124,106,250,0.45)] transition-all"
                          >
                            <Calendar size={12} /> Schedule
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* TECHNICAL DATA ACCORDION (Full Transcript & Captions) */}
                <div className="pt-6 border-t border-white/5">
                  <button
                    onClick={() =>
                      setShowTechnicalDetails(!showTechnicalDetails)
                    }
                    className="w-full flex justify-between items-center p-4 bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 rounded-2xl transition-colors font-mono text-xs font-bold text-white/60 uppercase tracking-wider"
                  >
                    <span className="flex items-center gap-2">
                      <FileText size={14} className="text-violet-400" />
                      Deepgram Speech Metadata & Full Transcript
                    </span>
                    {showTechnicalDetails ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>

                  <AnimatePresence>
                    {showTechnicalDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden space-y-6 pt-5"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Deepgram generated transcript */}
                          <Card className="border border-white/10 bg-white/[0.01] p-5 rounded-2xl flex flex-col">
                            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-white/60 mb-3.5 flex items-center gap-2">
                              Full Source Transcript
                            </h3>
                            <div className="h-56 overflow-y-auto pr-2 text-xs text-white/70 leading-relaxed font-sans p-4 border border-white/5 bg-black/25 rounded-xl custom-scrollbar whitespace-pre-wrap select-all">
                              {project.transcript || "No transcript returned."}
                            </div>
                            <Button
                              onClick={() => {
                                toast.success("Transcript copied!");
                                navigator.clipboard.writeText(
                                  project.transcript || "",
                                );
                              }}
                              className="bg-white/5 hover:bg-white/10 text-white border border-white/5 text-[10px] h-8 mt-4 rounded-lg w-full font-mono cursor-pointer"
                            >
                              Copy Transcript
                            </Button>
                          </Card>

                          {/* Words timeline */}
                          <Card className="border border-white/10 bg-white/[0.01] p-5 rounded-2xl flex flex-col">
                            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-white/60 mb-3.5 flex items-center gap-2">
                              Aligned Timecodes (JSON Words)
                            </h3>
                            <div className="h-56 overflow-y-auto pr-1 border border-white/5 bg-black/25 rounded-xl p-4 font-mono text-[9px] text-white/40 leading-relaxed custom-scrollbar">
                              {project.captions &&
                              project.captions.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {project.captions.map((w, idx) => (
                                    <div
                                      key={idx}
                                      className="px-2 py-0.5 bg-white/[0.02] border border-white/5 rounded flex items-center gap-1"
                                    >
                                      <span className="text-white font-bold">
                                        {w.word}
                                      </span>
                                      <span className="text-[8px] text-violet-400/80">
                                        {w.start.toFixed(2)}s
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-white/25 italic">
                                  No aligned timecodes found.
                                </span>
                              )}
                            </div>
                          </Card>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}
