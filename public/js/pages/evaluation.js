/** evaluation.js — Job detail page with A-G evaluation blocks */
const EvaluationPage = {
  render() {
    return '<div id="eval-page"><div class="loading-overlay"><div class="spinner" style="width:28px;height:28px;border-width:3px"></div><p>Loading...</p></div></div>';
  },

  async init(jobId) {
    const c = document.getElementById('eval-page');
    try {
      const job = await API.getJob(jobId);
      if (!job) { c.innerHTML = '<div class="empty-state"><h3>Job not found</h3></div>'; return; }
      c.innerHTML = this._build(job);
    } catch (err) {
      c.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${esc(err.message)}</p></div>`;
    }
  },

  _build(job) {
    const ev = job.evaluation;
    const hasEval = ev && ev.score !== null;
    const blocks = ev?.blocks || {};
    const keys = [
      { k:'A', icon:'📋', t:'Role Summary' },
      { k:'B', icon:'🎯', t:'CV Match' },
      { k:'C', icon:'📊', t:'Level & Strategy' },
      { k:'D', icon:'💰', t:'Comp & Demand' },
      { k:'E', icon:'✏️', t:'Personalization' },
      { k:'F', icon:'🎤', t:'Interview Prep' },
      { k:'G', icon:'🔍', t:'Legitimacy' },
    ];

    let html = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:24px">
      <button class="btn btn-ghost" onclick="history.back()">← Back</button></div>
      <div class="card" style="margin-bottom:20px">
        <div class="eval-header-row" style="display:flex;align-items:flex-start;gap:20px;flex-wrap:wrap">
          ${hasEval ? ScoreCard.ring(ev.score, 80) : ''}
          <div style="flex:1;min-width:160px">
            <h2 style="font-family:var(--font-heading);font-size:clamp(1rem,4vw,1.3rem);font-weight:700;margin-bottom:4px">${esc(job.title || 'Untitled Position')}</h2>
            <div style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:8px">${esc(job.company || 'Unknown')}${job.location ? ' · ' + esc(job.location) : ''}</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">${StatusBadge.render(job.status)}
              ${hasEval && ev.archetype ? `<span class="badge" style="background:var(--purple-dim);color:var(--purple-accent)">${esc(ev.archetype)}</span>` : ''}
              ${hasEval && ev.legitimacy ? `<span class="badge badge-${ev.legitimacy==='High Confidence'?'applied':ev.legitimacy==='Suspicious'?'rejected':'saved'}">${esc(ev.legitimacy)}</span>` : ''}
            </div>
          </div>
          <div class="eval-actions" style="display:flex;gap:8px;flex-wrap:wrap">
            ${!hasEval && job.raw_jd && App._geminiConfigured ? `<button class="btn btn-primary btn-sm" id="run-eval-btn" onclick="EvaluationPage.runEval(${job.id})">🤖 Evaluate</button>` : ''}
            ${hasEval ? `<button class="btn btn-secondary btn-sm" onclick="location.hash='#/job/${job.id}/resume'">📄 Resume</button>` : ''}
            ${StatusBadge.dropdown(job.status, job.id)}
          </div>
        </div>
        ${!App._geminiConfigured && !hasEval ? '<div class="info-banner" style="margin-top:16px">⚠️ Gemini API not configured. <a href="#/profile" style="margin-left:auto">Configure →</a></div>' : ''}
      </div>`;

    if (hasEval && ev.keywordsList?.length) {
      html += `<div class="card" style="margin-bottom:20px"><div class="card-title" style="margin-bottom:10px">🔑 Keywords</div>
        <div class="keyword-tags">${ev.keywordsList.map(k=>`<span class="keyword-tag">${esc(k)}</span>`).join('')}</div></div>`;
    }

    if (hasEval) {
      html += '<h3 style="font-family:var(--font-heading);font-size:1rem;font-weight:600;margin-bottom:12px">Evaluation Breakdown</h3>';
      for (const { k, icon, t } of keys) {
        const b = blocks[k];
        if (!b) continue;
        html += `<div class="eval-block" id="block-${k}">
          <div class="eval-block-header" onclick="document.getElementById('block-${k}').classList.toggle('open')">
            <div class="eval-block-label"><span class="eval-block-key">${k}</span> ${icon} ${esc(b.title||t)}</div>
            <span class="eval-block-chevron">▼</span></div>
          <div class="eval-block-content"><div class="eval-block-body">${this._md(b.content)}</div></div></div>`;
      }
    }

    if (job.raw_jd) {
      html += `<div class="card" style="margin-top:20px"><div class="card-header"><div class="card-title">📄 Job Description</div>
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('jd-full').style.display=document.getElementById('jd-full').style.display==='none'?'block':'none'">Toggle</button></div>
        <div class="jd-preview" id="jd-full" style="display:none">${esc(job.raw_jd)}</div></div>`;
    }

    html += `<div class="action-row" style="margin-top:20px;display:flex;gap:8px;flex-wrap:wrap">
      <a href="${job.url}" target="_blank" class="btn btn-secondary btn-sm">🔗 Open Original</a>
      <button class="btn btn-danger btn-sm" onclick="EvaluationPage.deleteJob(${job.id})">Delete</button></div>`;
    return html;
  },

  _evalQuotes: [
    { text: "The best way to predict the future is to invent it.", author: "Alan Kay" },
    { text: "AI is the new electricity.", author: "Andrew Ng" },
    { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
    { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
    { text: "In God we trust; all others must bring data.", author: "W. Edwards Deming" },
    { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
    { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
  ],
  _quoteTimer: null,

  async runEval(id) {
    const c = document.getElementById('eval-page');
    const randomQuote = () => this._evalQuotes[Math.floor(Math.random() * this._evalQuotes.length)];
    const q = randomQuote();

    // Show loading overlay with quotes
    c.innerHTML = `
      <div class="card" style="text-align:center;padding:40px 24px;max-width:560px;margin:40px auto">
        <div class="spinner" style="width:36px;height:36px;border-width:3px;margin:0 auto 20px"></div>
        <h3 style="font-family:var(--font-heading);font-size:1.1rem;margin-bottom:8px;color:var(--teal-bright)">
          🤖 Evaluating your opportunity...
        </h3>
        <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:24px">
          This takes 30–60 seconds. Sit tight!
        </p>
        <div style="border-top:1px solid var(--border-subtle);padding-top:20px;min-height:80px">
          <p style="font-size:1rem;font-style:italic;color:var(--text-secondary);margin-bottom:8px;line-height:1.6;transition:opacity 0.3s" id="eq-text">
            "${q.text}"
          </p>
          <p style="font-size:0.8rem;color:var(--text-muted);transition:opacity 0.3s" id="eq-author">— ${q.author}</p>
        </div>
      </div>`;

    // Rotate quotes
    this._quoteTimer = setInterval(() => {
      const nq = randomQuote();
      const t = document.getElementById('eq-text');
      const a = document.getElementById('eq-author');
      if (t && a) {
        t.style.opacity = '0'; a.style.opacity = '0';
        setTimeout(() => {
          t.textContent = `"${nq.text}"`; a.textContent = `— ${nq.author}`;
          t.style.opacity = '1'; a.style.opacity = '1';
        }, 300);
      }
    }, 5000);

    try {
      await API.evaluateJob(id);
      clearInterval(this._quoteTimer);
      Toast.success('Evaluation complete!');
      this.init(id);
    } catch (err) {
      clearInterval(this._quoteTimer);

      if (err.message?.includes('rate limit') || err.message?.includes('429')) {
        const rq = randomQuote();
        c.innerHTML = `
          <div class="card" style="text-align:center;padding:40px 24px;max-width:560px;margin:40px auto">
            <div style="font-size:2.5rem;margin-bottom:12px">☕</div>
            <h3 style="font-family:var(--font-heading);font-size:1.1rem;margin-bottom:8px;color:var(--amber)">
              Rate Limit Reached
            </h3>
            <p style="font-size:0.88rem;color:var(--text-secondary);margin-bottom:8px">
              Gemini API is cooling down. This usually resets in about a minute.
            </p>
            <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:20px">
              Grab a coffee and try again shortly ☕
            </p>
            <div style="border-top:1px solid var(--border-subtle);padding-top:20px;min-height:80px">
              <p style="font-size:1rem;font-style:italic;color:var(--text-secondary);margin-bottom:8px;line-height:1.6">"${rq.text}"</p>
              <p style="font-size:0.8rem;color:var(--text-muted)">— ${rq.author}</p>
            </div>
            <button class="btn btn-primary" style="margin-top:20px" onclick="EvaluationPage.runEval(${id})">🔄 Try Again</button>
            <button class="btn btn-ghost" style="margin-top:8px" onclick="EvaluationPage.init(${id})">← Back to Job</button>
          </div>`;
      } else {
        Toast.error(err.message);
        this.init(id);
      }
    }
  },

  async deleteJob(id) {
    if (!confirm('Delete this job?')) return;
    try { await API.deleteJob(id); Toast.success('Deleted'); location.hash = '#/tracker'; } catch (e) { Toast.error(e.message); }
  },

  _md(text) {
    if (!text) return '<em style="color:var(--text-muted)">No content</em>';
    let h = esc(text);
    h = h.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
    h = h.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    h = h.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    h = h.replace(/\*(.+?)\*/g, '<em>$1</em>');
    h = h.replace(/`([^`]+)`/g, '<code>$1</code>');
    h = h.replace(/^- (.+)$/gm, '<li>$1</li>');
    h = h.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');
    h = h.replace(/\n\n/g, '<br><br>');
    h = h.replace(/\n/g, '<br>');
    return h;
  },
};
