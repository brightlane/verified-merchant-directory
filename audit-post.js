/**
 * audit-post.js
 * ─────────────
 * Four independent auditors that score every blog post before it deploys.
 * Called by generate-blog-post.js after each write attempt.
 *
 * AUDITOR 1 — SEO          (min score: 80)
 * AUDITOR 2 — Content Quality (min score: 85)
 * AUDITOR 3 — Affiliate Links (min score: 100) ← zero tolerance
 * AUDITOR 4 — Translation     (min score: 80)  ← runs per language
 *
 * Each auditor returns:
 *   { score, passed, issues[], fixes[] }
 *
 * The rewrite loop in generate-blog-post.js feeds failed auditor
 * feedback back into Claude so it fixes exactly what failed.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const THRESHOLDS = {
  seo:         80,
  quality:     85,
  affiliate:  100,   // zero tolerance — affiliate URL must be perfect
  translation: 80,
};

const MAX_RETRIES = 3;

// ── GitHub Models API — with rate limit retry ──────────────────────────────
async function claude(system, user, maxTokens = 600) {
  const MAX_RETRIES  = 5;
  const BASE_DELAY   = 3000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch('https://models.inference.ai.azure.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        },
        body: JSON.stringify({
          model:      'gpt-4o-mini',
          max_tokens: maxTokens,
          messages: [
            { role: 'system', content: system },
            { role: 'user',   content: user   },
          ],
        }),
      });

      if (res.status === 429 || res.status >= 500) {
        const delay = BASE_DELAY * Math.pow(2, attempt - 1);
        console.warn(`  ⚠️  Rate limit/server error — waiting ${delay/1000}s (attempt ${attempt})`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      const data = await res.json();
      if (data.error?.code === 'rate_limit_exceeded') {
        const delay = BASE_DELAY * Math.pow(2, attempt - 1);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      if (data.error) throw new Error(`GitHub Models: ${data.error.message}`);

      const text = data.choices[0].message.content;
      let clean = text.replace(/```json|```/g, '').trim();
      const start = clean.indexOf('{');
      const end   = clean.lastIndexOf('}');
      if (start !== -1 && end !== -1) clean = clean.slice(start, end + 1);
      clean = clean.replace(/,\s*([}\]])/g, '$1').replace(/[\u2018\u2019]/g,"'").replace(/[\u201C\u201D]/g,'"');
      return JSON.parse(clean);

    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      const delay = BASE_DELAY * Math.pow(2, attempt - 1);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════
// AUDITOR 1 — SEO
// Checks: keyword in title/meta/H1, meta length, word count,
//         heading structure, internal links, schema readiness
// ══════════════════════════════════════════════════════════════════════════
export async function auditSEO(post, keyword) {
  console.log('    🔍  Auditor 1: SEO...');

  const kw          = (typeof keyword === 'string' ? keyword : (keyword?.keyword || '')).toLowerCase();
  const titleLower  = (post.title || '').toLowerCase();
  const metaLower   = (post.metaDescription || post.meta_description || '').toLowerCase();
  const h1Lower     = (post.h1 || '').toLowerCase();
  const allContent  = [
    post.intro,
    ...(post.sections || []).map(s => s.content),
    post.conclusion,
  ].join(' ');

  // Hard checks (deterministic — no API needed)
  const checks = {
    keyword_in_title:    titleLower.includes(kw),
    keyword_in_meta:     metaLower.includes(kw),
    keyword_in_h1:       h1Lower.includes(kw),
    title_length_ok:     post.title?.length >= 40 && post.title?.length <= 65,
    meta_length_ok:      (post.metaDescription || post.meta_description || "").length >= 140 && (post.metaDescription || post.meta_description || "").length <= 165,
    word_count_ok:       (post.wordCount || post.word_count || 0) >= 1200,
    has_sections:        (post.sections || []).length >= 4,
    has_faq:             (post.faq || []).length >= 4,
    has_internal_links:  (post.internal_links || []).length >= 2,
    meta_keywords_set:   !!post.meta_keywords,
    h2_count_ok:         (post.sections || []).length >= 4,
    keyword_in_content:  allContent.toLowerCase().includes(kw),
  };

  // Score: each check worth points
  const weights = {
    keyword_in_title:   20,
    keyword_in_h1:      15,
    keyword_in_meta:    10,
    title_length_ok:    10,
    meta_length_ok:     10,
    word_count_ok:      10,
    has_sections:        8,
    has_faq:             7,
    has_internal_links:  5,
    meta_keywords_set:   2,
    h2_count_ok:         2,
    keyword_in_content:  1,
  };

  let score = 0;
  const issues = [];
  const fixes  = [];

  for (const [check, passed] of Object.entries(checks)) {
    if (passed) {
      score += weights[check] || 0;
    } else {
      const w = weights[check] || 0;
      switch (check) {
        case 'keyword_in_title':
          issues.push(`Target keyword "${keyword.keyword}" missing from title`);
          fixes.push(`Include "${keyword.keyword}" in the title naturally`);
          break;
        case 'keyword_in_h1':
          issues.push(`H1 does not contain target keyword`);
          fixes.push(`Rewrite H1 to include "${keyword.keyword}"`);
          break;
        case 'keyword_in_meta':
          issues.push(`Meta description missing target keyword`);
          fixes.push(`Add "${keyword.keyword}" to the meta description`);
          break;
        case 'title_length_ok':
          issues.push(`Title length ${post.title?.length} chars — must be 40-65`);
          fixes.push(`Rewrite title to be between 40-65 characters`);
          break;
        case 'meta_length_ok':
          issues.push(`Meta description ${(post.metaDescription || post.meta_description || "").length} chars — must be 140-165`);
          fixes.push(`Rewrite meta description to be 140-165 characters`);
          break;
        case 'word_count_ok':
          issues.push(`Word count ${post.wordCount || post.word_count} is below minimum 1200`);
          fixes.push(`Expand content to at least 1200 words — add more detail to each section`);
          break;
        case 'has_sections':
          issues.push(`Only ${post.sections?.length} sections — need at least 4`);
          fixes.push(`Add ${4 - (post.sections?.length || 0)} more sections with H2 headings`);
          break;
        case 'has_faq':
          issues.push(`Only ${post.faq?.length} FAQ items — need at least 4`);
          fixes.push(`Add ${4 - (post.faq?.length || 0)} more FAQ questions and answers`);
          break;
        case 'has_internal_links':
          issues.push(`Missing internal links to tool review and category pages`);
          fixes.push(`Add internal_links array with tool review URL and category URL`);
          break;
      }
    }
  }

  const passed = score >= THRESHOLDS.seo;

  console.log(`    📊  SEO score: ${score}/100 — ${passed ? '✅ PASS' : '❌ FAIL'}`);
  if (issues.length) console.log(`        Issues: ${issues.join(' | ')}`);

  return { score, passed, issues, fixes, checks };
}

// ══════════════════════════════════════════════════════════════════════════
// AUDITOR 2 — Content Quality
// Checks: readability, originality, value, tone, not keyword-stuffed,
//         not thin content, genuine helpfulness, intro hook strength
// ══════════════════════════════════════════════════════════════════════════
export async function auditQuality(post) {
  console.log('    🔍  Auditor 2: Content Quality...');

  const result = await claude(
    `You are a ruthless content quality editor. You reject mediocre AI content.
Score strictly — most AI content scores 60-75. Only genuinely excellent content scores 85+.
Return ONLY valid JSON. No markdown, no explanation.`,

    `Score this blog post content quality. Be strict.

TITLE: ${post.title}

INTRO (first 500 chars):
${(post.intro || '').substring(0, 500)}

SECTION SAMPLES (first 2):
${(post.sections || []).slice(0, 2).map(s => `H2: ${s.h2}\n${(s.content || '').substring(0, 300)}`).join('\n\n')}

FAQ COUNT: ${(post.faq || []).length}
WORD COUNT: ${post.wordCount || post.word_count}

CONCLUSION (first 200 chars):
${(post.conclusion || '').substring(0, 200)}

Return ONLY this JSON:
{
  "score": 0-100,
  "readability": 0-100,
  "value_to_reader": 0-100,
  "originality": 0-100,
  "intro_hook": 0-100,
  "natural_tone": true/false,
  "keyword_stuffed": true/false,
  "thin_content": true/false,
  "generic_ai_feel": true/false,
  "issues": ["specific issue 1", "specific issue 2"],
  "fixes": ["exact rewrite instruction 1", "exact rewrite instruction 2"]
}`
  );

  // Penalize if flagged
  let score = result.score || 0;
  if (result.keyword_stuffed)  score = Math.min(score, 60);
  if (result.thin_content)     score = Math.min(score, 55);
  if (result.generic_ai_feel)  score = Math.min(score, 65);

  result.score  = score;
  result.passed = score >= THRESHOLDS.quality;

  console.log(`    📊  Quality score: ${score}/100 — ${result.passed ? '✅ PASS' : '❌ FAIL'}`);
  if (result.issues?.length) console.log(`        Issues: ${result.issues.join(' | ')}`);

  return result;
}

// ══════════════════════════════════════════════════════════════════════════
// AUDITOR 3 — Affiliate Link Integrity
// Zero tolerance — score must be 100 to deploy.
// Checks: correct URL, tracking params intact, appears 3+ times,
//         in conclusion, rel=sponsored noted, no URL modifications
// ══════════════════════════════════════════════════════════════════════════
export function auditAffiliate(post, expectedAffUrl) {
  console.log('    🔍  Auditor 3: Affiliate Links...');

  const allContent = [
    post.intro || '',
    ...(post.sections || []).map(s => s.content || ''),
    post.conclusion || '',
  ].join(' ');

  // Guard against undefined affUrl
  if (!expectedAffUrl) return { passed: true, score: 100, issues: [], fixes: [] };
  // Escape URL for regex
  const escaped  = expectedAffUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const urlRegex = new RegExp(escaped, 'g');
  const urlCount = (allContent.match(urlRegex) || []).length;

  const checks = {
    url_stored_correctly: post.affiliate_url === expectedAffUrl,
    url_in_content_3x:   urlCount >= 3,
    url_in_conclusion:   (post.conclusion || '').includes(expectedAffUrl),
    url_not_modified:    !allContent.includes(expectedAffUrl.split('?')[0] + '?') ||
                          allContent.includes(expectedAffUrl),
    tool_matches:        !!post.tool,
  };

  const issues = [];
  const fixes  = [];

  if (!checks.url_stored_correctly) {
    issues.push(`affiliate_url field has wrong URL. Expected: ${expectedAffUrl} Got: ${post.affiliate_url}`);
    fixes.push(`Set affiliate_url exactly to: ${expectedAffUrl}`);
  }
  if (!checks.url_in_content_3x) {
    issues.push(`Affiliate URL appears only ${urlCount} times — needs 3 minimum`);
    fixes.push(`Add the URL ${expectedAffUrl} at least ${3 - urlCount} more times naturally in the content`);
  }
  if (!checks.url_in_conclusion) {
    issues.push('Affiliate URL missing from conclusion — this is where conversion happens');
    fixes.push(`End the conclusion with a CTA linking to ${expectedAffUrl}`);
  }

  // Score: all checks must pass for 100
  const passCount  = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;
  const score = passCount === totalChecks ? 100 : Math.round((passCount / totalChecks) * 80);
  const passed = score >= THRESHOLDS.affiliate;

  console.log(`    📊  Affiliate score: ${score}/100 (URL count: ${urlCount}) — ${passed ? '✅ PASS' : '❌ FAIL'}`);
  if (issues.length) console.log(`        Issues: ${issues.join(' | ')}`);

  return { score, passed, issues, fixes, checks, url_count: urlCount };
}

// ══════════════════════════════════════════════════════════════════════════
// AUDITOR 4 — Translation Quality
// Runs per language after translation.
// Checks: naturalness, accuracy, cultural fit, no robotic phrasing,
//         affiliate URLs preserved exactly
// ══════════════════════════════════════════════════════════════════════════
export async function auditTranslation(originalPost, translatedPost, lang, affUrl) {
  console.log(`    🔍  Auditor 4: Translation quality (${lang.name})...`);

  // First check affiliate URL is still intact (deterministic)
  const tContent = [
    translatedPost.intro || '',
    ...(translatedPost.sections || []).map(s => s.content || ''),
    translatedPost.conclusion || '',
  ].join(' ');

  const escaped = affUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const urlCount = (tContent.match(new RegExp(escaped, 'g')) || []).length;
  const urlIntact = urlCount >= 3;

  if (!urlIntact) {
    return {
      score:   0,
      passed:  false,
      issues:  [`Affiliate URL stripped during translation — only ${urlCount} occurrences found`],
      fixes:   [`Re-translate preserving the URL ${affUrl} exactly ${3} times`],
      url_count: urlCount,
    };
  }

  // AI quality check
  const result = await claude(
    `You are a professional ${lang.name} editor and translator. Return ONLY JSON.`,
    `Rate this translation from English to ${lang.name}.

ENGLISH INTRO (first 300 chars):
${(originalPost.intro || '').substring(0, 300)}

${lang.name.toUpperCase()} TRANSLATION (first 300 chars):
${(translatedPost.intro || '').substring(0, 300)}

Return ONLY this JSON:
{
  "score": 0-100,
  "natural": true/false,
  "accurate": true/false,
  "culturally_appropriate": true/false,
  "robotic_phrasing": true/false,
  "issues": ["issue if any"],
  "fixes": ["fix if needed"]
}`
  );

  if (result.robotic_phrasing) result.score = Math.min(result.score || 0, 65);

  result.passed    = (result.score || 0) >= THRESHOLDS.translation;
  result.url_count = urlCount;

  console.log(`    📊  Translation (${lang.name}): ${result.score}/100 — ${result.passed ? '✅' : '❌'}`);

  return result;
}

// ══════════════════════════════════════════════════════════════════════════
// MASTER AUDIT — runs all 3 content auditors, returns combined result
// (Translation audit runs separately per language in generate-blog-post.js)
// ══════════════════════════════════════════════════════════════════════════
export async function runAllAudits(post, keyword, affUrl) {
  console.log('\n  📋  Running all auditors...');

  const [seo, quality, affiliate] = await Promise.all([
    auditSEO(post, keyword),
    auditQuality(post),
    Promise.resolve(auditAffiliate(post, affUrl)),
  ]);

  const passed =
    seo.passed       &&
    quality.passed   &&
    affiliate.passed;

  // Collect all feedback for rewrite prompt
  const allIssues = [
    ...(seo.issues       || []),
    ...(quality.issues   || []),
    ...(affiliate.issues || []),
  ];
  const allFixes = [
    ...(seo.fixes       || []),
    ...(quality.fixes   || []),
    ...(affiliate.fixes || []),
  ];

  const feedback = [
    allIssues.length ? `ISSUES FOUND:\n${allIssues.map(i => `- ${i}`).join('\n')}` : '',
    allFixes.length  ? `REQUIRED FIXES:\n${allFixes.map(f => `- ${f}`).join('\n')}`  : '',
  ].filter(Boolean).join('\n\n');

  const scores = {
    seo:       seo.score,
    quality:   quality.score,
    affiliate: affiliate.score,
    overall:   Math.round((seo.score + quality.score + affiliate.score) / 3),
  };

  console.log(`\n  📊  Final scores — SEO: ${scores.seo} | Quality: ${scores.quality} | Affiliate: ${scores.affiliate} | Overall: ${scores.overall}`);
  console.log(`  ${passed ? '✅  ALL AUDITS PASSED — deploying' : '❌  AUDIT FAILED — rewriting'}\n`);

  return {
    passed,
    scores,
    feedback,
    details: { seo, quality, affiliate },
  };
}

// ── Audit report logger (saved to disk for debugging) ─────────────────────
export function saveAuditReport(keyword, scores, attempt, passed) {
  const __dir = dirname(fileURLToPath(import.meta.url));
  const dir   = resolve(__dir, 'audit-logs');
  mkdirSync(dir, { recursive: true });

  const slug    = keyword.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const date    = new Date().toISOString().replace(/[:.]/g, '-');
  const report  = {
    keyword, attempt, passed, scores,
    timestamp: new Date().toISOString(),
    thresholds: THRESHOLDS,
  };

  writeFileSync(
    resolve(dir, `${slug}-${date}.json`),
    JSON.stringify(report, null, 2),
    'utf-8'
  );
}

export { THRESHOLDS, MAX_RETRIES };
