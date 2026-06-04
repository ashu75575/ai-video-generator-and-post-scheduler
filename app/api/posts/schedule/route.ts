import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { scheduledPosts } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";
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

    const cacheKey = `scheduled_posts:${userId}`;
    const cached = await cache.get<any[]>(cacheKey);
    if (cached) {
      console.log(`[CACHE HIT] GET scheduled posts for user: ${userId}`);
      return NextResponse.json({
        success: true,
        posts: cached,
      });
    }

    console.log(`[CACHE MISS] GET scheduled posts for user: ${userId}`);
    const posts = await db
      .select()
      .from(scheduledPosts)
      .where(eq(scheduledPosts.userId, userId))
      .orderBy(desc(scheduledPosts.scheduledTime));

    // Cache scheduled posts for 1 hour (3600 seconds)
    await cache.set(cacheKey, posts, 3600);

    return NextResponse.json({
      success: true,
      posts,
    });
  } catch (err: any) {
    console.error("❌ GET scheduled posts error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { clipId, title, caption, platform, scheduledTime } = body;

    if (!title || !caption || !platform || !scheduledTime) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: title, caption, platform, scheduledTime",
        },
        { status: 400 },
      );
    }

    const newPostId = `post-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

    const newPost = await db
      .insert(scheduledPosts)
      .values({
        id: newPostId,
        userId,
        clipId: clipId || null,
        title,
        caption,
        platform,
        scheduledTime: new Date(scheduledTime),
        status: "pending",
      })
      .returning();

    // Invalidate scheduled posts cache for this user
    await cache.del(`scheduled_posts:${userId}`);
    console.log(`[CACHE INVALIDATION] Invalidate scheduled_posts:${userId} due to new scheduled post`);

    return NextResponse.json({
      success: true,
      post: newPost[0],
    });
  } catch (err: any) {
    console.error("❌ POST schedule post error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}

