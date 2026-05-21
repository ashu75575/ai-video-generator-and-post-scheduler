import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
import { DM_Sans, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { GlobalHeader } from "@/components/landing/GlobalHeader";

import { checkAndSyncUser } from "@/lib/db/sync";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ClipForge AI — Turn long videos into viral clips",
  description:
    "AI-powered video clipping, captions, and multi-platform scheduling for creators.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Synchronize authenticated user profile with Neon database
  await checkAndSyncUser();

  return (
    <html
      lang="en"
      className={cn(
        "h-full antialiased",
        spaceGrotesk.variable,
        dmSans.variable,
        geistMono.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider
          appearance={{
            theme: dark,
          }}
        >
          <GlobalHeader />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
