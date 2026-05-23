import { db } from "../db";
import { projects } from "../db/schema";
import { eq } from "drizzle-orm";
import { VideoMetadata } from "./validation";

/**
 * Creates a project row in the database.
 */
export async function createProjectRow(
  projectId: string,
  userId: string,
  fileName: string,
  originalUrl: string,
): Promise<void> {
  if (!db) return;
  console.log(`[DB] Creating database record for project: ${projectId}`);
  await db
    .insert(projects)
    .values({
      id: projectId,
      userId,
      name: fileName,
      status: "uploaded",
      originalUrl,
      progress: 20,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: projects.id,
      set: {
        userId,
        name: fileName,
        status: "uploaded",
        originalUrl,
        progress: 20,
        updatedAt: new Date(),
      },
    });
}

/**
 * Updates a project's processing status and progress in the database.
 */
export async function updateProjectStatus(
  projectId: string,
  status: "uploaded" | "validating" | "processing" | "ready" | "failed",
  progress: number,
): Promise<void> {
  if (!db) return;
  console.log(
    `[DB] Updating project ${projectId} status to "${status}" (progress: ${progress}%)`,
  );
  await db
    .update(projects)
    .set({
      status,
      progress,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId));
}

/**
 * Saves project technical metadata extracted from ffprobe.
 */
export async function updateProjectMetadata(
  projectId: string,
  metadata: VideoMetadata,
): Promise<void> {
  if (!db) return;
  console.log(
    `[DB] Saving metadata for project ${projectId}: duration=${metadata.duration}s, fps=${metadata.fps}`,
  );
  await db
    .update(projects)
    .set({
      duration: metadata.duration,
      fps: metadata.fps,
      codec: metadata.codec,
      width: metadata.width,
      height: metadata.height,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId));
}

/**
 * Finalizes the project's preprocessing stage and saves the S3 processed URL.
 */
export async function updateProjectProcessed(
  projectId: string,
  processedUrl: string,
): Promise<void> {
  if (!db) return;
  console.log(`[DB] Saving processed URL for project ${projectId}`);
  await db
    .update(projects)
    .set({
      processedUrl,
      videoUrl: processedUrl, // Keep videoUrl in sync for backward compatibility
      status: "ready",
      progress: 100,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId));
}

/**
 * Sets project status to failed and saves the error message.
 */
export async function updateProjectError(
  projectId: string,
  errorMessage: string,
): Promise<void> {
  if (!db) return;
  console.log(
    `[DB] Marking project ${projectId} as failed. Error: ${errorMessage}`,
  );
  await db
    .update(projects)
    .set({
      status: "failed",
      processingError: errorMessage,
      progress: 100, // completed failure state
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId));
}
