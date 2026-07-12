import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
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

    const cacheKey = `projects:${userId}`;
    const cached = await cache.get<any[]>(cacheKey);
    if (cached) {
      console.log(`[CACHE HIT] GET projects for user: ${userId}`);
      return NextResponse.json({
        success: true,
        projects: [], 
      });
    }

    console.log(`[CACHE MISS] GET projects for user: ${userId}`);
    const userProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.createdAt));

    // Cache user projects for 1 hour (3600 seconds)
    await cache.set(cacheKey, userProjects, 3600);

    return NextResponse.json({
      success: true,
      projects: userProjects,
    });
  } catch (err: any) {
    console.error("❌ GET projects route error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}

