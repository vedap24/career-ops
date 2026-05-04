/**
 * extractor.js — JD extraction from URLs
 *
 * Uses Mozilla Readability + linkedom to extract job description text
 * from any URL without needing a full browser (no Playwright dependency).
 *
 * Falls back gracefully: if extraction fails, returns null so the
 * caller can prompt for manual JD paste.
 */

import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';

// Timeout for URL fetches (10 seconds)
const FETCH_TIMEOUT_MS = 10_000;

/**
 * Extract job description content from a URL.
 *
 * @param {string} url - Job posting URL
 * @returns {Promise<{title: string|null, company: string|null, content: string|null, ok: boolean}>}
 */
export async function extractFromUrl(url) {
  try {
    const html = await fetchPage(url);
    if (!html) return { title: null, company: null, content: null, location: null, ok: false };

    const { document } = parseHTML(html);

    // Try Readability for clean text extraction
    const reader = new Readability(document, { charThreshold: 100 });
    const article = reader.parse();

    // Extract metadata from page
    const title = extractTitle(document, article);
    const company = extractCompany(document, url);
    const location = extractLocation(document);

    // Get the clean text content
    let content = article?.textContent?.trim() || null;

    // If Readability fails, try fallback extraction
    if (!content || content.length < 100) {
      content = fallbackExtract(document);
    }

    return {
      title,
      company,
      location,
      content,
      ok: !!content && content.length > 50,
    };
  } catch (err) {
    console.error(`[extractor] Failed to extract from ${url}:`, err.message);
    return { title: null, company: null, content: null, location: null, ok: false };
  }
}

/**
 * Fetch page HTML with timeout and basic error handling.
 */
async function fetchPage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    if (!res.ok) {
      console.warn(`[extractor] HTTP ${res.status} for ${url}`);
      return null;
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      console.warn(`[extractor] Non-HTML content type: ${contentType}`);
      return null;
    }

    return await res.text();
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn(`[extractor] Timeout fetching ${url}`);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Extract job title from page metadata or content.
 */
function extractTitle(doc, article) {
  // Try OpenGraph title first (usually cleanest for job postings)
  const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
  if (ogTitle) return cleanTitle(ogTitle);

  // Try page <title>
  const pageTitle = doc.querySelector('title')?.textContent;
  if (pageTitle) return cleanTitle(pageTitle);

  // Fall back to Readability's detected title
  if (article?.title) return cleanTitle(article.title);

  return null;
}

/**
 * Extract company name from page metadata or URL patterns.
 */
function extractCompany(doc, url) {
  // Try OpenGraph site name
  const ogSite = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content');
  if (ogSite) return ogSite.trim();

  // Try to extract from known job board URL patterns
  const patterns = [
    /jobs\.lever\.co\/([^/?#]+)/,           // Lever
    /jobs\.ashbyhq\.com\/([^/?#]+)/,        // Ashby
    /boards\.greenhouse\.io\/([^/?#]+)/,     // Greenhouse
    /([^.]+)\.workday\.com/,                 // Workday
    /careers\.([^.]+)\./,                    // careers.company.com
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
  }

  // Try application-name meta
  const appName = doc.querySelector('meta[name="application-name"]')?.getAttribute('content');
  if (appName) return appName.trim();

  return null;
}

/**
 * Extract location from structured data or common meta tags.
 */
function extractLocation(doc) {
  // Try JSON-LD structured data
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent);
      if (data.jobLocation?.address) {
        const addr = data.jobLocation.address;
        return [addr.addressLocality, addr.addressRegion, addr.addressCountry]
          .filter(Boolean).join(', ');
      }
    } catch { /* ignore parse errors */ }
  }

  return null;
}

/**
 * Fallback: extract text from common job posting containers.
 */
function fallbackExtract(doc) {
  // Common selectors used by job boards
  const selectors = [
    '[data-testid="job-description"]',
    '.job-description',
    '.job-details',
    '.posting-description',
    '#job-description',
    '[class*="jobDescription"]',
    '[class*="job-description"]',
    'article',
    'main',
    '.content',
  ];

  for (const sel of selectors) {
    const el = doc.querySelector(sel);
    if (el) {
      const text = el.textContent?.trim();
      if (text && text.length > 100) return text;
    }
  }

  return null;
}

/**
 * Clean up extracted title (remove company suffix patterns, trim).
 */
function cleanTitle(raw) {
  return raw
    .replace(/\s*[|\-–—]\s*.*$/, '')  // Remove "Title | Company" or "Title - Company"
    .replace(/\s*at\s+\w.*$/i, '')    // Remove "Title at Company"
    .trim()
    .slice(0, 200);                   // Cap at 200 chars
}
