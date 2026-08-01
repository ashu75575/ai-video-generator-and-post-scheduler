import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Html5Video,
  useCurrentFrame,
  useRemotionEnvironment,
  useVideoConfig,
} from "remotion";
import { Video as MediaVideo } from "@remotion/media";

// ---- Types ----
export interface CaptionStyleProps {
  id?: string;
  name?: string;
  fontFamily?: string;
  textTransform?: "none" | "uppercase" | "lowercase";
  colorActive?: string;
  colorInactive?: string;
  fontSizeActive?: string;
  fontSizeInactive?: string;
  textShadow?: string;
  backgroundColor?: string;
  borderRadius?: string;
  padding?: string;
  border?: string;
  animation?: string;
  gap?: string;
  letterSpacing?: string;
}

interface Word {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface ShortVideoCompositionProps {
  videoUrl: string;
  startTime: number;
  endTime: number;
  captions: Word[];
  captionStyle: CaptionStyleProps | null;
}

function remToPx(remStr: string | undefined, fallback: number): number {
  if (!remStr) return fallback;
  const val = parseFloat(remStr);
  if (isNaN(val)) return fallback;
  return val * 16;
}

function parsePxOrRem(val: string | undefined, fallback: number): number {
  if (!val) return fallback;
  if (val.includes("rem")) return remToPx(val, fallback);
  if (val.includes("px")) return parseFloat(val);
  return parseFloat(val) || fallback;
}

/**
 * Binary search for the active caption word at `currentTime`.
 * Captions from Deepgram are time-ordered; O(log n) beats per-frame findIndex.
 */
function findActiveCaptionIndex(captions: Word[], currentTime: number): number {
  if (!captions.length) return -1;

  let lo = 0;
  let hi = captions.length - 1;
  let candidate = -1;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (captions[mid].start <= currentTime) {
      candidate = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  if (candidate === -1) return -1;
  const word = captions[candidate];
  return currentTime <= word.end ? candidate : -1;
}

export const ShortVideoComposition: React.FC<ShortVideoCompositionProps> = ({
  videoUrl,
  startTime,
  endTime,
  captions,
  captionStyle,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const env = useRemotionEnvironment();

  const startFrame = Math.max(0, Math.round(startTime * fps));
  const endFrame = Math.max(startFrame + 1, Math.round(endTime * fps));
  const currentTime = startTime + frame / fps;

  const activeIndex = useMemo(
    () => findActiveCaptionIndex(captions ?? [], currentTime),
    [captions, currentTime],
  );

  const CHUNK_SIZE = 3;
  const groupStart =
    activeIndex === -1 ? -1 : Math.floor(activeIndex / CHUNK_SIZE) * CHUNK_SIZE;
  const wordGroup =
    groupStart === -1 || !captions
      ? []
      : captions.slice(groupStart, groupStart + CHUNK_SIZE);

  const styles = useMemo(() => {
    const fontFamily =
      captionStyle?.fontFamily || "Impact, Arial Black, sans-serif";
    const textTransform =
      (captionStyle?.textTransform as React.CSSProperties["textTransform"]) ||
      "uppercase";
    const colorActive = captionStyle?.colorActive || "#facc15";
    const colorInactive = captionStyle?.colorInactive || "#ffffff";
    const bgColor = captionStyle?.backgroundColor || "rgba(5, 5, 10, 0.88)";
    const borderRadius = parsePxOrRem(captionStyle?.borderRadius, 32);
    const border = captionStyle?.border || "none";
    const letterSpacing = captionStyle?.letterSpacing || "0.04em";
    const gap = parsePxOrRem(captionStyle?.gap, 24);
    const fontSizeActive =
      remToPx(captionStyle?.fontSizeActive || "5.4rem", 86) * 1.5;
    const fontSizeInactive =
      remToPx(captionStyle?.fontSizeInactive || "4.8rem", 77) * 1.5;
    const textShadow =
      captionStyle?.textShadow ||
      `-4px -4px 0 #000, 4px -4px 0 #000, -4px 4px 0 #000, 4px 4px 0 #000, 0px 6px 12px rgba(0,0,0,0.9)`;
    const paddingRaw = captionStyle?.padding || "24px 44px";
    const paddingParts = paddingRaw.split(" ");
    const paddingV = parsePxOrRem(paddingParts[0], 24) * 1.5;
    const paddingH = parsePxOrRem(paddingParts[1] || paddingParts[0], 44) * 1.5;

    return {
      fontFamily,
      textTransform,
      colorActive,
      colorInactive,
      bgColor,
      borderRadius,
      border,
      letterSpacing,
      gap,
      fontSizeActive,
      fontSizeInactive,
      textShadow,
      paddingV,
      paddingH,
    };
  }, [captionStyle]);

  const videoStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  };

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      {/*
        Lambda bottleneck fix:
        Html5 <Video> + pauseWhenBuffering caused chunk workers to hang while
        seeking/buffering remote S3 media (missing chunks → main timeout).

        - While rendering: @remotion/media Video (WebCodecs, partial downloads)
        - In Player/Studio preview: Html5Video for simple browser playback
      */}
      {env.isRendering ? (
        <MediaVideo
          src={videoUrl}
          trimBefore={startFrame}
          trimAfter={endFrame}
          style={videoStyle}
          // Prefer fast path; fall back to OffthreadVideo if codec unsupported
          toneFrequency={1}
        />
      ) : (
        <Html5Video
          src={videoUrl}
          trimBefore={startFrame}
          trimAfter={endFrame}
          style={videoStyle}
        />
      )}

      {wordGroup.length > 0 && (
        <AbsoluteFill
          style={{
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
              backgroundColor: styles.bgColor,
              paddingTop: styles.paddingV,
              paddingBottom: styles.paddingV,
              paddingLeft: styles.paddingH,
              paddingRight: styles.paddingH,
              borderRadius: styles.borderRadius,
              border: styles.border,
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "center",
              gap: styles.gap,
              maxWidth: "92%",
              wordBreak: "break-word",
            }}
          >
            {wordGroup.map((w, idx) => {
              const globalIdx = groupStart + idx;
              const isCurrent = globalIdx === activeIndex;

              return (
                <span
                  key={`${globalIdx}-${w.start}`}
                  style={{
                    fontFamily: styles.fontFamily,
                    color: isCurrent
                      ? styles.colorActive
                      : styles.colorInactive,
                    fontSize: isCurrent
                      ? styles.fontSizeActive
                      : styles.fontSizeInactive,
                    fontWeight: 900,
                    textTransform: styles.textTransform,
                    letterSpacing: styles.letterSpacing,
                    transform: isCurrent ? "scale(1.08)" : "scale(1.0)",
                    display: "inline-block",
                    textShadow: styles.textShadow,
                  }}
                >
                  {w.word}
                </span>
              );
            })}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
