/**
 * jobs.js — Job intake and tracker API routes
 *
 * POST /api/jobs          — Intake a new job URL (fetch + extract JD)
 * GET  /api/jobs          — List all tracked jobs (with optional status filter)
 * GET  /api/jobs/:id      — Get full job detail including evaluation + resume
 * PATCH /api/jobs/:id     — Update job status or details
 * DELETE /api/jobs/:id    — Remove a job from tracker
 */

import { Router } from 'express';
import { extractFromUrl } from '../services/extractor.js';
import {
  createJob, getJob, listJobs,
  updateJobStatus, updateJobDetails, deleteJob,
} from '../db/database.js';

const router = Router();

/**
 * POST /api/jobs — Intake a new job URL
 * Body: { url: string, manualJd?: string }
 *
 * Fetches the URL, extracts JD text, creates a tracker entry.
 * If extraction fails, still creates the entry with extraction_ok=false.
 * If manualJd is provided, skips URL fetch and uses the provided text.
 */
router.post('/', async (req, res) => {
  try {
    const { url, manualJd } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    let title = null;
    let company = null;
    let location = null;
    let content = null;
    let extractionOk = true;

    if (manualJd) {
      // User provided JD text directly (fallback for failed extraction)
      content = manualJd;
    } else {
      // Try to extract from URL
      console.log(`[jobs] Extracting JD from: ${url}`);
      const extracted = await extractFromUrl(url);
      title = extracted.title;
      company = extracted.company;
      location = extracted.location;
      content = extracted.content;
      extractionOk = extracted.ok;

      if (!extractionOk) {
        console.warn(`[jobs] Extraction failed for ${url} — saving with null JD`);
      }
    }

    const job = createJob({
      url,
      title,
      company,
      location,
      raw_jd: content,
      status: 'saved',
      extraction_ok: extractionOk,
    });

    res.status(201).json(job);
  } catch (err) {
    console.error('[jobs] POST error:', err);
    res.status(500).json({ error: 'Failed to process job URL' });
  }
});

/**
 * GET /api/jobs — List all tracked jobs
 * Query: ?status=evaluated
 */
router.get('/', (req, res) => {
  try {
    const { status } = req.query;
    const jobs = listJobs({ status });
    res.json(jobs);
  } catch (err) {
    console.error('[jobs] GET list error:', err);
    res.status(500).json({ error: 'Failed to load jobs' });
  }
});

/**
 * GET /api/jobs/:id — Get full job detail
 */
router.get('/:id', (req, res) => {
  try {
    const job = getJob(parseInt(req.params.id));
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    console.error('[jobs] GET detail error:', err);
    res.status(500).json({ error: 'Failed to load job' });
  }
});

/**
 * PATCH /api/jobs/:id — Update job status or details
 * Body: { status?: string, title?: string, company?: string, raw_jd?: string }
 */
router.patch('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = getJob(id);
    if (!existing) return res.status(404).json({ error: 'Job not found' });

    const { status, title, company, location, raw_jd, extraction_ok } = req.body;

    // Validate status if provided
    if (status) {
      const validStatuses = ['saved', 'evaluated', 'applied', 'rejected'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        });
      }
      updateJobStatus(id, status);
    }

    // Update other fields if provided
    if (title !== undefined || company !== undefined || location !== undefined ||
        raw_jd !== undefined || extraction_ok !== undefined) {
      updateJobDetails(id, { title, company, location, raw_jd, extraction_ok });
    }

    const updated = getJob(id);
    res.json(updated);
  } catch (err) {
    console.error('[jobs] PATCH error:', err);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

/**
 * DELETE /api/jobs/:id — Remove a job
 */
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = getJob(id);
    if (!existing) return res.status(404).json({ error: 'Job not found' });

    deleteJob(id);
    res.json({ deleted: true, id });
  } catch (err) {
    console.error('[jobs] DELETE error:', err);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

export default router;
