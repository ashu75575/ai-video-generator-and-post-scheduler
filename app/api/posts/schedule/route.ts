import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { scheduledPosts } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";

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

    const posts = await db
      .select()
      .from(scheduledPosts)
      .where(eq(scheduledPosts.userId, userId))
      .orderBy(desc(scheduledPosts.scheduledTime));

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
