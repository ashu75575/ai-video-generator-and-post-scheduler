import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest) {
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
    const { firstName, lastName } = body;

    // Validate that at least one value is provided
    if (firstName === undefined && lastName === undefined) {
      return NextResponse.json(
        { error: "Missing fields. Provide firstName or lastName to update." },
        { status: 400 },
      );
    }

    // Perform database update
    await db
      .update(users)
      .set({
        firstName: firstName !== undefined ? firstName || null : undefined,
        lastName: lastName !== undefined ? lastName || null : undefined,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    console.log(
      `✅ Successfully updated profile in Neon DB for user: ${userId}`,
    );

    return NextResponse.json({
      success: true,
      message: "User profile updated successfully in Neon DB.",
    });
  } catch (err: any) {
    console.error("❌ PATCH user profile error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
