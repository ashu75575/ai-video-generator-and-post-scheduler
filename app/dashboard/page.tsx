"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Video,
  Calendar,
  Flame,
  Upload,
  Play,
  Eye,
  ThumbsUp,
  Download,
  Clock,
  Scissors,
  X,
  Check,
  FileVideo,
  RefreshCw,
  Info,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useDashboard } from "@/hooks/use-dashboard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function DashboardHome() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { clips, setClips, rawVideos, setRawVideos } = useDashboard();

  // Local Video Upload UI States
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success"
  >("idle");
  const [uploadStatusText, setUploadStatusText] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedProjectId, setUploadedProjectId] = useState<string | null>(
    null,
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Clean up object URL when file changes
  useEffect(() => {
    return () => {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [videoPreviewUrl]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("video/")) {
        setSelectedVideoFile(file);
        setVideoPreviewUrl(URL.createObjectURL(file));
        toast.success("Video selected!", {
          description: `"${file.name}" is loaded and ready for preview.`,
        });
      } else {
        toast.error("Invalid file type", {
          description: "Please drop a valid video file (MP4, MOV, or WEBM).",
        });
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedVideoFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
      toast.success("Video selected!", {
        description: `"${file.name}" is loaded and ready for preview.`,
      });
    }
  };

  const clearSelection = () => {
    if ((window as any)._activeUploadPoll) {
      clearInterval((window as any)._activeUploadPoll);
      (window as any)._activeUploadPoll = null;
    }
    setSelectedVideoFile(null);
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
      setVideoPreviewUrl(null);
    }
    setUploadStatus("idle");
    setUploadProgress(0);
    setUploadStatusText("");
    setUploadedProjectId(null);
  };

  const startUpload = async () => {
    if (!selectedVideoFile) return;
    setIsUploadingVideo(true);
    setUploadStatus("uploading");
    setUploadProgress(0);
    setUploadStatusText("Uploading video to server...");

    try {
      const formData = new FormData();
      formData.append("file", selectedVideoFile);
      formData.append("name", selectedVideoFile.name);

      const response = await fetch("/api/projects/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload video to server");
      }

      const data = await response.json();
      if (!data.success || !data.projectId) {
        throw new Error(data.error || "Failed to start upload processing");
      }

      const projectId = data.projectId;
      setUploadedProjectId(projectId);
      setUploadStatusText("Video saved. Background processing started...");
      setUploadProgress(15);

      // Start polling status
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/projects/${projectId}/status`);
          if (!statusRes.ok) {
            throw new Error("Failed to fetch processing status");
          }

          const statusData = await statusRes.json();
          const { status, progress, videoUrl } = statusData;

          // Update progress bar
          setUploadProgress(progress);

          if (status === "uploading") {
            if (progress < 40) {
              setUploadStatusText(
                "Connecting & starting background pipeline...",
              );
            } else if (progress < 85) {
              setUploadStatusText("Uploading segments to AWS S3 bucket...");
            } else {
              setUploadStatusText("Acquiring viewer signed URL...");
            }
          } else if (status === "completed") {
            clearInterval(pollInterval);
            (window as any)._activeUploadPoll = null;
            setUploadStatus("success");
            setUploadStatusText("Upload complete!");

            // Add the new video and a generated clip to local context list
            setTimeout(() => {
              const newVideoId = `raw-${Date.now()}`;
              const newRawVideo = {
                id: newVideoId,
                title: selectedVideoFile.name,
                date: new Date().toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }),
                size: `${(selectedVideoFile.size / (1024 * 1024)).toFixed(1)} MB`,
                duration: "1:15",
                clips: 1,
                status: "Analyzed" as const,
                img:
                  videoUrl ||
                  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80",
              };

              const newClip = {
                id: `clip-${Date.now()}`,
                title: `Isolated Highlight from ${selectedVideoFile.name.split(".")[0]}`,
                sourceVideo: selectedVideoFile.name,
                duration: "0:35",
                viralityScore: 93,
                views: "0",
                likes: "0",
                platform: "Multi-Platform" as const,
                thumbnail:
                  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80",
                status: "Ready" as const,
                transcript:
                  "This is a transcript generated from your upload. It represents a highly retention-optimized segment isolated by ClipForge AI.",
                description: `Checkout this epic clip isolated by ClipForge AI! 🔥 #clips #ai`,
                tags: ["#clips", "#ai"],
                metrics: {
                  hookStrength: 95,
                  retentionPotential: 90,
                  pacingScore: 92,
                  visualEngagement: 91,
                },
              };

              setRawVideos((prev) => [newRawVideo, ...prev]);
              setClips((prev) => [newClip, ...prev]);

              toast.success("Upload Successful!", {
                description: `"${selectedVideoFile.name}" has been uploaded to AWS S3 and added to your library.`,
              });
            }, 1000);
          } else if (status === "failed") {
            clearInterval(pollInterval);
            (window as any)._activeUploadPoll = null;
            setIsUploadingVideo(false);
            setUploadStatus("idle");
            toast.error("Processing Failed", {
              description: "The background upload job failed on the server.",
            });
          }
        } catch (pollErr) {
          console.error("Polling error:", pollErr);
        }
      }, 1500);

      // Save interval reference to clear it if component unmounts or user cancels
      (window as any)._activeUploadPoll = pollInterval;
    } catch (error: any) {
      console.error("Upload error:", error);
      setIsUploadingVideo(false);
      setUploadStatus("idle");
      toast.error("Upload Failed", {
        description:
          error.message || "An unexpected error occurred during upload.",
      });
    }
  };

  const handleStartAnalysis = async () => {
    if (!uploadedProjectId) return;
    setIsAnalyzing(true);
    try {
      const response = await fetch(
        `/api/projects/${uploadedProjectId}/analyze`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to start project analysis");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to start analysis");
      }

      toast.success("Analysis Started!", {
        description: "Your video transcription and analysis have begun.",
      });

      // Navigate to the project analysis loading pipeline page
      router.push(`/dashboard/projects/${uploadedProjectId}`);
    } catch (err: any) {
      console.error("Start analysis error:", err);
      toast.error("Failed to Start Analysis", {
        description: err.message || "An unexpected error occurred.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8 max-w-[1000px] mx-auto will-change-transform"
    >
      {/* Centered Premium Welcoming Typography & Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-forge-accent/20 bg-forge-accent/10 px-3 py-1">
            <Sparkles size={11} className="text-forge-accent" />
            <span className="font-mono text-[10px] font-semibold tracking-wider uppercase text-forge-accent">
              AI Forge Engine v2.0
            </span>
          </div>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-extrabold tracking-tight text-white leading-tight">
            Welcome back,{" "}
            {isLoaded && user?.firstName ? user.firstName : "Alex"} 👋
          </h1>
          <p className="text-white/55 text-sm font-[family-name:var(--font-dm-sans)]">
            Load, preview, and process your long-form video assets to extract
            high-virality short clips.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/videos">
            <Button
              variant="ghost"
              className="rounded-xl border border-white/10 bg-white/[0.02]  text-white/80 text-xs font-semibold px-4 h-9 cursor-pointer"
            >
              <Video size={14} className="mr-1.5" />
              My Videos ({rawVideos.length})
            </Button>
          </Link>
          <Link href="/dashboard/clips">
            <Button className="rounded-xl bg-gradient-forge text-xs font-bold text-white shadow-md hover:shadow-forge-glow transition-all duration-300 px-4 h-9 cursor-pointer">
              <Scissors size={14} className="mr-1.5" />
              AI Clips ({clips.length})
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Studio Card workspace */}
      <Card className="relative overflow-hidden bg-white/3 border border-white/8 backdrop-blur-xl rounded-[24px] shadow-forge-panel p-6 md:p-8 min-h-[420px] flex flex-col justify-center select-none">
        <span className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-forge-accent/15 blur-3xl pointer-events-none" />
        <span className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-forge-accent-2/10 blur-3xl pointer-events-none" />

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="video/*"
          onChange={handleFileSelect}
        />

        <AnimatePresence mode="wait">
          {uploadStatus === "idle" && !selectedVideoFile ? (
            <motion.div
              key="idle-uploader"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10 w-full"
            >
              {/* Left Column: Information Panel */}
              <div className="lg:col-span-5 space-y-6">
                <div className="space-y-2">
                  <h3 className="font-(family-name:--font-space-grotesk)  text-lg font-bold text-white">
                    Step-by-Step AI Isolation
                  </h3>
                  <p className="text-white/45 text-xs font-(family-name:--font-dm-sans) leading-relaxed">
                    Our machine learning pipeline scans your file audio-visually
                    to pull viral highlights.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      step: "1",
                      title: "Video ingestion",
                      desc: "Drag and drop any MP4, MOV, or WebM video file up to 2GB.",
                    },
                    {
                      step: "2",
                      title: "Speech & waveform scan",
                      desc: "AI models transcribe speech and analyze facial expressions.",
                    },
                    {
                      step: "3",
                      title: "Viral moments extraction",
                      desc: "Renders vertical clips with subtitles, ready to publish.",
                    },
                  ].map((item, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forge-accent/20 border border-forge-accent/30 text-forge-accent font-mono text-xs font-bold">
                        {item.step}
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-white/90">
                          {item.title}
                        </h4>
                        <p className="text-[10px] text-white/40 leading-normal">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Drop Zone */}
              <div className="lg:col-span-7 w-full h-full">
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-500 min-h-[300px] flex flex-col items-center justify-center gap-4 ${
                    dragActive
                      ? "border-forge-accent bg-forge-accent/10 shadow-[0_0_20px_rgba(124,106,250,0.25)]"
                      : "border-white/10 hover:border-white/20 bg-white/[0.01] hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none rounded-2xl" />
                  <div className="p-4 rounded-full bg-forge-accent/10 text-forge-accent border border-forge-accent/15 shadow-inner">
                    <Upload size={32} className="animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-sm text-white">
                      Drag & Drop your video file here
                    </h3>
                    <p className="text-xs text-white/40 max-w-xs mx-auto font-[family-name:var(--font-dm-sans)]">
                      Or click to browse from local directories
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    className="h-8 rounded-lg border border-white/10 bg-white/[0.02] px-4 text-xs text-white/70 hover:text-black cursor-pointer"
                  >
                    Select Local Video
                  </Button>
                  <span className="text-[9px] text-white/25 font-mono">
                    Supported: MP4, MOV, WebM (Max 2GB)
                  </span>
                </div>
              </div>
            </motion.div>
          ) : uploadStatus === "idle" && selectedVideoFile ? (
            <motion.div
              key="preview-panel"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10 w-full"
            >
              {/* Left Column: HTML5 Preview Player */}
              <div className="lg:col-span-7 relative aspect-video w-full rounded-2xl overflow-hidden border border-white/15 bg-black shadow-inner flex items-center justify-center group">
                {videoPreviewUrl ? (
                  <video
                    src={videoPreviewUrl}
                    className="w-full h-full object-contain"
                    muted
                    loop
                    autoPlay
                    playsInline
                  />
                ) : (
                  <FileVideo
                    size={48}
                    className="text-white/25 animate-pulse"
                  />
                )}
                <div className="absolute top-3 left-3 bg-black/60 border border-white/10 backdrop-blur-md px-2.5 py-0.5 rounded-lg text-[9px] font-mono text-forge-accent-2 tracking-wider">
                  LOCAL PREVIEW PLAYER
                </div>
              </div>

              {/* Right Column: Video Details & Actions */}
              <div className="lg:col-span-5 space-y-6">
                <div className="space-y-4">
                  <Badge className="bg-forge-accent-2/15 border-forge-accent-2/20 text-forge-accent-2 font-mono text-[9px] tracking-wider uppercase px-2.5 py-0.5">
                    File Selected Successfully
                  </Badge>

                  <div className="space-y-2">
                    <h2 className="font-[family-name:var(--font-space-grotesk)] font-bold text-lg text-white leading-snug break-words">
                      {selectedVideoFile.name}
                    </h2>

                    <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 font-mono text-xs text-white/50">
                      <div>
                        <span className="block text-[9px] text-white/30 uppercase">
                          Size
                        </span>
                        <strong className="text-white/80">
                          {(selectedVideoFile.size / (1024 * 1024)).toFixed(2)}{" "}
                          MB
                        </strong>
                      </div>
                      <div>
                        <span className="block text-[9px] text-white/30 uppercase">
                          Format
                        </span>
                        <strong className="text-white/80">
                          {selectedVideoFile.type
                            .split("/")[1]
                            ?.toUpperCase() || "MP4"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Optimization Platform checklist */}
                  <div className="space-y-2 pt-2">
                    <span className="block text-[10px] text-white/40 uppercase font-mono tracking-wider">
                      Target Platforms
                    </span>
                    <div className="flex gap-2">
                      {["TikTok", "YouTube Shorts", "Instagram Reels"].map(
                        (p, idx) => (
                          <Badge
                            key={idx}
                            className="bg-white/5 border border-white/10 text-white/70 font-mono text-[9px] py-1 px-2"
                          >
                            {p}
                          </Badge>
                        ),
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    onClick={clearSelection}
                    variant="ghost"
                    className="flex-1 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] text-white/70 hover:text-white text-xs px-4 h-10 cursor-pointer"
                  >
                    <X size={14} className="mr-1.5" />
                    Clear File
                  </Button>
                  <Button
                    onClick={startUpload}
                    className="flex-1 rounded-xl bg-gradient-forge text-xs px-4 h-10 font-bold text-white shadow-md hover:shadow-forge-glow transition-all duration-300 cursor-pointer animate-pulse-glow"
                  >
                    <Sparkles size={14} className="mr-1.5" />
                    Upload & Extract
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : uploadStatus === "uploading" ? (
            <motion.div
              key="uploading-panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10 w-full"
            >
              {/* Left Column: Dimmed Preview */}
              <div className="lg:col-span-7 relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-black shadow-inner flex items-center justify-center">
                {videoPreviewUrl && (
                  <video
                    src={videoPreviewUrl}
                    className="w-full h-full object-contain opacity-25 blur-[1px]"
                    muted
                    loop
                    autoPlay
                    playsInline
                  />
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/45 backdrop-blur-sm animate-in fade-in duration-300">
                  <RefreshCw
                    size={28}
                    className="text-forge-accent animate-spin"
                  />
                  <span className="text-[10px] font-mono text-white/40 tracking-widest uppercase">
                    SYNCING VIDEO FILE
                  </span>
                </div>
              </div>

              {/* Right Column: Uploading Progress Telemetry */}
              <div className="lg:col-span-5 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest">
                      Uploading segments
                    </span>
                    <span className="font-mono font-bold text-forge-accent">
                      {uploadProgress}%
                    </span>
                  </div>

                  {/* Glowing Linear Progress Bar */}
                  <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-gradient-forge shadow-[0_0_10px_rgba(124,106,250,0.6)] transition-all duration-100 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-white/30 font-mono">
                    <span className="animate-pulse">{uploadStatusText}</span>
                    <span>
                      {(uploadProgress * 0.45).toFixed(1)} MB /{" "}
                      {(selectedVideoFile
                        ? selectedVideoFile.size / (1024 * 1024)
                        : 0
                      ).toFixed(1)}{" "}
                      MB
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.01] border border-white/5 flex gap-3 text-[10px] text-white/40 leading-relaxed font-mono">
                  <Info
                    size={14}
                    className="text-forge-accent shrink-0 mt-0.5"
                  />
                  <span>
                    Transfer speed optimized at 15.4 MB/s. Do not close or
                    refresh this tab while upload is active.
                  </span>
                </div>

                <Button
                  onClick={clearSelection}
                  variant="ghost"
                  className="rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] text-white/70 hover:text-white text-xs px-4 h-9 cursor-pointer"
                >
                  Cancel Upload
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success-panel"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-8 text-center z-10 w-full space-y-6"
            >
              <div className="flex flex-col items-center">
                <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(52,211,153,0.25)]">
                  <Check size={32} className="stroke-[3]" />
                </div>
                <h2 className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-white mb-2">
                  Uploaded Successfully!
                </h2>
                <p className="text-xs text-white/50 max-w-sm leading-relaxed font-[family-name:var(--font-dm-sans)]">
                  "{selectedVideoFile?.name}" has been saved to your AWS S3
                  bucket and registered. Ready for audio transcription and
                  speech extraction.
                </p>
              </div>

              <div className="flex gap-4 w-full max-w-md justify-center">
                <Button
                  onClick={clearSelection}
                  variant="ghost"
                  className="rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] text-white/70 hover:text-white text-xs px-5 h-10 cursor-pointer font-mono"
                  disabled={isAnalyzing}
                >
                  Cancel & Clear
                </Button>
                <Button
                  onClick={handleStartAnalysis}
                  className="rounded-xl bg-gradient-forge text-xs px-6 h-10 font-bold text-white shadow-md hover:shadow-forge-glow transition-all duration-300 cursor-pointer flex items-center gap-1.5"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      Start Analysis
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
