import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  processVideoUpload,
  processVideoPipeline,
  analyzeProjectVideo,
  renderShortVideoClip,
} from "@/lib/inngest/functions";

// Create an API route that serves Inngest functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processVideoUpload,
    processVideoPipeline,
    analyzeProjectVideo,
    renderShortVideoClip,
  ],
});
