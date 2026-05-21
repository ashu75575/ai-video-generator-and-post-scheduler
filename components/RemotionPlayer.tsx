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

  // Find the word active at this specific timestamp
  const activeWord = captions?.find(
    (w) => currentTime >= w.start && currentTime <= w.end,
  );

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

      {activeWord && (
        <div
          style={{
            position: "absolute",
            top: "25%",
            bottom: 0,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            pointerEvents: "none",
            zIndex: 10,
            padding: "0 8%",
          }}
        >
          <span
            style={{
              backgroundColor: "rgba(5, 5, 10, 0.85)",
              color: "#facc15", // bright viral yellow
              fontSize: "4.2rem",
              fontWeight: 900,
              padding: "16px 36px",
              borderRadius: "24px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              textAlign: "center",
              textShadow: `
                -3px -3px 0 #000,
                 3px -3px 0 #000,
                -3px  3px 0 #000,
                 3px  3px 0 #000,
                 0px  6px 12px rgba(0, 0, 0, 0.9)
              `,
              maxWidth: "90%",
              wordBreak: "break-word",
              animation: "scaleIn 0.08s ease-out forwards",
            }}
          >
            {activeWord.word}
          </span>
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
