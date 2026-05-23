import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface VideoMetadata {
  duration: number;
  fps: number;
  codec: string;
  width: number;
  height: number;
}

// Supported containers and video codecs whitelists
const SUPPORTED_CODECS = new Set([
  "h264",
  "hevc",
  "h265",
  "vp8",
  "vp9",
  "av1",
  "mpeg4",
  "prores",
  "h263",
  "mjpeg",
]);

const SUPPORTED_FORMATS = new Set([
  "mp4",
  "mov",
  "webm",
  "mkv",
  "avi",
  "3gp",
  "flv",
  "ogg",
  "mj2",
]);

/**
 * Validates a video file using ffprobe.
 * Extracts and returns video metadata if valid, otherwise throws an error.
 */
export async function validateVideo(filePath: string): Promise<VideoMetadata> {
  console.log(`[FFprobe] Validating media file: ${filePath}`);

  // Construct a safe command escaping the path
  const ffprobeCmd = `ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,codec_type,r_frame_rate,width,height -show_entries format=duration,format_name -of json "${filePath.replace(/"/g, '\\"')}"`;

  let stdout: string;
  try {
    const result = await execAsync(ffprobeCmd);
    stdout = result.stdout;
    console.log(`[FFprobe] ffprobe execution completed successfully.`);
  } catch (err: any) {
    console.error(`[FFprobe] Execution failed for ${filePath}:`, err);
    throw new Error(
      `Media validation failed: file is corrupted or not a valid video format. Details: ${err.message}`,
    );
  }

  let parsed: any;
  try {
    parsed = JSON.parse(stdout);
  } catch (parseErr: any) {
    console.error("[FFprobe] Failed to parse ffprobe JSON output:", stdout);
    throw new Error(
      "Media validation failed: unable to parse media properties.",
    );
  }

  // 1. Check for video stream
  const videoStream = parsed.streams?.find(
    (s: any) => s.codec_type === "video",
  );
  if (!videoStream) {
    throw new Error(
      "Media validation rejected: No video stream found in the uploaded file.",
    );
  }

  // 2. Validate codec support
  const codec = videoStream.codec_name?.toLowerCase();
  if (!codec || !SUPPORTED_CODECS.has(codec)) {
    throw new Error(
      `Media validation rejected: Unsupported video codec "${codec || "unknown"}".`,
    );
  }

  // 3. Validate format support
  const formatNameRaw = parsed.format?.format_name?.toLowerCase();
  if (!formatNameRaw) {
    throw new Error(
      "Media validation rejected: Unable to identify video container format.",
    );
  }

  const formats = formatNameRaw.split(",").map((f: string) => f.trim());
  const isFormatSupported = formats.some((f: string) =>
    SUPPORTED_FORMATS.has(f),
  );
  if (!isFormatSupported) {
    throw new Error(
      `Media validation rejected: Unsupported container formats [${formats.join(", ")}].`,
    );
  }

  // 4. Extract and parse metadata fields
  const duration = parseFloat(parsed.format?.duration || "0");
  if (isNaN(duration) || duration <= 0) {
    throw new Error("Media validation rejected: Invalid video duration.");
  }

  const width = parseInt(videoStream.width || "0", 10);
  const height = parseInt(videoStream.height || "0", 10);
  if (width <= 0 || height <= 0) {
    throw new Error(
      `Media validation rejected: Invalid video dimensions ${width}x${height}.`,
    );
  }

  // Parse frame rate (can be in fraction format e.g. "30000/1001" or decimal format e.g. "30")
  let fps = 30; // default fallback
  const frameRateStr = videoStream.r_frame_rate;
  if (frameRateStr) {
    const parts = frameRateStr.split("/");
    if (parts.length === 2) {
      const num = parseFloat(parts[0]);
      const den = parseFloat(parts[1]);
      if (den > 0) {
        fps = num / den;
      }
    } else {
      const parsedFps = parseFloat(frameRateStr);
      if (!isNaN(parsedFps) && parsedFps > 0) {
        fps = parsedFps;
      }
    }
  }

  console.log(
    `[FFprobe] Video successfully validated. ` +
      `Metadata: duration=${duration}s, fps=${fps.toFixed(2)}, codec=${codec}, resolution=${width}x${height}`,
  );

  return {
    duration,
    fps,
    codec,
    width,
    height,
  };
}
