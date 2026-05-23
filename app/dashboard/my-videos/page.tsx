"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Upload,
  Video,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  ChevronRight,
  FileText,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ProjectItem {
  id: string;
  userId: string;
  name: string;
  status:
    | "pending"
    | "uploaded"
    | "validating"
    | "processing"
    | "ready"
    | "failed"
    | "transcribing"
    | "generating_shorts";
  progress: number;
  videoUrl: string | null;
  originalUrl: string | null;
  processedUrl: string | null;
  transcript: string | null;
  captions: any;
  createdAt: string;
  updatedAt: string;
}

export default function MyVideosPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch projects from user database
  const loadProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (!response.ok) {
        throw new Error("Failed to load video library.");
      }
      const data = await response.json();
      if (data.success) {
        setProjects(data.projects || []);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load videos", {
        description: err.message || "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Trigger analysis for a project
  const handleStartAnalysis = async (projectId: string) => {
    setActionLoading(projectId);
    try {
      const response = await fetch(`/api/projects/${projectId}/analyze`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to trigger video analysis.");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Analysis failed to start.");
      }

      toast.success("Analysis Triggered", {
        description: "Background transcription and caption extraction started.",
      });

      // Redirect user to the loading pipeline page
      router.push(`/dashboard/projects/${projectId}`);
    } catch (err: any) {
      console.error(err);
      toast.error("Analysis Failed", {
        description: err.message || "Could not start audio transcription.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 max-w-[1200px] mx-auto py-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white tracking-tight">
            My Uploaded Library
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Manage your long-form uploads, trigger Deepgram voice analyses, and
            view timecoded subtitles.
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard")}
          className="rounded-xl bg-gradient-forge px-4 py-2 text-xs font-bold text-white shadow-md cursor-pointer hover:shadow-forge-glow transition-shadow duration-300"
        >
          <Upload size={14} className="mr-1.5" />
          Upload New Video
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          <p className="text-xs text-white/30 font-mono tracking-widest uppercase">
            FETCHING VIDEO LIBRARY
          </p>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-white/20 border border-dashed border-white/5 bg-white/0.5 rounded-2xl p-6 min-h-[300px]">
          <Video size={40} className="stroke-[1.5] mb-3 text-white/10" />
          <span className="text-sm font-semibold text-white/40">
            Your uploaded library is empty
          </span>
          <span className="text-xs mt-1 max-w-sm mx-auto leading-relaxed">
            You haven't uploaded any long-form source videos yet. Get started by
            uploading a raw file.
          </span>
          <Button
            onClick={() => router.push("/dashboard")}
            className="mt-4 h-8 rounded-lg bg-forge-accent hover:bg-forge-accent/90 px-4 text-xs font-bold text-white cursor-pointer"
          >
            Upload Source Video
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const isAnalyzed =
              project.status === "ready" && !!project.transcript;
            const isPreprocessing = [
              "uploaded",
              "validating",
              "processing",
            ].includes(project.status);
            const isProcessing =
              project.status === "transcribing" ||
              project.status === "generating_shorts" ||
              isPreprocessing;

            return (
              <Card
                key={project.id}
                className="bg-white/1.5 border border-white/5 rounded-2xl overflow-hidden group hover:border-white/10 transition-colors duration-300 flex flex-col h-full justify-between"
              >
                {/* Visual Preview Box */}
                <div className="relative aspect-video bg-black overflow-hidden border-b border-white/5 flex items-center justify-center">
                  {project.processedUrl || project.videoUrl ? (
                    <video
                      src={project.processedUrl || project.videoUrl || ""}
                      className="h-full w-full object-cover opacity-60 group-hover:scale-102 transition-transform duration-500"
                      muted
                      playsInline
                    />
                  ) : (
                    <Video size={36} className="text-white/10" />
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[8px] font-mono border uppercase tracking-wider ${
                        isAnalyzed
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : isProcessing
                            ? "bg-primary/10 text-primary border-primary/20 animate-pulse"
                            : project.status === "failed"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {project.status === "ready"
                        ? isAnalyzed
                          ? "analyzed"
                          : "preprocessed"
                        : project.status}
                    </span>
                  </div>
                </div>

                {/* Details Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-sm text-white group-hover:text-forge-accent transition-colors truncate">
                      {project.name}
                    </h3>
                    <div className="flex gap-2 font-mono text-[9px] text-white/35">
                      <span>
                        Created:{" "}
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5">
                    {/* Render Start Analysis if unanalyzed and completed/pending */}
                    {!isAnalyzed &&
                    !isProcessing &&
                    project.status !== "failed" ? (
                      <>
                        <span className="font-mono text-[9px] text-white/35 flex items-center gap-1">
                          <Clock size={11} className="text-amber-400" />
                          Unanalyzed
                        </span>

                        <Button
                          size="sm"
                          disabled={actionLoading !== null}
                          onClick={() => handleStartAnalysis(project.id)}
                          className="h-7 rounded-lg bg-gradient-forge hover:shadow-forge-glow text-[10px] font-bold text-white cursor-pointer px-3 flex items-center gap-1"
                        >
                          {actionLoading === project.id ? (
                            <RefreshCw size={10} className="animate-spin" />
                          ) : (
                            <Sparkles size={10} />
                          )}
                          Start Analysis
                        </Button>
                      </>
                    ) : isProcessing ? (
                      <>
                        <span className="font-mono text-[9px] text-primary flex items-center gap-1 animate-pulse">
                          <RefreshCw size={11} className="animate-spin" />
                          {isPreprocessing
                            ? "Preprocessing..."
                            : "Transcribing..."}
                        </span>

                        <Button
                          size="sm"
                          onClick={() =>
                            router.push(`/dashboard/projects/${project.id}`)
                          }
                          className="h-7 rounded-lg bg-white/4 border border-white/8 hover:bg-white/8 px-3 text-[10px] font-bold text-white cursor-pointer flex items-center"
                        >
                          View Progress{" "}
                          <ChevronRight size={10} className="ml-0.5" />
                        </Button>
                      </>
                    ) : project.status === "failed" ? (
                      <>
                        <span className="font-mono text-[9px] text-red-400 flex items-center gap-1">
                          <AlertTriangle size={11} />
                          Failed
                        </span>

                        <Button
                          size="sm"
                          disabled
                          className="h-7 rounded-lg bg-red-500/10 text-red-400 border border-red-500/10 px-3 text-[10px] font-bold"
                        >
                          System Error
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="font-mono text-[9px] text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={11} />
                          Analyzed
                        </span>

                        <Button
                          size="sm"
                          onClick={() =>
                            router.push(`/dashboard/projects/${project.id}`)
                          }
                          className="h-7 rounded-lg bg-white/4 border border-white/8 hover:bg-white/8 px-3 text-[10px] font-bold text-white cursor-pointer flex items-center gap-1"
                        >
                          <FileText size={10} />
                          View Transcript
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
