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

  async runEval(id) {
    const btn = document.getElementById('run-eval-btn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Evaluating...'; }
    try {
      Toast.info('Evaluating... ~30-60s');
      await API.evaluateJob(id);
      Toast.success('Done!');
      this.init(id);
    } catch (err) { Toast.error(err.message); if (btn) { btn.disabled = false; btn.innerHTML = '🤖 Evaluate'; } }
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
