import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shortVideos, projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { cache } from "@/lib/redis";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clipId: string }> },
) {
  try {
    const { clipId } = await params;
    const { captionStyle } = await req.json();

    if (!db) {
      return NextResponse.json(
        { error: "Database connection is not available." },
        { status: 500 },
      );
    }

    const updated = await db
      .update(shortVideos)
      .set({
        captionStyle: captionStyle,
        // Reset export URL — user must re-render after editing caption style
        exportUrl: null,
        renderStatus: "pending",
        updatedAt: new Date(),
      })
      .where(eq(shortVideos.id, clipId))
      .returning();

    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    const clip = updated[0];
    const projectId = clip.projectId;

    // Fetch the project to get userId for cache invalidation
    const projectResult = await db
      .select({ userId: projects.userId })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
    const userId = projectResult?.[0]?.userId;

    if (userId) {
      await Promise.all([
        cache.del(`clip_render_status:${clipId}`),
        cache.del(`project_status:${projectId}`),
        cache.del(`clips:${userId}`),
      ]);
      console.log(
        `[CACHE INVALIDATION] Invalidate clip render status, project status and user clips cache due to clip PATCH`,
      );
    }

    return NextResponse.json({ success: true, clip });
  } catch (err: any) {
    console.error("❌ Update short video clip route error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
