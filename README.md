# Career-Ops

**AI-Powered Job Evaluation & Resume Tailoring**

Paste a job posting URL → get a detailed A-G evaluation breakdown + tailored resume draft. Built for job seekers who want data-driven decisions, not spray-and-pray.

🌐 **[Live Demo →](https://career-ops-try.vercel.app)**

---

## What It Does

1. **Paste a job URL** — Career-Ops extracts the job description automatically
2. **Get a full evaluation** — 7-block A-G analysis: role match, CV gaps, comp data, interview prep, legitimacy check
3. **Tailored resume** — AI generates a role-specific resume draft highlighting your strongest matches
4. **Track everything** — Built-in application tracker with status management

## Features

| Feature | Description |
|---------|-------------|
| 🔗 **Smart JD Extraction** | Auto-extracts from Lever, Greenhouse, Ashby, Workday, and most career pages |
| 🤖 **A-G Evaluation** | 7-block deep analysis: Role Summary, CV Match, Level Strategy, Comp, Personalization, Interview Prep, Legitimacy |
| 📄 **Resume Tailoring** | Generates an ATS-optimized resume draft matched to the JD |
| 📊 **Application Tracker** | Track jobs across saved → evaluated → applied → rejected |
| ⚡ **Rate Limit Handling** | Auto-retry with backoff + fun AI quotes while waiting |
| 📱 **Mobile Responsive** | Works perfectly on phone, tablet, and desktop |
| 🔒 **Privacy First** | Your data stays local. No tracking, no analytics, no data sharing |

## Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript (no framework, no build step)
- **Backend:** Node.js, Express
- **AI/LLM:** Google Gemini API (gemini-2.0-flash)
- **JD Extraction:** Mozilla Readability + LinkedOM
- **Deployment:** Vercel

## Quick Start

### Local Development

```bash
# Clone the repo
git clone https://github.com/vedap24/career-ops.git
cd career-ops

# Install dependencies
npm install

# Set up environment (optional — app works without Gemini key)
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — that's it.

### Deploy to Vercel

1. Fork this repo
2. Go to [vercel.com/new](https://vercel.com/new) → Import your fork
3. Add environment variable: `GEMINI_API_KEY` = your Gemini API key
4. Deploy — done ✅

> **Without a Gemini API key:** URL intake, JD extraction, and tracking still work. Evaluation and resume tailoring are disabled until a key is added.

## How It Works

```
User pastes URL → Server fetches page → Readability extracts JD
                                        ↓
                               JD saved to tracker
                                        ↓
                          User clicks "Evaluate" (optional)
                                        ↓
                      Gemini evaluates JD against user's CV
                                        ↓
                       7-block A-G evaluation + keywords
                                        ↓
                    User clicks "Generate Resume" (optional)
                                        ↓
                   Gemini tailors resume to match JD keywords
```

## Project Structure

```
career-ops/
├── public/              # Frontend (vanilla HTML/CSS/JS)
│   ├── index.html       # SPA entry point
│   ├── css/styles.css   # Full design system
│   └── js/              # Pages and components
├── server/              # Backend (Express)
│   ├── index.js         # Server entry
│   ├── routes/          # API routes
│   ├── services/        # Evaluator, extractor, resume builder
│   ├── prompts/         # Gemini prompt templates
│   └── db/              # In-memory data store
├── vercel.json          # Vercel deployment config
└── package.json
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | For AI features | Google Gemini API key ([Get one free](https://aistudio.google.com/apikey)) |
| `PORT` | No | Server port (default: 3000) |

## License

MIT

---

Built with ☕ and AI by [vedap24](https://github.com/vedap24)
