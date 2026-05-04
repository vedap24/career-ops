/** status-badge.js — Colored status pill component */
const StatusBadge = {
  render(status) {
    const s = (status || 'saved').toLowerCase();
    const labels = { saved: 'Saved', evaluated: 'Evaluated', applied: 'Applied', rejected: 'Rejected' };
    const icons = { saved: '○', evaluated: '◉', applied: '✓', rejected: '✗' };
    return `<span class="badge badge-${s}">${icons[s] || '○'} ${labels[s] || s}</span>`;
  },

  /** Dropdown for changing status */
  dropdown(currentStatus, jobId) {
    const statuses = ['saved', 'evaluated', 'applied', 'rejected'];
    const options = statuses.map(s =>
      `<option value="${s}" ${s === currentStatus ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`
    ).join('');
    return `<select class="status-select" data-job-id="${jobId}" onchange="App.updateJobStatus(${jobId}, this.value)"
      style="padding:4px 8px;font-size:0.75rem;background:var(--bg-secondary);color:var(--text-primary);border:1px solid var(--border-subtle);border-radius:4px;cursor:pointer">
      ${options}</select>`;
  },
};
