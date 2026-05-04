/**
 * evaluate.js — Evaluation API route
 *
 * POST /api/jobs/:id/evaluate — Run Career-Ops A-G evaluation
 *
 * Calls the Gemini-based evaluator service.
 * If Gemini is unavailable, returns a structured error
 * so the frontend can show "evaluation pending" state.
 */

import { Router } from 'express';
import { getJob, saveEvaluation, getProfile } from '../db/database.js';
import { evaluateJob } from '../services/evaluator.js';

const router = Router();

/**
 * POST /api/jobs/:id/evaluate
 * Body: { cvContent?: string } — optional CV override
 *
 * Runs the full A-G evaluation using Gemini.
 * Updates job status to "evaluated" on success.
 */
router.post('/:id/evaluate', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const job = getJob(id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (!job.raw_jd) {
      return res.status(400).json({
        error: 'No job description available. Please add the JD text first.',
      });
    }

    // Get CV content: from request body, or from stored profile
    let cvContent = req.body.cvContent;
    if (!cvContent) {
      const profile = getProfile();
      cvContent = profile?.cv_markdown || '';
    }

    console.log(`[evaluate] Starting evaluation for job #${id}: ${job.company || 'Unknown'} - ${job.title || 'Unknown'}`);

    // Run evaluation
    const result = await evaluateJob(job.raw_jd, cvContent);

    if (!result.ok) {
      // LLM unavailable or error — return structured error
      return res.status(result.unavailable ? 503 : 500).json({
        error: result.error,
        unavailable: result.unavailable || false,
        job_id: id,
      });
    }

    // Save evaluation results to database
    const updated = saveEvaluation(id, {
      score: result.score,
      archetype: result.archetype,
      legitimacy: result.legitimacy,
      blocks: result.blocks,
      keywords: result.keywords,
      raw_output: result.raw,
      model_used: result.model_used,
    });

    // Also update job title/company if we got better data from eval
    if (result.blocks?.A?.content) {
      // The evaluation might have extracted better company/role info
    }

    res.json({
      ok: true,
      job: updated,
    });
  } catch (err) {
    console.error('[evaluate] Error:', err);
    res.status(500).json({ error: 'Evaluation failed: ' + err.message });
  }
});

export default router;
