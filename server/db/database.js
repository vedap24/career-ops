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

const store = {
  profile: null,
  jobs: [],
  evaluations: [],
  resumes: [],
  _nextJobId: 1,
  _nextEvalId: 1,
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
