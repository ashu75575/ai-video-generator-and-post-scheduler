"use client";

import React, { useState, useEffect } from "react";
import { Player } from "@remotion/player";
import { Video, useCurrentFrame, useVideoConfig } from "remotion";

interface Word {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

interface RemotionPlayerProps {
  videoUrl: string;
  startTime: number;
  endTime: number;
  captions: Word[];
}

// Composition Component rendered inside Remotion Player
const ShortVideoComposition: React.FC<RemotionPlayerProps> = ({
  videoUrl,
  startTime,
  endTime,
  captions,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Current playback time in seconds, calculated frame-accurately
  const currentTime = startTime + frame / fps;

  // Find index of the active word in the captions array
  const activeIndex = captions ? captions.findIndex(
    (w) => currentTime >= w.start && currentTime <= w.end,
  ) : -1;

  const CHUNK_SIZE = 3;
  let wordGroup: Word[] = [];
  let groupStart = -1;

  if (activeIndex !== -1 && captions) {
    groupStart = Math.floor(activeIndex / CHUNK_SIZE) * CHUNK_SIZE;
    const groupEnd = Math.min(groupStart + CHUNK_SIZE, captions.length);
    wordGroup = captions.slice(groupStart, groupEnd);
  }

  const startFrame = Math.round(startTime * fps);

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: "#000",
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Video
        src={videoUrl}
        startFrom={startFrame}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {wordGroup.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            pointerEvents: "none",
            zIndex: 10,
            padding: "0 6%",
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(5, 5, 10, 0.88)",
              padding: "24px 44px",
              borderRadius: "32px",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "center",
              gap: "24px",
              maxWidth: "92%",
              wordBreak: "break-word",
            }}
          >
            {wordGroup.map((w, idx) => {
              const globalIdx = groupStart + idx;
              const isCurrent = globalIdx === activeIndex;

              return (
                <span
                  key={globalIdx}
                  style={{
                    color: isCurrent ? "#facc15" : "#ffffff", // Neon yellow for current, white for others
                    fontSize: isCurrent ? "5.4rem" : "4.8rem", // Highlight speaking word with larger font size
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    transform: isCurrent ? "scale(1.1)" : "scale(1.0)",
                    transition: "transform 0.05s ease-out, color 0.05s ease-out",
                    display: "inline-block",
                    textShadow: `
                      -4px -4px 0 #000,
                       4px -4px 0 #000,
                      -4px  4px 0 #000,
                       4px  4px 0 #000,
                       0px  6px 12px rgba(0, 0, 0, 0.9)
                    `,
                    animation: isCurrent ? "scaleIn 0.08s ease-out forwards" : "none",
                  }}
                >
                  {w.word}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default function RemotionPlayer({
  videoUrl,
  startTime,
  endTime,
  captions,
}: RemotionPlayerProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="aspect-[9/16] w-full bg-[#0a0814] rounded-2xl flex items-center justify-center border border-white/5">
        <div className="animate-pulse text-xs text-white/40 uppercase tracking-widest font-mono">
          Initializing Engine...
        </div>
      </div>
    );
  }

  const fps = 30;
  const durationInSeconds = endTime - startTime;
  // Fallback to at least 1 second if duration is invalid
  const durationInFrames = Math.max(30, Math.round(durationInSeconds * fps));

  return (
    <div className="relative aspect-[9/16] w-full max-w-[340px] mx-auto rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(139,92,246,0.15)] bg-black">
      <Player
        component={ShortVideoComposition}
        inputProps={{ videoUrl, startTime, endTime, captions }}
        durationInFrames={durationInFrames}
        fps={fps}
        compositionWidth={1080}
        compositionHeight={1920}
        style={{
          width: "100%",
          height: "100%",
        }}
        controls
        loop
        autoPlay={false}
      />
    </div>
  );
}
