-- Career-Ops MVP — SQLite Schema
-- Single-user local persistence for job tracking, evaluations, and resumes.

-- User profile + CV content (single row, upserted)
CREATE TABLE IF NOT EXISTS profile (
  id          INTEGER PRIMARY KEY CHECK (id = 1),  -- enforce single row
  name        TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  phone       TEXT NOT NULL DEFAULT '',
  location    TEXT NOT NULL DEFAULT '',
  linkedin    TEXT NOT NULL DEFAULT '',
  portfolio   TEXT NOT NULL DEFAULT '',
  cv_markdown TEXT NOT NULL DEFAULT '',              -- raw CV in markdown
  target_roles TEXT NOT NULL DEFAULT '[]',           -- JSON array of target role strings
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tracked jobs (one row per pasted URL)
CREATE TABLE IF NOT EXISTS jobs (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  url             TEXT NOT NULL,
  title           TEXT,                               -- extracted from page
  company         TEXT,                               -- extracted from page
  location        TEXT,                               -- extracted from JD
  raw_jd          TEXT,                               -- full extracted JD text
  status          TEXT NOT NULL DEFAULT 'saved'
                  CHECK (status IN ('saved','evaluated','applied','rejected')),
  extraction_ok   INTEGER NOT NULL DEFAULT 1,         -- 0 if extraction failed
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Evaluation results (one per job, from Gemini)
CREATE TABLE IF NOT EXISTS evaluations (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id      INTEGER NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
  score       REAL,                                    -- global score 1-5
  archetype   TEXT,                                    -- detected archetype
  legitimacy  TEXT,                                    -- High Confidence / Proceed with Caution / Suspicious
  blocks_json TEXT NOT NULL DEFAULT '{}',              -- JSON: { A: {title, content}, B: ... G: ... }
  keywords    TEXT NOT NULL DEFAULT '[]',              -- JSON array of extracted keywords
  raw_output  TEXT,                                    -- full Gemini response text
  model_used  TEXT,                                    -- e.g. gemini-2.0-flash
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Generated tailored resumes (one per job)
CREATE TABLE IF NOT EXISTS resumes (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id          INTEGER NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
  html_content    TEXT,                                -- tailored resume HTML
  markdown_content TEXT,                               -- tailored resume markdown
  keywords_used   TEXT NOT NULL DEFAULT '[]',           -- JSON array
  coverage_pct    REAL DEFAULT 0,                      -- keyword coverage percentage
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
