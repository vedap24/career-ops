/** resume.js — Resume editor + export page */
const ResumePage = {
  render() {
    return '<div id="resume-page"><div class="loading-overlay"><div class="spinner" style="width:28px;height:28px;border-width:3px"></div><p>Loading...</p></div></div>';
  },

  async init(jobId) {
    const c = document.getElementById('resume-page');
    try {
      const job = await API.getJob(jobId);
      if (!job) { c.innerHTML = '<div class="empty-state"><h3>Job not found</h3></div>'; return; }
      c.innerHTML = this._build(job);
    } catch (err) {
      c.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${esc(err.message)}</p></div>`;
    }
  },

  _build(job) {
    const hasResume = job.resume && job.resume.html_content;
    const keywords = job.evaluation?.keywordsList || [];

    return `
    <div style="margin-bottom:20px">
      <button class="btn btn-ghost" onclick="location.hash='#/job/${job.id}'" style="margin-bottom:8px">← Back to Evaluation</button>
      <h2 style="font-family:var(--font-heading);font-size:clamp(0.95rem,3.5vw,1.1rem);font-weight:600">
        Tailored Resume — ${esc(job.company || '')} ${esc(job.title || '')}
      </h2>
    </div>

    ${!App._geminiConfigured ? '<div class="info-banner">⚠️ Gemini API not configured. Resume will show your existing CV without tailoring. <a href="#/profile" style="margin-left:auto">Configure →</a></div>' : ''}

    <div class="action-row" style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap">
      <button class="btn btn-primary" id="gen-resume-btn" onclick="ResumePage.generate(${job.id})">
        ${hasResume ? '🔄 Regenerate' : '✨ Generate Tailored Resume'}
      </button>
      ${hasResume ? `
        <button class="btn btn-secondary" onclick="ResumePage.copyHtml()">📋 Copy HTML</button>
        <button class="btn btn-secondary" onclick="ResumePage.copyMarkdown()">📝 Copy Markdown</button>
        <button class="btn btn-secondary" onclick="ResumePage.downloadHtml(${job.id})">💾 Download HTML</button>
      ` : ''}
    </div>

    ${hasResume && job.resume.coverage_pct !== undefined ? `
    <div class="info-banner info-teal" style="margin-bottom:20px">
      📊 Keyword coverage: <strong>${job.resume.coverage_pct}%</strong> of JD keywords matched
      ${job.resume.keywordsList?.length ? ` · ${job.resume.keywordsList.length} keywords used` : ''}
    </div>` : ''}

    ${keywords.length ? `
    <div style="margin-bottom:16px">
      <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:8px">Target Keywords</div>
      <div class="keyword-tags">${keywords.map(k => {
        const matched = hasResume && job.resume.keywordsList?.includes(k);
        return `<span class="keyword-tag ${matched ? 'matched' : ''}">${esc(k)}</span>`;
      }).join('')}</div>
    </div>` : ''}

    <div class="tabs">
      <div class="tab active" onclick="ResumePage.switchTab('preview')">Preview</div>
      <div class="tab" onclick="ResumePage.switchTab('markdown')">Markdown</div>
    </div>

    <div id="tab-preview" class="card" style="padding:0;overflow:hidden">
      ${hasResume ?
        `<div class="resume-html-preview" id="resume-preview">${job.resume.html_content}</div>` :
        `<div class="empty-state"><div class="empty-state-icon">📄</div><h3>No resume generated yet</h3><p>Click "Generate Tailored Resume" to create a version optimized for this job.</p></div>`
      }
    </div>

    <div id="tab-markdown" class="card" style="display:none">
      <pre style="white-space:pre-wrap;font-size:0.85rem;line-height:1.6;color:var(--text-secondary);max-height:600px;overflow:auto" id="resume-md">${hasResume ? esc(job.resume.markdown_content || '') : 'No markdown content yet.'}</pre>
    </div>`;
  },

  switchTab(tab) {
    document.getElementById('tab-preview').style.display = tab === 'preview' ? 'block' : 'none';
    document.getElementById('tab-markdown').style.display = tab === 'markdown' ? 'block' : 'none';
    document.querySelectorAll('.tab').forEach((t, i) => {
      t.classList.toggle('active', (i === 0 && tab === 'preview') || (i === 1 && tab === 'markdown'));
    });
  },

  async generate(jobId) {
    const btn = document.getElementById('gen-resume-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Generating...';
    try {
      const result = await API.generateResume(jobId);
      if (result.fallback) Toast.info('Showing existing CV (no Gemini key configured for tailoring)');
      else Toast.success('Tailored resume generated!');
      this.init(jobId);
    } catch (err) { Toast.error(err.message); }
    finally { btn.disabled = false; btn.innerHTML = '✨ Generate Tailored Resume'; }
  },

  copyHtml() {
    const el = document.getElementById('resume-preview');
    if (!el) return;
    navigator.clipboard.writeText(el.innerHTML).then(() => Toast.success('HTML copied!')).catch(() => Toast.error('Copy failed'));
  },

  copyMarkdown() {
    const el = document.getElementById('resume-md');
    if (!el) return;
    navigator.clipboard.writeText(el.textContent).then(() => Toast.success('Markdown copied!')).catch(() => Toast.error('Copy failed'));
  },

  downloadHtml(jobId) {
    const el = document.getElementById('resume-preview');
    if (!el) return;
    const full = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Resume</title>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
      <style>body{font-family:'DM Sans',sans-serif;font-size:11px;line-height:1.5;color:#1a1a2e;max-width:8.5in;margin:0 auto;padding:20px}
      h1{font-family:'Space Grotesk',sans-serif;font-size:24px;font-weight:700}
      .header-gradient{height:2px;background:linear-gradient(to right,hsl(182,70%,45%),hsl(270,50%,55%));margin:6px 0 8px}
      .contact-row{display:flex;gap:8px;font-size:10px;color:#666;flex-wrap:wrap}
      .section-title{font-family:'Space Grotesk',sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:hsl(182,70%,40%);border-bottom:1px solid #e2e2e2;padding-bottom:4px;margin:16px 0 8px}
      .competency-tag{display:inline-block;font-size:9px;padding:3px 8px;border-radius:3px;background:hsl(182,40%,95%);color:hsl(182,70%,30%);border:1px solid hsl(182,40%,88%);margin:2px}
      .job{margin-bottom:12px} .job-company{font-weight:600;color:hsl(270,50%,50%)} .job-period{font-size:10px;color:#888}</style></head>
      <body>${el.innerHTML}</body></html>`;
    const blob = new Blob([full], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `resume-job-${jobId}.html`;
    a.click();
    Toast.success('HTML file downloaded');
  },
};
