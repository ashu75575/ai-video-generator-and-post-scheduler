import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { projects, shortVideos } from "@/lib/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import { cache } from "@/lib/redis";

export async function GET(req: NextRequest) {
  try {
    const authResult = await auth();
    const userId = authResult?.userId;
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in first." },
        { status: 401 },
      );
    }

    if (!db) {
      return NextResponse.json(
        { error: "Database connection is not available." },
        { status: 500 },
      );
    }

    const cacheKey = `clips:${userId}`;
    const cached = await cache.get<any[]>(cacheKey);
    if (cached) {
      console.log(`[CACHE HIT] GET clips for user: ${userId}`);
      return NextResponse.json({
        success: true,
        clips: cached,
      });
    }

    console.log(`[CACHE MISS] GET clips for user: ${userId}`);
    // Fetch all successfully exported clips belonging to this user
    const userClips = await db
      .select({
        id: shortVideos.id,
        projectId: shortVideos.projectId,
        title: shortVideos.title,
        startTime: shortVideos.startTime,
        endTime: shortVideos.endTime,
        whyBest: shortVideos.whyBest,
        seoRanking: shortVideos.seoRanking,
        captions: shortVideos.captions,
        captionStyle: shortVideos.captionStyle,
        exportUrl: shortVideos.exportUrl,
        renderStatus: shortVideos.renderStatus,
        projectName: projects.name,
        createdAt: shortVideos.createdAt,
        updatedAt: shortVideos.updatedAt,
      })
      .from(shortVideos)
      .innerJoin(projects, eq(shortVideos.projectId, projects.id))
      .where(
        and(
          eq(projects.userId, userId),
          eq(shortVideos.renderStatus, "done"),
          isNotNull(shortVideos.exportUrl),
        ),
      );

    // Cache user clips for 1 hour (3600 seconds)
    await cache.set(cacheKey, userClips, 3600);

    return NextResponse.json({
      success: true,
      clips: userClips,
    });
  } catch (err: any) {
    console.error("❌ GET user clips route error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}

