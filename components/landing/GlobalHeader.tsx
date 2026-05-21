"use client";

import { usePathname } from "next/navigation";
import { AuthButtons } from "./AuthButtons";

export function GlobalHeader() {
  const pathname = usePathname();

  // Hide the global landing page auth buttons when inside the dashboard area
  if (pathname?.startsWith("/dashboard")) {
    return null;
  }

  return (
    <header className="fixed top-4 right-6 z-200 flex items-center gap-3">
      <AuthButtons />
    </header>
  );
}
