import { spawn } from "child_process";

/**
 * Normalizes a video file using FFmpeg.
 * Resolves with the execution duration in milliseconds if successful, otherwise rejects.
 */
export async function normalizeVideo(inputPath: string, outputPath: string): Promise<number> {
  const startTime = Date.now();
  console.log(`[FFmpeg] Normalizing video from ${inputPath} to ${outputPath}`);

  const ffmpegArgs = [
    "-y", // overwrite output files without asking
    "-i",
    inputPath,
    "-vf",
    "scale=1920:1080:force_original_aspect_ratio=decrease,fps=30",
    "-c:v",
    "libx264",
    "-profile:v",
    "high",
    "-level",
    "4.1",
    "-preset",
    "medium",
    "-crf",
    "23",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-ar",
    "48000",
    "-b:a",
    "192k",
    "-movflags",
    "+faststart",
    outputPath,
  ];

  console.log(`[FFmpeg] Executing command: ffmpeg ${ffmpegArgs.join(" ")}`);

  return new Promise((resolve, reject) => {
    const ffmpegProcess = spawn("ffmpeg", ffmpegArgs);

    let stderrBuffer = "";

    // FFmpeg logs diagnostics, warnings, and progress to stderr
    ffmpegProcess.stderr.on("data", (data) => {
      const logLine = data.toString();
      stderrBuffer += logLine;

      // Clean up log display: print progress logs or warnings to server console
      // Split by newline and log each line prefixed by [FFmpeg Progress]
      const lines = logLine.split("\n");
      for (const line of lines) {
        if (line.trim().startsWith("frame=") || line.trim().startsWith("size=")) {
          // Log progress lines compactly
          process.stdout.write(`\r[FFmpeg Progress] ${line.trim()}`);
        } else if (line.trim().length > 0) {
          console.log(`[FFmpeg Log] ${line.trim()}`);
        }
      }
    });

    ffmpegProcess.on("close", (code) => {
      // Ensure we clean up the carriage return carriage from stdout writing
      process.stdout.write("\n");
      
      const durationMs = Date.now() - startTime;

      if (code === 0) {
        console.log(
          `[FFmpeg] Normalization completed successfully. ` +
            `Duration: ${(durationMs / 1000).toFixed(2)} seconds.`
        );
        resolve(durationMs);
      } else {
        console.error(`[FFmpeg] Process exited with non-zero exit code: ${code}`);
        const logTail = stderrBuffer.split("\n").slice(-15).join("\n");
        reject(
          new Error(
            `FFmpeg processing failed with exit code ${code}.\n` +
              `Tail of FFmpeg log:\n${logTail}`
          )
        );
      }
    });

    ffmpegProcess.on("error", (err) => {
      console.error("[FFmpeg] Failed to start FFmpeg subprocess:", err);
      reject(new Error(`FFmpeg failed to start: ${err.message}`));
    });
  });
}
