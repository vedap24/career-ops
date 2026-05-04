/** intake.js — URL paste + JD extraction page */
const IntakePage = {
  render(geminiConfigured) {
    return `
    <div class="hero">
      <h1>Evaluate Any Job in Seconds</h1>
      <p>Paste a job posting URL — get a detailed Career-Ops evaluation breakdown and a tailored resume draft.</p>
    </div>

    ${!geminiConfigured ? `<div class="info-banner">
      ⚠️ Gemini API key not configured. URL intake and tracking work, but evaluation and resume tailoring are disabled.
      <a href="#/profile" style="margin-left:auto;white-space:nowrap">Set up in Profile →</a>
    </div>` : ''}

    <div class="intake-box">
      <div class="intake-input-wrap" id="intake-wrap">
        <input type="url" id="url-input" placeholder="https://jobs.lever.co/company/role..."
          autocomplete="off" spellcheck="false">
        <button class="btn btn-primary" id="intake-btn" onclick="IntakePage.submit()">
          Extract JD
        </button>
      </div>
      <p style="text-align:center;font-size:0.8rem;color:var(--text-muted);margin-top:10px">
        Supports Lever, Greenhouse, Ashby, Workday, and most career pages
      </p>
    </div>

    <!-- JD Preview (shown after extraction) -->
    <div id="jd-result" style="display:none;max-width:640px;margin:24px auto 0">
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title" id="jd-title">Extracted Job Description</div>
            <div style="font-size:0.8rem;color:var(--text-muted)" id="jd-company"></div>
          </div>
          <span class="badge badge-saved">Saved</span>
        </div>
        <div class="jd-preview" id="jd-text"></div>
        <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">
          <button class="btn btn-primary" id="eval-btn" onclick="IntakePage.evaluate()" ${!geminiConfigured ? 'disabled title="Configure Gemini API key first"' : ''}>
            🤖 Run Evaluation
          </button>
          <button class="btn btn-secondary" onclick="location.hash='#/tracker'">
            View in Tracker
          </button>
        </div>
      </div>
    </div>

    <!-- Manual JD paste fallback -->
    <div id="manual-paste" style="display:none;max-width:640px;margin:24px auto 0">
      <div class="card">
        <div class="card-title" style="margin-bottom:12px">⚠️ Extraction Failed</div>
        <p style="font-size:0.88rem;color:var(--text-secondary);margin-bottom:16px">
          Could not extract the job description from that URL. This can happen with SPAs or pages that require login.
          Paste the JD text manually below:
        </p>
        <textarea id="manual-jd-text" placeholder="Paste the full job description here..." rows="10"></textarea>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn btn-primary" onclick="IntakePage.submitManual()">Save Job</button>
          <button class="btn btn-ghost" onclick="IntakePage.reset()">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Recent jobs -->
    <div style="max-width:640px;margin:40px auto 0" id="recent-section"></div>
    `;
  },

  async init() {
    await this.loadRecent();
    const input = document.getElementById('url-input');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.submit();
      });
      input.focus();
    }
  },

  _currentJobId: null,

  async submit() {
    const input = document.getElementById('url-input');
    const btn = document.getElementById('intake-btn');
    const url = input?.value?.trim();
    if (!url) { Toast.error('Please enter a URL'); return; }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Extracting...';

    try {
      const job = await API.createJob(url);
      this._currentJobId = job.id;

      if (job.extraction_ok && job.raw_jd) {
        document.getElementById('jd-result').style.display = 'block';
        document.getElementById('manual-paste').style.display = 'none';
        document.getElementById('jd-title').textContent = job.title || 'Job Description';
        document.getElementById('jd-company').textContent =
          [job.company, job.location].filter(Boolean).join(' · ');
        document.getElementById('jd-text').textContent = job.raw_jd.slice(0, 3000) +
          (job.raw_jd.length > 3000 ? '\n\n[...truncated for preview]' : '');
        Toast.success('Job description extracted successfully');
      } else {
        document.getElementById('jd-result').style.display = 'none';
        document.getElementById('manual-paste').style.display = 'block';
        Toast.info('Auto-extraction failed — paste the JD manually');
      }
      this.loadRecent();
    } catch (err) {
      Toast.error(err.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Extract JD';
    }
  },

  async submitManual() {
    const text = document.getElementById('manual-jd-text')?.value?.trim();
    if (!text) { Toast.error('Please paste the job description'); return; }

    try {
      if (this._currentJobId) {
        await API.updateJob(this._currentJobId, { raw_jd: text, extraction_ok: true });
        const job = await API.getJob(this._currentJobId);
        document.getElementById('manual-paste').style.display = 'none';
        document.getElementById('jd-result').style.display = 'block';
        document.getElementById('jd-title').textContent = job.title || 'Job Description';
        document.getElementById('jd-text').textContent = text.slice(0, 3000);
        Toast.success('Job description saved');
      }
    } catch (err) {
      Toast.error(err.message);
    }
  },

  async evaluate() {
    const btn = document.getElementById('eval-btn');
    if (!this._currentJobId) return;

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Evaluating (~30s)...';

    try {
      await API.evaluateJob(this._currentJobId);
      Toast.success('Evaluation complete!');
      location.hash = `#/job/${this._currentJobId}`;
    } catch (err) {
      if (err.unavailable) {
        Toast.error('Gemini API not available. Configure your API key in Profile settings.');
      } else {
        Toast.error(err.message);
      }
    } finally {
      btn.disabled = false;
      btn.innerHTML = '🤖 Run Evaluation';
    }
  },

  reset() {
    document.getElementById('jd-result').style.display = 'none';
    document.getElementById('manual-paste').style.display = 'none';
    document.getElementById('url-input').value = '';
    this._currentJobId = null;
  },

  async loadRecent() {
    const section = document.getElementById('recent-section');
    if (!section) return;
    try {
      const jobs = await API.listJobs();
      if (jobs.length === 0) {
        section.innerHTML = '';
        return;
      }
      const recent = jobs.slice(0, 5);
      section.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <h3 style="font-family:var(--font-heading);font-size:1rem;font-weight:600">Recent Jobs</h3>
          <a href="#/tracker" class="btn btn-ghost btn-sm">View All →</a>
        </div>
        <div class="job-list">
          ${recent.map(j => `
            <div class="job-card" onclick="location.hash='#/job/${j.id}'">
              <div class="job-card-info">
                <h3>${esc(j.title || 'Untitled Position')}</h3>
                <div class="job-meta">
                  <span>${esc(j.company || 'Unknown Company')}</span>
                  <span>${new Date(j.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              ${StatusBadge.render(j.status)}
              <div class="job-card-score">${ScoreCard.inline(j.score)}</div>
            </div>
          `).join('')}
        </div>
      `;
    } catch { section.innerHTML = ''; }
  },
};

function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
