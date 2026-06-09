# 🎬 ClipForge AI — Video Generator & Post Scheduler

ClipForge AI is an advanced, automated, enterprise-grade video processing application built with [Next.js](https://nextjs.org) and [Remotion](https://www.remotion.dev). It enables users to upload long-form video content, automatically transcribe audio, extract the most engaging highlights using Google Gemini AI, style customizable captions, render short vertical video compositions using AWS Lambda, and schedule posts across major platforms (TikTok, Instagram Reels, YouTube Shorts) utilizing the Zernio API.

---

## 🚀 Key Features

- **Secure Video Uploads**: Validated by [Arcjet](https://arcjet.com) Web Application Firewall (Shield), bot protection, and user-rate limits (3 uploads/day).
- **Deepgram AI Speech-to-Text**: Fast, sub-second transcription with word-level start and end timestamps.
- **Gemini AI Viral Highlight Identification**: Auto-clipping driven by [Gemini 2.5 Flash](https://aistudio.google.com) to find engaging, hook-centric moments with explainability and SEO ranking metrics.
- **Dynamic Caption Generator**: Grouped, multi-word stylized text overlays supporting user-defined custom properties (font family, colors, shadows, border-radii, backgrounds, scale adjustments).
- **Headless AWS Lambda Rendering**: Powered by Remotion Lambda for distributed, highly parallelized, fast rendering of 9:16 vertical compositions.
- **Social Accounts Connection & Post Scheduler**: Full cross-platform account authentication, account sync, and scheduled publishing pipeline driven by the [Zernio API](https://zernio.com).
- **Robust Background Pipelines & Failure Recovery**: Managed by [Inngest](https://www.inngest.com) for event-driven, fault-tolerant execution steps with configured retries, `onFailure` status update/cache invalidation hooks, and client-side retry/recovery options (e.g. Retry Analysis, Retry Render).
- **Redis Caching Layer**: High-performance caching using Redis (via `ioredis` with an in-memory fallback cache) to cache server-side queries for projects, clips, and scheduled posts, invalidating cache states automatically via event hooks in Inngest background tasks.
- **User Profile Settings**: Dedicated account configuration settings page coupled with dynamic Clerk database syncing APIs.

---


### Component Breakdown

1.  **Frontend (Next.js client-side UI)**: Uses [DM Sans](https://fonts.google.com/specimen/DM+Sans) and [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk), glassmorphism cards, and Framer Motion transitions. Includes a dedicated Settings page to configure profiles, and a player component integrating `@remotion/player` for live, real-time caption styling preview before rendering.
2.  **API Gateway (Next.js App Router)**: Standardized serverless routes for uploading media, querying project analysis statuses, updating user profile settings, generating captions, connecting social profiles, and scheduling posts.
3.  **Security Layer (Arcjet)**: Runs on the edge/serverless boundaries in [lib/arcjet.ts](file:///Users/ishpaulsingh/Desktop/ai%20video%20generator%20and%20post%20scheduler/lib/arcjet.ts) to intercept requests before executing business logic, protecting against bots and malicious prompt injections.
4.  **Database Layer (Neon + Drizzle ORM)**: PostgreSQL schemas located in [lib/db/schema.ts](file:///Users/ishpaulsingh/Desktop/ai%20video%20generator%20and%20post%20scheduler/lib/db/schema.ts) that represent relations between user records, project statuses, short clip metadata, social platform credentials, and scheduled queues.
5.  **Distributed Video Rendering Pipeline (AWS Lambda + Remotion)**: Renders composition files dynamically. Sources video from S3 via re-signed query links with checksum calculation disabled, avoiding browser-level render delays.
6.  **Background Processor (Inngest Dev/Production Server)**: An external runner that polls the Next.js API `/api/inngest` endpoint to run decoupled steps in [lib/inngest/functions.ts](file:///Users/ishpaulsingh/Desktop/ai%20video%20generator%20and%20post%20scheduler/lib/inngest/functions.ts) with concurrency limitations, automated state-polling retry logic (configured with `retries: 2` and `onFailure` fallback logic to clean up temporary files/assets and mark project status as `failed` in db).
7.  **Caching Layer (Redis / In-memory)**: Defined in [lib/redis.ts](file:///Users/ishpaulsingh/Desktop/ai%20video%20generator%20and%20post%20scheduler/lib/redis.ts). Uses Redis (via `ioredis` with an in-memory fallback cache) to cache server-side queries for projects, clips, and scheduled posts, invalidating cache states automatically via event hooks in Inngest background tasks.

---

## 🛠️ Database Schema Design

The application's relational data model is defined inside [lib/db/schema.ts](file:///Users/ishpaulsingh/Desktop/ai%20video%20generator%20and%20post%20scheduler/lib/db/schema.ts):

- **`users`**: Synced profile record of users authenticated via Clerk. Contains user info and their corresponding `zernioProfileId`.
- **`projects`**: Tracks uploaded source videos. Columns include execution state (`status` e.g., transcribing, ready), progress percentage, original S3 video URL, full transcript text, and complete transcript captions JSON.
- **`short_videos`**: Holds individual clips segmented from long videos. Columns include start/end boundaries, AI rating details, customized caption styles JSON, export URL, and Remotion rendering job metrics (`renderStatus` and `renderJobId`).
- **`social_accounts`**: Stores profiles connected via Zernio (TikTok, YouTube, Instagram, etc.), matching their profile indicators back to local user identifiers.
- **`scheduled_posts`**: Post schedule configurations, storing the target platform, scheduled time, post title/description copy, and execution queue status (`pending`, `posted`, `failed`).

---

## 📋 Prerequisites

Ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org) (v18.x or v20.x recommended)
- [npm](https://www.npmjs.com) or [pnpm](https://pnpm.io)
- An AWS Account (with IAM user permissions for S3 and Lambda)
- Accounts & API keys for the third-party providers listed in the environment variables setup below.

---

## ⚙️ Setup and Installation Guide

### Step 1: Clone the Repository

```bash
git clone https://github.com/ashu75575/ai-video-generator-and-post-scheduler.git
cd "ai video generator and post scheduler"
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

1. Copy the environment variables template file:
   ```bash
   cp .env.example .env
   ```
2. Open the newly created `.env` file and populate it with your specific API credentials. For details on what each variable does and where to get them, inspect [.env.example](file:///Users/ishpaulsingh/Desktop/ai%20video%20generator%20and%20post%20scheduler/.env.example).

> [!IMPORTANT]
> Make sure `DATABASE_URL` is set to your Neon PostgreSQL database, and your S3 bucket allows read access for Remotion Lambda renders.

### Step 4: Sync the Database Schema

Sync your schemas directly with Neon PostgreSQL using Drizzle Kit:

```bash
npx drizzle-kit push
```

If you need to view and manage database tables locally, run:

```bash
npx drizzle-kit studio
```

### Step 5: Setup and Start Inngest Local Dev Server

Inngest is used to handle background video uploads, transcription calls, AI clipping, and video rendering state loops.

Start the Inngest local simulator pointing to your application's API endpoint:

```bash
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```

Keep this process running in a separate terminal window.

### Step 6: Deploy Remotion Lambda (AWS Setup)

To enable video rendering on AWS Lambda, you need to configure and deploy the Remotion project:

1. **Deploy the Lambda Function**:
   Run the following command to set up the necessary Lambda function layers in your preferred AWS region (must match `AWS_REGION` in `.env`):
   ```bash
   npx remotion lambda functions deploy --region=eu-north-1
   ```
2. **Deploy the Render Site Bundle**:
   Bundles your composition components (located in [remotion/ShortVideoComposition.tsx](file:///Users/ishpaulsingh/Desktop/ai%20video%20generator%20and%20post%20scheduler/remotion/ShortVideoComposition.tsx)) and uploads them to an S3 site bundle:
   ```bash
   npx remotion lambda sites create remotion/index.ts --site-name=clipforge-site --region=eu-north-1
   ```
3. **Update Environment variables**:
   Once the site is created and the function is deployed:
   - Copy the S3 URL generated during the site creation process and save it as `REMOTION_SERVE_URL` in `.env`.
   - Copy the generated S3 bucket name and save it as `REMOTION_BUCKET_NAME`.
   - Run `npx remotion lambda functions ls --region=eu-north-1` to view your function names. Copy the exact function name and save it as `REMOTION_FUNCTION_NAME`.

---

## 🖥️ Running the Project in Localhost

To run ClipForge AI locally, you must run the Next.js development server and the Inngest dev server concurrently:

1.  **Start Inngest Dev Server** (in Terminal A):
    ```bash
    npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
    ```
2.  **Start Next.js App** (in Terminal B):
    ```bash
    npm run dev
    ```
3.  Open [http://localhost:3000](http://localhost:3000) on your web browser.
4.  Open the Inngest dashboard at [http://localhost:8288](http://localhost:8288) to monitor background jobs and event delivery logs.

---

## 🔗 Zernio Social Media Setup

ClipForge AI integrates with Zernio to link and post to TikTok, YouTube, and Instagram:

1.  When a user links an account, the backend route [app/api/social/connect/route.ts](file:///Users/ishpaulsingh/Desktop/ai%20video%20generator%20and%20post%20scheduler/app/api/social/connect/route.ts) checks if the user has a linked `zernioProfileId` in the local DB.
2.  If not, it calls Zernio's `/api/v1/profiles` endpoint using the `ZERNIO_API_KEY` to create a new profile for the user and saves it.
3.  It then fetches an oauth URL from Zernio (`https://zernio.com/api/v1/connect/[platform]`) and redirects the user to complete social authentication.
4.  Once connected, the accounts are synced locally in the database via the API route [app/api/social/accounts/route.ts](file:///Users/ishpaulsingh/Desktop/ai%20video%20generator%20and%20post%20scheduler/app/api/social/accounts/route.ts).

---

## 🤝 Contributing Guide

We welcome contributions to ClipForge AI! Please review these guidelines before submitting a Pull Request (PR).

### Development Process & Branching Strategy

We follow the standard Git Flow branching model:

- `main`: Holds the current production-ready stable release. Direct commits to `main` are strictly forbidden.
- `develop`: The integration branch for features and fixes.
- `feature/your-feature-name`: Branch off of `develop` for individual features.
- `bugfix/your-fix-name`: Branch off of `develop` for bug fixes.

**Pull Request Workflow**:

1. Branch off `develop` to create your feature branch: `git checkout -b feature/my-cool-feature`.
2. Commit your changes locally. Follow the commit style guide below.
3. Push to your origin branch and open a Pull Request targeting `develop`.
4. Ensure the codebase passes building (`npm run build`) and linting rules (`npm run lint`).
5. A project maintainer will review the code before merging.

### Commit Message Guidelines

We use conventional commit format. Commit messages must follow this structure:

```
<type>(<scope>): <short summary description>
```

**Types**:

- `feat`: A new feature (e.g. `feat(captions): add custom font size controls`).
- `fix`: A bug fix (e.g. `fix(lambda): resolve checksum issue with AWS URL signing`).
- `docs`: Documentation changes only.
- `style`: Code layout adjustments, indentation, prettier updates (no functional changes).
- `refactor`: Structural code edits that do not alter public APIs or fix bugs.
- `perf`: Performance optimizations.
- `test`: Adding or correcting tests.

### Code Style & UX Consistency

This project adheres to a strict styling policy:

1.  **Dark Mode First**: The system utilizes a deep near-black background (`#05050A`). Do not add light theme toggles.
2.  **Typography**: Always use `font-sans` ([DM Sans](https://fonts.google.com/specimen/DM+Sans)) for general copy and `font-heading` ([Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk)) with tight tracking for bold headers.
3.  **Color System**: Reference colors from [theme.md](file:///Users/ishpaulsingh/Desktop/ai%20video%20generator%20and%20post%20scheduler/theme.md). Primary accent must be `--color-forge-accent` (`#f78555` / Orange). Avoid raw Tailwind base colors.
4.  **Glassmorphism**: Cards and floating panels should utilize subtle transparent white backgrounds (`bg-white/[0.03]`), borders (`border-white/8`), and heavy backdrop blurs (`backdrop-blur-xl`).
5.  **Prettier & Linting**: Always format your changes before proposing them:
    ```bash
    npm run prettier
    npm run lint
    ```
