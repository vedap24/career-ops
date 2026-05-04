/**
 * profile.js — Profile and CV management API routes
 *
 * GET  /api/profile — Get current profile
 * POST /api/profile — Save/update profile and CV
 */

import { Router } from 'express';
import { getProfile, upsertProfile } from '../db/database.js';

const router = Router();

/**
 * GET /api/profile
 */
router.get('/', (req, res) => {
  try {
    const profile = getProfile();
    if (!profile) {
      return res.json({
        name: '', email: '', phone: '', location: '',
        linkedin: '', portfolio: '', cv_markdown: '',
        target_roles: [],
      });
    }
    // Parse JSON fields
    try { profile.target_roles = JSON.parse(profile.target_roles); } catch { profile.target_roles = []; }
    res.json(profile);
  } catch (err) {
    console.error('[profile] GET error:', err);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

/**
 * POST /api/profile
 * Body: { name, email, phone, location, linkedin, portfolio, cv_markdown, target_roles }
 */
router.post('/', (req, res) => {
  try {
    const updated = upsertProfile(req.body);
    try { updated.target_roles = JSON.parse(updated.target_roles); } catch { updated.target_roles = []; }
    res.json(updated);
  } catch (err) {
    console.error('[profile] POST error:', err);
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

export default router;
