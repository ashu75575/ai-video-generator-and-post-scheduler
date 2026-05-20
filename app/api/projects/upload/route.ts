import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { inngest } from "@/lib/inngest/client";
import { promises as fs } from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    // 1. Get Clerk user details
    const authResult = await auth();
    const userId = authResult?.userId;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database connection is not available." }, { status: 500 });
    }

    // 2. Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const fileName = name || file.name;
    const projectId = `proj-${Date.now()}`;

    // 3. Save file locally inside public/uploads workspace directory
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    
    // Use a safe, unique file name to avoid collisions
    const safeFileName = `${projectId}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(uploadDir, safeFileName);
    await fs.writeFile(filePath, buffer);

    console.log(`Saved file locally to ${filePath}`);

    // 4. Register project in the Neon Database
    await db.insert(projects).values({
      id: projectId,
      userId,
      name: fileName,
      status: "uploading",
      progress: 10,
    });
    console.log(`Database record created for project: ${projectId}`);

    // 5. Trigger the background Inngest event
    try {
      await inngest.send({
        name: "video/upload.started",
        data: {
          projectId,
          filePath,
          fileName,
        },
      });
      console.log(`Inngest workflow triggered for event 'video/upload.started' with project: ${projectId}`);
    } catch (inngestError) {
      console.error("❌ Failed to trigger Inngest workflow:", inngestError);
      return NextResponse.json({
        success: false,
        error: "Failed to trigger background processing workflow.",
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      projectId,
      fileName,
      message: "Video upload received. Processing has started.",
    });

  } catch (err: any) {
    console.error("❌ Upload route error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
