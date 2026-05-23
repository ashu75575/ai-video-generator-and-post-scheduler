export interface CaptionStyle {
  id: string;
  name: string;
  fontFamily: string;
  textTransform: "none" | "uppercase" | "lowercase";
  colorActive: string;
  colorInactive: string;
  fontSizeActive: string;
  fontSizeInactive: string;
  textShadow?: string;
  backgroundColor: string;
  borderRadius: string;
  padding: string;
  border?: string;
  animation?: string;
  gap?: string;
  letterSpacing?: string;
}

export const CAPTION_STYLES: CaptionStyle[] = [
  {
    id: "tiktok-bold",
    name: "TikTok Bold",
    fontFamily: "Impact, Arial Black, sans-serif",
    textTransform: "uppercase",
    colorActive: "#facc15",
    colorInactive: "#ffffff",
    fontSizeActive: "5.4rem",
    fontSizeInactive: "4.8rem",
    textShadow: `
      -4px -4px 0 #000,
       4px -4px 0 #000,
      -4px  4px 0 #000,
       4px  4px 0 #000,
       0px  6px 12px rgba(0, 0, 0, 0.9)
    `,
    backgroundColor: "rgba(5, 5, 10, 0.88)",
    borderRadius: "32px",
    padding: "24px 44px",
    gap: "24px",
    letterSpacing: "0.04em",
  },
  {
    id: "neon-cyan",
    name: "Neon Cyberpunk",
    fontFamily: "'Outfit', 'Inter', sans-serif",
    textTransform: "uppercase",
    colorActive: "#06b6d4",
    colorInactive: "#a1a1aa",
    fontSizeActive: "5.2rem",
    fontSizeInactive: "4.4rem",
    textShadow: `
      0 0 10px rgba(6, 182, 212, 0.8),
      0 0 20px rgba(6, 182, 212, 0.4),
      0 0 30px rgba(6, 182, 212, 0.2)
    `,
    backgroundColor: "rgba(10, 8, 20, 0.95)",
    borderRadius: "20px",
    padding: "20px 40px",
    border: "1px solid rgba(139, 92, 246, 0.3)",
    gap: "20px",
    letterSpacing: "0.08em",
  },
  {
    id: "minimalist-glass",
    name: "Minimalist Glass",
    fontFamily: "'Inter', sans-serif",
    textTransform: "none",
    colorActive: "#ffffff",
    colorInactive: "rgba(255, 255, 255, 0.45)",
    fontSizeActive: "4.8rem",
    fontSizeInactive: "4.2rem",
    textShadow: "0px 4px 10px rgba(0, 0, 0, 0.5)",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: "24px",
    padding: "18px 36px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    gap: "18px",
    letterSpacing: "-0.01em",
  },
  {
    id: "retro-console",
    name: "Retro Terminal",
    fontFamily: "'Courier New', Courier, monospace",
    textTransform: "uppercase",
    colorActive: "#22c55e",
    colorInactive: "#15803d",
    fontSizeActive: "4.6rem",
    fontSizeInactive: "4.0rem",
    textShadow: "0 0 8px rgba(34, 197, 94, 0.6)",
    backgroundColor: "#000000",
    borderRadius: "0px",
    padding: "16px 32px",
    border: "2px solid #22c55e",
    gap: "16px",
    letterSpacing: "0.1em",
  },
  {
    id: "sunset-orange",
    name: "Sunset Gradient",
    fontFamily: "'Space Grotesk', sans-serif",
    textTransform: "uppercase",
    colorActive: "#f97316",
    colorInactive: "#fef08a",
    fontSizeActive: "5.6rem",
    fontSizeInactive: "4.8rem",
    textShadow: `
      2px 2px 0px #000,
      4px 4px 0px rgba(0,0,0,0.15)
    `,
    backgroundColor: "rgba(24, 12, 8, 0.9)",
    borderRadius: "16px",
    padding: "22px 42px",
    border: "1px solid rgba(249, 115, 22, 0.2)",
    gap: "22px",
    letterSpacing: "0.02em",
  },
];

export const DEFAULT_CAPTION_STYLE = CAPTION_STYLES[0];

export function getStyleById(id?: string): CaptionStyle {
  if (!id) return DEFAULT_CAPTION_STYLE;
  return (
    CAPTION_STYLES.find((style) => style.id === id) || DEFAULT_CAPTION_STYLE
  );
}
