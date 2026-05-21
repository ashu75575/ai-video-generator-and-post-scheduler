import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
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

    let videoUrl = "";

    const result = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    videoUrl = result[0].videoUrl || "";

    if (!videoUrl) {
      return NextResponse.json(
        { error: "Project does not have an uploaded video URL yet." },
        { status: 400 },
      );
    }

    // Trigger the analysis Inngest function
    try {
      await inngest.send({
        name: "project/analysis.started",
        data: {
          projectId,
          videoUrl,
        },
      });
      console.log(
        `Inngest workflow triggered for event 'project/analysis.started' with project: ${projectId}`,
      );
    } catch (inngestError) {
      console.error(
        "❌ Failed to trigger Inngest analysis workflow:",
        inngestError,
      );
      return NextResponse.json(
        {
          success: false,
          error: "Failed to trigger background analysis workflow.",
        },
        { status: 500 },
      );
    }

    // Update DB status to transcribing initially
    try {
      await db
        .update(projects)
        .set({ status: "transcribing", progress: 10, updatedAt: new Date() })
        .where(eq(projects.id, projectId));
    } catch (dbError) {
      console.error("❌ Failed to update project status in DB:", dbError);
    }

    return NextResponse.json({
      success: true,
      message: "Project analysis background job triggered successfully.",
    });
  } catch (err: any) {
    console.error("❌ Analyze project route error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
