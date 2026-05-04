/** app.js — SPA router and global app controller */
const App = {
  _geminiConfigured: false,

  async start() {
    // Check health / Gemini status
    try {
      const h = await API.health();
      this._geminiConfigured = h.gemini_configured;
    } catch { this._geminiConfigured = false; }

    // Render header
    this._renderHeader();

    // Listen for hash changes
    window.addEventListener('hashchange', () => this.navigate());
    this.navigate();
  },

  _renderHeader() {
    document.getElementById('header').innerHTML = `
      <div class="container" style="display:flex;align-items:center;justify-content:space-between;height:60px">
        <div class="logo" onclick="location.hash='#/'">
          <div class="logo-icon">🎯</div>
          Career-Ops
        </div>
        <nav>
          <a href="#/" id="nav-home">Home</a>
          <a href="#/tracker" id="nav-tracker">Tracker</a>
          <a href="#/profile" id="nav-profile">Profile</a>
        </nav>
      </div>`;
  },

  async navigate() {
    const hash = location.hash || '#/';
    const content = document.getElementById('page-content');

    // Update active nav
    document.querySelectorAll('nav a').forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === hash ||
        (hash.startsWith('#/job') && a.id === 'nav-home'));
    });

    // Route matching
    if (hash === '#/' || hash === '') {
      content.innerHTML = IntakePage.render(this._geminiConfigured);
      IntakePage.init();
    } else if (hash.match(/^#\/job\/(\d+)\/resume$/)) {
      const id = hash.match(/^#\/job\/(\d+)\/resume$/)[1];
      content.innerHTML = ResumePage.render();
      ResumePage.init(parseInt(id));
    } else if (hash.match(/^#\/job\/(\d+)$/)) {
      const id = hash.match(/^#\/job\/(\d+)$/)[1];
      content.innerHTML = EvaluationPage.render();
      EvaluationPage.init(parseInt(id));
    } else if (hash === '#/tracker') {
      content.innerHTML = TrackerPage.render();
      TrackerPage.init();
    } else if (hash === '#/profile') {
      content.innerHTML = ProfilePage.render();
      ProfilePage.init();
    } else {
      content.innerHTML = '<div class="empty-state"><h3>Page not found</h3><a href="#/" class="btn btn-primary">Go Home</a></div>';
    }
  },

  /** Global status update (called from StatusBadge dropdown) */
  async updateJobStatus(jobId, newStatus) {
    try {
      await API.updateJob(jobId, { status: newStatus });
      Toast.success(`Status updated to ${newStatus}`);
    } catch (err) { Toast.error(err.message); }
  },
};

// Helper used across pages
function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

// Boot
document.addEventListener('DOMContentLoaded', () => App.start());
