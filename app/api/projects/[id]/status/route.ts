import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, shortVideos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { cache } from "@/lib/redis";

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

    const cacheKey = `project_status:${projectId}`;
    const cached = await cache.get<{
      status?: string;
      progress?: number;
    }>(cacheKey);

    // Never serve cached in-progress statuses — with in-memory cache, Inngest
    // invalidation may not reach the same isolate that served the poll, which
    // leaves the UI stuck (e.g. generating_shorts @ 70%).
    const terminalStatuses = new Set(["ready", "failed", "completed"]);
    if (cached?.status && terminalStatuses.has(cached.status)) {
      console.log(`[CACHE HIT] GET status for project: ${projectId}`);
      return NextResponse.json(cached);
    }

    console.log(`[CACHE MISS] GET status for project: ${projectId}`);
    const result = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const project = result[0];

    // Fetch any generated short videos for this project
    const shorts = await db
      .select()
      .from(shortVideos)
      .where(eq(shortVideos.projectId, projectId));

    const responseData = {
      id: project.id,
      name: project.name,
      status: project.status,
      progress: project.progress,
      videoUrl: project.videoUrl,
      transcript: project.transcript,
      captions: project.captions,
      shortVideos: shorts,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };

    // Only cache terminal states, and keep TTL short so UI recovers quickly.
    if (terminalStatuses.has(project.status)) {
      await cache.set(cacheKey, responseData, 30);
    } else {
      // Drop any stale in-progress entry left from earlier polls.
      await cache.del(cacheKey);
    }

    return NextResponse.json(responseData);
  } catch (err: unknown) {
    console.error("❌ Get project status route error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
