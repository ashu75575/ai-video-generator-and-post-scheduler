import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { scheduledPosts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id: postId } = await params;

    const deleted = await db
      .delete(scheduledPosts)
      .where(
        and(eq(scheduledPosts.id, postId), eq(scheduledPosts.userId, userId)),
      )
      .returning();

    if (!deleted || deleted.length === 0) {
      return NextResponse.json(
        { error: "Scheduled post not found or unauthorized" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Scheduled post cancelled successfully.",
      post: deleted[0],
    });
  } catch (err: any) {
    console.error("❌ DELETE scheduled post error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
