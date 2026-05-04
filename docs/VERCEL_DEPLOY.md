# Vercel Deployment Guide

## Prerequisites

1. Push the repo to GitHub
2. Connect to Vercel

## Database Migration

The local SQLite database won't work on Vercel serverless.
Swap to Turso (LibSQL) by:

1. Create a Turso database: `turso db create career-ops-mvp`
2. Get the URL: `turso db show career-ops-mvp --url`
3. Create a token: `turso db tokens create career-ops-mvp`
4. Add to Vercel env vars:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
5. Replace `server/db/database.js` with a `@libsql/client` adapter
   (same interface, different driver)

## Environment Variables

Add to Vercel project settings:
- `GEMINI_API_KEY` — your Gemini API key
- `GEMINI_MODEL` — `gemini-2.0-flash` (default)

## vercel.json

```json
{
  "version": 2,
  "builds": [
    { "src": "server/index.js", "use": "@vercel/node" },
    { "src": "public/**", "use": "@vercel/static" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "server/index.js" },
    { "src": "/(.*)", "dest": "public/$1" }
  ]
}
```

## Timeout Considerations

Vercel Hobby plan has a 10-second function timeout.
Gemini evaluations take 30-60 seconds.
Options:
1. Use Vercel Pro (60s timeout)
2. Implement streaming responses
3. Use background functions + polling
