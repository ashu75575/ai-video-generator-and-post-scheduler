"use client";

import React, { useState, useEffect } from "react";
import { Player } from "@remotion/player";
import {
  ShortVideoComposition,
  type CaptionStyleProps,
} from "@/remotion/ShortVideoComposition";

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
  captionStyle?: CaptionStyleProps;
}

export default function RemotionPlayer({
  videoUrl,
  startTime,
  endTime,
  captions,
  captionStyle,
}: RemotionPlayerProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      setIsMounted(true);
    }, 0);
    return () => clearTimeout(handle);
  }, []);

  if (!isMounted) {
    return (
      <div className="aspect-9/16 w-full rounded-2xl flex items-center justify-center border">
        <div className="animate-pulse text-xs text-white/40 uppercase tracking-widest font-mono">
          Initializing Engine...
        </div>
      </div>
    );
  }

  const fps = 30;
  const durationInSeconds = endTime - startTime;
  const durationInFrames = Math.max(30, Math.round(durationInSeconds * fps));

  return (
    <div className="relative aspect-9/16 w-full max-w-[340px] mx-auto rounded-3xl overflow-hidden border ">
      <Player
        component={ShortVideoComposition}
        inputProps={{
          videoUrl,
          startTime,
          endTime,
          captions,
          captionStyle: captionStyle || null,
        }}
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
