"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, 
  RefreshCw, 
  ArrowLeft, 
  FileText, 
  Video, 
  Sparkles, 
  ExternalLink,
  MessageSquare,
  Clock,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface CaptionWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

interface ProjectStatus {
  id: string;
  name: string;
  status: "pending" | "uploading" | "completed" | "failed" | "transcribing" | "ready";
  progress: number;
  videoUrl: string | null;
  transcript: string | null;
  captions: CaptionWord[] | null;
}

export default function ProjectAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          <p className="text-xs text-white/40 font-mono uppercase tracking-widest">Loading Pipeline...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#07050f] text-white flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-red-400 font-mono text-sm">❌ Error: {error || "Project not found"}</p>
          <Button onClick={() => router.push("/dashboard")} className="bg-white/10 hover:bg-white/20 text-xs">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Determine current active pipeline stage
  const getStageStatus = (stage: "upload" | "transcription" | "complete") => {
    const status = project.status;
    
    if (stage === "upload") {
      // Upload is always complete since we reached this page
      return "completed";
    }
    
    if (stage === "transcription") {
      if (status === "ready") return "completed";
      if (status === "transcribing") return "active";
      return "pending";
    }

    if (stage === "complete") {
      if (status === "ready") return "completed";
      return "pending";
    }
  };

  return (
    <div className="min-h-screen bg-[#07050f] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-[family-name:var(--font-space-grotesk)] font-bold bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
              {project.name}
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono border uppercase tracking-wider ${
              project.status === "ready" 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : project.status === "failed"
                ? "bg-red-500/10 text-red-400 border-red-500/20"
                : "bg-violet-500/10 text-violet-400 border-violet-500/20 animate-pulse"
            }`}>
              {project.status}
            </span>
          </div>
          <p className="text-xs text-white/40 font-mono">
            Source: {project.videoUrl ? "AWS S3 Cloud Storage" : "Local Workspace Cache"}
          </p>
        </div>

        {/* Pipeline Stage Card */}
        <Card className="border border-white/10 bg-white/[0.01] backdrop-blur-xl p-6 rounded-2xl">
          <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-white/60 mb-6 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500 animate-pulse" />
            ClipForge Processing Pipeline
          </h2>

          <div className="space-y-6">
            
            {/* Step 1: Upload & Cloud Ingestion */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="h-7 w-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs">
                  <Check size={14} className="stroke-[2.5]" />
                </div>
                <div className="w-0.5 h-12 bg-emerald-500/30" />
              </div>
              <div className="space-y-1 mt-0.5">
                <h3 className="text-xs font-bold text-white/90">Video Ingestion & S3 Upload</h3>
                <p className="text-[11px] text-white/45 font-mono">Video successfully uploaded and registered in database.</p>
              </div>
            </div>

            {/* Step 2: Audio Transcription (Deepgram) */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                {getStageStatus("transcription") === "completed" ? (
                  <div className="h-7 w-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs">
                    <Check size={14} className="stroke-[2.5]" />
                  </div>
                ) : getStageStatus("transcription") === "active" ? (
                  <div className="h-7 w-7 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30 flex items-center justify-center text-xs">
                    <RefreshCw size={12} className="animate-spin text-violet-400" />
                  </div>
                ) : (
                  <div className="h-7 w-7 rounded-full bg-white/5 text-white/35 border border-white/10 flex items-center justify-center text-xs font-mono">
                    2
                  </div>
                )}
                <div className={`w-0.5 h-12 ${getStageStatus("transcription") === "completed" ? "bg-emerald-500/30" : "bg-white/5"}`} />
              </div>
              <div className="space-y-1.5 mt-0.5 flex-1">
                <h3 className={`text-xs font-bold ${getStageStatus("transcription") !== "pending" ? "text-white/90" : "text-white/30"}`}>
                  Deepgram Transcription Engine
                </h3>
                <p className={`text-[11px] font-mono ${getStageStatus("transcription") !== "pending" ? "text-white/45" : "text-white/20"}`}>
                  {project.status === "transcribing" 
                    ? "Transcribing voice vectors and converting to text..." 
                    : project.status === "ready" 
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

            {/* Step 3: Clip Generation Readiness */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                {getStageStatus("complete") === "completed" ? (
                  <div className="h-7 w-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs">
                    <Check size={14} className="stroke-[2.5]" />
                  </div>
                ) : (
                  <div className="h-7 w-7 rounded-full bg-white/5 text-white/35 border border-white/10 flex items-center justify-center text-xs font-mono">
                    3
                  </div>
                )}
              </div>
              <div className="space-y-1 mt-0.5">
                <h3 className={`text-xs font-bold ${getStageStatus("complete") === "completed" ? "text-white/90" : "text-white/30"}`}>
                  Short Clips & Captions Ready
                </h3>
                <p className={`text-[11px] font-mono ${getStageStatus("complete") === "completed" ? "text-white/45" : "text-white/20"}`}>
                  Captions aligned and clip structures isolated successfully.
                </p>
              </div>
            </div>

          </div>
        </Card>

        {/* Results Showcase View */}
        <AnimatePresence mode="wait">
          {project.status === "ready" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-8 z-10"
            >
              {/* Left Side: Video Preview & Captions Grid */}
              <div className="md:col-span-6 space-y-6">
                <Card className="border border-white/10 bg-white/[0.01] backdrop-blur-xl p-5 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-white/60 flex items-center gap-2">
                    <Video className="h-4 w-4 text-violet-500" />
                    Uploaded Video Preview
                  </h3>
                  
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-white/5 bg-black">
                    {project.videoUrl ? (
                      <video 
                        src={project.videoUrl} 
                        className="w-full h-full object-contain" 
                        controls
                        playsInline
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/[0.02]">
                        <span className="text-[10px] text-white/30 font-mono">No video URL available</span>
                      </div>
                    )}
                  </div>

                  {project.videoUrl && (
                    <a 
                      href={project.videoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[10px] font-mono text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      Open source video in new tab <ExternalLink size={10} />
                    </a>
                  )}
                </Card>

                {/* Subtitle Captions JSON Structure */}
                <Card className="border border-white/10 bg-white/[0.01] backdrop-blur-xl p-5 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-white/60 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-violet-400" />
                    Captions & Timecodes (Words)
                  </h3>
                  
                  <div className="h-48 overflow-y-auto pr-1 border border-white/5 bg-black/25 rounded-xl p-3 font-mono text-[10px] text-white/50 leading-relaxed custom-scrollbar">
                    {project.captions && project.captions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {project.captions.map((w, idx) => (
                          <div 
                            key={idx}
                            className="px-2 py-1 bg-white/[0.02] border border-white/5 rounded-lg flex items-center gap-1.5"
                          >
                            <span className="text-white font-bold">{w.word}</span>
                            <span className="text-[9px] text-violet-400/80">{w.start.toFixed(2)}s</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-white/20 italic">No timecode word timestamps found.</span>
                    )}
                  </div>
                </Card>
              </div>

              {/* Right Side: Full Transcript View */}
              <div className="md:col-span-6 space-y-6">
                <Card className="border border-white/10 bg-white/[0.01] backdrop-blur-xl p-5 rounded-2xl space-y-4 flex flex-col h-full">
                  <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-white/60 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-violet-500" />
                    Deepgram Generated Transcript
                  </h3>
                  
                  <div className="flex-1 min-h-[300px] overflow-y-auto pr-2 text-xs text-white/70 leading-relaxed font-[family-name:var(--font-dm-sans)] p-4 border border-white/5 bg-black/25 rounded-xl custom-scrollbar whitespace-pre-wrap">
                    {project.transcript || "No transcript returned."}
                  </div>

                  <div className="pt-4 flex gap-3">
                    <Button 
                      onClick={() => {
                        toast.success("Transcript copied!");
                        navigator.clipboard.writeText(project.transcript || "");
                      }}
                      className="bg-white/5 hover:bg-white/10 text-white border border-white/5 text-[10px] h-9 px-4 rounded-xl flex-1 cursor-pointer font-mono"
                    >
                      Copy Transcript
                    </Button>
                    <Button 
                      onClick={() => router.push("/dashboard/clips")}
                      className="bg-gradient-to-r from-violet-600 to-indigo-500 text-white text-[10px] h-9 px-4 rounded-xl flex-1 cursor-pointer font-bold shadow-[0_0_15px_rgba(124,106,250,0.3)] hover:shadow-[0_0_20px_rgba(124,106,250,0.5)] transition-all"
                    >
                      Go to Clips Workspace <ChevronRight size={12} className="ml-1" />
                    </Button>
                  </div>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
