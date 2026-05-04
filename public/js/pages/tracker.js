/** tracker.js — Application tracker page */
const TrackerPage = {
  _filter: 'all',

  render() {
    return '<div id="tracker-page"><div class="loading-overlay"><div class="spinner" style="width:28px;height:28px;border-width:3px"></div></div></div>';
  },

  async init() {
    const c = document.getElementById('tracker-page');
    try {
      const jobs = await API.listJobs();
      c.innerHTML = this._build(jobs);
    } catch (err) {
      c.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${esc(err.message)}</p></div>`;
    }
  },

  _build(jobs) {
    if (jobs.length === 0) {
      return `<div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <h3>No jobs tracked yet</h3>
        <p>Paste a job URL on the home page to start tracking applications.</p>
        <a href="#/" class="btn btn-primary">+ Add First Job</a>
      </div>`;
    }

    const filtered = this._filter === 'all' ? jobs : jobs.filter(j => j.status === this._filter);
    const counts = { all: jobs.length, saved: 0, evaluated: 0, applied: 0, rejected: 0 };
    jobs.forEach(j => { if (counts[j.status] !== undefined) counts[j.status]++; });

    return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">
      <h2 style="font-family:var(--font-heading);font-size:1.3rem;font-weight:700">Application Tracker</h2>
      <a href="#/" class="btn btn-primary btn-sm">+ Add Job</a>
    </div>

    <div class="filter-bar">
      ${['all','saved','evaluated','applied','rejected'].map(s =>
        `<button class="filter-pill ${this._filter===s?'active':''}" onclick="TrackerPage.setFilter('${s}')">
          ${s === 'all' ? 'All' : s.charAt(0).toUpperCase()+s.slice(1)} (${counts[s]})
        </button>`
      ).join('')}
    </div>

    <div class="job-list">
      ${filtered.length === 0 ? `<div class="empty-state" style="padding:32px"><p>No jobs with status "${this._filter}"</p></div>` :
        filtered.map(j => `
          <div class="job-card" onclick="location.hash='#/job/${j.id}'">
            <div class="job-card-info">
              <h3>${esc(j.title || 'Untitled Position')}</h3>
              <div class="job-meta">
                <span>${esc(j.company || 'Unknown')}</span>
                ${j.location ? `<span>${esc(j.location)}</span>` : ''}
                <span>${new Date(j.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            ${StatusBadge.render(j.status)}
            <div class="job-card-score">${ScoreCard.inline(j.score)}</div>
          </div>
        `).join('')
      }
    </div>`;
  },

  setFilter(f) {
    this._filter = f;
    this.init();
  },
};
