/** intake.js — URL paste + JD extraction page */
const IntakePage = {
  // AI/tech quotes shown during evaluation loading or rate-limit waits
  _quotes: [
    { text: "The best way to predict the future is to invent it.", author: "Alan Kay" },
    { text: "Any sufficiently advanced technology is indistinguishable from magic.", author: "Arthur C. Clarke" },
    { text: "AI is the new electricity.", author: "Andrew Ng" },
    { text: "The measure of intelligence is the ability to change.", author: "Albert Einstein" },
    { text: "Move fast and break things. Unless you are breaking stuff, you are not moving fast enough.", author: "Mark Zuckerberg" },
    { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
    { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
    { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
    { text: "In God we trust; all others must bring data.", author: "W. Edwards Deming" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
    { text: "It's not a bug — it's an undocumented feature.", author: "Anonymous Dev" },
    { text: "Machine intelligence is the last invention that humanity will ever need to make.", author: "Nick Bostrom" },
    { text: "The future belongs to those who learn more skills and combine them in creative ways.", author: "Robert Greene" },
    { text: "A computer would deserve to be called intelligent if it could deceive a human into believing that it was human.", author: "Alan Turing" },
  ],

  _quoteInterval: null,

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

    <!-- Evaluation loading screen with rotating quotes -->
    <div id="eval-loading" style="display:none;max-width:640px;margin:24px auto 0">
      <div class="card" style="text-align:center;padding:40px 24px">
        <div class="spinner" style="width:36px;height:36px;border-width:3px;margin:0 auto 20px"></div>
        <h3 style="font-family:var(--font-heading);font-size:1.1rem;margin-bottom:8px;color:var(--teal-bright)" id="eval-loading-title">
          🤖 Evaluating your opportunity...
        </h3>
        <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:24px" id="eval-loading-subtitle">
          This takes 30–60 seconds. Sit tight!
        </p>
        <div style="border-top:1px solid var(--border-subtle);padding-top:20px;min-height:80px">
          <p style="font-size:1rem;font-style:italic;color:var(--text-secondary);margin-bottom:8px;line-height:1.6" id="eval-quote-text">
            "The best way to predict the future is to invent it."
          </p>
          <p style="font-size:0.8rem;color:var(--text-muted)" id="eval-quote-author">— Alan Kay</p>
        </div>
      </div>
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
        <div class="action-row" style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">
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
        <div class="action-row" style="display:flex;gap:8px;margin-top:12px">
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
        document.getElementById('jd-text').textContent = (job.raw_jd || text).slice(0, 3000);
        Toast.success('Job description saved');
      }
    } catch (err) {
      Toast.error(err.message);
    }
  },

  // Start rotating quotes
  _startQuotes() {
    this._showRandomQuote();
    this._quoteInterval = setInterval(() => this._showRandomQuote(), 5000);
  },

  _stopQuotes() {
    if (this._quoteInterval) {
      clearInterval(this._quoteInterval);
      this._quoteInterval = null;
    }
  },

  _showRandomQuote() {
    const q = this._quotes[Math.floor(Math.random() * this._quotes.length)];
    const textEl = document.getElementById('eval-quote-text');
    const authorEl = document.getElementById('eval-quote-author');
    if (textEl && authorEl) {
      textEl.style.opacity = '0';
      authorEl.style.opacity = '0';
      setTimeout(() => {
        textEl.textContent = `"${q.text}"`;
        authorEl.textContent = `— ${q.author}`;
        textEl.style.opacity = '1';
        authorEl.style.opacity = '1';
      }, 300);
    }
  },

  _showEvalLoading(title, subtitle) {
    const loading = document.getElementById('eval-loading');
    const jdResult = document.getElementById('jd-result');
    if (loading) {
      loading.style.display = 'block';
      if (title) document.getElementById('eval-loading-title').textContent = title;
      if (subtitle) document.getElementById('eval-loading-subtitle').textContent = subtitle;
    }
    if (jdResult) jdResult.style.display = 'none';
    this._startQuotes();
  },

  _hideEvalLoading() {
    const loading = document.getElementById('eval-loading');
    if (loading) loading.style.display = 'none';
    this._stopQuotes();
  },

  async evaluate() {
    if (!this._currentJobId) return;

    this._showEvalLoading(
      '🤖 Evaluating your opportunity...',
      'This takes 30–60 seconds. Sit tight!'
    );

    try {
      await API.evaluateJob(this._currentJobId);
      this._hideEvalLoading();
      Toast.success('Evaluation complete!');
      location.hash = `#/job/${this._currentJobId}`;
    } catch (err) {
      this._hideEvalLoading();

      if (err.message?.includes('rate limit') || err.message?.includes('429')) {
        // Show a friendly rate-limit message with quotes
        this._showRateLimitScreen();
      } else if (err.unavailable) {
        Toast.error('Gemini API not available. Configure your API key in Profile settings.');
        document.getElementById('jd-result').style.display = 'block';
      } else {
        Toast.error(err.message);
        document.getElementById('jd-result').style.display = 'block';
      }
    }
  },

  _showRateLimitScreen() {
    const container = document.getElementById('eval-loading');
    if (container) {
      container.style.display = 'block';
      container.querySelector('.card').innerHTML = `
        <div style="font-size:2.5rem;margin-bottom:12px">☕</div>
        <h3 style="font-family:var(--font-heading);font-size:1.1rem;margin-bottom:8px;color:var(--amber)">
          Rate Limit Reached
        </h3>
        <p style="font-size:0.88rem;color:var(--text-secondary);margin-bottom:8px">
          Gemini API is cooling down. This usually resets in about a minute.
        </p>
        <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:20px">
          Grab a coffee and try again shortly. Enjoy a quote while you wait! ☕
        </p>
        <div style="border-top:1px solid var(--border-subtle);padding-top:20px;min-height:80px">
          <p style="font-size:1rem;font-style:italic;color:var(--text-secondary);margin-bottom:8px;line-height:1.6;transition:opacity 0.3s" id="eval-quote-text">
            "${this._quotes[0].text}"
          </p>
          <p style="font-size:0.8rem;color:var(--text-muted);transition:opacity 0.3s" id="eval-quote-author">— ${this._quotes[0].author}</p>
        </div>
        <button class="btn btn-primary" style="margin-top:20px" onclick="IntakePage.retryEval()">
          🔄 Try Again
        </button>
        <button class="btn btn-ghost" style="margin-top:8px" onclick="IntakePage.dismissRateLimit()">
          Back to JD
        </button>
      `;
      this._startQuotes();
    }
  },

  retryEval() {
    this._hideEvalLoading();
    this.evaluate();
  },

  dismissRateLimit() {
    this._hideEvalLoading();
    document.getElementById('jd-result').style.display = 'block';
  },

  reset() {
    document.getElementById('jd-result').style.display = 'none';
    document.getElementById('manual-paste').style.display = 'none';
    document.getElementById('eval-loading').style.display = 'none';
    document.getElementById('url-input').value = '';
    this._currentJobId = null;
    this._stopQuotes();
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
