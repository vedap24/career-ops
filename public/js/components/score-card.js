/** score-card.js — Score visualization components */
const ScoreCard = {
  /** Render a score ring SVG */
  ring(score, size = 72) {
    if (score === null || score === undefined) {
      return `<div class="score-ring" style="width:${size}px;height:${size}px">
        <span class="score-value" style="color:var(--text-muted);font-size:${size * 0.2}px">—</span>
      </div>`;
    }
    const s = parseFloat(score);
    const cls = s >= 4.0 ? 'score-high' : s >= 3.5 ? 'score-mid' : 'score-low';
    const color = s >= 4.0 ? 'var(--green)' : s >= 3.5 ? 'var(--amber)' : 'var(--red)';
    const r = (size / 2) - 4;
    const circ = 2 * Math.PI * r;
    const pct = Math.min(s / 5, 1);
    const offset = circ * (1 - pct);

    return `<div class="score-ring" style="width:${size}px;height:${size}px">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--border-subtle)" stroke-width="4"/>
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="4"
          stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round"
          style="transition: stroke-dashoffset 0.8s ease"/>
      </svg>
      <span class="score-value ${cls}" style="font-size:${size * 0.25}px">${s.toFixed(1)}</span>
    </div>`;
  },

  /** Inline score text with color */
  inline(score) {
    if (score === null || score === undefined) return '<span style="color:var(--text-muted)">—</span>';
    const s = parseFloat(score);
    const cls = s >= 4.0 ? 'score-high' : s >= 3.5 ? 'score-mid' : 'score-low';
    return `<span class="${cls}">${s.toFixed(1)}</span>`;
  },
};
