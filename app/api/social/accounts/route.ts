import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, socialAccounts } from "@/lib/db/schema";
import { eq, and, notInArray } from "drizzle-orm";

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

    // Fetch user details from DB
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userResult || userResult.length === 0) {
      return NextResponse.json({ success: true, accounts: [] });
    }

    const profileId = userResult[0].zernioProfileId;
    if (!profileId) {
      // No profile created yet means no connected accounts
      return NextResponse.json({ success: true, accounts: [] });
    }

    const zernioApiKey = process.env.ZERNIO_API_KEY;
    if (!zernioApiKey) {
      console.warn("⚠️ ZERNIO_API_KEY is not configured.");
      return NextResponse.json(
        { error: "Zernio API is not configured on the server." },
        { status: 500 },
      );
    }

    // Call Zernio API to get accounts
    const response = await fetch("https://zernio.com/api/v1/accounts", {
      headers: {
        Authorization: `Bearer ${zernioApiKey}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Zernio API failed: ${response.status} ${errText}`);
    }

    const data = await response.json();
    const accounts = data.accounts || [];

    // Filter accounts belonging to this user's profile
    const userAccounts = accounts.filter((acc: any) => {
      const pId = acc.profileId || acc.profile || acc.profile_id;
      if (!pId) return false;
      if (typeof pId === "object") {
        return pId._id === profileId || pId.id === profileId;
      }
      return pId === profileId;
    });

    // Synchronize with our local social_accounts table in the database
    const activeIds = userAccounts.map((acc: any) => acc._id || acc.id);

    if (activeIds.length > 0) {
      // Upsert current connections
      for (const acc of userAccounts) {
        const id = acc._id || acc.id;
        await db
          .insert(socialAccounts)
          .values({
            id,
            userId,
            platform: acc.platform,
            handle: acc.handle || acc.username || acc.name || null,
            name: acc.name || null,
            profileId,
          })
          .onConflictDoUpdate({
            target: socialAccounts.id,
            set: {
              handle: acc.handle || acc.username || acc.name || null,
              name: acc.name || null,
              updatedAt: new Date(),
            },
          });
      }

      // Delete stale connections
      await db
        .delete(socialAccounts)
        .where(
          and(
            eq(socialAccounts.userId, userId),
            notInArray(socialAccounts.id, activeIds),
          ),
        );
    } else {
      // Clear out connections if none are active on Zernio
      await db.delete(socialAccounts).where(eq(socialAccounts.userId, userId));
    }

    // Fetch synced connections from database to return
    const dbAccounts = await db
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.userId, userId));

    return NextResponse.json({
      success: true,
      accounts: dbAccounts.map((acc) => ({
        _id: acc.id,
        platform: acc.platform,
        handle: acc.handle,
        name: acc.name,
        profileId: acc.profileId,
        createdAt: acc.createdAt,
      })),
    });
  } catch (err: any) {
    console.error("❌ GET Zernio accounts error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
