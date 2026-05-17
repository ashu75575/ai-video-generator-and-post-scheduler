import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./index";
import { users } from "./schema";

export async function checkAndSyncUser() {
  try {
    // 1. If db is not initialized, return early (logs warning from lib/db/index.ts)
    if (!db) {
      return;
    }

    // 2. Check if the user is authenticated with Clerk
    const { userId } = await auth();
    if (!userId) {
      return;
    }

    // 3. Retrieve detailed profile info from Clerk
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return;
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
      console.warn(`User ${clerkUser.id} does not have an email address. Skipping sync.`);
      return;
    }

    const firstName = clerkUser.firstName || null;
    const lastName = clerkUser.lastName || null;
    const imageUrl = clerkUser.imageUrl || null;

    // 4. Perform an "upsert" (insert or update on conflict) in a single highly-optimized query
    await db
      .insert(users)
      .values({
        id: clerkUser.id,
        email,
        firstName,
        lastName,
        imageUrl,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email,
          firstName,
          lastName,
          imageUrl,
          updatedAt: new Date(),
        },
      });

    console.log(`✅ Successfully synced user profile in Neon DB: ${clerkUser.id} (${email})`);
  } catch (error) {
    console.error("❌ Failed to sync user with Neon database:", error);
  }
}
