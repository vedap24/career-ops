# Career-Ops MVP

AI-powered job evaluation and resume tailoring — paste a URL, get a detailed breakdown.

> **Flagship workflow:** Paste one job URL → see extracted JD → run Career-Ops A-G evaluation → generate tailored resume draft → track application status.

## Quick Start

```bash
# 1. Clone and install
git clone <your-repo-url>
cd careerOps-project
npm install

# 2. Configure environment (optional — app works without Gemini key)
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY (free: https://aistudio.google.com/apikey)

# 3. Start the dev server
npm run dev
# → Opens at http://localhost:3000
```

## What Works Without a Gemini API Key

| Feature | Without Key | With Key |
|---------|-------------|----------|
| URL intake + JD extraction | ✅ | ✅ |
| Manual JD paste fallback | ✅ | ✅ |
| Application tracker | ✅ | ✅ |
| Status management | ✅ | ✅ |
| A-G Evaluation | ❌ | ✅ |
| Tailored resume generation | ❌ | ✅ |
| Keyword extraction | ❌ | ✅ |

## Architecture

```
careerOps-project/
├── server/                  # Express backend
│   ├── index.js             # Server entry point
│   ├── routes/              # API routes (jobs, evaluate, resume, profile)
│   ├── services/            # Business logic (extractor, evaluator, resume-builder)
│   ├── prompts/             # LLM prompt context (from career-ops modes/)
│   └── db/                  # SQLite schema and helpers
├── public/                  # Frontend (vanilla HTML/CSS/JS)
│   ├── index.html           # SPA shell
│   ├── css/styles.css       # Design system (dark theme, glassmorphism)
│   └── js/                  # Client-side app, pages, components
└── docs/                    # Architecture and deployment notes
```

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/jobs` | Submit a job URL for extraction |
| `GET` | `/api/jobs` | List tracked jobs |
| `GET` | `/api/jobs/:id` | Get full job detail |
| `PATCH` | `/api/jobs/:id` | Update status/details |
| `DELETE` | `/api/jobs/:id` | Remove a job |
| `POST` | `/api/jobs/:id/evaluate` | Run A-G evaluation |
| `POST` | `/api/jobs/:id/resume` | Generate tailored resume |
| `GET` | `/api/profile` | Get user profile |
| `POST` | `/api/profile` | Save profile + CV |
| `GET` | `/api/health` | Health check + Gemini status |

## Tech Stack

- **Runtime:** Node.js 20+
- **Server:** Express 4
- **Database:** SQLite (better-sqlite3) — swappable to Turso for Vercel
- **LLM:** Google Gemini (free tier, gemini-2.0-flash)
- **JD Extraction:** @mozilla/readability + linkedom
- **Frontend:** Vanilla HTML/CSS/JS (no build step)

## Evaluation System

Uses the Career-Ops A-G scoring methodology:

| Block | What it evaluates |
|-------|-------------------|
| A | Role Summary — archetype, domain, seniority |
| B | CV Match — requirement-to-experience mapping |
| C | Level & Strategy — seniority positioning |
| D | Comp & Demand — salary estimates, market demand |
| E | Personalization Plan — CV tailoring suggestions |
| F | Interview Prep — STAR+R stories mapped to JD |
| G | Posting Legitimacy — ghost job detection |

## Future Enhancements (v2)

- PDF export (Playwright-based)
- Multi-job batch scanning
- Portal integration (Greenhouse, Lever, Ashby APIs)
- Vercel deployment with Turso database
- Interview prep module

## Vercel Deployment Notes

The architecture is designed for future Vercel deployment:
1. API routes map to `/api/*` serverless functions
2. Database adapter pattern allows swapping SQLite → Turso
3. Static frontend serves from CDN
4. All secrets via environment variables

See `docs/VERCEL_DEPLOY.md` for details.

## Credits

Built on the evaluation methodology from [career-ops](https://github.com/santifer/career-ops).

## License

MIT
