import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shortVideos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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
        updatedAt: new Date(),
      })
      .where(eq(shortVideos.id, clipId))
      .returning();

    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, clip: updated[0] });
  } catch (err: any) {
    console.error("❌ Update short video clip route error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
