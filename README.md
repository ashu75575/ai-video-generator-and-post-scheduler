# ClipForge AI — Video Generator & Post Scheduler

ClipForge AI is an automated video processing application built with [Next.js](https://nextjs.org) and [Remotion](https://www.remotion.dev). Users upload long-form video, get audio transcribed, extract engaging short clips with Groq AI, style captions, render 9:16 compositions on AWS Lambda, and schedule posts to TikTok, Instagram Reels, and YouTube Shorts via the Zernio API.

---

## Key Features

- **Secure Video Uploads**: Validated by [Arcjet](https://arcjet.com) (Shield, bot protection, rate limits).
- **Deepgram Speech-to-Text**: Word-level timestamps for captions and clip boundaries.
- **Groq AI Highlight Detection**: Auto-clipping with [`llama-3.3-70b-versatile`](https://console.groq.com) (chunked prompts for free-tier TPM limits).
- **Dynamic Captions**: Multi-word stylized overlays with customizable fonts, colors, and shadows.
- **Remotion Lambda Rendering**: Distributed 9:16 renders using `@remotion/media` during Lambda execution.
- **Social Scheduling**: Account connect + scheduled publishing via [Zernio](https://zernio.com).
- **Background Jobs (Inngest)**: Upload → analyze → render pipelines with retries and failure hooks.
- **Caching**: Redis via `ioredis`, with automatic in-memory fallback when `REDIS_URL` is unset.
- **Auth & Profiles**: Clerk authentication with Neon-synced user profiles.

---

## Architecture

1. **Frontend (Next.js)** — Dashboard UI, Remotion Player preview, settings.
2. **API routes** — Upload, project status, clip render, social connect, scheduling.
3. **Arcjet** — Bot / WAF / prompt-injection guards (`lib/arcjet.ts`).
4. **Neon + Drizzle** — Schema in `lib/db/schema.ts`.
5. **S3 (`AWS_BUCKET_NAME`)** — Private storage for user-uploaded source videos (presigned URLs).
6. **Remotion Lambda** — Function + site bucket (`REMOTION_BUCKET_NAME`) for composition bundles and render outputs.
7. **Inngest** — Background steps in `lib/inngest/functions.ts`.
8. **Cache** — `lib/redis.ts` (Redis or in-memory).

### Two S3 buckets (do not mix)

| Env var | Purpose | Example |
|---|---|---|
| `AWS_BUCKET_NAME` | **User uploads** (source videos) | `clipforge-project` |
| `REMOTION_BUCKET_NAME` | **Remotion** site bundles + render artifacts | `remotionlambda-eunorth1-xxxxx` |

These must be **different buckets**, but in the **same AWS region** as `AWS_REGION`, the Remotion function, and `REMOTION_SERVE_URL`.

---

## Database Schema

Defined in `lib/db/schema.ts`:

- **`users`** — Clerk-synced profiles + optional `zernioProfileId`
- **`projects`** — Source videos, status/progress, transcript, captions, S3 URL
- **`short_videos`** — Clip windows, AI metadata, caption styles, `exportUrl`, `renderStatus`
- **`social_accounts`** — Connected platforms via Zernio
- **`scheduled_posts`** — Queue of posts (`pending` / `posted` / `failed`)

---

## Prerequisites

- Node.js 18+ or 20+
- npm
- AWS account (IAM user with S3 + Lambda permissions)
- API keys for Clerk, Neon, Deepgram, Groq, Arcjet, Zernio (see `.env.example`)

---

## Setup and Installation

### 1. Clone and install

```bash
git clone https://github.com/ashu75575/ai-video-generator-and-post-scheduler.git
cd ai-video-generator-and-post-scheduler
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in values from `.env.example`. At minimum for local video pipelines:

- `DATABASE_URL`
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET_NAME`
- `DEEPGRAM_API_KEY`, `GROQ_API_KEY`
- `REMOTION_SERVE_URL`, `REMOTION_BUCKET_NAME`, `REMOTION_FUNCTION_NAME`
- `INNGEST_DEV=1` (local)

> Redis (`REDIS_URL`) is optional. If unset or unreachable, the app falls back to in-memory cache.

### 3. Database

```bash
npx drizzle-kit push
# optional UI:
npx drizzle-kit studio
```

---

## AWS setup — user video storage

Use **one region** for everything (example: `eu-north-1`).

### 1. Create the videos bucket

1. AWS Console → **S3 → Create bucket**
2. Name: e.g. `clipforge-project` (globally unique)
3. Region: same as `AWS_REGION`
4. Keep **Block Public Access** enabled (app uses private + presigned URLs)

### 2. Configure CORS on that bucket

S3 → bucket → **Permissions → CORS**:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD", "PUT", "POST"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Range", "Accept-Ranges"],
    "MaxAgeSeconds": 3000
  }
]
```

Restrict `AllowedOrigins` to your domains in production.

### 3. Create an IAM user

1. IAM → Users → create e.g. `clipforge-app`
2. Create an access key (Application running outside AWS)
3. Put keys in `.env.local` as `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
4. Attach S3 access for `AWS_BUCKET_NAME`, plus Remotion policies (next section)

Upload flow: local temp file → `s3://AWS_BUCKET_NAME/projects/{projectId}/...` → presigned GET URL stored on the project.

---

## AWS setup — Remotion Lambda

Follow [Remotion Lambda setup](https://www.remotion.dev/docs/lambda/setup) for full IAM details. Summary:

### 1. Export credentials in your shell

```bash
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_REGION=eu-north-1
```

### 2. Apply Remotion IAM policies

```bash
npx remotion lambda policies role
npx remotion lambda policies user
npx remotion lambda policies validate --region=eu-north-1
```

Attach the printed policy JSON to your IAM user / role as documented by Remotion.

### 3. Deploy the Lambda function

Prefer **240s timeout** and ~3GB memory for ~60–90s 1080×1920 clips (120s functions often abort during stitching):

```bash
npx remotion lambda functions deploy \
  --region=eu-north-1 \
  --memory=3008 \
  --disk=2048 \
  --timeout=240
```

List and copy the exact function name:

```bash
npx remotion lambda functions ls --region=eu-north-1
```

### 4. Deploy the Remotion site (composition bundle)

**Same region** as the function and video bucket:

```bash
npx remotion lambda sites create remotion/index.ts \
  --site-name=clipforge-site \
  --region=eu-north-1
```

From the output, set:

- Serve URL → `REMOTION_SERVE_URL`
- Bucket name → `REMOTION_BUCKET_NAME`

```bash
npx remotion lambda sites ls --region=eu-north-1
```

### 5. Example `.env.local` Remotion block

```bash
AWS_REGION=eu-north-1
AWS_BUCKET_NAME=clipforge-project

REMOTION_SERVE_URL=https://remotionlambda-eunorth1-xxxxx.s3.eu-north-1.amazonaws.com/sites/clipforge-site/index.html
REMOTION_BUCKET_NAME=remotionlambda-eunorth1-xxxxx
REMOTION_FUNCTION_NAME=remotion-render-4-0-469-mem3008mb-disk2048mb-240sec
```

### 6. Redeploy the site after composition changes

Whenever you change files under `remotion/`:

```bash
npx remotion lambda sites create remotion/index.ts \
  --site-name=clipforge-site \
  --region=eu-north-1
```

---

## Inngest (background jobs)

Locally, events must go to the Dev Server (not Inngest Cloud):

```bash
# .env.local
INNGEST_DEV=1
```

Start the Dev Server (default UI: http://localhost:8288):

```bash
npm run dev:inngest
# equivalent:
# npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```

For production, unset `INNGEST_DEV` and set `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY` from [app.inngest.com](https://app.inngest.com).

---

## Running locally

You need **two terminals**:

**Terminal A — Inngest**

```bash
npm run dev:inngest
```

**Terminal B — Next.js**

```bash
npm run dev
```

Then open:

- App: http://localhost:3000  
- Inngest: http://localhost:8288  

### Quick verification

1. Upload a video → object appears under `projects/` in `AWS_BUCKET_NAME`
2. Start analysis → Inngest runs transcription + Groq clipping
3. Render a clip → Remotion Lambda job completes; `exportUrl` is set on the clip

Optional CLI render smoke test:

```bash
npx remotion lambda render \
  "$REMOTION_SERVE_URL" \
  ShortVideo \
  --region=eu-north-1 \
  --function-name="$REMOTION_FUNCTION_NAME" \
  --props='{"videoUrl":"HTTPS_PRESIGNED_URL","startTime":0,"endTime":15,"captions":[],"captionStyle":null}' \
  --log=verbose
```

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `Event key not found` (401) from Inngest | Dev Server not running, or `INNGEST_DEV` unset |
| UI stuck at 70% after analysis | Stale status cache; ensure latest status route (in-progress statuses are not cached) |
| Groq `TPM` / request too large | Long transcripts are chunked automatically; wait between chunks or upgrade Groq tier |
| Remotion `Too many functions` | Clip too long / low `framesPerLambda` (app clamps clips to ≤90s and scales concurrency) |
| Remotion stitcher `AbortError` / ~120s timeout | Function timeout too low, or **region mismatch** between site / function / video bucket |
| Cross-region site vs function | Keep `AWS_REGION`, `REMOTION_SERVE_URL`, and function all in one region |

CloudWatch for a failed render (`renderId=...`):

- Chunks: `method=renderer,renderId=...`
- Main/stitcher: `method=launch,renderId=...`

---

## Zernio social setup

1. User connects an account via `app/api/social/connect/route.ts`
2. If needed, a Zernio profile is created with `ZERNIO_API_KEY` and stored on the user
3. OAuth URL from Zernio completes platform auth
4. Accounts sync through `app/api/social/accounts/route.ts`

---

## Contributing

### Branching

- `main` — production
- `develop` — integration
- `feature/...` / `bugfix/...` — off `develop`

Open PRs against `develop`. Run `npm run build` and `npm run lint` before requesting review.

### Commits

```
<type>(<scope>): <short summary>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`.

### Code style

1. Dark UI baseline (`#05050A`); no light-theme toggles.
2. Typography: `font-sans` (DM Sans), `font-heading` (Space Grotesk).
3. Accent: `--color-forge-accent` / `#f78555` (see `theme.md`).
4. Format before PR:

```bash
npm run prettier
npm run lint
```
