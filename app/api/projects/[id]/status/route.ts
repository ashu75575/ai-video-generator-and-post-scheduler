import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, shortVideos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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

    return NextResponse.json({
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
    });
  } catch (err: any) {
    console.error("❌ Get project status route error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
