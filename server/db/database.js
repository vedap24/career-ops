/**
 * database.js — In-memory data store
 *
 * Vercel-compatible: no native modules, no filesystem writes.
 * Exports the same API as the previous SQLite version so all
 * routes work without changes.
 *
 * Data lives in memory — resets on each cold start.
 * This is fine for a demo MVP. For persistence, swap to Turso/LibSQL.
 */

// ─── In-Memory Store ────────────────────────────────────────────────

const DEMO_TS = new Date().toISOString().replace('T', ' ').slice(0, 19);

const store = {
  profile: {
    id: 1,
    name: 'Alex Chen',
    email: 'alex@example.com',
    phone: '',
    location: 'San Francisco, CA',
    linkedin: 'linkedin.com/in/alexchen',
    portfolio: 'alexchen.dev',
    cv_markdown: `# Alex Chen — Senior Software Engineer

## Summary
Full-stack engineer with 5+ years building production AI/ML systems, web platforms, and developer tools. Led teams of 3-8 engineers. Strong focus on performance, scalability, and developer experience.

## Experience
**Senior Software Engineer — TechCorp (2022-Present)**
- Built real-time analytics dashboard serving 50K+ daily users, reducing load time from 3.2s to 480ms
- Designed and shipped LLM evaluation pipeline processing 10K+ test cases daily
- Led migration from monolith to microservices, cutting deploy time from 45min to 8min
- Mentored 4 junior engineers through structured 1:1s and code review

**Software Engineer — StartupAI (2020-2022)**
- Built customer-facing AI chatbot handling 25K conversations/month with 94% satisfaction
- Implemented RAG pipeline using pgvector over 15K documents with sub-200ms retrieval
- Shipped 3 major features end-to-end: scoping, design, implementation, monitoring

**Junior Developer — WebAgency (2018-2020)**
- Built responsive web apps for 12+ clients using React, Node.js, PostgreSQL
- Reduced page load times by 40% average through performance auditing

## Skills
JavaScript/TypeScript, React, Next.js, Node.js, Python, PostgreSQL, Redis, Docker, AWS, GCP, LLM APIs (OpenAI, Gemini), RAG, CI/CD, Agile

## Education
B.S. Computer Science — UC Berkeley (2018)`,
    target_roles: '["Senior Frontend Engineer","Full Stack Engineer","AI Platform Engineer"]',
    created_at: DEMO_TS,
    updated_at: DEMO_TS,
  },
  jobs: [
    {
      id: 1,
      url: 'https://vercel.com/careers/senior-frontend-engineer',
      title: 'Senior Frontend Engineer',
      company: 'Vercel',
      location: 'Remote (US)',
      raw_jd: `Senior Frontend Engineer — Vercel

About the Role
We're looking for a Senior Frontend Engineer to help build the future of web development. You'll work on Vercel's dashboard, deployment platform, and developer tools used by millions of developers worldwide.

Responsibilities
- Build and maintain high-performance React applications for Vercel's dashboard
- Design and implement new features for the deployment and analytics experience
- Collaborate with design and product teams to deliver polished user experiences
- Optimize Core Web Vitals and frontend performance at scale
- Mentor junior engineers and contribute to engineering standards
- Write clean, tested, well-documented code

Requirements
- 5+ years of professional frontend development experience
- Expert-level React/Next.js knowledge with TypeScript
- Strong understanding of web performance optimization
- Experience with design systems and component libraries
- Familiarity with CI/CD pipelines and deployment workflows
- Excellent communication skills and ability to work in a remote team

Nice to Have
- Experience with Turborepo or monorepo tooling
- Contributions to open-source projects
- Experience building developer tools or platforms
- Knowledge of serverless architectures

Compensation
$180K - $250K base salary + equity + benefits
Remote-first, US timezone preferred`,
      status: 'evaluated',
      extraction_ok: 1,
      created_at: DEMO_TS,
      updated_at: DEMO_TS,
    },
  ],
  evaluations: [
    {
      id: 1,
      job_id: 1,
      score: 4.2,
      archetype: 'AI Platform / Developer Tools',
      legitimacy: 'High Confidence',
      blocks_json: JSON.stringify({
        A: {
          title: 'Role Summary',
          content: `**Archetype:** Developer Tools / Platform Engineering
**Domain:** Web Platform & Developer Experience
**Function:** Build
**Seniority:** Senior (IC4-IC5)
**Remote:** Full Remote (US timezone)
**Team:** Engineering — Dashboard & DX team

**TL;DR:** High-visibility IC role building the developer dashboard and deployment UX for one of the most respected developer platforms. Strong brand, excellent comp, remote-first culture.`
        },
        B: {
          title: 'CV Match',
          content: `| JD Requirement | CV Match | Strength |
|---|---|---|
| 5+ years frontend | ✅ 5+ years full-stack with strong frontend | Strong |
| Expert React/Next.js + TS | ✅ React, Next.js listed; built dashboards | Strong |
| Web performance optimization | ✅ "Reduced load time from 3.2s to 480ms" | Strong |
| Design systems | ⚠️ Not explicitly mentioned | Gap |
| CI/CD pipelines | ✅ "Cut deploy time from 45min to 8min" | Strong |
| Remote collaboration | ✅ Current role experience | Moderate |
| Mentoring | ✅ "Mentored 4 junior engineers" | Strong |

**Gaps & Mitigation:**
1. **Design Systems** — Moderate gap. Mitigate by highlighting component library work from WebAgency projects. Frame dashboard work as "built reusable component system."
2. **Turborepo/Monorepo** — Nice-to-have, low risk. Can learn quickly given strong build tooling experience.`
        },
        C: {
          title: 'Level & Strategy',
          content: `**JD Level:** Senior (IC4-IC5)
**Candidate Level:** Senior — good alignment

**Strategy:** Lead with the analytics dashboard project (50K users, 85% load time reduction). This directly maps to Vercel's dashboard work. Frame the microservices migration as "improving developer experience at scale" — this resonates with Vercel's mission.

**If downleveled:** Unlikely given experience, but if offered IC4 instead of IC5, negotiate based on comp band and request 6-month promotion review with clear criteria.`
        },
        D: {
          title: 'Comp & Demand',
          content: `**Posted Range:** $180K-$250K + equity
**Market Data:** Senior Frontend at top-tier dev tools companies: $170K-$260K (Levels.fyi, 2024)
**Assessment:** Competitive. The equity component at Vercel (pre/post-IPO) could be significant.

**Demand:** Frontend engineers with Next.js expertise are in high demand. Vercel specifically needs people who understand their own framework deeply — this is a strong advantage.

**Recommendation:** Target $210K-$230K base given experience level. The equity story is compelling.`
        },
        E: {
          title: 'Personalization Plan',
          content: `| # | Section | Current | Proposed Change | Why |
|---|---------|---------|----------------|-----|
| 1 | Summary | Generic full-stack | Lead with "frontend platform engineer" framing | Matches JD language |
| 2 | TechCorp bullets | Analytics dashboard, generic | Add "React/Next.js" explicitly, mention component reuse | Direct keyword match |
| 3 | Skills order | JS/TS buried in list | Move React, Next.js, TypeScript to front | ATS optimization |
| 4 | Projects | Not highlighted | Add a "Developer Tools" section with relevant side projects | Shows passion for DX |
| 5 | Metrics | Good but generic | Reframe around Core Web Vitals language (LCP, CLS) | Vercel cares about this |`
        },
        F: {
          title: 'Interview Prep',
          content: `**Recommended Stories:**

| # | JD Requirement | STAR+R Story |
|---|---|---|
| 1 | Performance optimization | Analytics dashboard: 3.2s → 480ms (React profiling, code splitting, caching) |
| 2 | Scale | Dashboard serving 50K daily users — monitoring, error boundaries, graceful degradation |
| 3 | Mentoring | Structured 1:1 program for 4 junior engineers — created review rubric, pair programming |
| 4 | Collaboration | Cross-team feature launch with design and product — discovery, iteration, ship |
| 5 | Technical leadership | Monolith → microservices migration — RFC process, incremental rollout, rollback plan |

**Red-Flag Questions:**
- "Why leave your current role?" → Frame around wanting to work on developer tools at scale
- "What's your Next.js experience?" → Honest: strong React, learning Next.js patterns actively`
        },
        G: {
          title: 'Posting Legitimacy',
          content: `**Assessment: High Confidence ✅**

| Signal | Finding | Weight |
|---|---|---|
| Company reputation | Vercel is a well-funded, active company with public hiring | ✅ Positive |
| Tech specificity | Names React, Next.js, TypeScript, Core Web Vitals | ✅ Positive |
| Salary transparency | Clear range posted ($180K-$250K) | ✅ Positive |
| Requirements realism | Reasonable 5+ years, no contradictions | ✅ Positive |
| Role-company fit | Frontend eng at a frontend platform company — perfect fit | ✅ Positive |

**Context:** Vercel is actively hiring and growing. This appears to be a genuine, well-scoped position.`
        },
      }),
      keywords: JSON.stringify(['React', 'Next.js', 'TypeScript', 'Frontend', 'Performance', 'Core Web Vitals', 'Design Systems', 'CI/CD', 'Remote', 'Developer Tools', 'Dashboard', 'Component Libraries', 'Mentoring']),
      raw_output: '',
      model_used: 'demo-seed',
      created_at: DEMO_TS,
    },
  ],
  resumes: [],
  _nextJobId: 2,
  _nextEvalId: 2,
  _nextResumeId: 1,
};

function now() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

// ─── Profile helpers ────────────────────────────────────────────────

export function getProfile() {
  return store.profile ? { ...store.profile } : null;
}

export function upsertProfile(data) {
  const ts = now();
  if (store.profile) {
    store.profile = {
      ...store.profile,
      name: data.name ?? store.profile.name,
      email: data.email ?? store.profile.email,
      phone: data.phone ?? store.profile.phone,
      location: data.location ?? store.profile.location,
      linkedin: data.linkedin ?? store.profile.linkedin,
      portfolio: data.portfolio ?? store.profile.portfolio,
      cv_markdown: data.cv_markdown ?? store.profile.cv_markdown,
      target_roles: data.target_roles
        ? JSON.stringify(data.target_roles)
        : store.profile.target_roles,
      updated_at: ts,
    };
  } else {
    store.profile = {
      id: 1,
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      location: data.location || '',
      linkedin: data.linkedin || '',
      portfolio: data.portfolio || '',
      cv_markdown: data.cv_markdown || '',
      target_roles: JSON.stringify(data.target_roles || []),
      created_at: ts,
      updated_at: ts,
    };
  }
  return getProfile();
}

// ─── Jobs helpers ───────────────────────────────────────────────────

export function createJob(data) {
  const ts = now();
  const job = {
    id: store._nextJobId++,
    url: data.url,
    title: data.title || null,
    company: data.company || null,
    location: data.location || null,
    raw_jd: data.raw_jd || null,
    status: data.status || 'saved',
    extraction_ok: data.extraction_ok !== undefined ? (data.extraction_ok ? 1 : 0) : 1,
    created_at: ts,
    updated_at: ts,
  };
  store.jobs.push(job);
  return getJob(job.id);
}

export function getJob(id) {
  const job = store.jobs.find(j => j.id === id);
  if (!job) return null;

  const result = { ...job };

  // Attach evaluation
  const ev = store.evaluations.find(e => e.job_id === id);
  if (ev) {
    result.evaluation = { ...ev };
    try { result.evaluation.blocks = JSON.parse(ev.blocks_json); } catch { result.evaluation.blocks = {}; }
    try { result.evaluation.keywordsList = JSON.parse(ev.keywords); } catch { result.evaluation.keywordsList = []; }
  } else {
    result.evaluation = null;
  }

  // Attach resume
  const res = store.resumes.find(r => r.job_id === id);
  if (res) {
    result.resume = { ...res };
    try { result.resume.keywordsList = JSON.parse(res.keywords_used); } catch { result.resume.keywordsList = []; }
  } else {
    result.resume = null;
  }

  return result;
}

export function listJobs(filters = {}) {
  let jobs = [...store.jobs];

  if (filters.status) {
    jobs = jobs.filter(j => j.status === filters.status);
  }

  // Sort by created_at descending
  jobs.sort((a, b) => b.created_at.localeCompare(a.created_at));

  // Attach scores for list view
  return jobs.map(job => {
    const ev = store.evaluations.find(e => e.job_id === job.id);
    return {
      ...job,
      score: ev?.score || null,
      archetype: ev?.archetype || null,
      legitimacy: ev?.legitimacy || null,
    };
  });
}

export function updateJobStatus(id, status) {
  const job = store.jobs.find(j => j.id === id);
  if (job) {
    job.status = status;
    job.updated_at = now();
  }
  return getJob(id);
}

export function updateJobDetails(id, data) {
  const job = store.jobs.find(j => j.id === id);
  if (!job) return getJob(id);

  if (data.title !== undefined) job.title = data.title;
  if (data.company !== undefined) job.company = data.company;
  if (data.location !== undefined) job.location = data.location;
  if (data.raw_jd !== undefined) job.raw_jd = data.raw_jd;
  if (data.extraction_ok !== undefined) job.extraction_ok = data.extraction_ok ? 1 : 0;
  job.updated_at = now();

  return getJob(id);
}

// ─── Evaluations helpers ────────────────────────────────────────────

export function saveEvaluation(jobId, data) {
  const ts = now();

  // Remove existing evaluation for this job
  store.evaluations = store.evaluations.filter(e => e.job_id !== jobId);

  store.evaluations.push({
    id: store._nextEvalId++,
    job_id: jobId,
    score: data.score,
    archetype: data.archetype,
    legitimacy: data.legitimacy,
    blocks_json: JSON.stringify(data.blocks || {}),
    keywords: JSON.stringify(data.keywords || []),
    raw_output: data.raw_output || '',
    model_used: data.model_used || '',
    created_at: ts,
  });

  // Update job status
  const job = store.jobs.find(j => j.id === jobId);
  if (job) {
    job.status = 'evaluated';
    job.updated_at = ts;
  }

  return getJob(jobId);
}

// ─── Resumes helpers ────────────────────────────────────────────────

export function saveResume(jobId, data) {
  const ts = now();

  // Remove existing resume for this job
  store.resumes = store.resumes.filter(r => r.job_id !== jobId);

  store.resumes.push({
    id: store._nextResumeId++,
    job_id: jobId,
    html_content: data.html_content || '',
    markdown_content: data.markdown_content || '',
    keywords_used: JSON.stringify(data.keywords_used || []),
    coverage_pct: data.coverage_pct || 0,
    created_at: ts,
    updated_at: ts,
  });

  return getJob(jobId);
}

export function deleteJob(id) {
  store.jobs = store.jobs.filter(j => j.id !== id);
  store.evaluations = store.evaluations.filter(e => e.job_id !== id);
  store.resumes = store.resumes.filter(r => r.job_id !== id);
}
