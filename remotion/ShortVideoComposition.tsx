import React from "react";
import { Video, useCurrentFrame, useVideoConfig } from "remotion";

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

// Pixel conversion for Remotion: font sizes in rem are designed for the browser
// where 1rem ≈ 16px but Remotion renders in a 1080×1920 canvas.
// We treat the style values as pixel values (e.g. "5.4rem" → 86px at 16x scale).
function remToPx(remStr: string | undefined, fallback: number): number {
  if (!remStr) return fallback;
  const val = parseFloat(remStr);
  if (isNaN(val)) return fallback;
  // In the 1080px wide canvas, original design targets ~1080px wide player
  // So treat rem × 16 as browser pixels, then scale for 1080px canvas.
  return val * 16;
}

function parsePxOrRem(val: string | undefined, fallback: number): number {
  if (!val) return fallback;
  if (val.includes("rem")) return remToPx(val, fallback);
  if (val.includes("px")) return parseFloat(val);
  return parseFloat(val) || fallback;
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

  const currentTime = startTime + frame / fps;

  const activeIndex =
    captions && captions.length > 0
      ? captions.findIndex(
          (w) => currentTime >= w.start && currentTime <= w.end
        )
      : -1;

  const CHUNK_SIZE = 3;
  let wordGroup: Word[] = [];
  let groupStart = -1;

  if (activeIndex !== -1 && captions) {
    groupStart = Math.floor(activeIndex / CHUNK_SIZE) * CHUNK_SIZE;
    const groupEnd = Math.min(groupStart + CHUNK_SIZE, captions.length);
    wordGroup = captions.slice(groupStart, groupEnd);
  }

  const startFrame = Math.round(startTime * fps);

  // ------ Caption style values ------
  const fontFamily =
    captionStyle?.fontFamily || "Impact, Arial Black, sans-serif";
  const textTransform: React.CSSProperties["textTransform"] =
    (captionStyle?.textTransform as React.CSSProperties["textTransform"]) ||
    "uppercase";
  const colorActive = captionStyle?.colorActive || "#facc15";
  const colorInactive = captionStyle?.colorInactive || "#ffffff";
  const bgColor =
    captionStyle?.backgroundColor || "rgba(5, 5, 10, 0.88)";
  const borderRadius = parsePxOrRem(captionStyle?.borderRadius, 32);
  const border = captionStyle?.border || "none";
  const letterSpacing = captionStyle?.letterSpacing || "0.04em";
  const gap = parsePxOrRem(captionStyle?.gap, 24);

  // Scale font sizes: the composition is 1080px wide.
  // Original sizes like 5.4rem (≈86px) look right in browser at ~400px wide preview.
  // For the 1080px canvas we use larger sizes proportionally.
  const fontSizeActiveRaw = captionStyle?.fontSizeActive || "5.4rem";
  const fontSizeInactiveRaw = captionStyle?.fontSizeInactive || "4.8rem";
  // We'll scale up the font sizes for the high-res canvas
  const fontSizeActive = remToPx(fontSizeActiveRaw, 86) * 1.5;
  const fontSizeInactive = remToPx(fontSizeInactiveRaw, 77) * 1.5;

  const textShadow =
    captionStyle?.textShadow ||
    `-4px -4px 0 #000, 4px -4px 0 #000, -4px 4px 0 #000, 4px 4px 0 #000, 0px 6px 12px rgba(0,0,0,0.9)`;

  // Padding: parse for top/bottom and left/right
  const paddingRaw = captionStyle?.padding || "24px 44px";
  const paddingParts = paddingRaw.split(" ");
  const paddingV = parsePxOrRem(paddingParts[0], 24) * 1.5;
  const paddingH = parsePxOrRem(paddingParts[1] || paddingParts[0], 44) * 1.5;

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
        pauseWhenBuffering={true}
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
              backgroundColor: bgColor,
              paddingTop: paddingV,
              paddingBottom: paddingV,
              paddingLeft: paddingH,
              paddingRight: paddingH,
              borderRadius,
              border,
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "center",
              gap,
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
                    fontFamily,
                    color: isCurrent ? colorActive : colorInactive,
                    fontSize: isCurrent ? fontSizeActive : fontSizeInactive,
                    fontWeight: 900,
                    textTransform,
                    letterSpacing,
                    transform: isCurrent ? "scale(1.08)" : "scale(1.0)",
                    display: "inline-block",
                    textShadow,
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
