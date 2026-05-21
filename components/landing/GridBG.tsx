"use client";

import { motion } from "framer-motion";

export function GridBG() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Dot/grid pattern */}
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <pattern
            id="forge-grid"
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke="rgba(124,106,250,0.22)"
              strokeWidth="0.5"
            />
          </pattern>
          {/* Vignette mask so grid fades out at edges */}
          <radialGradient id="grid-fade" cx="50%" cy="45%" r="65%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="60%" stopColor="white" stopOpacity="0.5" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="grid-mask">
            <rect width="100%" height="100%" fill="url(#grid-fade)" />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="url(#forge-grid)"
          mask="url(#grid-mask)"
          opacity="0.5"
        />
      </svg>

      {/* Animated ambient blobs — use will-change for GPU layer */}
      <motion.div
        animate={{ y: [-24, 24, -24], rotate: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 14, ease: "easeInOut" }}
        style={{ willChange: "transform" }}
        className="absolute top-[10%] left-[5%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(124,106,250,0.14)_0%,transparent_70%)] blur-[50px]"
      />
      <motion.div
        animate={{ y: [24, -24, 24], rotate: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 18, ease: "easeInOut" }}
        style={{ willChange: "transform" }}
        className="absolute top-[25%] right-[3%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(62,207,207,0.09)_0%,transparent_70%)] blur-[40px]"
      />
      {/* Small accent blob bottom */}
      <motion.div
        animate={{ y: [-12, 12, -12] }}
        transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
        style={{ willChange: "transform" }}
        className="absolute bottom-[10%] left-[40%] h-[280px] w-[280px] rounded-full bg-[radial-gradient(circle,rgba(124,106,250,0.08)_0%,transparent_70%)] blur-[30px]"
      />
    </div>
  );
}
