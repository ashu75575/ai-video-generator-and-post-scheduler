import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, shortVideos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;

    if (!db) {
      return NextResponse.json(
        { error: "Database connection is not available." },
        { status: 500 },
      );
    }

    const result = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    const project = result?.[0];

    // Fetch any generated short videos for this project
    const shorts = project
      ? await db
          .select()
          .from(shortVideos)
          .where(eq(shortVideos.projectId, projectId))
      : [];

    if (!project) {
      return NextResponse.json({
        id: projectId,
        name: "Processing...",
        status: "uploading",
        progress: 10,
        videoUrl: null,
        originalUrl: null,
        processedUrl: null,
        processingError: null,
        duration: null,
        fps: null,
        codec: null,
        width: null,
        height: null,
        transcript: null,
        captions: null,
        shortVideos: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      id: project.id,
      name: project.name,
      status: project.status,
      progress: project.progress,
      videoUrl: project.videoUrl,
      originalUrl: project.originalUrl,
      processedUrl: project.processedUrl,
      processingError: project.processingError,
      duration: project.duration,
      fps: project.fps,
      codec: project.codec,
      width: project.width,
      height: project.height,
      transcript: project.transcript,
      captions: project.captions,
      shortVideos: shorts,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    });
  } catch (err: any) {
    console.error("❌ Get project status route error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
