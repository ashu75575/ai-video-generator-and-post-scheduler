"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  Clapperboard,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useDashboard } from "@/hooks/use-dashboard";
import RemotionPlayer from "@/components/RemotionPlayer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CAPTION_STYLES,
  CaptionStyle,
  getStyleById,
} from "@/lib/caption-styles";
import { Paintbrush } from "lucide-react";

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
  captionStyle: CaptionStyle | null;
  exportUrl: string | null;
  renderStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProjectStatus {
  id: string;
  name: string;
  status:
    | "pending"
    | "uploaded"
    | "validating"
    | "processing"
    | "uploading"
    | "completed"
    | "failed"
    | "transcribing"
    | "generating_shorts"
    | "ready";
  progress: number;
  videoUrl: string | null;
  originalUrl?: string | null;
  processedUrl?: string | null;
  processingError?: string | null;
  duration?: number | null;
  fps?: number | null;
  codec?: string | null;
  width?: number | null;
  height?: number | null;
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

  const { triggerScheduleDialog } = useDashboard();

  const [project, setProject] = useState<ProjectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track playing clip ID separately to isolate playback inside the grid
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);

  // Accordion state for technical details (transcript and raw captions)
  const [showTechnicalDetails, setShowTechnicalDetails] =
    useState<boolean>(false);

  // Caption style editor state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClip, setEditingClip] = useState<ShortVideo | null>(null);
  const [customStyle, setCustomStyle] = useState<CaptionStyle | null>(null);
  const [isSavingStyle, setIsSavingStyle] = useState(false);

  // ── Render Dialog State ──────────────────────────────────
  const [isRenderDialogOpen, setIsRenderDialogOpen] = useState(false);
  const [renderingClip, setRenderingClip] = useState<ShortVideo | null>(null);
  const [renderPhase, setRenderPhase] = useState<string>("Initializing...");
  const [renderPct, setRenderPct] = useState<number>(0);
  const [renderError, setRenderError] = useState<string | null>(null);
  const renderPollRef = useRef<NodeJS.Timeout | null>(null);

  const stopRenderPoll = useCallback(() => {
    if (renderPollRef.current) {
      clearInterval(renderPollRef.current);
      renderPollRef.current = null;
    }
  }, []);

  // Poll render status from DB and update dialog
  const startRenderPoll = useCallback(
    (clipId: string, clipTitle: string) => {
      stopRenderPoll();
      renderPollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/projects/clips/${clipId}/render`);
          if (!res.ok) return;
          const data = await res.json();
          const status: string = data.renderStatus || "pending";

          if (status.startsWith("rendering:")) {
            const pct = parseInt(status.split(":")[1] || "0", 10);
            setRenderPct(pct);
            setRenderPhase(
              pct < 20
                ? "Preparing Remotion Lambda environment..."
                : pct < 50
                  ? "Rendering frames on AWS Lambda..."
                  : pct < 80
                    ? "Encoding video stream with captions..."
                    : "Finalizing and uploading output...",
            );
          } else if (status === "rendering") {
            setRenderPct((p) => Math.min(p + 2, 18));
            setRenderPhase("Starting Remotion Lambda render...");
          } else if (status === "done" && data.exportUrl) {
            stopRenderPoll();
            setRenderPct(100);
            setRenderPhase("Render complete! Downloading...");

            // Update local project state so Download button reflects the new exportUrl
            setProject((prev) => {
              if (!prev || !prev.shortVideos) return prev;
              return {
                ...prev,
                shortVideos: prev.shortVideos.map((c) =>
                  c.id === clipId
                    ? { ...c, exportUrl: data.exportUrl, renderStatus: "done" }
                    : c,
                ),
              };
            });

            // Auto-download after short delay
            setTimeout(() => {
              const a = document.createElement("a");
              a.href = data.exportUrl;
              a.download = `${clipTitle}.mp4`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              setIsRenderDialogOpen(false);
              toast.success("Download started!", {
                description: `${clipTitle} has been rendered and is downloading.`,
              });
            }, 1200);
          } else if (status === "failed") {
            stopRenderPoll();
            setRenderError(
              "Render failed on Lambda. Check Inngest dashboard for details.",
            );
            // Update local state
            setProject((prev) => {
              if (!prev || !prev.shortVideos) return prev;
              return {
                ...prev,
                shortVideos: prev.shortVideos.map((c) =>
                  c.id === clipId ? { ...c, renderStatus: "failed" } : c,
                ),
              };
            });
          }
        } catch (e) {
          console.error("Render poll error:", e);
        }
      }, 2000);
    },
    [stopRenderPoll],
  );

  // Cleanup poll on unmount
  useEffect(() => {
    return () => stopRenderPoll();
  }, [stopRenderPoll]);

  // Handle download button click
  const handleDownloadClick = useCallback(
    async (clip: ShortVideo) => {
      // If exportUrl is already present, download directly
      if (clip.exportUrl && clip.renderStatus === "done") {
        const a = document.createElement("a");
        a.href = clip.exportUrl;
        a.download = `${clip.title}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("Downloading video!", {
          description: `${clip.title} is downloading from S3.`,
        });
        return;
      }

      // Otherwise trigger a new render
      setRenderingClip(clip);
      setRenderPhase("Queuing render job...");
      setRenderPct(0);
      setRenderError(null);
      setIsRenderDialogOpen(true);

      try {
        const res = await fetch(`/api/projects/clips/${clip.id}/render`, {
          method: "POST",
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to start render");
        }
        // Update local state to reflect rendering
        setProject((prev) => {
          if (!prev || !prev.shortVideos) return prev;
          return {
            ...prev,
            shortVideos: prev.shortVideos.map((c) =>
              c.id === clip.id
                ? { ...c, renderStatus: "rendering", exportUrl: null }
                : c,
            ),
          };
        });
        setRenderPhase("Render job started. Waiting for Lambda...");
        startRenderPoll(clip.id, clip.title);
      } catch (err: any) {
        setRenderError(err.message || "Unknown error starting render.");
      }
    },
    [startRenderPoll],
  );

  const handleEditClick = (clip: ShortVideo) => {
    setEditingClip(clip);
    // Use the clip's existing style, or fall back to the first preset template
    const baseStyle = clip.captionStyle || CAPTION_STYLES[0];
    setCustomStyle({ ...baseStyle });
    setIsEditModalOpen(true);
  };

  const handleApplyStyle = async () => {
    if (!editingClip || !customStyle) return;
    setIsSavingStyle(true);
    try {
      const response = await fetch(`/api/projects/clips/${editingClip.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ captionStyle: customStyle }),
      });

      if (!response.ok) {
        throw new Error("Failed to save style to database");
      }

      const data = await response.json();
      if (data.success) {
        toast.success("Caption style updated!", {
          description:
            "Export URL has been cleared. Re-render to download with the new style.",
        });
        // Update local state — also reset exportUrl/renderStatus since the clip was edited
        setProject((prev) => {
          if (!prev || !prev.shortVideos) return prev;
          return {
            ...prev,
            shortVideos: prev.shortVideos.map((c) =>
              c.id === editingClip.id
                ? {
                    ...c,
                    captionStyle: customStyle,
                    exportUrl: null,
                    renderStatus: "pending",
                  }
                : c,
            ),
          };
        });
        setIsEditModalOpen(false);
      }
    } catch (err: any) {
      console.error("Error saving style:", err);
      toast.error(err.message || "Failed to update caption style.");
    } finally {
      setIsSavingStyle(false);
    }
  };

  const isFullyAnalyzed = project?.status === "ready" && !!project?.transcript;

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
        if (
          (data.status === "ready" && data.transcript) ||
          data.status === "failed"
        ) {
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
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          <p className="text-xs text-white/40 font-mono uppercase tracking-widest">
            Loading Pipeline...
          </p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center p-4">
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
  const getStageStatus = (
    stage: "upload" | "preprocessing" | "transcription" | "complete",
  ) => {
    const status = project.status;

    if (stage === "upload") {
      return "completed";
    }

    if (stage === "preprocessing") {
      if (status === "validating" || status === "processing") return "active";
      if (status === "uploaded") return "pending";
      return "completed";
    }

    if (stage === "transcription") {
      if (isFullyAnalyzed || status === "generating_shorts") return "completed";
      if (status === "transcribing") return "active";
      return "pending";
    }

    if (stage === "complete") {
      if (isFullyAnalyzed) return "completed";
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
    <div className="min-h-screen bg-background text-white py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background radial overlays */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[15%] top-[5%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.08)_0%,transparent_70%)] blur-[50px]" />
        <div className="absolute right-[10%] top-[25%] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.05)_0%,transparent_70%)] blur-2xl" />
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
            <h1 className="text-2xl sm:text-3xl font-heading font-bold bg-linear-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
              {project.name}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono border uppercase tracking-wider ${
                project.status === "ready"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : project.status === "failed"
                    ? "bg-red-500/10 text-red-400 border-red-500/20"
                    : "bg-primary/10 text-primary border-primary/20 animate-pulse"
              }`}
            >
              {project.status.replace("_", " ")}
            </span>
          </div>
          <p className="text-xs text-white/40 font-mono">
            Original Source:{" "}
            {project.processedUrl || project.videoUrl
              ? "AWS S3 Cloud Storage"
              : "Local Workspace Cache"}
          </p>
        </div>

        {/* ==========================================
            PIPELINE STATUS VIEW (Active during processing)
            ========================================== */}
        {!isFullyAnalyzed && (
          <Card className="border border-white/10 bg-white/1 backdrop-blur-xl p-6 rounded-2xl max-w-2xl mx-auto shadow-2xl shadow-primary/20">
            <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-white/60 mb-6 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
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

              {/* Step 2: Media Validation & Normalization */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  {getStageStatus("preprocessing") === "completed" ? (
                    <div className="h-7 w-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs">
                      <Check size={14} className="stroke-[2.5]" />
                    </div>
                  ) : getStageStatus("preprocessing") === "active" ? (
                    <div className="h-7 w-7 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center text-xs">
                      <RefreshCw
                        size={12}
                        className="animate-spin text-primary"
                      />
                    </div>
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-white/5 text-white/35 border border-white/10 flex items-center justify-center text-xs font-mono">
                      2
                    </div>
                  )}
                  <div
                    className={`w-0.5 h-12 ${getStageStatus("preprocessing") === "completed" ? "bg-emerald-500/30" : "bg-white/5"}`}
                  />
                </div>
                <div className="space-y-1.5 mt-0.5 flex-1">
                  <h3
                    className={`text-xs font-bold ${getStageStatus("preprocessing") !== "pending" ? "text-white/90" : "text-white/30"}`}
                  >
                    Video Validation & Normalization
                  </h3>
                  <p
                    className={`text-[11px] font-mono ${getStageStatus("preprocessing") !== "pending" ? "text-white/45" : "text-white/20"}`}
                  >
                    {project.status === "validating"
                      ? "Verifying codec and checking streams with ffprobe..."
                      : project.status === "processing"
                        ? "Normalizing to 1080p, H.264 profile, and 30fps with FFmpeg..."
                        : getStageStatus("preprocessing") === "completed"
                          ? "Video normalized and saved to S3."
                          : "Awaiting start signal."}
                  </p>

                  {(project.status === "validating" ||
                    project.status === "processing") && (
                    <div className="space-y-1.5 max-w-sm mt-1 animate-in fade-in duration-300">
                      <div className="flex justify-between items-center text-[10px] font-mono text-primary">
                        <span>Preprocessing status</span>
                        <span>
                          {project.status === "validating" ? "30%" : "60%"}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-primary to-forge-accent-2 rounded-full transition-all duration-300"
                          style={{
                            width:
                              project.status === "validating" ? "30%" : "60%",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3: Audio Transcription */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  {getStageStatus("transcription") === "completed" ? (
                    <div className="h-7 w-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs">
                      <Check size={14} className="stroke-[2.5]" />
                    </div>
                  ) : getStageStatus("transcription") === "active" ? (
                    <div className="h-7 w-7 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center text-xs">
                      <RefreshCw
                        size={12}
                        className="animate-spin text-primary"
                      />
                    </div>
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-white/5 text-white/35 border border-white/10 flex items-center justify-center text-xs font-mono">
                      3
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
                      : project.status === "generating_shorts" ||
                          isFullyAnalyzed
                        ? "Completed converting voice segments to text."
                        : "Awaiting start signal."}
                  </p>

                  {project.status === "transcribing" && (
                    <div className="space-y-1.5 max-w-sm mt-1 animate-in fade-in duration-300">
                      <div className="flex justify-between items-center text-[10px] font-mono text-primary">
                        <span>Transcribing progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-primary to-forge-accent-2 rounded-full transition-all duration-300"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 4: Clip Isolation */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  {getStageStatus("complete") === "completed" ? (
                    <div className="h-7 w-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs">
                      <Check size={14} className="stroke-[2.5]" />
                    </div>
                  ) : getStageStatus("complete") === "active" ? (
                    <div className="h-7 w-7 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center text-xs">
                      <RefreshCw
                        size={12}
                        className="animate-spin text-primary"
                      />
                    </div>
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-white/5 text-white/35 border border-white/10 flex items-center justify-center text-xs font-mono">
                      4
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
                          className="h-full bg-linear-to-r from-primary via-primary/80 to-forge-accent-2 rounded-full transition-all duration-300 animate-pulse"
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

        {/* RESULTS SHOWCASE VIEW */}
        <AnimatePresence mode="wait">
          {isFullyAnalyzed &&
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
                  <Flame className="h-5 w-5 text-primary" />
                  <h2 className="font-heading text-lg font-bold text-white uppercase tracking-wider">
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
                        className="border border-white/10 bg-white/1 hover:bg-white/2 hover:border-white/15 backdrop-blur-xl p-5 rounded-3xl flex flex-col justify-between gap-5 transition-all duration-300 shadow-xl overflow-hidden group relative"
                      >
                        {/* Top: Video Player Panel */}
                        <div className="w-full aspect-9/16 relative rounded-2xl overflow-hidden border border-white/10 bg-black/60 shadow-[0_0_20px_rgba(0,0,0,0.4)]">
                          <RemotionPlayer
                            videoUrl={
                              project.processedUrl || project.videoUrl || ""
                            }
                            startTime={clip.startTime}
                            endTime={clip.endTime}
                            captions={clip.captions || []}
                            captionStyle={clip.captionStyle || undefined}
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
                              <h3 className="text-sm font-bold text-white font-heading leading-tight flex-1">
                                {clip.title}
                              </h3>

                              {/* SEO ranking indicator */}
                              <div className="flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full shrink-0">
                                <Trophy size={11} className="text-primary" />
                                {clip.seoRanking}%
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] text-white/35 font-mono">
                              <Volume2 size={10} className="text-primary" />
                              <span>Auto-aligned transcript</span>
                            </div>
                          </div>

                          {/* Why Best explanation */}
                          <div className="bg-primary/5 border border-primary/15 p-3.5 rounded-xl text-[11px] text-white/70 leading-relaxed font-sans select-text">
                            <span className="font-mono text-[9px] font-bold text-primary uppercase tracking-wide block mb-1">
                              AI Explanation:
                            </span>
                            {clip.whyBest}
                          </div>
                        </div>

                        {/* Bottom: Action Buttons */}
                        <div className="flex gap-2 pt-2 border-t border-white/4">
                          <Button
                            onClick={() => handleEditClick(clip)}
                            className="bg-white/5 hover:bg-white/10 text-white border border-white/5 text-[10px] h-9 px-2 rounded-xl font-semibold flex-1 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            <Paintbrush size={11} className="text-primary" />{" "}
                            Edit Style
                          </Button>
                          <Button
                            onClick={() => handleDownloadClick(clip)}
                            disabled={
                              clip.renderStatus === "rendering" ||
                              clip.renderStatus?.startsWith("rendering:")
                            }
                            className="bg-white/5 hover:bg-white/10 text-white border border-white/5 text-[10px] h-9 px-2 rounded-xl font-semibold flex-1 flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {clip.renderStatus === "rendering" ||
                            clip.renderStatus?.startsWith("rendering:") ? (
                              <>
                                <Loader2
                                  size={11}
                                  className="animate-spin text-primary"
                                />
                                Rendering...
                              </>
                            ) : clip.exportUrl &&
                              clip.renderStatus === "done" ? (
                              <>
                                <Download
                                  size={11}
                                  className="text-emerald-400"
                                />
                                Download
                              </>
                            ) : (
                              <>
                                <Clapperboard
                                  size={11}
                                  className="text-primary"
                                />
                                Render &amp; Download
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => handleScheduleClick(clip)}
                            className="bg-linear-to-r from-primary to-forge-accent-2 text-white text-[10px] h-9 px-2 rounded-xl font-bold flex-1 flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(152, 61, 22,0.2)] hover:shadow-[0_0_15px_rgba(152, 61, 22,0.35)] transition-all"
                          >
                            <Calendar size={11} /> Schedule
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
                    className="w-full flex justify-between items-center p-4 bg-white/1 hover:bg-white/2 border border-white/5 rounded-2xl transition-colors font-mono text-xs font-bold text-white/60 uppercase tracking-wider"
                  >
                    <span className="flex items-center gap-2">
                      <FileText size={14} className="text-primary" />
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
                          <Card className="border border-white/10 bg-white/1 p-5 rounded-2xl flex flex-col">
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
                          <Card className="border border-white/10 bg-white/1 p-5 rounded-2xl flex flex-col">
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
                                      className="px-2 py-0.5 bg-white/2 border border-white/5 rounded flex items-center gap-1"
                                    >
                                      <span className="text-white font-bold">
                                        {w.word}
                                      </span>
                                      <span className="text-[8px] text-primary/80">
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

        {/* ─────────────────────────────────────────────────────────────
            DIALOG: RENDER PROGRESS
            ───────────────────────────────────────────────────────────── */}
        <Dialog
          open={isRenderDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              // Only allow closing if render is done or errored
              if (renderPct === 100 || renderError) {
                setIsRenderDialogOpen(false);
                stopRenderPoll();
              }
              // If still rendering, block close (user must wait)
            }
          }}
        >
          <DialogContent className="max-w-md rounded-3xl border border-white/10 bg-[#1A1A1A]/95 backdrop-blur-2xl p-7 text-white shadow-2xl shadow-black/80">
            <DialogHeader>
              <DialogTitle className="font-heading text-lg font-bold text-white flex items-center gap-2.5">
                <Clapperboard size={18} className="text-primary" />
                {renderError
                  ? "Render Failed"
                  : renderPct === 100
                    ? "Render Complete!"
                    : "Rendering Video..."}
              </DialogTitle>
              <DialogDescription className="text-xs text-white/40">
                {renderError
                  ? "An error occurred during rendering."
                  : "Your video is being rendered via Remotion Lambda on AWS. Do not close this dialog."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-3">
              {renderError ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="h-14 w-14 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center">
                    <AlertCircle size={28} className="text-red-400" />
                  </div>
                  <p className="text-sm text-red-300 text-center leading-relaxed">
                    {renderError}
                  </p>
                </div>
              ) : (
                <>
                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono text-[10px] text-white/50 uppercase tracking-wider animate-pulse">
                        {renderPhase}
                      </span>
                      <span className="font-mono font-bold text-primary tabular-nums">
                        {renderPct}%
                      </span>
                    </div>
                    <div className="relative h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-primary to-forge-accent-2 shadow-[0_0_12px_rgba(152, 61, 22,0.6)]"
                        animate={{ width: `${renderPct}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  {/* Pipeline steps */}
                  <div className="space-y-2.5">
                    {[
                      { label: "Inngest job queued", done: renderPct > 0 },
                      {
                        label: "Lambda environment booted",
                        done: renderPct > 10,
                      },
                      {
                        label: "Frames rendered (AWS Lambda)",
                        done: renderPct > 50,
                      },
                      { label: "Video encoded (H.264)", done: renderPct > 80 },
                      {
                        label: "Output uploaded to S3",
                        done: renderPct >= 100,
                      },
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div
                          className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                            step.done
                              ? "bg-emerald-500/20 border border-emerald-500/40"
                              : "bg-white/5 border border-white/10"
                          }`}
                        >
                          {step.done ? (
                            <Check
                              size={11}
                              className="text-emerald-400 stroke-[2.5]"
                            />
                          ) : (
                            <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
                          )}
                        </div>
                        <span
                          className={`text-xs font-mono transition-colors ${
                            step.done ? "text-white/80" : "text-white/25"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {renderPct === 100 && (
                    <div className="flex items-center gap-2.5 bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-3.5 animate-in fade-in duration-300">
                      <Check size={16} className="text-emerald-400 shrink-0" />
                      <p className="text-xs text-emerald-300">
                        Video rendered successfully. Download starting...
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            <DialogFooter>
              {(renderError || renderPct === 100) && (
                <Button
                  onClick={() => {
                    setIsRenderDialogOpen(false);
                    stopRenderPoll();
                  }}
                  className="rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white cursor-pointer"
                >
                  Close
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG: EDIT CAPTION STYLE*/}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-[90vw]! w-[90vw] h-[85vh] max-h-[800px] rounded-3xl border border-white/10 bg-black/90 backdrop-blur-2xl p-6 text-white shadow-xl shadow-black/80 flex flex-col overflow-hidden">
            <DialogHeader className="shrink-0 mb-4">
              <DialogTitle className="font-heading text-xl font-bold text-white flex items-center gap-2">
                <Paintbrush size={18} className="text-primary" />
                Customize Caption Design
              </DialogTitle>
              <DialogDescription className="text-xs text-white/40">
                Customize fonts, colors, and layout styles for captions in
                real-time. Changes will be saved to your video.
              </DialogDescription>
            </DialogHeader>

            {editingClip && customStyle && (
              <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-5 gap-6">
                {/* Left Side: Caption Style Editor Controls */}
                <div className="md:col-span-3 flex flex-col gap-5 overflow-y-auto pr-2 custom-scrollbar">
                  {/* Preset Templates */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-white/50 uppercase tracking-wider block font-mono">
                      Caption Style Presets
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {CAPTION_STYLES.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => setCustomStyle({ ...preset })}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                            customStyle.id === preset.id
                              ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(152, 61, 22,0.15)]"
                              : "border-white/5 bg-white/2 hover:bg-white/4 hover:border-white/10"
                          }`}
                        >
                          <span className="block font-semibold text-xs text-white">
                            {preset.name}
                          </span>
                          <span
                            className="block text-[9px] text-white/40 font-mono mt-0.5 truncate"
                            style={{ fontFamily: preset.fontFamily }}
                          >
                            {preset.fontFamily.split(",")[0].replace(/'/g, "")}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Customization */}
                  <div className="space-y-3 bg-white/1 border border-white/5 p-4 rounded-2xl">
                    <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest block mb-2">
                      Typography & Alignment
                    </span>

                    {/* Font Family Selection */}
                    <div className="space-y-2">
                      <label className="text-xs text-white/60 block">
                        Font Family
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          {
                            label: "Impact",
                            value: "Impact, Arial Black, sans-serif",
                          },
                          {
                            label: "Outfit",
                            value: "'Outfit', 'Inter', sans-serif",
                          },
                          { label: "Inter", value: "'Inter', sans-serif" },
                          {
                            label: "Courier New",
                            value: "'Courier New', Courier, monospace",
                          },
                          {
                            label: "Space Grotesk",
                            value: "'Space Grotesk', sans-serif",
                          },
                        ].map((f) => (
                          <button
                            key={f.label}
                            onClick={() =>
                              setCustomStyle((prev) =>
                                prev ? { ...prev, fontFamily: f.value } : null,
                              )
                            }
                            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                              customStyle.fontFamily === f.value
                                ? "border-primary bg-primary/20 text-white"
                                : "border-white/5 bg-white/2 text-white/60 hover:bg-white/4 hover:text-white"
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Case Transformation */}
                    <div className="space-y-2 pt-2">
                      <label className="text-xs text-white/60 block">
                        Letter Case
                      </label>
                      <div className="flex gap-2">
                        {[
                          { label: "ALL CAPS", value: "uppercase" as const },
                          { label: "Normal Case", value: "none" as const },
                          { label: "lowercase", value: "lowercase" as const },
                        ].map((c) => (
                          <button
                            key={c.label}
                            onClick={() =>
                              setCustomStyle((prev) =>
                                prev
                                  ? { ...prev, textTransform: c.value }
                                  : null,
                              )
                            }
                            className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer text-center ${
                              customStyle.textTransform === c.value
                                ? "border-primary bg-primary/20 text-white"
                                : "border-white/5 bg-white/2 text-white/60 hover:bg-white/4 hover:text-white"
                            }`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Colors Customization */}
                  <div className="space-y-3 bg-white/1 border border-white/5 p-4 rounded-2xl">
                    <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest block mb-2">
                      Subtitles Styling & Colors
                    </span>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs text-white/60">
                          Active Word Color
                        </label>
                        <div className="flex items-center gap-2 bg-white/2 border border-white/5 p-2 rounded-xl">
                          <input
                            type="color"
                            value={
                              customStyle.colorActive.startsWith("#")
                                ? customStyle.colorActive
                                : "#facc15"
                            }
                            onChange={(e) =>
                              setCustomStyle((prev) =>
                                prev
                                  ? { ...prev, colorActive: e.target.value }
                                  : null,
                              )
                            }
                            className="w-8 h-8 rounded-lg border-none bg-transparent cursor-pointer shrink-0"
                          />
                          <span className="text-xs font-mono text-white/70 uppercase">
                            {customStyle.colorActive}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-white/60">
                          Inactive Word Color
                        </label>
                        <div className="flex items-center gap-2 bg-white/2 border border-white/5 p-2 rounded-xl">
                          <input
                            type="color"
                            value={
                              customStyle.colorInactive.startsWith("#")
                                ? customStyle.colorInactive
                                : "#ffffff"
                            }
                            onChange={(e) =>
                              setCustomStyle((prev) =>
                                prev
                                  ? { ...prev, colorInactive: e.target.value }
                                  : null,
                              )
                            }
                            className="w-8 h-8 rounded-lg border-none bg-transparent cursor-pointer shrink-0"
                          />
                          <span className="text-xs font-mono text-white/70 uppercase">
                            {customStyle.colorInactive}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sizes Customization */}
                  <div className="space-y-3 bg-white/1 border border-white/5 p-4 rounded-2xl">
                    <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest block mb-2">
                      Caption Sizes
                    </span>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs text-white/60">
                          Active Font Size
                        </label>
                        <div className="flex items-center gap-2 bg-white/2 border border-white/5 p-1 rounded-xl justify-between">
                          <button
                            onClick={() => {
                              const val =
                                parseFloat(customStyle.fontSizeActive) - 0.2;
                              setCustomStyle((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      fontSizeActive: `${val.toFixed(1)}rem`,
                                    }
                                  : null,
                              );
                            }}
                            className="px-2.5 py-1 text-xs bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer font-bold"
                          >
                            -
                          </button>
                          <span className="text-xs font-mono font-bold text-white">
                            {customStyle.fontSizeActive}
                          </span>
                          <button
                            onClick={() => {
                              const val =
                                parseFloat(customStyle.fontSizeActive) + 0.2;
                              setCustomStyle((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      fontSizeActive: `${val.toFixed(1)}rem`,
                                    }
                                  : null,
                              );
                            }}
                            className="px-2.5 py-1 text-xs bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-white/60">
                          Inactive Font Size
                        </label>
                        <div className="flex items-center gap-2 bg-white/2 border border-white/5 p-1 rounded-xl justify-between">
                          <button
                            onClick={() => {
                              const val =
                                parseFloat(customStyle.fontSizeInactive) - 0.2;
                              setCustomStyle((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      fontSizeInactive: `${val.toFixed(1)}rem`,
                                    }
                                  : null,
                              );
                            }}
                            className="px-2.5 py-1 text-xs bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer font-bold"
                          >
                            -
                          </button>
                          <span className="text-xs font-mono font-bold text-white">
                            {customStyle.fontSizeInactive}
                          </span>
                          <button
                            onClick={() => {
                              const val =
                                parseFloat(customStyle.fontSizeInactive) + 0.2;
                              setCustomStyle((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      fontSizeInactive: `${val.toFixed(1)}rem`,
                                    }
                                  : null,
                              );
                            }}
                            className="px-2.5 py-1 text-xs bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Background Box Opacity */}
                  <div className="space-y-3 bg-white/1 border border-white/5 p-4 rounded-2xl">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest block">
                        Background Overlay Opacity
                      </span>
                      <span className="text-xs font-mono font-bold text-white/80">
                        {Math.round(
                          (customStyle.backgroundColor.includes("rgba")
                            ? parseFloat(
                                customStyle.backgroundColor.split(",")[3],
                              )
                            : 0.9) * 100,
                        )}
                        %
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={
                          customStyle.backgroundColor.includes("rgba")
                            ? parseFloat(
                                customStyle.backgroundColor.split(",")[3],
                              )
                            : 0.9
                        }
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setCustomStyle((prev) => {
                            if (!prev) return null;
                            const base = prev.backgroundColor.startsWith("rgba")
                              ? prev.backgroundColor.substring(
                                  0,
                                  prev.backgroundColor.lastIndexOf(","),
                                )
                              : "rgba(5, 5, 10";
                            return {
                              ...prev,
                              backgroundColor: `${base}, ${val})`,
                            };
                          });
                        }}
                        className="flex-1 accent-primary h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Side: Live Remotion Player Preview */}
                <div className="md:col-span-2 flex flex-col items-center justify-center bg-black/40 rounded-3xl border border-white/5 p-4 relative group">
                  <div className="w-full h-full max-h-[460px] flex items-center justify-center">
                    <RemotionPlayer
                      videoUrl={project.processedUrl || project.videoUrl || ""}
                      startTime={editingClip.startTime}
                      endTime={editingClip.endTime}
                      captions={editingClip.captions || []}
                      captionStyle={customStyle}
                    />
                  </div>
                  <div className="text-[10px] font-mono text-white/30 uppercase tracking-wider mt-3">
                    Live Preview Engine
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="shrink-0 mt-6 pt-4 border-t border-white/5 gap-3">
              <Button
                onClick={() => setIsEditModalOpen(false)}
                variant="ghost"
                className="rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 text-xs font-semibold text-white/70 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                disabled={isSavingStyle}
                onClick={handleApplyStyle}
                className="rounded-xl bg-linear-to-r from-primary to-forge-accent-2 px-5 text-xs font-bold text-white shadow-md shadow-primary/30 hover:shadow-primary/50 hover:from-primary hover:to-forge-accent-2 cursor-pointer"
              >
                {isSavingStyle ? "Saving Style..." : "Apply Style"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
