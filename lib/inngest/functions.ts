import { inngest } from "./client";
import { db } from "../db";
import { projects } from "../db/schema";
import { eq } from "drizzle-orm";
import fs from "fs/promises";
import { existsSync, createReadStream } from "fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const processVideoUpload = inngest.createFunction(
  { id: "process-video-upload" },
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
      }
    });

    // Step 2: Upload to AWS S3
    const videoUrl = await step.run("upload-to-s3", async () => {
      if (db) {
        await db
          .update(projects)
          .set({ status: "uploading", progress: 50, updatedAt: new Date() })
          .where(eq(projects.id, projectId));
      }

      const bucketName = process.env.AWS_BUCKET_NAME;
      const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
      const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
      const region = process.env.AWS_REGION || "us-east-1";

      if (!bucketName || !accessKeyId || !secretAccessKey) {
        throw new Error(
          "AWS S3 environment variables are not fully configured. " +
          "Please check AWS_BUCKET_NAME, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY."
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
        })
      );

      // Construct the actual direct public URL
      const actualUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;

      if (db) {
        await db
          .update(projects)
          .set({ status: "uploading", progress: 85, updatedAt: new Date() })
          .where(eq(projects.id, projectId));
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
      }
      console.log(`Successfully completed upload process for project: ${projectId}`);
    });

    return { success: true, url: videoUrl };
  }
);
