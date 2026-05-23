import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createWriteStream } from "fs";
import fs from "fs/promises";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

function getS3Client() {
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

  // Disable checksum calculation/validation in newer SDKs for Remotion compatibility
  const s3 = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    // @ts-ignore
    requestChecksumCalculation: "WHEN_REQUIRED",
    // @ts-ignore
    responseChecksumValidation: "WHEN_REQUIRED",
  });

  return { s3, bucketName };
}

/**
 * Downloads a file from S3 to a local disk path.
 */
export async function downloadFromS3(
  s3Key: string,
  localFilePath: string,
): Promise<void> {
  const { s3, bucketName } = getS3Client();
  console.log(
    `[S3] Downloading s3://${bucketName}/${s3Key} to ${localFilePath}`,
  );

  const response = await s3.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
    }),
  );

  if (!response.Body) {
    throw new Error(`S3 Object response body is empty for key: ${s3Key}`);
  }

  const writeStream = createWriteStream(localFilePath);
  await pipeline(response.Body as Readable, writeStream);
  console.log(`[S3] Download complete: ${localFilePath}`);
}

/**
 * Uploads a local file to S3 and returns a presigned URL valid for 7 days.
 */
export async function uploadToS3(
  localFilePath: string,
  s3Key: string,
  contentType: string = "video/mp4",
): Promise<{ presignedUrl: string; s3Key: string }> {
  const { s3, bucketName } = getS3Client();
  console.log(`[S3] Uploading ${localFilePath} to s3://${bucketName}/${s3Key}`);

  const fileBuffer = await fs.readFile(localFilePath);

  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: contentType,
    }),
  );

  // Generate a presigned URL to allow downstream services (Deepgram, Lambda) to access it
  const getCommand = new GetObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
  });
  const presignedUrl = await getSignedUrl(s3, getCommand, {
    expiresIn: 604800, // Valid for 7 days
  });

  console.log(`[S3] Upload complete. Generated presigned URL.`);
  return { presignedUrl, s3Key };
}
