export const config = {
  // Number of short videos to generate from the long video (at least 4-5)
  shortVideoCount: 5,

  // Groq AI model to use
  groqModel: "llama-3.3-70b-versatile",

  // Keep each Groq request under free-tier TPM (12k). Leave headroom for
  // system prompt + JSON response tokens.
  groqMaxInputTokens: 7500,

  // Wait between chunked Groq calls so TPM budget can recover.
  groqChunkDelay: "25s",

  // Short-form clip duration bounds (seconds)
  clipMinDurationSec: 30,
  clipMaxDurationSec: 90,
};

/** Clamp a clip window to configured short-form bounds. */
export function clampClipWindow(
  startTime: number,
  endTime: number,
): { startTime: number; endTime: number } {
  const start = Math.max(0, Number(startTime) || 0);
  let end = Math.max(start + 1, Number(endTime) || start + 1);
  const duration = end - start;

  if (duration > config.clipMaxDurationSec) {
    end = start + config.clipMaxDurationSec;
  }

  return { startTime: start, endTime: end };
}
