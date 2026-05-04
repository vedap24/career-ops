/**
 * api.js — Fetch wrapper for backend API calls
 * All API functions used by the frontend pages.
 */

const API = {
  /** Health check — also returns gemini_configured status */
  async health() {
    const res = await fetch('/api/health');
    return res.json();
  },

  /** Submit a job URL for extraction */
  async createJob(url, manualJd) {
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, manualJd }),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to create job');
    return res.json();
  },

  /** List all jobs, optionally filtered by status */
  async listJobs(status) {
    const q = status ? `?status=${status}` : '';
    const res = await fetch(`/api/jobs${q}`);
    return res.json();
  },

  /** Get full job detail */
  async getJob(id) {
    const res = await fetch(`/api/jobs/${id}`);
    if (!res.ok) throw new Error('Job not found');
    return res.json();
  },

  /** Update job status or details */
  async updateJob(id, data) {
    const res = await fetch(`/api/jobs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Update failed');
    return res.json();
  },

  /** Delete a job */
  async deleteJob(id) {
    const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    return res.json();
  },

  /** Run evaluation on a job */
  async evaluateJob(id, cvContent) {
    const res = await fetch(`/api/jobs/${id}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cvContent }),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || 'Evaluation failed');
      err.unavailable = data.unavailable;
      throw err;
    }
    return data;
  },

  /** Generate tailored resume */
  async generateResume(id, selectedSections) {
    const res = await fetch(`/api/jobs/${id}/resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selectedSections }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Resume generation failed');
    return data;
  },

  /** Get profile */
  async getProfile() {
    const res = await fetch('/api/profile');
    return res.json();
  },

  /** Save profile */
  async saveProfile(data) {
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save profile');
    return res.json();
  },
};
