# KIU Meeting Insights

Automate meeting transcripts, summaries, action items and visual summaries—all in under 700 lines of TypeScript.

---

## Overview

KIU Meeting Insights transforms raw meeting recordings (audio or video) into organized, actionable records:

1. **Transcription** with speaker labels
2. **Executive summary** (2–3 sentences)
3. **Action items** (with owner, deadline and calendar links)
4. **Semantic search** across your entire archive
5. **Slide-style thumbnail** for each meeting
6. **Light & dark interface**, drag-and-drop upload

All data is persisted in a single JSON file (`data/db.json`), and the entire codebase weighs in at \~700 LOC.

---

## Key Capabilities

| Category            | What It Does                                         | API Used               |
| ------------------- | ---------------------------------------------------- | ---------------------- |
| **Transcription**   | Converts speech to text with speaker attribution     | Whisper                |
| **Summary**         | Produces concise 2-3 sentence recaps                 | GPT-4o                 |
| **Action Items**    | Identifies tasks, assigns owners and due dates       | GPT-4o (function call) |
| **Calendar Links**  | Generates ready-to-use Google/Outlook event stubs    | Internal helper        |
| **Semantic Search** | Embeds transcripts, retrieves top matches by cosine  | text-embedding-3-small |
| **Visual Preview**  | Renders a slide thumbnail from meeting title/bullets | DALL·E 3               |
| **Theming & UX**    | Persistent light/dark mode; intuitive drag/drop      | —                      |

---

## Quick Start

```bash
git clone https://github.com/yourUser/kiu-meeting-insights.git
cd kiu-meeting-insights

cp .env.example .env      # add your OPENAI_API_KEY
pnpm install              # or npm install
pnpm dev                  # launches at http://localhost:3000
```

### Running Tests

```bash
pnpm test                 # Vitest suite with mocked OpenAI calls
```

---

## System Architecture

```
Browser (React UI)
  └─ POST /api/upload → Process pipeline:
       • ffmpeg-static → WAV conversion
       • Whisper → Transcript + speaker tags
       • GPT-4o → Summary
       • GPT-4o → Extract action items (function call)
       • DALL·E 3 → Generate slide image
       • Embeddings → 60-token vectors
  ↔ db.json (lowdb)
  └─ GET /api/search → Cosine similarity → Top 10 hits
```

---

## Project Layout

```
.
├── pages/
│   ├── index.tsx          # Main UI (drag/drop, theme toggle)
│   └── api/
│       ├── upload.ts      # End-to-end processing
│       ├── search.ts      # Semantic search handler
│       ├── list.ts        # Meeting list endpoint
│       └── meeting.ts     # Single meeting details
├── lib/
│   ├── openai.ts          # OpenAI client wrapper
│   ├── db.ts              # lowdb helper
│   ├── similarity.ts      # Cosine similarity function
│   ├── calendar.ts        # Calendar link generator
│   └── extractAudio.ts    # Video → WAV converter
├── data/
│   └── db.json            # JSON “database”
└── __tests__/
    └── pipeline.test.ts   # End-to-end pipeline tests
```

---

## API Endpoints

| Method | Path               | Description                              |
| ------ | ------------------ | ---------------------------------------- |
| POST   | `/api/upload`      | Upload audio/video, store processed data |
| GET    | `/api/list`        | Retrieve minimal meeting list            |
| GET    | `/api/meeting?id=` | Fetch full meeting details               |
| GET    | `/api/search?q=`   | Perform semantic search (hits + related) |

> **Note:** All endpoints are open by default—add authentication (JWT, Clerk, etc.) if required.

---

## Development Commands

| Command      | Action                                   |
| ------------ | ---------------------------------------- |
| `pnpm dev`   | Start development server with hot reload |
| `pnpm build` | Compile for production                   |
| `pnpm start` | Run built app                            |
| `pnpm test`  | Execute Vitest suite                     |

---

## Deployment

### Vercel

```bash
vercel --prod
# Ensure OPENAI_API_KEY is set in Project Settings → Environment Variables
```

### Docker

```dockerfile
FROM node:20
WORKDIR /app
COPY . .
RUN corepack enable && pnpm install --frozen-lockfile
RUN pnpm build
CMD ["pnpm", "start", "-p", "8080"]
```

---

## Tech Stack

* **Next.js 14** (Pages Router)
* **React 18**
* **lowdb 6** for lightweight JSON storage
* **OpenAI APIs**: Whisper, GPT-4o, Embeddings, DALL·E 3
* **ffmpeg-static** for on-the-fly audio extraction
* **Vitest** + vite-tsconfig-paths for testing

---

## License

Released under the MIT License.
