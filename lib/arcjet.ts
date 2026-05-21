import arcjet, {
  detectBot,
  detectPromptInjection,
  shield,
  slidingWindow,
} from "@arcjet/next";

// 1. Arcjet client for protecting the video upload API route
// This includes:
// - WAF (Shield) to block common vulnerabilities (SQLi, XSS, etc.)
// - Bot detection to prevent automated scraping/abuse of the upload endpoint
// - Sliding window rate limiter tracking Clerk user ID (max 3 uploads per 24 hours)
// - Prompt injection detection to scan the project/file name
export const uploadApiProtector = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE",
      allow: [], // Block all standard automated crawlers/bots
    }),
    slidingWindow({
      mode: "LIVE",
      characteristics: ["userId"], // Rate limit tracked by Clerk User ID
      max: 3, // Max 3 uploads
      interval: 86400, // 24 hours in seconds
    }),
    detectPromptInjection({
      mode: "LIVE",
    }),
  ],
});

// 2. Arcjet client for prompt injection checks on text payloads (e.g., transcripts in background workers)
export const contentScanner = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    detectPromptInjection({
      mode: "LIVE", // Actively block if prompt injection is detected
    }),
  ],
});
