"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FORGE_ACCENT, FORGE_ACCENT_2 } from "./tokens";

type TerminalLineProps = {
  line: string;
  delay: number;
};

export function TerminalLine({ line, delay }: TerminalLineProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  if (!visible) return null;

  const isCommand = line.startsWith("$");
  const isOutput =
    line.startsWith("✓") ||
    line.startsWith("→") ||
    line.startsWith("📦") ||
    line.startsWith("🎉");

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-1.5 font-mono text-[13px] tracking-wide"
      style={{
        color: isCommand
          ? FORGE_ACCENT
          : isOutput
            ? FORGE_ACCENT_2
            : "rgba(255,255,255,0.45)",
      }}
    >
      {line}
    </motion.div>
  );
}
