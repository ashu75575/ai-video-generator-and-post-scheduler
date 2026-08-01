import { Inngest } from "inngest";

// Create an Inngest client to send and receive events.
// With INNGEST_DEV=1, events are sent to the local Dev Server (no cloud event key needed).
export const inngest = new Inngest({
  id: "clipforge-ai",
  isDev:
    process.env.INNGEST_DEV === "1" || process.env.NODE_ENV === "development",
});
