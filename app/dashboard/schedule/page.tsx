"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  CheckCircle2,
  Video,
  AlertTriangle,
  Play,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Interfaces matching backend tables and hook structure
interface ExportedClip {
  id: string;
  projectId: string;
  title: string;
  startTime: number;
  endTime: number;
  whyBest: string;
  seoRanking: number;
  captions: any;
  captionStyle: any;
  exportUrl: string;
  renderStatus: string;
  projectName: string;
  createdAt: string;
  updatedAt: string;
}

interface ScheduledPost {
  id: string;
  clipId: string | null;
  title: string;
  caption: string;
  platform: string;
  scheduledTime: string;
  status: "pending" | "posted" | "failed";
}

interface SocialAccount {
  _id: string;
  platform: string;
  name?: string;
  handle?: string;
  profileId: string;
  createdAt: string;
}

const getPlatformBadgeStyle = (platform: string) => {
  const p = platform.toLowerCase();
  if (p === "tiktok") return "bg-white/5 border-white/10 text-white";
  if (p === "youtube" || p === "youtube shorts")
    return "bg-red-500/10 border-red-500/20 text-red-400";
  if (p === "instagram" || p === "instagram reels")
    return "bg-pink-500/10 border-pink-500/20 text-pink-400";
  if (p === "twitter" || p === "x")
    return "bg-slate-400/10 border-slate-400/20 text-slate-300";
  if (p === "linkedin")
    return "bg-blue-600/10 border-blue-600/20 text-blue-400";
  if (p === "bluesky") return "bg-cyan-500/10 border-cyan-500/20 text-cyan-400";
  if (p === "facebook" || p === "facebook reels")
    return "bg-blue-500/10 border-blue-500/20 text-blue-400";
  return "bg-white/5 border-white/10 text-white";
};

const formatPlatformName = (platform: string) => {
  const p = platform.toLowerCase();
  if (p === "tiktok") return "TikTok";
  if (p === "youtube" || p === "youtube shorts") return "YouTube Shorts";
  if (p === "instagram" || p === "instagram reels") return "Instagram Reels";
  if (p === "twitter" || p === "x") return "Twitter / X";
  if (p === "linkedin") return "LinkedIn";
  if (p === "bluesky") return "Bluesky";
  if (p === "facebook" || p === "facebook reels") return "Facebook Reels";
  return platform.charAt(0).toUpperCase() + platform.slice(1);
};

export default function SchedulePage() {
  const router = useRouter();

  // Calendar states
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Database states
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [exportedClips, setExportedClips] = useState<ExportedClip[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<SocialAccount[]>(
    [],
  );
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingClips, setIsLoadingClips] = useState(true);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

  // Dialog & scheduling form states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedClipId, setSelectedClipId] = useState<string>("");
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [postTitle, setPostTitle] = useState("");
  const [postCaption, setPostCaption] = useState("");
  const [postTime, setPostTime] = useState("18:00");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch functions
  const fetchScheduledPosts = async () => {
    setIsLoadingPosts(true);
    try {
      const response = await fetch("/api/posts/schedule");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setScheduledPosts(data.posts || []);
        }
      }
    } catch (error) {
      console.error("Failed to fetch scheduled posts:", error);
      toast.error("Failed to fetch delivery queue");
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const fetchExportedClips = async () => {
    setIsLoadingClips(true);
    try {
      const response = await fetch("/api/projects/clips");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setExportedClips(data.clips || []);
        }
      }
    } catch (error) {
      console.error("Failed to fetch exported clips:", error);
    } finally {
      setIsLoadingClips(false);
    }
  };

  const fetchConnectedAccounts = async () => {
    setIsLoadingAccounts(true);
    try {
      const response = await fetch("/api/social/accounts");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const accounts = data.accounts || [];
          setConnectedAccounts(accounts);
          if (accounts.length > 0) {
            setSelectedAccount(accounts[0]._id);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch social accounts:", error);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  useEffect(() => {
    const handle = setTimeout(() => {
      fetchScheduledPosts();
      fetchExportedClips();
      fetchConnectedAccounts();
    }, 0);
    return () => clearTimeout(handle);
  }, []);

  // Calendar math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString("en-US", { month: "long" });

  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const days = [];

    // 1. Prev month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthTotalDays - i;
      const date = new Date(year, month - 1, d);
      days.push({
        dayNumber: d,
        date,
        isCurrentMonth: false,
      });
    }

    // 2. Current month days
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, month, d);
      days.push({
        dayNumber: d,
        date,
        isCurrentMonth: true,
      });
    }

    // 3. Next month leading days (fill up to a multiple of 7)
    const remainingSlots = 42 - days.length; // 6 rows of 7
    for (let d = 1; d <= remainingSlots; d++) {
      const date = new Date(year, month + 1, d);
      days.push({
        dayNumber: d,
        date,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month]);

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Map scheduled posts by day string for fast lookup
  const postsByDateString = useMemo(() => {
    const map: Record<string, ScheduledPost[]> = {};
    scheduledPosts.forEach((post) => {
      const dateKey = new Date(post.scheduledTime).toDateString();
      if (!map[dateKey]) {
        map[dateKey] = [];
      }
      map[dateKey].push(post);
    });
    return map;
  }, [scheduledPosts]);

  // Handle clicking + Add Post
  const handleAddPostClick = (date: Date) => {
    setSelectedDate(date);
    // Reset form states
    setSelectedClipId("");
    setSelectedAccount(
      connectedAccounts.length > 0 ? connectedAccounts[0]._id : "",
    );
    setPostTitle("");
    setPostCaption("");
    setPostTime("18:00");
    setIsDialogOpen(true);
  };

  // Handle clip selection to trigger AI Post Generation
  const handleClipChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clipId = e.target.value;
    setSelectedClipId(clipId);
    if (!clipId) return;

    const clip = exportedClips.find((c) => c.id === clipId);
    if (!clip) return;

    // Get selected account platform
    const account = connectedAccounts.find((a) => a._id === selectedAccount);
    const platform = account ? account.platform : "TikTok";

    setIsGeneratingAI(true);
    setPostTitle("");
    setPostCaption("");
    try {
      const response = await fetch("/api/ai/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clipTitle: clip.title,
          transcript: clip.whyBest || clip.title, // Fallback if no transcript
          platform,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPostTitle(data.title || clip.title);
          setPostCaption(data.caption || "");
          toast.success("AI Post copy generated!");
        } else {
          setPostTitle(clip.title);
        }
      } else {
        setPostTitle(clip.title);
      }
    } catch (error) {
      console.error("AI Generation failed:", error);
      setPostTitle(clip.title);
      toast.error("Failed to generate AI captions. Using clip title.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Handle account change in dialog (optional trigger to regenerate)
  const handleAccountChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const accId = e.target.value;
    setSelectedAccount(accId);

    // If a clip is already selected, let's regenerate for the new platform
    if (selectedClipId) {
      const clip = exportedClips.find((c) => c.id === selectedClipId);
      if (!clip) return;

      const account = connectedAccounts.find((a) => a._id === accId);
      const platform = account ? account.platform : "TikTok";

      setIsGeneratingAI(true);
      try {
        const response = await fetch("/api/ai/generate-post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clipTitle: clip.title,
            transcript: clip.whyBest || clip.title,
            platform,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setPostTitle(data.title || clip.title);
            setPostCaption(data.caption || "");
            toast.success(`AI caption regenerated for ${platform}!`);
          }
        }
      } catch (error) {
        console.error("AI regeneration failed:", error);
      } finally {
        setIsGeneratingAI(false);
      }
    }
  };

  // Submit Scheduled Post
  const handleSavePost = async () => {
    if (!selectedDate) return;
    if (!postTitle || !postCaption) {
      toast.error("Please provide a title and caption for the post");
      return;
    }

    const [hours, minutes] = postTime.split(":").map(Number);
    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(hours || 18, minutes || 0, 0, 0);

    const account = connectedAccounts.find((a) => a._id === selectedAccount);
    const platform = account ? account.platform : "TikTok";

    setIsSaving(true);
    try {
      const response = await fetch("/api/posts/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clipId: selectedClipId || null,
          title: postTitle,
          caption: postCaption,
          platform,
          scheduledTime: scheduledDateTime.toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success("Post scheduled successfully!");
          setIsDialogOpen(false);
          fetchScheduledPosts();
        } else {
          throw new Error(data.error || "Failed to schedule post");
        }
      } else {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to schedule post");
      }
    } catch (error: any) {
      console.error("Failed to save scheduled post:", error);
      toast.error(error.message || "Failed to save scheduled post");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete/Cancel post
  const handleDeletePost = async (id: string) => {
    try {
      const response = await fetch(`/api/posts/schedule/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Post cancelled");
        fetchScheduledPosts();
      } else {
        toast.error("Failed to cancel post");
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast.error("Failed to cancel post");
    }
  };

  // Next scheduled posts queue
  const upcomingPosts = useMemo(() => {
    return scheduledPosts
      .filter((post) => new Date(post.scheduledTime) >= new Date())
      .sort(
        (a, b) =>
          new Date(a.scheduledTime).getTime() -
          new Date(b.scheduledTime).getTime(),
      );
  }, [scheduledPosts]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 max-w-[1200px] mx-auto pb-10"
    >
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white tracking-tight">
            Post Delivery Pipeline
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Auto-schedule and coordinate direct publications to social channels.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Interactive Calendar (takes 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-white/2.5 border border-white/5 rounded-[20px] p-6 backdrop-blur-xl">
            {/* Calendar Header Navigation */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <CalendarIcon size={18} className="text-forge-accent" />
                <h2 className="font-heading text-base font-bold text-white">
                  {monthName} {year}
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  onClick={handlePrevMonth}
                  variant="outline"
                  size="icon-sm"
                  className="h-8 w-8 rounded-lg cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button
                  onClick={() => setCurrentDate(new Date())}
                  variant="outline"
                  className="h-8 rounded-lg px-3 text-xs font-semibold cursor-pointer"
                >
                  Today
                </Button>
                <Button
                  onClick={handleNextMonth}
                  variant="outline"
                  size="icon-sm"
                  className="h-8 w-8 rounded-lg cursor-pointer"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>

            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                (dayName) => (
                  <span
                    key={dayName}
                    className="font-mono text-[10px] font-bold text-white/35 uppercase tracking-wider py-1"
                  >
                    {dayName}
                  </span>
                ),
              )}
            </div>

            {/* Calendar Days Grid */}
            {isLoadingPosts ? (
              <div className="flex flex-col items-center justify-center py-32 text-white/30 space-y-3">
                <Loader2 className="animate-spin text-forge-accent" size={24} />
                <span className="text-xs font-semibold">
                  Loading calendar queue...
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map(
                  ({ dayNumber, date, isCurrentMonth }, idx) => {
                    const dateKey = date.toDateString();
                    const dayPosts = postsByDateString[dateKey] || [];
                    const isToday = new Date().toDateString() === dateKey;

                    return (
                      <div
                        key={idx}
                        className={`min-h-[110px] rounded-[14px] border p-2 flex flex-col justify-between group relative transition-all duration-300 ${
                          isCurrentMonth
                            ? "bg-white/1.5 border-white/5 hover:border-white/12 hover:bg-white/3.5"
                            : "bg-white/0.5 border-white/2 opacity-35"
                        } ${isToday ? "ring-1 ring-forge-accent/50 border-forge-accent/40 bg-forge-accent/5 hover:bg-forge-accent/8" : ""}`}
                      >
                        {/* Cell Header */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-mono text-xs font-bold ${
                              isToday
                                ? "text-forge-accent"
                                : isCurrentMonth
                                  ? "text-white/60"
                                  : "text-white/20"
                            }`}
                          >
                            {dayNumber}
                          </span>
                          {isToday && (
                            <span className="h-1.5 w-1.5 rounded-full bg-forge-accent shadow-[0_0_8px_#7c6afa]" />
                          )}
                        </div>

                        {/* Display Scheduled Posts inside Cell */}
                        <div className="flex-1 space-y-1 mt-1.5 mb-6 max-h-[56px] overflow-y-auto scrollbar-none">
                          {dayPosts.map((post) => {
                            const platformBadgeStyle = getPlatformBadgeStyle(
                              post.platform,
                            );

                            return (
                              <div
                                key={post.id}
                                title={`${formatPlatformName(post.platform)}: ${post.title}`}
                                className={`text-[9px] px-1.5 py-0.5 rounded-md border truncate font-medium flex items-center gap-1 ${platformBadgeStyle}`}
                              >
                                <span className="w-1 h-1 rounded-full bg-current" />
                                <span className="truncate">{post.title}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Hover Action Button */}
                        <Button
                          onClick={() => handleAddPostClick(date)}
                          variant="default"
                          className="opacity-0 group-hover:opacity-100 transition-all duration-200 absolute bottom-1.5 right-1.5 h-6 rounded-lg px-2 text-[9px] font-bold flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus size={10} />
                          <span>Add</span>
                        </Button>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Queue list & Connected accounts */}
        <div className="space-y-6">
          {/* Upcoming timeline */}
          <Card className="bg-white/2.5 border border-white/5 rounded-[20px] p-6 backdrop-blur-xl">
            <h3 className="font-heading text-sm font-bold text-white mb-4">
              Upcoming Publications
            </h3>

            {upcomingPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-white/20 border border-dashed border-white/5 rounded-xl bg-white/0.5">
                <Clock size={20} className="text-white/10 mb-2" />
                <span className="text-xs font-semibold text-white/40">
                  Queue is empty
                </span>
                <span className="text-[10px] mt-1 max-w-[180px] leading-relaxed">
                  Hover over a calendar day to schedule a clip publication.
                </span>
              </div>
            ) : (
              <div className="space-y-4 relative border-l border-white/10 pl-4 ml-2 max-h-[380px] overflow-y-auto scrollbar-thin">
                {upcomingPosts.map((post) => {
                  const platformBadgeStyle = getPlatformBadgeStyle(
                    post.platform,
                  );

                  const formattedTime = new Date(
                    post.scheduledTime,
                  ).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div key={post.id} className="relative space-y-1">
                      {/* Timeline Bullet */}
                      <span className="absolute left-[-21px] top-1 h-2.5 w-2.5 rounded-full bg-[#7c6afa] ring-4 ring-[#0a0814]" />

                      <div className="p-3.5 rounded-xl bg-white/1.5 border border-white/5 hover:border-white/10 hover:bg-white/2.5 transition-all duration-300 flex items-start justify-between gap-2 group">
                        <div className="min-w-0 space-y-1.5 flex-1">
                          <div className="flex items-center gap-1.5">
                            <Badge
                              className={`font-mono text-[8px] uppercase tracking-wide px-1.5 ${platformBadgeStyle}`}
                            >
                              {formatPlatformName(post.platform)}
                            </Badge>
                            <span className="font-mono text-[9px] text-white/40 flex items-center gap-0.5">
                              <Clock size={8} />
                              {formattedTime}
                            </span>
                          </div>
                          <h4 className="font-bold text-xs text-white truncate">
                            {post.title}
                          </h4>
                        </div>

                        <Button
                          onClick={() => handleDeletePost(post.id)}
                          variant="ghost"
                          size="icon-sm"
                          className="h-6 w-6 rounded-md hover:text-red-400 cursor-pointer transition-colors"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Connected accounts list */}
          <Card className="bg-white/2.5 border border-white/5 rounded-[20px] p-6 backdrop-blur-xl">
            <h3 className="font-heading text-sm font-bold text-white mb-4">
              Connected Channels
            </h3>
            <div className="space-y-3">
              {isLoadingAccounts ? (
                <div className="flex items-center justify-center py-4 text-white/30 gap-2">
                  <Loader2 className="animate-spin text-[#7c6afa]" size={16} />
                  <span className="text-xs">Loading channels...</span>
                </div>
              ) : connectedAccounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center text-white/20 border border-dashed border-white/5 rounded-xl bg-white/0.5">
                  <Share2 size={20} className="text-white/10 mb-2" />
                  <span className="text-xs font-semibold text-white/40">
                    No channels connected
                  </span>
                  <Button
                    onClick={() => router.push("/dashboard/social-connections")}
                    variant="default"
                    className="mt-3 text-[10px] h-7 cursor-pointer font-bold"
                  >
                    Connect a Channel
                  </Button>
                </div>
              ) : (
                connectedAccounts.map((acc, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-white/1.5 border border-white/5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <span className="block font-semibold text-xs text-white uppercase">
                        {acc.platform}
                      </span>
                      <span className="block font-mono text-[10px] text-white/35 truncate">
                        {acc.handle || acc.name || "Connected"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                      <span className="font-mono text-[9px] font-bold text-emerald-400/80">
                        Active
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Scheduling Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl border border-white/10 bg-[#0a0814]/95 backdrop-blur-2xl p-7 text-white shadow-2xl shadow-black/80">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold text-white flex items-center gap-2">
              <CalendarIcon size={16} className="text-forge-accent" />
              Schedule Social Post
            </DialogTitle>
            <DialogDescription className="text-white/40 text-xs mt-1">
              Select an exported video clip, connect to a channel, and schedule
              your publication.
            </DialogDescription>
          </DialogHeader>

          {selectedDate && (
            <div className="flex items-center gap-2 py-2 px-3 bg-white/3 border border-white/5 rounded-xl text-xs font-medium text-white/70">
              <CalendarIcon size={13} className="text-forge-accent" />
              <span>
                Target date:{" "}
                <span className="text-white font-semibold">
                  {selectedDate.toDateString()}
                </span>
              </span>
            </div>
          )}

          <div className="space-y-4 my-4">
            {/* Choose Video Clip */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 font-mono">
                Select Video Clip (Exported URLs Only)
              </label>
              {isLoadingClips ? (
                <div className="flex items-center gap-2 text-white/40 py-2.5 px-3 border border-white/5 bg-white/1.5 rounded-xl text-xs">
                  <Loader2
                    className="animate-spin text-forge-accent"
                    size={13}
                  />
                  <span>Loading exported clips...</span>
                </div>
              ) : exportedClips.length === 0 ? (
                <div className="p-3 border border-dashed border-white/5 bg-white/1.5 rounded-xl text-xs text-white/40 flex items-start gap-2.5">
                  <AlertTriangle
                    className="text-amber-500 shrink-0 mt-0.5"
                    size={14}
                  />
                  <div>
                    <span className="block font-semibold text-white/70">
                      No exported clips found
                    </span>
                    <span className="block text-[10px] mt-0.5 leading-relaxed">
                      You must export or render clips first under &quot;AI Clips&quot; to
                      make them available here.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full">
                  <NativeSelect
                    value={selectedClipId}
                    onChange={handleClipChange}
                    className="w-full! [&_select]:w-full! [&_select]:bg-[#0d0d18] [&_select]:border-white/10 [&_select]:rounded-xl [&_select]:h-10 text-white"
                  >
                    <NativeSelectOption value="">
                      Choose a generated clip...
                    </NativeSelectOption>
                    {exportedClips.map((clip) => (
                      <NativeSelectOption key={clip.id} value={clip.id}>
                        {clip.title} ({clip.projectName})
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
              )}
            </div>

            {/* Choose Social Account */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 font-mono">
                Select Social Account
              </label>
              <div className="w-full">
                {isLoadingAccounts ? (
                  <div className="flex items-center gap-2 text-white/40 py-2.5 px-3 border border-white/5 bg-white/1.5 rounded-xl text-xs">
                    <Loader2
                      className="animate-spin text-[#7c6afa]"
                      size={13}
                    />
                    <span>Loading channels...</span>
                  </div>
                ) : connectedAccounts.length === 0 ? (
                  <div className="p-3 border border-dashed border-white/5 bg-white/1.5 rounded-xl text-xs text-white/40 flex items-start gap-2.5">
                    <AlertTriangle
                      className="text-amber-500 shrink-0 mt-0.5"
                      size={14}
                    />
                    <div className="flex-1">
                      <span className="block font-semibold text-white/70">
                        No connected channels
                      </span>
                      <span className="block text-[10px] mt-0.5 leading-relaxed">
                        You need to link a channel first under &quot;Social
                        Connections&quot; to publish.
                      </span>
                      <Button
                        onClick={() => {
                          setIsDialogOpen(false);
                          router.push("/dashboard/social-connections");
                        }}
                        variant="default"
                        className="mt-2 text-[9px] h-6 cursor-pointer font-bold"
                      >
                        Go to Social Connections
                      </Button>
                    </div>
                  </div>
                ) : (
                  <NativeSelect
                    value={selectedAccount}
                    onChange={handleAccountChange}
                    className="w-full! [&_select]:w-full! [&_select]:bg-[#0d0d18] [&_select]:border-white/10 [&_select]:rounded-xl [&_select]:h-10 text-white"
                  >
                    {connectedAccounts.map((acc) => (
                      <NativeSelectOption key={acc._id} value={acc._id}>
                        {formatPlatformName(acc.platform)} (
                        {acc.handle || acc.name || "Connected"})
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                )}
              </div>
            </div>

            {/* AI Generator loading or content display */}
            {isGeneratingAI ? (
              <div className="flex flex-col items-center justify-center py-8 bg-[#7c6afa]/5 border border-dashed border-[#7c6afa]/30 rounded-xl space-y-2 text-center p-4">
                <Loader2 className="animate-spin text-forge-accent" size={20} />
                <span className="text-xs font-bold text-forge-accent flex items-center gap-1">
                  <Sparkles size={12} className="animate-pulse" />
                  AI Writing Hook & Hashtags...
                </span>
                <span className="text-[10px] text-white/30 max-w-xs">
                  We are analyzing this clip&apos;s transcript using Gemini to
                  construct optimal visual hooks and hashtags for your platform.
                </span>
              </div>
            ) : (
              selectedClipId && (
                <div className="space-y-4 animate-scale-in">
                  {/* Title */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 font-mono">
                      Post Title / Headline
                    </label>
                    <Input
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                      placeholder="Enter an attention-grabbing headline"
                      className="bg-[#0d0d18] border-white/10 rounded-xl h-10 text-white"
                    />
                  </div>

                  {/* Caption Description */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 font-mono">
                      AI Generated Caption & Hashtags
                    </label>
                    <Textarea
                      value={postCaption}
                      onChange={(e) => setPostCaption(e.target.value)}
                      placeholder="What should the post body say?"
                      className="bg-[#0d0d18] border-white/10 rounded-xl min-h-24 text-white text-xs leading-relaxed"
                    />
                  </div>
                </div>
              )
            )}

            {/* Date Time selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 font-mono">
                  Post Date
                </label>
                <Input
                  type="text"
                  disabled
                  value={selectedDate ? selectedDate.toLocaleDateString() : ""}
                  className="bg-[#0d0d18]/50 border-white/10 rounded-xl h-10 text-white/50 cursor-not-allowed"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 font-mono">
                  Time of Delivery
                </label>
                <div className="relative">
                  <Input
                    type="time"
                    value={postTime}
                    onChange={(e) => setPostTime(e.target.value)}
                    className="bg-[#0d0d18] border-white/10 rounded-xl h-10 text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 flex justify-end gap-2 border-t border-white/5 pt-4">
            <Button
              onClick={() => setIsDialogOpen(false)}
              variant="outline"
              className="h-9 rounded-lg px-4 text-xs font-bold cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              disabled={isSaving || isGeneratingAI}
              onClick={handleSavePost}
              variant="default"
              className="h-9 rounded-lg px-5 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin" size={13} />
                  <span>Scheduling...</span>
                </>
              ) : (
                <>
                  <CalendarIcon size={13} />
                  <span>Schedule Post</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
