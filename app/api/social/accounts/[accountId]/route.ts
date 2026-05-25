import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, socialAccounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ accountId: string }> },
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

    const { accountId } = await params;

    // Fetch user details to verify profile mapping and key configuration
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userResult || userResult.length === 0 || !userResult[0].zernioProfileId) {
      return NextResponse.json(
        { error: "Zernio connection profile not found for user." },
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

    console.log(`Deleting social account ${accountId} from Zernio`);

    const response = await fetch(`https://zernio.com/api/v1/accounts/${accountId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${zernioApiKey}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Zernio Disconnect API failed: ${response.status} ${errText}`);
    }

    // Delete social account from our local database
    await db
      .delete(socialAccounts)
      .where(
        and(
          eq(socialAccounts.id, accountId),
          eq(socialAccounts.userId, userId),
        ),
      );

    return NextResponse.json({
      success: true,
      message: "Social channel disconnected successfully.",
    });
  } catch (err: any) {
    console.error("❌ DELETE Zernio account error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
