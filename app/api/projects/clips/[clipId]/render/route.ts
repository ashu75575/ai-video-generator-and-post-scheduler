import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shortVideos, projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { inngest } from "@/lib/inngest/client";
import { cache } from "@/lib/redis";

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

    const cacheKey = `clip_render_status:${clipId}`;
    const cached = await cache.get<any>(cacheKey);
    if (cached) {
      console.log(`[CACHE HIT] GET render status for clip: ${clipId}`);
      return NextResponse.json(cached);
    }

    console.log(`[CACHE MISS] GET render status for clip: ${clipId}`);
    const result = await db
      .select()
      .from(shortVideos)
      .where(eq(shortVideos.id, clipId))
      .limit(1);

    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    const clip = result[0];

    const responseData = {
      clipId,
      renderStatus: clip.renderStatus || "pending",
      exportUrl: clip.exportUrl || null,
    };

    // Cache rendering status for 5 minutes (300 seconds) for polling efficiency
    await cache.set(cacheKey, responseData, 300);

    return NextResponse.json(responseData);
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

    // Fetch the parent project to get videoUrl and userId
    const projectResult = await db
      .select()
      .from(projects)
      .where(eq(projects.id, clip.projectId))
      .limit(1);

    if (!projectResult || projectResult.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const project = projectResult[0];

    if (!project.videoUrl) {
      return NextResponse.json(
        { error: "Project video URL is not available." },
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

    // Invalidate caches because database state has changed
    const userId = project.userId;
    await Promise.all([
      cache.del(`clip_render_status:${clipId}`),
      cache.del(`project_status:${clip.projectId}`),
      cache.del(`clips:${userId}`),
    ]);

    console.log(
      `[CACHE INVALIDATION] Invalidate clip render status, project status and user clips cache due to render start`,
    );

    // Send the Inngest event to trigger the background render job
    await inngest.send({
      name: "clip/render.started",
      data: {
        clipId,
        videoUrl: project.videoUrl,
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
