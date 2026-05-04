/**
 * resume.js — Resume generation API route
 *
 * POST /api/jobs/:id/resume — Generate a tailored resume
 *
 * Uses the evaluation results + user's CV to produce
 * a tailored resume in HTML and Markdown formats.
 */

import { Router } from 'express';
import { getJob, getProfile, saveResume } from '../db/database.js';
import { generateTailoredResume } from '../services/resume-builder.js';

const router = Router();

/**
 * POST /api/jobs/:id/resume
 * Body: { selectedSections?: string[], customEdits?: object }
 *
 * Generates a tailored resume for the specific job.
 * Requires the job to have been evaluated (for keywords/archetype).
 */
router.post('/:id/resume', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const job = getJob(id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const profile = getProfile();
    if (!profile?.cv_markdown) {
      return res.status(400).json({
        error: 'No CV content found. Please add your CV in the Profile section first.',
      });
    }

    // Get keywords and archetype from evaluation (if available)
    const keywords = job.evaluation?.keywordsList || [];
    const archetype = job.evaluation?.archetype || 'Unknown';

    console.log(`[resume] Generating tailored resume for job #${id}`);

    const result = await generateTailoredResume({
      cvMarkdown: profile.cv_markdown,
      jdText: job.raw_jd || '',
      keywords,
      archetype,
      profile: {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        linkedin: profile.linkedin,
        portfolio: profile.portfolio,
      },
      selectedSections: req.body.selectedSections,
    });

    // Save to database
    const updated = saveResume(id, {
      html_content: result.html,
      markdown_content: result.markdown,
      keywords_used: result.keywords_used,
      coverage_pct: result.coverage_pct,
    });

    res.json({
      ok: true,
      html: result.html,
      markdown: result.markdown,
      keywords_used: result.keywords_used,
      coverage_pct: result.coverage_pct,
      fallback: result.fallback || false,
    });
  } catch (err) {
    console.error('[resume] Error:', err);
    res.status(500).json({ error: 'Resume generation failed: ' + err.message });
  }
});

export default router;
