import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  real,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk User ID (e.g. user_2d...)
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  status: text("status").default("pending").notNull(), // "pending", "uploading", "completed", "failed", "transcribing", "ready"
  progress: integer("progress").default(0).notNull(),
  videoUrl: text("video_url"),
  transcript: text("transcript"),
  captions: jsonb("captions"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const shortVideos = pgTable("short_videos", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  startTime: real("start_time").notNull(),
  endTime: real("end_time").notNull(),
  whyBest: text("why_best").notNull(),
  seoRanking: integer("seo_ranking").notNull(),
  captions: jsonb("captions"),
  captionStyle: jsonb("caption_style"),
  exportUrl: text("export_url"),
  renderJobId: text("render_job_id"),
  renderStatus: text("render_status").default("pending"), // "pending" | "rendering" | "done" | "failed"
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const scheduledPosts = pgTable("scheduled_posts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  clipId: text("clip_id")
    .references(() => shortVideos.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  caption: text("caption").notNull(),
  platform: text("platform").notNull(), // "TikTok" | "Instagram Reels" | "YouTube Shorts"
  scheduledTime: timestamp("scheduled_time", { withTimezone: true }).notNull(),
  status: text("status").default("pending").notNull(), // "pending" | "posted" | "failed"
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type ShortVideo = typeof shortVideos.$inferSelect;
export type NewShortVideo = typeof shortVideos.$inferInsert;

export type ScheduledPost = typeof scheduledPosts.$inferSelect;
export type NewScheduledPost = typeof scheduledPosts.$inferInsert;
