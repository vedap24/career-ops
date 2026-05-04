/**
 * resume-builder.js — Tailored resume generation
 *
 * Takes the user's CV + job evaluation results and produces
 * a tailored resume in both HTML and Markdown formats.
 *
 * Uses the career-ops CV template design system (Space Grotesk + DM Sans)
 * and keyword injection strategy from modes/pdf.md.
 *
 * If Gemini is available, uses it to intelligently tailor content.
 * If not, provides a formatted version of the existing CV.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load the resume tailoring prompt
const RESUME_PROMPT = readFileSync(
  join(__dirname, '..', 'prompts', 'resume-tailoring.md'), 'utf-8'
);

/**
 * Generate a tailored resume for a specific job.
 *
 * @param {object} params
 * @param {string} params.cvMarkdown - User's CV in markdown
 * @param {string} params.jdText - Job description text
 * @param {string[]} params.keywords - Keywords extracted from evaluation
 * @param {string} params.archetype - Detected role archetype
 * @param {object} params.profile - User profile data (name, email, etc.)
 * @param {string[]} params.selectedSections - Which sections to include
 * @returns {Promise<{ok: boolean, html?: string, markdown?: string, keywords_used?: string[], coverage_pct?: number}>}
 */
export async function generateTailoredResume(params) {
  const {
    cvMarkdown,
    jdText,
    keywords = [],
    archetype = 'Unknown',
    profile = {},
    selectedSections,
  } = params;

  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

  // If no API key, return the CV as-is in HTML format
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return formatCvFallback(cvMarkdown, profile);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.3,       // More deterministic for resume content
        maxOutputTokens: 6144,
      },
    });

    const prompt = buildResumePrompt(cvMarkdown, jdText, keywords, archetype, profile, selectedSections);

    console.log(`[resume-builder] Generating tailored resume via Gemini...`);
    const result = await model.generateContent([{ text: prompt }]);
    const rawText = result.response.text();

    // Parse the response for HTML and Markdown sections
    const parsed = parseResumeResponse(rawText, profile);

    // Calculate keyword coverage
    const keywordsUsed = keywords.filter(kw =>
      parsed.markdown.toLowerCase().includes(kw.toLowerCase())
    );
    const coveragePct = keywords.length > 0
      ? Math.round((keywordsUsed.length / keywords.length) * 100)
      : 0;

    return {
      ok: true,
      html: parsed.html || wrapInHtmlTemplate(parsed.markdown, profile),
      markdown: parsed.markdown,
      keywords_used: keywordsUsed,
      coverage_pct: coveragePct,
    };
  } catch (err) {
    console.error(`[resume-builder] Error:`, err.message);
    return formatCvFallback(cvMarkdown, profile);
  }
}

/**
 * Build the prompt for resume tailoring.
 */
function buildResumePrompt(cvMarkdown, jdText, keywords, archetype, profile, selectedSections) {
  return `${RESUME_PROMPT}

═══════════════════════════════════════════════════════
CANDIDATE'S CURRENT CV (Markdown)
═══════════════════════════════════════════════════════
${cvMarkdown}

═══════════════════════════════════════════════════════
JOB DESCRIPTION
═══════════════════════════════════════════════════════
${jdText}

═══════════════════════════════════════════════════════
EVALUATION CONTEXT
═══════════════════════════════════════════════════════
Detected Archetype: ${archetype}
Target Keywords: ${keywords.join(', ')}
${selectedSections ? `Sections to include: ${selectedSections.join(', ')}` : 'Include all standard sections.'}

═══════════════════════════════════════════════════════
CANDIDATE PROFILE
═══════════════════════════════════════════════════════
Name: ${profile.name || 'Candidate'}
Email: ${profile.email || ''}
Phone: ${profile.phone || ''}
Location: ${profile.location || ''}
LinkedIn: ${profile.linkedin || ''}
Portfolio: ${profile.portfolio || ''}

═══════════════════════════════════════════════════════
OUTPUT INSTRUCTIONS
═══════════════════════════════════════════════════════
Generate the tailored resume in TWO formats, clearly separated:

1. First, output the resume in Markdown between these markers:
---RESUME_MARKDOWN---
(full tailored resume in clean markdown)
---END_MARKDOWN---

2. Then output the resume as clean, semantic HTML between these markers:
---RESUME_HTML---
(full tailored resume as HTML body content, no <html> or <head> tags)
---END_HTML---

The HTML should use these CSS classes for styling:
- .header for the name/contact section
- .header h1 for the name
- .header-gradient for the decorative line
- .contact-row for contact info
- .section for each section container
- .section-title for section headers (PROFESSIONAL SUMMARY, EXPERIENCE, etc.)
- .summary-text for the professional summary paragraph
- .competencies-grid > .competency-tag for skill tags
- .job for each work experience entry
- .job-header for company + dates row
- .job-company for company name
- .job-period for date range
- .job-role for role title
- .project for portfolio projects
- .project-title for project name
- .edu-item for education entries
`;
}

/**
 * Parse the Gemini response for resume content.
 */
function parseResumeResponse(rawText, profile) {
  let markdown = '';
  let html = '';

  // Extract markdown
  const mdMatch = rawText.match(/---RESUME_MARKDOWN---\s*([\s\S]*?)---END_MARKDOWN---/);
  if (mdMatch) {
    markdown = mdMatch[1].trim();
  } else {
    // If no markers, use the full text as markdown
    markdown = rawText.trim();
  }

  // Extract HTML
  const htmlMatch = rawText.match(/---RESUME_HTML---\s*([\s\S]*?)---END_HTML---/);
  if (htmlMatch) {
    html = htmlMatch[1].trim();
  }

  return { markdown, html };
}

/**
 * Fallback: format existing CV without LLM.
 * Returns the CV in a basic HTML template.
 */
function formatCvFallback(cvMarkdown, profile) {
  return {
    ok: true,
    html: wrapInHtmlTemplate(cvMarkdown, profile),
    markdown: cvMarkdown || '# Resume\n\n*No CV content available. Please add your CV in the Profile section.*',
    keywords_used: [],
    coverage_pct: 0,
    fallback: true,
  };
}

/**
 * Wrap markdown content in the career-ops HTML template.
 * This provides the visual design even without LLM tailoring.
 */
function wrapInHtmlTemplate(markdownContent, profile = {}) {
  const name = profile.name || 'Your Name';
  const email = profile.email || '';
  const phone = profile.phone || '';
  const location = profile.location || '';
  const linkedin = profile.linkedin || '';
  const portfolio = profile.portfolio || '';

  // Build contact items (only include non-empty ones)
  const contactItems = [
    phone && `<span>${phone}</span>`,
    email && `<span>${email}</span>`,
    linkedin && `<a href="${linkedin.startsWith('http') ? linkedin : 'https://' + linkedin}">${linkedin.replace(/^https?:\/\//, '')}</a>`,
    portfolio && `<a href="${portfolio.startsWith('http') ? portfolio : 'https://' + portfolio}">${portfolio.replace(/^https?:\/\//, '')}</a>`,
    location && `<span>${location}</span>`,
  ].filter(Boolean);

  return `<div class="resume-preview">
  <div class="header">
    <h1>${name}</h1>
    <div class="header-gradient"></div>
    <div class="contact-row">
      ${contactItems.join('\n      <span class="separator">|</span>\n      ')}
    </div>
  </div>

  <div class="section">
    <div class="section-title">RESUME CONTENT</div>
    <div class="summary-text">
      <em>This is your existing CV formatted for preview. Use the "Generate Tailored Resume" button with a Gemini API key to get a version optimized for the specific job.</em>
    </div>
  </div>

  <div class="section">
    <div class="cv-raw-content">${escapeHtml(markdownContent || 'No CV content yet.')}</div>
  </div>
</div>`;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
