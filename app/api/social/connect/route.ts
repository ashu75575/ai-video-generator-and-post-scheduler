import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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

    const { searchParams } = new URL(req.url);
    const platform = searchParams.get("platform");

    if (!platform) {
      return NextResponse.json(
        { error: "Missing query parameter: platform" },
        { status: 400 },
      );
    }

    const zernioApiKey = process.env.ZERNIO_API_KEY;
    if (!zernioApiKey) {
      return NextResponse.json(
        { error: "Zernio API is not configured on the server." },
        { status: 500 },
      );
    }

    // 1. Fetch user details from DB
    let userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // If user is not found or not synced in DB yet, sync from Clerk
    if (!userResult || userResult.length === 0) {
      const clerkUser = await currentUser();
      if (!clerkUser) {
        return NextResponse.json(
          { error: "User profile not found in database or Clerk." },
          { status: 404 },
        );
      }
      const email =
        clerkUser.emailAddresses[0]?.emailAddress || `${userId}@clipforge.ai`;
      await db.insert(users).values({
        id: userId,
        email,
        firstName: clerkUser.firstName || null,
        lastName: clerkUser.lastName || null,
        imageUrl: clerkUser.imageUrl || null,
      });
      userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
    }

    let profileId = userResult[0].zernioProfileId;

    // 2. If user doesn't have a profileId, create a new Zernio Profile
    if (!profileId) {
      const userEmail = userResult[0].email;
      const profileName = `ClipForge - ${userResult[0].firstName || ""} (${userEmail})`;

      console.log(`Creating Zernio profile for user: ${userId}`);

      const createResponse = await fetch("https://zernio.com/api/v1/profiles", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${zernioApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: profileName,
          description: `Zernio profile for ClipForge user ${userId}`,
        }),
      });

      if (!createResponse.ok) {
        const errText = await createResponse.text();
        throw new Error(
          `Zernio Profile creation failed: ${createResponse.status} ${errText}`,
        );
      }

      const createData = await createResponse.json();
      const newProfileId = createData.profile?._id || createData.profile?.id;

      if (!newProfileId) {
        throw new Error("Failed to retrieve profile ID from Zernio response");
      }

      profileId = newProfileId;

      // Update DB with the new profile ID
      await db
        .update(users)
        .set({ zernioProfileId: profileId, updatedAt: new Date() })
        .where(eq(users.id, userId));

      console.log(
        `Zernio profile ${profileId} saved to database for user: ${userId}`,
      );
    }

    // 3. Connect to the platform and retrieve Auth URL
    // Endpoint: GET https://zernio.com/api/v1/connect/[platform]?profileId=[profileId]
    console.log(`Connecting platform ${platform} for profile ${profileId}`);

    const origin = req.nextUrl.origin;
    const redirectUrl = `${origin}/dashboard/social-connections`;
    const connectUrl = `https://zernio.com/api/v1/connect/${platform}?profileId=${profileId}&redirectUrl=${encodeURIComponent(redirectUrl)}&redirect_url=${encodeURIComponent(redirectUrl)}&callbackUrl=${encodeURIComponent(redirectUrl)}`;
    const connectResponse = await fetch(connectUrl, {
      headers: {
        Authorization: `Bearer ${zernioApiKey}`,
      },
    });

    if (!connectResponse.ok) {
      const errText = await connectResponse.text();
      throw new Error(
        `Zernio Connection URL request failed: ${connectResponse.status} ${errText}`,
      );
    }

    const connectData = await connectResponse.json();
    const authUrl = connectData.authUrl || connectData.auth_url;

    if (!authUrl) {
      throw new Error("No authentication URL returned from Zernio");
    }

    return NextResponse.json({
      success: true,
      authUrl,
    });
  } catch (err: any) {
    console.error("❌ GET Zernio connect error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
