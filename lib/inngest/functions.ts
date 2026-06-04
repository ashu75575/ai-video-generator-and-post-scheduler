import { inngest } from "./client";
import { db } from "../db";
import { projects, shortVideos } from "../db/schema";
import { eq } from "drizzle-orm";
import { cache } from "../redis";

async function invalidateProjectCache(projectId: string) {
  if (!db) return;
  try {
    const res = await db
      .select({ userId: projects.userId })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
    if (res && res.length > 0) {
      const userId = res[0].userId;
      await Promise.all([
        cache.del(`projects:${userId}`),
        cache.del(`project_status:${projectId}`),
      ]);
      console.log(`[CACHE INVALIDATION] Invalidated projects:${userId} and project_status:${projectId}`);
    }
  } catch (err) {
    console.error("Failed to invalidate project cache:", err);
  }
}

async function invalidateClipCache(clipId: string) {
  if (!db) return;
  try {
    const clipRes = await db
      .select({ projectId: shortVideos.projectId })
      .from(shortVideos)
      .where(eq(shortVideos.id, clipId))
      .limit(1);
    if (clipRes && clipRes.length > 0) {
      const projectId = clipRes[0].projectId;
      const projRes = await db
        .select({ userId: projects.userId })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);
      const userId = projRes?.[0]?.userId;

      const promises = [
        cache.del(`clip_render_status:${clipId}`),
        cache.del(`project_status:${projectId}`),
      ];
      if (userId) {
        promises.push(cache.del(`clips:${userId}`));
      }
      await Promise.all(promises);
      console.log(`[CACHE INVALIDATION] Invalidated clip:${clipId}, project_status:${projectId}, clips:${userId}`);
    }
  } catch (err) {
    console.error("Failed to invalidate clip cache:", err);
  }
}
import fs from "fs/promises";
import { existsSync, createReadStream } from "fs";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "../config";
import crypto from "crypto";
import { contentScanner } from "../arcjet";
import {
  renderMediaOnLambda,
  getRenderProgress,
} from "@remotion/lambda/client";

export const processVideoUpload = inngest.createFunction(
  {
    id: "process-video-upload",
    retries: 2,
    onFailure: async ({ event, step }) => {
      const { projectId, filePath } = event.data.event.data;
      await step.run("mark-project-failed", async () => {
        if (db) {
          await db
            .update(projects)
            .set({ status: "failed", updatedAt: new Date() })
            .where(eq(projects.id, projectId));
          await invalidateProjectCache(projectId);
        }
      });
      if (filePath) {
        await step.run("cleanup-temp-file", async () => {
          try {
            if (existsSync(filePath)) {
              await fs.unlink(filePath);
              console.log(`[onFailure] Cleaned up local temp file: ${filePath}`);
            }
          } catch (err) {
            console.error(`[onFailure] Failed to delete local file ${filePath}:`, err);
          }
        });
      }
    },
  },
  { event: "video/upload.started" },
  async ({ event, step }) => {
    const { projectId, filePath, fileName } = event.data;

    // Step 1: Initialize status in Database
    await step.run("initialize-db-status", async () => {
      console.log(`Starting upload process for project: ${projectId}`);
      if (db) {
        await db
          .update(projects)
          .set({ status: "uploading", progress: 20, updatedAt: new Date() })
          .where(eq(projects.id, projectId));
        await invalidateProjectCache(projectId);
      }
    });

    // Step 2: Upload to AWS S3
    const videoUrl = await step.run("upload-to-s3", async () => {
      if (db) {
        await db
          .update(projects)
          .set({ status: "uploading", progress: 50, updatedAt: new Date() })
          .where(eq(projects.id, projectId));
        await invalidateProjectCache(projectId);
      }

      const bucketName = process.env.AWS_BUCKET_NAME;
      const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
      const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
      const region = process.env.AWS_REGION || "us-east-1";

      if (!bucketName || !accessKeyId || !secretAccessKey) {
        throw new Error(
          "AWS S3 environment variables are not fully configured. " +
            "Please check AWS_BUCKET_NAME, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY.",
        );
      }

      // Initialize AWS S3 Client
      const s3 = new S3Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });

      // Stream the local file contents
      const fileStream = createReadStream(filePath);
      const s3Key = `projects/${projectId}/${Date.now()}-${fileName}`;

      // Upload file directly to S3
      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: s3Key,
          Body: fileStream,
        }),
      );

      // Generate a presigned URL to allow Deepgram (and the frontend player) to access the private S3 file securely
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
      });
      const actualUrl = await getSignedUrl(s3, getCommand, {
        expiresIn: 604800,
      }); // Valid for 7 days

      if (db) {
        await db
          .update(projects)
          .set({ status: "uploading", progress: 85, updatedAt: new Date() })
          .where(eq(projects.id, projectId));
        await invalidateProjectCache(projectId);
      }
      return actualUrl;
    });

    // Step 3: Clean up local file
    await step.run("cleanup-local-file", async () => {
      try {
        if (existsSync(filePath)) {
          await fs.unlink(filePath);
          console.log(`Successfully deleted local temp file: ${filePath}`);
        }
      } catch (err) {
        console.error(`Failed to delete local file ${filePath}:`, err);
      }
    });

    // Step 4: Finalize database status
    await step.run("finalize-db-status", async () => {
      if (db) {
        await db
          .update(projects)
          .set({
            status: "completed",
            progress: 100,
            videoUrl: videoUrl,
            updatedAt: new Date(),
          })
          .where(eq(projects.id, projectId));
        await invalidateProjectCache(projectId);
      }
      console.log(
        `Successfully completed upload process for project: ${projectId}`,
      );
    });

    return { success: true, url: videoUrl };
  },
);

interface Word {
  word: string;
  start: number;
  end: number;
  confidence: number;
  punctuated_word?: string;
}

interface Sentence {
  text: string;
  start: number;
  end: number;
}

function groupWordsIntoSentences(words: Word[]): Sentence[] {
  if (!Array.isArray(words) || words.length === 0) return [];

  const sentences: Sentence[] = [];
  let currentWords: string[] = [];
  let currentStart = words[0].start;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const wordText = w.punctuated_word || w.word;
    currentWords.push(wordText);

    // Check if the word ends with sentence-ending punctuation or if it has been 15 words
    const isEnding =
      /[.!?]$/.test(wordText) ||
      currentWords.length >= 15 ||
      i === words.length - 1;

    if (isEnding) {
      sentences.push({
        text: currentWords.join(" "),
        start: currentStart,
        end: w.end,
      });
      if (i + 1 < words.length) {
        currentStart = words[i + 1].start;
      }
      currentWords = [];
    }
  }

  return sentences;
}

export const analyzeProjectVideo = inngest.createFunction(
  {
    id: "analyze-project-video",
    retries: 2,
    onFailure: async ({ event, step }) => {
      const { projectId } = event.data.event.data;
      await step.run("mark-analysis-failed", async () => {
        if (db) {
          await db
            .update(projects)
            .set({ status: "failed", updatedAt: new Date() })
            .where(eq(projects.id, projectId));
          await invalidateProjectCache(projectId);
        }
      });
    },
  },
  { event: "project/analysis.started" },
  async ({ event, step }) => {
    const { projectId, videoUrl } = event.data;

    // Step 1: Initialize analysis in DB
    await step.run("initialize-analysis-db", async () => {
      if (db) {
        await db
          .update(projects)
          .set({ status: "transcribing", progress: 10, updatedAt: new Date() })
          .where(eq(projects.id, projectId));
        await invalidateProjectCache(projectId);
      }
    });

    // Step 2: Call Deepgram to transcribe and get captions
    const result = await step.run("transcribe-video", async () => {
      if (db) {
        await db
          .update(projects)
          .set({ status: "transcribing", progress: 40, updatedAt: new Date() })
          .where(eq(projects.id, projectId));
        await invalidateProjectCache(projectId);
      }

      const deepgramApiKey = process.env.DEEPGRAM_API_KEY;

      if (!deepgramApiKey) {
        throw new Error(
          "DEEPGRAM_API_KEY environment variable is not configured.",
        );
      }

      const response = await fetch(
        "https://api.deepgram.com/v1/listen?smart_format=true&punctuate=true",
        {
          method: "POST",
          headers: {
            Authorization: `Token ${deepgramApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: videoUrl }),
        },
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(
          `Deepgram API failed with code ${response.status}: ${errText}`,
        );
      }

      const data = await response.json();
      const transcript =
        data.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";
      const captions =
        data.results?.channels?.[0]?.alternatives?.[0]?.words || [];

      return { transcript, captions };
    });

    // Step 3: Update DB status to generating shorts
    await step.run("update-db-status-generating-shorts", async () => {
      if (db) {
        await db
          .update(projects)
          .set({
            status: "generating_shorts",
            progress: 70,
            updatedAt: new Date(),
          })
          .where(eq(projects.id, projectId));
        await invalidateProjectCache(projectId);
      }
    });

    // Step 4: Use Gemini AI model to find the best engaging moments
    const shortVideoSegments = await step.run(
      "generate-short-videos",
      async () => {
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
          console.warn(
            "⚠️ GEMINI_API_KEY is not set. Skipping short video generation.",
          );
          return [];
        }

        const sentences = groupWordsIntoSentences(result.captions);
        if (sentences.length === 0) {
          console.warn(
            "No sentences found in transcription. Skipping short video generation.",
          );
          return [];
        }

        // Check for prompt injection attacks in the transcript before calling Gemini API
        try {
          const decision = await contentScanner.protect(null as any, {
            detectPromptInjectionMessage: result.transcript || "",
          });

          if (decision.isDenied()) {
            console.error(
              `❌ Prompt injection detected in transcript for project ${projectId}. Blocking Gemini API call.`,
            );
            throw new Error(
              "Analysis failed: Prompt injection detected in video content.",
            );
          }
        } catch (scanError: any) {
          if (scanError.message?.includes("Prompt injection detected")) {
            throw scanError;
          }
          console.error(
            "⚠️ Arcjet prompt injection scan encountered an error:",
            scanError,
          );
        }

        console.log(
          `Sending ${sentences.length} sentences to Gemini to find best engaging moments.`,
        );

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: `You are an expert viral video editor and content strategist.
Analyze the following transcript of a long video, which is split into sentences with start and end times (in seconds).
Identify the top ${config.shortVideoCount} most engaging, viral, and coherent segments suitable for short videos (TikTok, Reels, YouTube Shorts).

Each segment MUST:
1. Be between 30 and 90 seconds long.
2. Have a strong hook at the beginning.
3. Be self-contained and make sense to the viewer.
4. Align exactly with the sentence boundaries (use the start time of the first sentence and the end time of the last sentence in the segment).
5. Add SEO ranking from 1 to 10 for each short video, 1 is best and 10 is worst, this SEO ranking is for youtube shorts.

Here is the sentence list:
${JSON.stringify(sentences, null, 2)}

Return the output as a JSON object matching the requested schema.`,
                    },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: "OBJECT",
                  properties: {
                    shortVideos: {
                      type: "ARRAY",
                      items: {
                        type: "OBJECT",
                        properties: {
                          title: { type: "STRING" },
                          startTime: { type: "NUMBER" },
                          endTime: { type: "NUMBER" },
                          whyBest: { type: "STRING" },
                          seoRanking: { type: "INTEGER" },
                        },
                        required: [
                          "title",
                          "startTime",
                          "endTime",
                          "whyBest",
                          "seoRanking",
                        ],
                      },
                    },
                  },
                  required: ["shortVideos"],
                },
              },
            }),
          },
        );

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(
            `Gemini API failed with status ${response.status}: ${errText}`,
          );
        }

        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!responseText) {
          throw new Error("Empty response received from Gemini API");
        }

        const parsed = JSON.parse(responseText);
        return parsed.shortVideos || [];
      },
    );

    // Step 5: Save short videos and specific captions to the database
    await step.run("save-short-videos", async () => {
      if (!db || !shortVideoSegments || shortVideoSegments.length === 0) {
        console.log("No short videos to save to the database.");
        return;
      }

      for (const segment of shortVideoSegments) {
        // Filter the captions array for words that fall within this segment's duration
        const segmentCaptions = result.captions.filter(
          (w: any) => w.start >= segment.startTime && w.end <= segment.endTime,
        );

        await db.insert(shortVideos).values({
          id: crypto.randomUUID(),
          projectId,
          title: segment.title,
          startTime: segment.startTime,
          endTime: segment.endTime,
          whyBest: segment.whyBest,
          seoRanking: segment.seoRanking,
          captions: segmentCaptions,
        });
      }
      console.log(
        `Successfully saved ${shortVideoSegments.length} short videos for project: ${projectId}`,
      );

      // Invalidate projects, project status, and clips caches
      await invalidateProjectCache(projectId);
      const res = await db.select({ userId: projects.userId }).from(projects).where(eq(projects.id, projectId)).limit(1);
      if (res && res.length > 0) {
        await cache.del(`clips:${res[0].userId}`);
      }
    });

    // Step 6: Save transcription results and finalize project status
    await step.run("finalize-analysis-db", async () => {
      if (db) {
        await db
          .update(projects)
          .set({
            status: "ready",
            progress: 100,
            transcript: result.transcript,
            captions: result.captions,
            updatedAt: new Date(),
          })
          .where(eq(projects.id, projectId));
        await invalidateProjectCache(projectId);
      }
      console.log(
        `Successfully transcribed and analyzed video for project: ${projectId}`,
      );
    });

    return {
      success: true,
      result,
      shortVideosCount: shortVideoSegments.length,
    };
  },
);

// ─────────────────────────────────────────────────────────
// FUNCTION: renderShortVideoClip
// Triggered when a user clicks Download on a clip that has
// no exportUrl (or has been edited since last render).
// ─────────────────────────────────────────────────────────
export const renderShortVideoClip = inngest.createFunction(
  {
    id: "render-short-video-clip",
    concurrency: { limit: 3 },
    retries: 2,
    onFailure: async ({ event, step }) => {
      const { clipId } = event.data.event.data;
      await step.run("mark-clip-render-failed", async () => {
        if (db) {
          await db
            .update(shortVideos)
            .set({ renderStatus: "failed", updatedAt: new Date() })
            .where(eq(shortVideos.id, clipId));
          await invalidateClipCache(clipId);
        }
      });
    },
  },
  { event: "clip/render.started" },
  async ({ event, step }) => {
    const { clipId, videoUrl, startTime, endTime, captions, captionStyle } =
      event.data;

    const region = process.env.AWS_REGION || "eu-north-1";
    const serveUrl = process.env.REMOTION_SERVE_URL;
    const functionName = process.env.REMOTION_FUNCTION_NAME;

    if (!serveUrl || !functionName) {
      throw new Error(
        "REMOTION_SERVE_URL or REMOTION_FUNCTION_NAME is not set in environment variables.",
      );
    }

    // Step 1: Mark clip as rendering in the database
    await step.run("mark-clip-rendering", async () => {
      if (!db) return;
      await db
        .update(shortVideos)
        .set({
          renderStatus: "rendering",
          exportUrl: null,
          updatedAt: new Date(),
        })
        .where(eq(shortVideos.id, clipId));
      await invalidateClipCache(clipId);
    });

    // Step 2: Generate a clean presigned URL without x-amz-checksum-mode=ENABLED
    // The stored videoUrl is a presigned URL from the user-facing upload flow.
    // Newer AWS SDK versions add x-amz-checksum-mode=ENABLED which Remotion's
    // headless Chrome cannot handle (causes delayRender timeout).
    // We re-sign the URL using an S3 client with checksum calculation disabled.
    const cleanVideoUrl = await step.run(
      "generate-clean-presigned-url",
      async () => {
        const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
        const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
        const bucketName = process.env.AWS_BUCKET_NAME;

        if (!accessKeyId || !secretAccessKey || !bucketName) {
          // Fallback to stored URL if credentials not available
          console.warn(
            "AWS credentials not available for URL re-signing, using stored URL.",
          );
          return videoUrl;
        }

        try {
          // Parse the S3 key from the stored presigned URL
          // URL format: https://{bucket}.s3.{region}.amazonaws.com/{key}?...
          const urlObj = new URL(videoUrl);
          // pathname starts with '/', remove leading slash to get the key
          const s3Key = decodeURIComponent(urlObj.pathname.slice(1));

          // Create S3 client with checksum validation disabled
          // This prevents x-amz-checksum-mode=ENABLED from being added to presigned URLs
          const s3Clean = new S3Client({
            region,
            credentials: { accessKeyId, secretAccessKey },
            // @ts-ignore — valid in AWS SDK v3.622+
            requestChecksumCalculation: "WHEN_REQUIRED",
            // @ts-ignore
            responseChecksumValidation: "WHEN_REQUIRED",
          });

          const getCommand = new GetObjectCommand({
            Bucket: bucketName,
            Key: s3Key,
          });

          // Generate a 12-hour presigned URL — Lambda render can take minutes
          const freshUrl = await getSignedUrl(s3Clean, getCommand, {
            expiresIn: 43200,
          });

          console.log(
            `✅ Generated clean presigned URL for clip ${clipId} (no checksum mode)`,
          );
          return freshUrl;
        } catch (urlErr) {
          console.error(
            "Failed to re-sign URL, falling back to stored URL:",
            urlErr,
          );
          return videoUrl;
        }
      },
    );

    // Step 3: Start the Remotion Lambda render with the clean URL
    const renderResult = await step.run("start-lambda-render", async () => {
      const { renderId, bucketName } = await renderMediaOnLambda({
        region: region as any,
        functionName,
        serveUrl,
        composition: "ShortVideo",
        inputProps: {
          videoUrl: cleanVideoUrl,
          startTime,
          endTime,
          captions: captions || [],
          captionStyle: captionStyle || null,
        },
        codec: "h264",
        imageFormat: "jpeg",
        maxRetries: 1,
        // Fewer frames per lambda chunk = more reliable loading per invocation
        framesPerLambda: 20,
        privacy: "public",
        outName: `clip-${clipId}-${Date.now()}.mp4`,
        // Give each Lambda invocation 2 minutes to load and render its chunk
        timeoutInMilliseconds: 120000,
      });

      return { renderId, bucketName };
    });

    const { renderId, bucketName } = renderResult;

    // Step 4: Poll for completion (max 20 minutes)
    const exportUrl = await step.run("poll-render-progress", async () => {
      const maxAttempts = 240; // 240 × 5s = 20 min
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const progress = await getRenderProgress({
          renderId,
          bucketName,
          functionName,
          region: region as any,
        });

        // Update progress in DB every 5 attempts (~25s)
        if (attempt % 5 === 0 && db) {
          const pct = Math.round((progress.overallProgress || 0) * 100);
          await db
            .update(shortVideos)
            .set({
              renderStatus: `rendering:${pct}`,
              updatedAt: new Date(),
            })
            .where(eq(shortVideos.id, clipId));
          await invalidateClipCache(clipId);
        }

        if (progress.done) {
          if (progress.outputFile) {
            return progress.outputFile;
          }
          throw new Error(
            `Render completed but no output file. Errors: ${JSON.stringify(progress.errors)}`,
          );
        }

        if (progress.fatalErrorEncountered) {
          throw new Error(
            `Remotion Lambda render failed: ${JSON.stringify(progress.errors)}`,
          );
        }

        // Wait 5 seconds before next poll
        await new Promise((r) => setTimeout(r, 5000));
      }
      throw new Error("Remotion Lambda render timed out after 20 minutes.");
    });

    // Step 5: Save the export URL to the database
    await step.run("save-export-url", async () => {
      if (!db) return;
      await db
        .update(shortVideos)
        .set({
          exportUrl,
          renderStatus: "done",
          updatedAt: new Date(),
        })
        .where(eq(shortVideos.id, clipId));
      await invalidateClipCache(clipId);
    });

    return { success: true, clipId, exportUrl };
  },
);
