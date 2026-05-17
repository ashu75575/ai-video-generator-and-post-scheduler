"use client";

import { motion } from "framer-motion";

export function GridBG() {
  return (
    <motion.div className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg className="absolute inset-0 h-full w-full opacity-25">
        <defs>
          <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke="rgba(124,106,250,0.35)"
              strokeWidth="0.5"
            />
          </pattern>
          <radialGradient id="fade" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="100%" stopColor="#05050a" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <rect width="100%" height="100%" fill="url(#fade)" />
      </svg>
      <motion.div
        animate={{ y: [-20, 20, -20], rotate: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
        className="absolute top-[15%] left-[10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(124,106,250,0.12)_0%,transparent_70%)] blur-[40px]"
      />
      <motion.div
        animate={{ y: [20, -20, 20], rotate: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 16, ease: "easeInOut" }}
        className="absolute top-[30%] right-[5%] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(62,207,207,0.1)_0%,transparent_70%)] blur-[40px]"
      />
    </motion.div>
  );
}
