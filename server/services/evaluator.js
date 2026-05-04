/**
 * evaluator.js — Gemini-powered A-G evaluation engine
 *
 * Mirrors the career-ops gemini-eval.mjs approach:
 * 1. Build system prompt from _shared.md + oferta.md context
 * 2. Include user's CV
 * 3. Send JD to Gemini
 * 4. Parse structured response (score, archetype, blocks A-G)
 *
 * If Gemini API is unavailable, returns a graceful fallback
 * so the tracker and JD extraction still work.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Load evaluation prompt context ─────────────────────────────────
// These are embedded copies of the career-ops mode files.
// They define the full A-G scoring methodology.

const SHARED_CONTEXT = readFileSync(
  join(__dirname, '..', 'prompts', 'shared-context.md'), 'utf-8'
);
const EVALUATION_PROMPT = readFileSync(
  join(__dirname, '..', 'prompts', 'evaluation.md'), 'utf-8'
);

/**
 * Run a full Career-Ops A-G evaluation on a job description.
 *
 * @param {string} jdText - The raw job description text
 * @param {string} cvContent - The user's CV in markdown format
 * @param {object} options - Optional overrides
 * @returns {Promise<{ok: boolean, score?, archetype?, legitimacy?, blocks?, keywords?, raw?, error?}>}
 */
export async function evaluateJob(jdText, cvContent, options = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = options.model || process.env.GEMINI_MODEL || 'gemini-2.0-flash';

  // Check if LLM is available
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return {
      ok: false,
      error: 'GEMINI_API_KEY not configured. Evaluation requires an API key.',
      unavailable: true,
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.4,       // Deterministic enough for structured evaluation
        maxOutputTokens: 8192,  // Full 7-block evaluation
      },
    });

    // Build system prompt (mirrors gemini-eval.mjs exactly)
    const systemPrompt = buildSystemPrompt(cvContent);
    const userMessage = `\n\nJOB DESCRIPTION TO EVALUATE:\n\n${jdText}`;

    console.log(`[evaluator] Calling Gemini (${modelName})...`);
    const startTime = Date.now();

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userMessage },
    ]);

    const rawText = result.response.text();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[evaluator] Gemini responded in ${elapsed}s (${rawText.length} chars)`);

    // Parse the structured response
    const parsed = parseEvaluationResponse(rawText);

    return {
      ok: true,
      score: parsed.score,
      archetype: parsed.archetype,
      legitimacy: parsed.legitimacy,
      blocks: parsed.blocks,
      keywords: parsed.keywords,
      raw: rawText,
      model_used: modelName,
    };
  } catch (err) {
    console.error(`[evaluator] Gemini API error:`, err.message);

    let errorMsg = 'Evaluation failed: ' + err.message;
    if (err.message?.includes('API_KEY')) {
      errorMsg = 'Invalid GEMINI_API_KEY. Check your .env file.';
    } else if (err.message?.includes('quota') || err.message?.includes('rate')) {
      errorMsg = 'Gemini rate limit hit. Wait 60 seconds and retry.';
    }

    return {
      ok: false,
      error: errorMsg,
      unavailable: false,
    };
  }
}

/**
 * Build the full system prompt from embedded career-ops context.
 * Mirrors the exact prompt structure from gemini-eval.mjs.
 */
function buildSystemPrompt(cvContent) {
  return `You are career-ops, an AI-powered job search assistant.
You evaluate job offers against the user's CV using a structured A-G scoring system.

Your evaluation methodology is defined below. Follow it exactly.

═══════════════════════════════════════════════════════
SYSTEM CONTEXT (_shared.md)
═══════════════════════════════════════════════════════
${SHARED_CONTEXT}

═══════════════════════════════════════════════════════
EVALUATION MODE (oferta.md)
═══════════════════════════════════════════════════════
${EVALUATION_PROMPT}

═══════════════════════════════════════════════════════
CANDIDATE RESUME (cv.md)
═══════════════════════════════════════════════════════
${cvContent || '[No CV provided — evaluate based on JD analysis only]'}

═══════════════════════════════════════════════════════
IMPORTANT OPERATING RULES FOR THIS WEB SESSION
═══════════════════════════════════════════════════════
1. You do NOT have access to WebSearch, Playwright, or file writing tools.
   - For Block D (Comp research): provide salary estimates based on your training data, clearly noted as estimates.
   - For Block G (Legitimacy): analyze the JD text only; skip URL/page freshness checks.
   - Post-evaluation file saving is handled by the app, not by you.
2. Generate Blocks A through G in full, in English, unless the JD is in another language.
3. At the very end, output a machine-readable summary block in this exact format:

---SCORE_SUMMARY---
COMPANY: <company name or "Unknown">
ROLE: <role title>
SCORE: <global score as decimal, e.g. 3.8>
ARCHETYPE: <detected archetype>
LEGITIMACY: <High Confidence | Proceed with Caution | Suspicious>
---END_SUMMARY---

4. Also output a keywords block:

---KEYWORDS---
keyword1, keyword2, keyword3, ...
---END_KEYWORDS---
`;
}

/**
 * Parse the Gemini evaluation response into structured data.
 * Extracts score summary, blocks A-G, and keywords.
 */
function parseEvaluationResponse(rawText) {
  const result = {
    score: null,
    archetype: 'Unknown',
    legitimacy: 'Unknown',
    blocks: {},
    keywords: [],
  };

  // ── Parse SCORE_SUMMARY block ─────────────────────────────────────
  const summaryMatch = rawText.match(
    /---SCORE_SUMMARY---\s*([\s\S]*?)---END_SUMMARY---/
  );

  if (summaryMatch) {
    const block = summaryMatch[1];
    const extract = (key) => {
      const m = block.match(new RegExp(`${key}:\\s*(.+)`));
      return m ? m[1].trim() : null;
    };
    result.score = parseFloat(extract('SCORE')) || null;
    result.archetype = extract('ARCHETYPE') || 'Unknown';
    result.legitimacy = extract('LEGITIMACY') || 'Unknown';

    // Also try to extract company/role from summary if not in blocks
    result._company = extract('COMPANY');
    result._role = extract('ROLE');
  }

  // ── Parse KEYWORDS block ──────────────────────────────────────────
  const keywordsMatch = rawText.match(
    /---KEYWORDS---\s*([\s\S]*?)---END_KEYWORDS---/
  );
  if (keywordsMatch) {
    result.keywords = keywordsMatch[1]
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);
  }

  // ── Parse A-G blocks from markdown headers ────────────────────────
  // Look for patterns like "## Bloque A", "## A)", "## Block A", "## A —"
  const blockPatterns = [
    { key: 'A', labels: ['Bloque A', 'Block A', 'A)', 'A —', 'A.', 'A -', 'Resumen del Rol', 'Role Summary'] },
    { key: 'B', labels: ['Bloque B', 'Block B', 'B)', 'B —', 'B.', 'B -', 'Match con CV', 'CV Match'] },
    { key: 'C', labels: ['Bloque C', 'Block C', 'C)', 'C —', 'C.', 'C -', 'Nivel y Estrategia', 'Level'] },
    { key: 'D', labels: ['Bloque D', 'Block D', 'D)', 'D —', 'D.', 'D -', 'Comp', 'Compensation'] },
    { key: 'E', labels: ['Bloque E', 'Block E', 'E)', 'E —', 'E.', 'E -', 'Personalización', 'Personalization'] },
    { key: 'F', labels: ['Bloque F', 'Block F', 'F)', 'F —', 'F.', 'F -', 'Entrevistas', 'Interview'] },
    { key: 'G', labels: ['Bloque G', 'Block G', 'G)', 'G —', 'G.', 'G -', 'Legitimacy', 'Legitimidad'] },
  ];

  const blockTitles = {
    A: 'Role Summary',
    B: 'CV Match',
    C: 'Level & Strategy',
    D: 'Comp & Demand',
    E: 'Personalization Plan',
    F: 'Interview Prep',
    G: 'Posting Legitimacy',
  };

  // Find each block's start position
  const positions = [];
  for (const bp of blockPatterns) {
    for (const label of bp.labels) {
      const regex = new RegExp(`^#{1,3}\\s*(?:.*?)${escapeRegex(label)}`, 'mi');
      const match = rawText.match(regex);
      if (match) {
        positions.push({ key: bp.key, index: match.index, title: blockTitles[bp.key] });
        break;
      }
    }
  }

  // Sort by position in text
  positions.sort((a, b) => a.index - b.index);

  // Extract content between block headers
  for (let i = 0; i < positions.length; i++) {
    const start = positions[i].index;
    const end = i + 1 < positions.length
      ? positions[i + 1].index
      : rawText.indexOf('---SCORE_SUMMARY---') !== -1
        ? rawText.indexOf('---SCORE_SUMMARY---')
        : rawText.length;

    let content = rawText.slice(start, end).trim();
    // Remove the header line itself
    content = content.replace(/^#{1,3}\s*.*$/m, '').trim();

    result.blocks[positions[i].key] = {
      title: positions[i].title,
      content,
    };
  }

  return result;
}

/**
 * Escape special regex characters in a string.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
