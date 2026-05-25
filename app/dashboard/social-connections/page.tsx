"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Share2,
  CheckCircle2,
  Loader2,
  Trash2,
  AlertCircle,
  Plus,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface SocialAccount {
  _id: string;
  platform: string;
  name?: string;
  handle?: string;
  profileId: string;
  createdAt: string;
}

interface PlatformConfig {
  id: string; // Internal id (used in connect API, e.g. 'twitter')
  name: string; // Nice name
  iconText: string;
  brandColor: string;
  description: string;
}

const SUPPORTED_PLATFORMS: PlatformConfig[] = [
  {
    id: "tiktok",
    name: "TikTok",
    iconText: "T",
    brandColor: "#FE2C55",
    description: "Publish engaging 9:16 short vertical videos directly to your feed.",
  },
  {
    id: "youtube",
    name: "YouTube Shorts",
    iconText: "Y",
    brandColor: "#FF0000",
    description: "Broadcast shorts directly to your channel library and audience.",
  },
  {
    id: "instagram",
    name: "Instagram Reels",
    iconText: "I",
    brandColor: "#E1306C",
    description: "Post aesthetic vertical clips directly to your reels grid.",
  },
  {
    id: "twitter",
    name: "Twitter / X",
    iconText: "X",
    brandColor: "#FFFFFF",
    description: "Share thoughts, high-impact loops, and viral vertical video threads.",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    iconText: "L",
    brandColor: "#0A66C2",
    description: "Build your professional brand with thought leadership video loops.",
  },
  {
    id: "bluesky",
    name: "Bluesky",
    iconText: "B",
    brandColor: "#0085FF",
    description: "Publish post updates and vertical video segments directly to the AT Protocol feed.",
  },
  {
    id: "facebook",
    name: "Facebook Reels",
    iconText: "F",
    brandColor: "#1877F2",
    description: "Syndicate video loops and short reels to your page timelines.",
  },
];

const PlatformIcon = ({ id, color }: { id: string; color: string }) => {
  const size = 18;
  const p = id.toLowerCase();
  
  if (p === "tiktok") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.62 4.2 1.22 1.25 2.87 1.99 4.6 2.12v3.74c-1.63-.03-3.21-.52-4.57-1.42a8.03 8.03 0 0 1-1.65-1.5v7.26c-.03 2.15-.84 4.23-2.3 5.76a7.7 7.7 0 0 1-5.59 2.33 7.82 7.82 0 0 1-6.1-3.13 8.04 8.04 0 0 1-1.57-5.91 7.8 7.8 0 0 1 3.94-6 7.74 7.74 0 0 1 6.54-.42v3.83a4 4 0 0 0-2.61.94 3.96 3.96 0 0 0-1.45 2.91 3.96 3.96 0 0 0 2.21 3.66c1.28.66 2.86.53 4.02-.32a3.94 3.94 0 0 0 1.25-2.92V0h-.02z" />
      </svg>
    );
  }
  if (p === "youtube") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  }
  if (p === "instagram") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    );
  }
  if (p === "twitter" || p === "x") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  if (p === "linkedin") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    );
  }
  if (p === "bluesky") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 10.8c-1.3-2.7-3.6-5.8-7-6.8C2 3.1 0 4.9 0 7.8c0 3.3 2.1 9.4 6 12 4.4 2.9 5.6.8 6-.2.4 1 1.6 3.1 6 .2 3.9-2.6 6-8.7 6-12 0-2.9-2-4.7-5-3.8-3.4 1-5.7 4.1-7 6.8z" />
      </svg>
    );
  }
  if (p === "facebook") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  }
  return <span style={{ color }}>{id.charAt(0).toUpperCase()}</span>;
};

export default function SocialConnectionsPage() {
  const [connections, setConnections] = useState<SocialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [disconnectingAccount, setDisconnectingAccount] = useState<string | null>(null);

  const fetchConnections = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/social/accounts");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setConnections(data.accounts || []);
        } else {
          toast.error(data.error || "Failed to load social connections");
        }
      } else {
        toast.error("Server error when loading connections");
      }
    } catch (error) {
      console.error("Fetch connections failed:", error);
      toast.error("Network error when loading connections");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleConnect = async (platformId: string) => {
    setConnectingPlatform(platformId);
    toast.loading(`Initiating ${platformId} connection flow...`, { id: "connect-flow" });
    try {
      const response = await fetch(`/api/social/connect?platform=${platformId}`);
      const data = await response.json();

      if (response.ok && data.success && data.authUrl) {
        toast.success("Connection URL ready. Redirecting...", { id: "connect-flow" });
        // Redirect browser to Zernio's platform auth url
        window.location.href = data.authUrl;
      } else {
        toast.error(data.error || `Could not initiate connection for ${platformId}`, {
          id: "connect-flow",
        });
      }
    } catch (error) {
      console.error("Connection failed:", error);
      toast.error("Network failure initiating connection", { id: "connect-flow" });
    } finally {
      setConnectingPlatform(null);
    }
  };

  const handleDisconnect = async (accountId: string, platformName: string) => {
    setDisconnectingAccount(accountId);
    toast.loading(`Disconnecting ${platformName}...`, { id: "disconnect-flow" });
    try {
      const response = await fetch(`/api/social/accounts/${accountId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`Disconnected ${platformName} account successfully!`, {
          id: "disconnect-flow",
        });
        fetchConnections();
      } else {
        toast.error(data.error || `Failed to disconnect ${platformName}`, {
          id: "disconnect-flow",
        });
      }
    } catch (error) {
      console.error("Disconnect error:", error);
      toast.error("Network error disconnecting channel", { id: "disconnect-flow" });
    } finally {
      setDisconnectingAccount(null);
    }
  };

  // Group connections by platform for quick lookups
  const activeConnectionsByPlatform = useMemo(() => {
    const map: Record<string, SocialAccount[]> = {};
    connections.forEach((conn) => {
      // Normalize platform name to match configuration ids (e.g. 'twitter' or 'x' vs 'twitter')
      let platformKey = conn.platform.toLowerCase();
      if (platformKey === "x") platformKey = "twitter";
      if (!map[platformKey]) {
        map[platformKey] = [];
      }
      map[platformKey].push(conn);
    });
    return map;
  }, [connections]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 max-w-[1200px] mx-auto pb-10"
    >
      {/* Page Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-white tracking-tight">
          Social Connections
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Link and authorize social media channels to publish content automatically using the scheduling pipeline.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 text-white/30 space-y-3">
          <Loader2 className="animate-spin text-forge-accent" size={32} />
          <span className="text-sm font-semibold">Loading connected accounts...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SUPPORTED_PLATFORMS.map((platform) => {
            const platformConns = activeConnectionsByPlatform[platform.id] || [];
            const isConnected = platformConns.length > 0;

            return (
              <Card
                key={platform.id}
                className="bg-white/2 border border-white/5 hover:border-white/10 p-5 rounded-2xl transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  {/* Platform Brand Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        style={{
                          background: `${platform.brandColor}15`,
                          borderColor: `${platform.brandColor}35`,
                          boxShadow: `0 0 10px ${platform.brandColor}10`,
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border text-[15px] font-extrabold cursor-default select-none"
                      >
                        <span style={{ color: platform.brandColor }}>
                          <PlatformIcon id={platform.id} color={platform.brandColor} />
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-white">
                        {platform.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isConnected
                            ? "bg-emerald-400 shadow-[0_0_6px_#34d399]"
                            : "bg-white/10"
                        }`}
                      />
                      <span className="font-mono text-[9px] text-white/35">
                        {isConnected ? "Connected" : "Disconnected"}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-white/50 leading-relaxed mb-6">
                    {platform.description}
                  </p>
                </div>

                <div className="space-y-3">
                  {/* If connected: display account handles list */}
                  {isConnected && (
                    <div className="space-y-2">
                      {platformConns.map((conn) => (
                        <div
                          key={conn._id}
                          className="flex items-center justify-between bg-white/1 border border-white/5 p-2 px-3 rounded-lg text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="block font-mono text-[10px] text-white truncate">
                              {conn.handle || conn.name || "Authenticated Account"}
                            </span>
                            <span className="block font-mono text-[8px] text-white/30 truncate mt-0.5">
                              ID: {conn._id}
                            </span>
                          </div>
                          <Button
                            disabled={disconnectingAccount === conn._id}
                            onClick={() => handleDisconnect(conn._id, platform.name)}
                            variant="ghost"
                            size="icon-sm"
                            className="h-7 w-7 rounded-md hover:bg-red-500/10 text-white/30 hover:text-red-400 cursor-pointer"
                            title="Disconnect Account"
                          >
                            {disconnectingAccount === conn._id ? (
                              <Loader2 size={11} className="animate-spin" />
                            ) : (
                              <Trash2 size={11} />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Connection Button */}
                  <Button
                    disabled={connectingPlatform === platform.id}
                    onClick={() => handleConnect(platform.id)}
                    className={`w-full h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      isConnected
                        ? "border border-white/10 bg-white/2 hover:bg-white/5 text-white/80"
                        : "bg-gradient-forge text-white shadow-md shadow-forge-glow/20"
                    }`}
                  >
                    {connectingPlatform === platform.id ? (
                      <>
                        <Loader2 className="animate-spin" size={12} />
                        <span>Connecting...</span>
                      </>
                    ) : isConnected ? (
                      <>
                        <Plus size={12} />
                        <span>Link Another</span>
                      </>
                    ) : (
                      <>
                        <span>Connect Channel</span>
                        <ArrowUpRight size={12} className="opacity-60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
