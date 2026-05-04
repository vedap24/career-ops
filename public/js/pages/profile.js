/** profile.js — Profile and CV management page */
const ProfilePage = {
  render() {
    return '<div id="profile-page"><div class="loading-overlay"><div class="spinner" style="width:28px;height:28px;border-width:3px"></div></div></div>';
  },

  async init() {
    const c = document.getElementById('profile-page');
    try {
      const profile = await API.getProfile();
      const health = await API.health();
      c.innerHTML = this._build(profile, health.gemini_configured);
    } catch (err) {
      c.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${esc(err.message)}</p></div>`;
    }
  },

  _build(p, geminiOk) {
    return `
    <h2 style="font-family:var(--font-heading);font-size:1.3rem;font-weight:700;margin-bottom:20px">Profile & CV</h2>

    <div class="card" style="margin-bottom:20px">
      <div class="card-title" style="margin-bottom:4px">🤖 Gemini API Status</div>
      <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
        <span style="width:10px;height:10px;border-radius:50%;background:${geminiOk?'var(--green)':'var(--red)'}"></span>
        <span style="font-size:0.9rem;color:var(--text-secondary)">${geminiOk ? 'Connected — evaluation and resume tailoring are enabled' : 'Not configured — add GEMINI_API_KEY to your .env file and restart the server'}</span>
      </div>
    </div>

    <form onsubmit="ProfilePage.save(event)">
    <div class="card" style="margin-bottom:20px">
      <div class="card-title" style="margin-bottom:16px">👤 Contact Information</div>
      <div class="profile-grid" style="display:grid;gap:16px">
        <div class="form-group"><label>Full Name</label><input type="text" id="p-name" value="${esc(p.name||'')}"></div>
        <div class="form-group"><label>Email</label><input type="email" id="p-email" value="${esc(p.email||'')}"></div>
        <div class="form-group"><label>Phone</label><input type="text" id="p-phone" value="${esc(p.phone||'')}"></div>
        <div class="form-group"><label>Location</label><input type="text" id="p-location" value="${esc(p.location||'')}"></div>
        <div class="form-group"><label>LinkedIn</label><input type="text" id="p-linkedin" value="${esc(p.linkedin||'')}" placeholder="linkedin.com/in/..."></div>
        <div class="form-group"><label>Portfolio URL</label><input type="text" id="p-portfolio" value="${esc(p.portfolio||'')}" placeholder="https://..."></div>
      </div>
    </div>

    <div class="card" style="margin-bottom:20px">
      <div class="card-title" style="margin-bottom:16px">📄 Your CV (Markdown)</div>
      <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:12px">Paste your full CV in Markdown format. This is used for evaluation matching and resume tailoring.</p>
      <textarea id="p-cv" rows="20" style="font-family:monospace;font-size:0.85rem">${esc(p.cv_markdown||'')}</textarea>
    </div>

    <button type="submit" class="btn btn-primary" id="save-profile-btn">💾 Save Profile</button>
    </form>`;
  },

  async save(e) {
    e.preventDefault();
    const btn = document.getElementById('save-profile-btn');
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Saving...';
    try {
      await API.saveProfile({
        name: document.getElementById('p-name').value,
        email: document.getElementById('p-email').value,
        phone: document.getElementById('p-phone').value,
        location: document.getElementById('p-location').value,
        linkedin: document.getElementById('p-linkedin').value,
        portfolio: document.getElementById('p-portfolio').value,
        cv_markdown: document.getElementById('p-cv').value,
      });
      Toast.success('Profile saved!');
    } catch (err) { Toast.error(err.message); }
    finally { btn.disabled = false; btn.innerHTML = '💾 Save Profile'; }
  },
};
