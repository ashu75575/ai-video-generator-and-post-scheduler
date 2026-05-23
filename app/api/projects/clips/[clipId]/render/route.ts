import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shortVideos, projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { inngest } from "@/lib/inngest/client";

// GET /api/projects/clips/[clipId]/render
// Returns current render status for polling on the frontend
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clipId: string }> },
) {
  try {
    const { clipId } = await params;

    if (!db) {
      return NextResponse.json(
        { error: "Database connection is not available." },
        { status: 500 },
      );
    }

    const result = await db
      .select()
      .from(shortVideos)
      .where(eq(shortVideos.id, clipId))
      .limit(1);

    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    const clip = result[0];

    return NextResponse.json({
      clipId,
      renderStatus: clip.renderStatus || "pending",
      exportUrl: clip.exportUrl || null,
    });
  } catch (err: any) {
    console.error("❌ Get render status route error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/projects/clips/[clipId]/render
// Triggers an Inngest render job for the given clip
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clipId: string }> },
) {
  try {
    const { clipId } = await params;

    if (!db) {
      return NextResponse.json(
        { error: "Database connection is not available." },
        { status: 500 },
      );
    }

    // Fetch clip details from DB
    const clipResult = await db
      .select()
      .from(shortVideos)
      .where(eq(shortVideos.id, clipId))
      .limit(1);

    if (!clipResult || clipResult.length === 0) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    const clip = clipResult[0];

    // Fetch the parent project to get videoUrl
    const projectResult = await db
      .select()
      .from(projects)
      .where(eq(projects.id, clip.projectId))
      .limit(1);

    if (!projectResult || projectResult.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const project = projectResult[0];

    if (!project.processedUrl) {
      return NextResponse.json(
        { error: "Project processed video URL is not available." },
        { status: 400 },
      );
    }

    // Mark as rendering immediately so UI responds fast
    await db
      .update(shortVideos)
      .set({
        renderStatus: "rendering",
        exportUrl: null,
        updatedAt: new Date(),
      })
      .where(eq(shortVideos.id, clipId));

    // Send the Inngest event to trigger the background render job
    await inngest.send({
      name: "clip/render.started",
      data: {
        clipId,
        videoUrl: project.processedUrl,
        startTime: clip.startTime,
        endTime: clip.endTime,
        captions: clip.captions || [],
        captionStyle: clip.captionStyle || null,
      },
    });

    return NextResponse.json({
      success: true,
      clipId,
      message: "Render job started successfully.",
    });
  } catch (err: any) {
    console.error("❌ Start render route error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
