"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

export interface Clip {
  id: string;
  title: string;
  sourceVideo: string;
  duration: string;
  viralityScore: number;
  views: string;
  likes: string;
  platform: "TikTok" | "Instagram Reels" | "YouTube Shorts" | "Multi-Platform";
  thumbnail: string;
  status: "Ready" | "Processing" | "Scheduled";
  transcript: string;
  description: string;
  tags: string[];
  metrics: {
    hookStrength: number;
    retentionPotential: number;
    pacingScore: number;
    visualEngagement: number;
  };
}

export interface ScheduledPost {
  id: string;
  clipId: string;
  title: string;
  caption: string;
  platform: "TikTok" | "Instagram Reels" | "YouTube Shorts";
  time: string;
  status: "Pending" | "Posted" | "Failed";
}

export interface SocialAccount {
  _id?: string;
  id: string;
  platform: string;
  name?: string | null;
  handle?: string | null;
  avatarUrl?: string | null;
}

export interface RawVideo {
  id: string;
  title: string;
  date: string;
  size: string;
  duration: string;
  clips: number;
  status: "Analyzed" | "Analyzing";
  img: string;
}

interface DashboardContextType {
  clips: Clip[];
  setClips: React.Dispatch<React.SetStateAction<Clip[]>>;
  scheduledPosts: ScheduledPost[];
  setScheduledPosts: React.Dispatch<React.SetStateAction<ScheduledPost[]>>;
  rawVideos: RawVideo[];
  setRawVideos: React.Dispatch<React.SetStateAction<RawVideo[]>>;
  socialAccounts: SocialAccount[];
  setSocialAccounts: React.Dispatch<React.SetStateAction<SocialAccount[]>>;
  isLoadingAccounts: boolean;

  // Dialog & Interactive Upload states
  isUploadOpen: boolean;
  setIsUploadOpen: (open: boolean) => void;
  dragActive: boolean;
  setDragActive: (active: boolean) => void;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  isForging: boolean;
  setIsForging: (forging: boolean) => void;
  forgeProgress: number;
  setForgeProgress: (progress: number) => void;
  forgePhase: string;
  setForgePhase: (phase: string) => void;
  forgeLogs: string[];
  setForgeLogs: React.Dispatch<React.SetStateAction<string[]>>;

  // Inspect Clip Detail Dialog State
  selectedClip: Clip | null;
  setSelectedClip: (clip: Clip | null) => void;
  isDetailOpen: boolean;
  setIsDetailOpen: (open: boolean) => void;

  // New Schedule Dialog State
  isScheduleOpen: boolean;
  setIsScheduleOpen: (open: boolean) => void;
  clipToSchedule: Clip | null;
  setClipToSchedule: (clip: Clip | null) => void;
  schedulePlatform: string;
  setSchedulePlatform: (platform: string) => void;
  scheduleTime: string;
  setScheduleTime: (time: string) => void;
  scheduleCaption: string;
  setScheduleCaption: (caption: string) => void;

  // Handlers
  handleDrag: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  startAIForger: () => void;
  handleScheduleSubmit: () => void;
  triggerScheduleDialog: (clip: Clip) => void;
  triggerInspectDialog: (clip: Clip) => void;
  handleDownload: (clipTitle: string) => void;
}

function mapPlatformName(p: string): string {
  const lower = p.toLowerCase();
  if (lower === "tiktok") return "TikTok";
  if (lower === "youtube") return "YouTube Shorts";
  if (lower === "instagram") return "Instagram Reels";
  if (lower === "twitter" || lower === "x") return "Twitter / X";
  if (lower === "linkedin") return "LinkedIn";
  if (lower === "bluesky") return "Bluesky";
  if (lower === "facebook") return "Facebook Reels";
  return p;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined,
);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();

  // Real database-backed user states
  const [clips, setClips] = useState<Clip[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [rawVideos, setRawVideos] = useState<RawVideo[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.projects) {
            const mappedVideos: RawVideo[] = data.projects.map((proj: any) => ({
              id: proj.id,
              title: proj.name,
              date: new Date(proj.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              size: "120 MB",
              duration: "0:45",
              clips: proj.status === "ready" ? 1 : 0,
              status: proj.status === "ready" ? "Analyzed" : "Analyzing",
              img: "https://images.unsplash.com/photo-1542744094-2ab25be78b90?auto=format&fit=crop&w=400&q=80",
            }));
            setRawVideos(mappedVideos);
          }
        }
      } catch (error) {
        console.error("Error fetching projects in useDashboard:", error);
      }
    };

    const fetchScheduledPosts = async () => {
      try {
        const response = await fetch("/api/posts/schedule");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.posts) {
            const mappedPosts = data.posts.map((p: any) => ({
              id: p.id,
              clipId: p.clipId,
              title: p.title,
              caption: p.caption,
              platform: p.platform,
              time: new Date(p.scheduledTime).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
              status:
                p.status === "pending"
                  ? "Pending"
                  : p.status === "posted"
                    ? "Posted"
                    : "Failed",
            }));
            setScheduledPosts(mappedPosts);
          }
        }
      } catch (error) {
        console.error("Error fetching scheduled posts in useDashboard:", error);
      }
    };

    const fetchClips = async () => {
      try {
        const response = await fetch("/api/projects/clips");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.clips) {
            const mappedClips: Clip[] = data.clips.map((clip: any) => ({
              id: clip.id,
              title: clip.title,
              sourceVideo: clip.projectName,
              duration: `${Math.round(clip.endTime - clip.startTime)}s`,
              viralityScore: clip.seoRanking,
              views: "Ready",
              likes: "Ready",
              platform: "Multi-Platform",
              thumbnail: "https://images.unsplash.com/photo-1542744094-2ab25be78b90?auto=format&fit=crop&w=400&q=80",
              status: "Ready",
              transcript: clip.whyBest,
              description: `${clip.title} - ${clip.whyBest}`,
              tags: ["#viral", "#ai", "#short"],
              metrics: {
                hookStrength: clip.seoRanking,
                retentionPotential: Math.min(100, clip.seoRanking + 2),
                pacingScore: Math.min(100, clip.seoRanking - 3),
                visualEngagement: Math.min(100, clip.seoRanking + 1),
              },
            }));
            setClips(mappedClips);
          }
        }
      } catch (error) {
        console.error("Error fetching clips in useDashboard:", error);
      }
    };

    const fetchSocialAccounts = async () => {
      setIsLoadingAccounts(true);
      try {
        const response = await fetch("/api/social/accounts");
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setSocialAccounts(data.accounts || []);
          }
        }
      } catch (error) {
        console.error("Error fetching social accounts in useDashboard:", error);
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    if (user) {
      fetchProjects();
      fetchScheduledPosts();
      fetchClips();
      fetchSocialAccounts();
    }
  }, [user]);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isForging, setIsForging] = useState(false);
  const [forgeProgress, setForgeProgress] = useState(0);
  const [forgePhase, setForgePhase] = useState("");
  const [forgeLogs, setForgeLogs] = useState<string[]>([]);

  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [clipToSchedule, setClipToSchedule] = useState<Clip | null>(null);
  const [schedulePlatform, setSchedulePlatform] = useState<string>("TikTok");

  const [scheduleTime, setScheduleTime] = useState("Today, 8:00 PM");
  const [scheduleCaption, setScheduleCaption] = useState("");

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
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const startAIForger = () => {
    if (!selectedFile) return;
    setIsForging(true);
    setForgeProgress(0);
    setForgeLogs([]);

    const phases = [
      {
        pct: 0,
        text: "Initializing forge engine & transcribing long-form speech spectrum...",
        log: "🎙️ [01/05] Speech-to-Text audio decoding: extracting semantic keywords.",
      },
      {
        pct: 25,
        text: "Analyzing emotional waveforms & face tracking indices...",
        log: "🎥 [02/05] Vision tracking active: tagging camera zooms, speaker transitions, and facial dynamics.",
      },
      {
        pct: 50,
        text: "Isolating high-retention clips using virality match engine...",
        log: "⚡ [03/05] Hook extraction complete: found 1 moment with high virality markers (95% match).",
      },
      {
        pct: 75,
        text: "Reframing to 9:16 vertical viewport & rendering dynamic subtitles...",
        log: "🎨 [04/05] Applying premium glassmorphic subtitle overlays and visual enhancers.",
      },
      {
        pct: 95,
        text: "Indexing virality scores & compiling metadata tags...",
        log: "🤖 [05/05] Meta indexing: title generation, tags suggestion, and description auto-formatting complete.",
      },
    ];

    let currentPhaseIndex = 0;

    const interval = setInterval(() => {
      setForgeProgress((prev) => {
        const next = prev + 1;

        const phase = phases[currentPhaseIndex];
        if (phase && next >= phase.pct) {
          setForgePhase(phase.text);
          setForgeLogs((logs) => [...logs, phase.log]);
          currentPhaseIndex++;
        }

        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            const newClip: Clip = {
              id: `clip-${Date.now()}`,
              title: "How to Bootstrap a $10M Startup Solo",
              sourceVideo: selectedFile.name,
              duration: "0:45",
              viralityScore: 95,
              views: "0",
              likes: "0",
              platform: "Multi-Platform",
              thumbnail:
                "https://images.unsplash.com/photo-1542744094-2ab25be78b90?auto=format&fit=crop&w=400&q=80",
              status: "Ready",
              transcript:
                "Bootstrapping is not a constraint; it is a massive competitive advantage. It forces you to focus strictly on revenue, customer feedback, and real product value instead of catering to pitch deck slides. Every dollar you spend is real, which makes every decision sharp.",
              description:
                "Why bootstrapping makes your startup indestructible. 💸🔥 #bootstrapping #startups #founders",
              tags: ["#bootstrapping", "#startups", "#founders", "#business"],
              metrics: {
                hookStrength: 97,
                retentionPotential: 94,
                pacingScore: 96,
                visualEngagement: 92,
              },
            };

            const newRawVideo: RawVideo = {
              id: `raw-${Date.now()}`,
              title: selectedFile.name || "Imported Video Source",
              date: new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              size: selectedFile.size
                ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
                : "120 MB",
              duration: "0:45",
              clips: 1,
              status: "Analyzed",
              img: "https://images.unsplash.com/photo-1542744094-2ab25be78b90?auto=format&fit=crop&w=400&q=80",
            };

            setClips((prevClips) => [newClip, ...prevClips]);
            setRawVideos((prev) => [newRawVideo, ...prev]);
            setIsForging(false);
            setIsUploadOpen(false);
            setSelectedFile(null);
            toast("AI Clips Forged!", {
              description:
                "Successfully extracted 1 viral short. Ready in AI Clips.",
            });
          }, 800);
          return 100;
        }
        return next;
      });
    }, 80);
  };

  const handleScheduleSubmit = async () => {
    if (!clipToSchedule) return;

    try {
      // Since scheduleTime in standard clip dialog is a text like "Today, 8:00 PM"
      // We will parse it to a real date, or default to 2 hours from now if invalid
      const scheduledTimeRaw = new Date();
      scheduledTimeRaw.setHours(scheduledTimeRaw.getHours() + 2);

      const response = await fetch("/api/posts/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clipId: clipToSchedule.id,
          title: clipToSchedule.title,
          caption: scheduleCaption || clipToSchedule.description,
          platform: schedulePlatform,
          scheduledTime: scheduledTimeRaw.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save scheduled post");
      }

      const resData = await response.json();
      if (resData.success) {
        const p = resData.post;
        const newPost: ScheduledPost = {
          id: p.id,
          clipId: p.clipId,
          title: p.title,
          caption: p.caption,
          platform: p.platform as ScheduledPost["platform"],
          time: new Date(p.scheduledTime).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: "Pending",
        };

        setScheduledPosts((prev) => [newPost, ...prev]);
        setClips((prev) =>
          prev.map((c) =>
            c.id === clipToSchedule.id ? { ...c, status: "Scheduled" } : c,
          ),
        );
        setIsScheduleOpen(false);
        toast("Post Scheduled!", {
          description: `Your short will go live on ${schedulePlatform} at ${newPost.time}.`,
        });
      }
    } catch (err) {
      const error = err as Error;
      console.error("Failed to submit schedule:", error);
      toast("Error scheduling post", {
        description: error.message || "Something went wrong.",
      });
    }
  };

  const triggerScheduleDialog = (clip: Clip) => {
    setClipToSchedule(clip);
    setScheduleCaption(clip.description);
    if (socialAccounts.length > 0) {
      setSchedulePlatform(mapPlatformName(socialAccounts[0].platform));
    }
    setIsScheduleOpen(true);
  };

  const triggerInspectDialog = (clip: Clip) => {
    setSelectedClip(clip);
    setIsDetailOpen(true);
  };

  const handleDownload = (clipTitle: string) => {
    toast("Downloading MP4 video...", {
      description: `${clipTitle} (Rendered 9:16 HD with subtitles) is saving to your device.`,
    });
  };

  return (
    <DashboardContext.Provider
      value={{
        clips,
        setClips,
        scheduledPosts,
        setScheduledPosts,
        rawVideos,
        setRawVideos,
        socialAccounts,
        setSocialAccounts,
        isLoadingAccounts,
        isUploadOpen,
        setIsUploadOpen,
        dragActive,
        setDragActive,
        selectedFile,
        setSelectedFile,
        isForging,
        setIsForging,
        forgeProgress,
        setForgeProgress,
        forgePhase,
        setForgePhase,
        forgeLogs,
        setForgeLogs,
        selectedClip,
        setSelectedClip,
        isDetailOpen,
        setIsDetailOpen,
        isScheduleOpen,
        setIsScheduleOpen,
        clipToSchedule,
        setClipToSchedule,
        schedulePlatform,
        setSchedulePlatform,
        scheduleTime,
        setScheduleTime,
        scheduleCaption,
        setScheduleCaption,
        handleDrag,
        handleDrop,
        handleFileSelect,
        startAIForger,
        handleScheduleSubmit,
        triggerScheduleDialog,
        triggerInspectDialog,
        handleDownload,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
