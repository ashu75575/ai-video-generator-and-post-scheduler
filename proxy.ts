import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define routes that do not require Clerk authentication
// Mark Inngest endpoint as public so Inngest dev server / cloud can communicate with it
const isPublicRoute = createRouteMatcher([
  "/api/inngest(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
