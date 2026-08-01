import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getGroqClient, groqJsonCompletion } from "@/lib/groq";

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

    const { clipTitle, transcript, platform } = await req.json();

    if (!clipTitle || !transcript || !platform) {
      return NextResponse.json(
        { error: "Missing required fields: clipTitle, transcript, platform" },
        { status: 400 },
      );
    }

    if (!getGroqClient()) {
      return NextResponse.json(
        { error: "AI service is currently unavailable." },
        { status: 500 },
      );
    }

    const parsed = await groqJsonCompletion<{
      title: string;
      caption: string;
    }>(`You are an expert social media manager and content creator.
Your job is to write a highly engaging social media post/caption with relevant hashtags for a short vertical video clip.
The post is going to be published on the "${platform}" platform.

Clip Title: ${clipTitle}
Clip Transcript:
${transcript}

Write a post content that contains:
1. An eye-catching, engaging headline or hook at the very beginning.
2. A short, compelling description of the value or takeaway from the video.
3. 3-5 highly relevant, high-impact hashtags matching the platform style.
4. If the platform is "YouTube Shorts", also generate a clean YouTube Title (max 70 characters) that stands out. Otherwise, for TikTok or Instagram Reels, you can output a recommended video title.

Output the result strictly as a JSON object matching this schema:
{
  "title": "A compelling title/headline",
  "caption": "The complete post caption with emojis, spacing, and hashtags"
}`);

    return NextResponse.json({
      success: true,
      title: parsed.title,
      caption: parsed.caption,
    });
  } catch (err: any) {
    console.error("❌ GET AI generated post error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
