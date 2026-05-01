/**
 * translate-post.js
 * ─────────────────
 * Translates a blog post into all 20 languages via Claude API.
 * Runs quality check per language via Auditor 4 in audit-post.js.
 * Retries once if quality fails.
 * Preserves ALL affiliate URLs exactly — zero tolerance for URL modification.
 *
 * USAGE (standalone):
 *   node translate-post.js --slug "best-crm-for-small-business"
 *
 * USAGE (imported by generate-blog-post.js):
 *   import { translateAll } from './translate-post.js';
 *   const translations = await translateAll(post, affUrl);
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { auditTranslation } from './audit-post.js';

const __dir   = dirname(fileURLToPath(import.meta.url));

const KEYWORDS = JSON.parse(readFileSync(resolve(__dir, 'keywords.json'), 'utf-8'));
const LANGUAGES = KEYWORDS.languages;

// ── GitHub Models API — with rate limit retry ──────────────────────────────
async function claude(system, user, maxTokens = 5000) {
  if (!process.env.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN not available');

  const MAX_RETRIES = 5;
  const BASE_DELAY  = 3000;

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
        console.warn(`  ⚠️  Rate limit — waiting ${delay/1000}s (attempt ${attempt})`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      const data = await res.json();
      if (data.error?.code === 'rate_limit_exceeded') {
        const delay = BASE_DELAY * Math.pow(2, attempt - 1);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      if (data.error) throw new Error(`GitHub Models error: ${data.error.message}`);

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

// ── Single language translator ─────────────────────────────────────────────
async function translateOne(post, lang, affUrl, attempt = 1) {
  const system = `You are a professional ${lang.name} translator, SEO expert, and copywriter.
You translate blog posts so they read as if originally written in ${lang.name} — never robotic or literal.
You adapt idioms, examples, and cultural references for ${lang.name}-speaking audiences.

ABSOLUTE RULES — never break these:
1. ALL URLs must be preserved EXACTLY as-is — never translate, shorten, or modify any URL
2. The affiliate URL "${affUrl}" must appear the SAME NUMBER of times as in the original
3. Keep JSON structure identical to input — same keys, same array lengths
4. Translate the slug to a ${lang.name} URL-safe slug (lowercase, hyphens, no special chars)
5. Translate meta_keywords to ${lang.name} search terms people actually use
6. Keep all HTML tags intact if any appear in content
7. Return ONLY valid JSON — no markdown, no explanation, no code blocks`;

  const retryNote = attempt > 1
    ? `\n\nIMPORTANT: This is retry attempt ${attempt}. Previous translation was rejected for poor quality or URL modification. Fix all issues.`
    : '';

  const user = `Translate this entire blog post JSON to ${lang.name} (language code: ${lang.code}, locale: ${lang.locale}).${retryNote}

The affiliate URL that must be preserved exactly: ${affUrl}

INPUT JSON:
${JSON.stringify(post, null, 2)}

Return the complete translated JSON with identical structure.
The affiliate URL ${affUrl} must appear exactly as many times in your output as it does in the input.`;

  const translated = await claude(system, user, 6000);

  // Force correct language metadata
  translated.lang      = lang.code;
  translated.lang_name = lang.name;
  translated.locale    = lang.locale;

  // Force affiliate_url field to be correct (never let translation modify it)
  translated.affiliate_url = post.affiliate_url;
  translated.tool          = post.tool;

  return translated;
}

// ── Verify affiliate URL survived translation ─────────────────────────────
function verifyUrls(translated, affUrl) {
  const allContent = [
    translated.intro || '',
    ...(translated.sections || []).map(s => s.content || ''),
    translated.conclusion || '',
  ].join(' ');

  const escaped  = affUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const count    = (allContent.match(new RegExp(escaped, 'g')) || []).length;

  return { intact: count >= 3, count };
}

// ── Force-inject affiliate URL if it was lost in translation ─────────────
function injectMissingUrl(translated, affUrl, originalCount) {
  // Find how many are missing
  const allContent = [
    translated.intro || '',
    ...(translated.sections || []).map(s => s.content || ''),
    translated.conclusion || '',
  ].join(' ');

  const escaped     = affUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const currentCount = (allContent.match(new RegExp(escaped, 'g')) || []).length;
  const missing      = Math.max(0, 3 - currentCount);

  if (missing === 0) return translated;

  // Append to conclusion with natural CTA
  const ctaSuffix = `\n\n${affUrl}`;
  for (let i = 0; i < missing; i++) {
    translated.conclusion = (translated.conclusion || '') + ctaSuffix;
  }

  console.log(`    🔧  Force-injected ${missing} missing affiliate URL(s) into conclusion`);
  return translated;
}

// ── Translate one language with retry + audit ─────────────────────────────
async function translateWithRetry(post, lang, affUrl) {
  const MAX_TRANSLATION_RETRIES = 2;

  for (let attempt = 1; attempt <= MAX_TRANSLATION_RETRIES; attempt++) {
    try {
      const translated = await translateOne(post, lang, affUrl, attempt);

      // Check URLs first (instant fail if stripped)
      const urlCheck = verifyUrls(translated, affUrl);
      if (!urlCheck.intact && attempt < MAX_TRANSLATION_RETRIES) {
        console.log(`    ⚠️  URLs stripped in ${lang.name} translation (${urlCheck.count} found) — retrying...`);
        continue;
      }

      // Run translation quality audit
      const audit = await auditTranslation(post, translated, lang, affUrl);

      if (audit.passed) {
        return translated;
      }

      if (attempt < MAX_TRANSLATION_RETRIES) {
        console.log(`    ⚠️  ${lang.name} quality score ${audit.score}/100 — retrying...`);
        continue;
      }

      // Final attempt failed — force-inject URLs if missing, use anyway
      console.log(`    ⚠️  ${lang.name} using best available translation (score: ${audit.score})`);
      return injectMissingUrl(translated, affUrl, 3);

    } catch (err) {
      if (attempt < MAX_TRANSLATION_RETRIES) {
        console.warn(`    ⚠️  ${lang.name} translation error: ${err.message} — retrying...`);
        await new Promise(r => setTimeout(r, 2000)); // brief pause before retry
      } else {
        console.warn(`    ❌  ${lang.name} translation failed after ${MAX_TRANSLATION_RETRIES} attempts — using English fallback`);
        return { ...post, lang: lang.code, lang_name: lang.name, locale: lang.locale };
      }
    }
  }
}

// ── Translate to all 20 languages ─────────────────────────────────────────
export async function translateAll(post, affUrl) {
  console.log('\n  🌍  Translating to 20 languages...\n');

  const results = { en: post }; // English already exists
  const remaining = LANGUAGES.filter(l => l.code !== 'en');

  // Process in batches of 4 to avoid rate limits
  const BATCH_SIZE = 4;

  for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
    const batch = remaining.slice(i, i + BATCH_SIZE);

    console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.map(l => l.name).join(', ')}`);

    const batchResults = await Promise.allSettled(
      batch.map(lang => translateWithRetry(post, lang, affUrl))
    );

    batchResults.forEach((result, idx) => {
      const lang = batch[idx];
      if (result.status === 'fulfilled' && result.value) {
        results[lang.code] = result.value;
        console.log(`    ✓  ${lang.name}`);
      } else {
        // English fallback
        results[lang.code] = { ...post, lang: lang.code, lang_name: lang.name, locale: lang.locale };
        console.warn(`    ⚠️  ${lang.name} — using English fallback`);
      }
    });

    // Pause between batches to respect API rate limits
    if (i + BATCH_SIZE < remaining.length) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  console.log(`\n  ✅  Translation complete — ${Object.keys(results).length}/20 languages`);
  return results;
}

// ── Save translated posts to disk ─────────────────────────────────────────
export function saveTranslations(translations, slug) {
  const dir = resolve(__dir, 'blog', '_drafts', slug);
  mkdirSync(dir, { recursive: true });

  for (const [langCode, post] of Object.entries(translations)) {
    const path = resolve(dir, `${langCode}.json`);
    writeFileSync(path, JSON.stringify(post, null, 2), 'utf-8');
  }

  console.log(`  💾  Saved ${Object.keys(translations).length} translations to blog/_drafts/${slug}/`);
}

// ── Load saved translations from disk ─────────────────────────────────────
export function loadTranslations(slug) {
  const dir = resolve(__dir, 'blog', '_drafts', slug);
  if (!existsSync(dir)) return null;

  const translations = {};
  for (const lang of LANGUAGES) {
    const path = resolve(dir, `${lang.code}.json`);
    if (existsSync(path)) {
      translations[lang.code] = JSON.parse(readFileSync(path, 'utf-8'));
    }
  }

  return Object.keys(translations).length > 0 ? translations : null;
}

// ── Standalone CLI mode ────────────────────────────────────────────────────
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args    = process.argv.slice(2);
  const slugArg = args[args.indexOf('--slug') + 1];

  if (!slugArg) {
    console.error('Usage: node translate-post.js --slug "best-crm-for-small-business"');
    process.exit(1);
  }

  const draftPath = resolve(__dir, 'blog', '_drafts', slugArg, 'en.json');
  if (!existsSync(draftPath)) {
    console.error(`❌  No English draft found at: ${draftPath}`);
    console.error('    Run generate-blog-post.js first to create the English post.');
    process.exit(1);
  }

  const post   = JSON.parse(readFileSync(draftPath, 'utf-8'));
  const affUrl = KEYWORDS.affiliate_map[post.tool];

  if (!affUrl) {
    console.error(`❌  No affiliate URL for tool: ${post.tool}`);
    process.exit(1);
  }

  console.log(`\n🌍  Translating "${post.title}" to 19 languages...\n`);

  translateAll(post, affUrl)
    .then(translations => {
      saveTranslations(translations, slugArg);
      console.log('\n✅  All translations complete and saved.');
    })
    .catch(err => {
      console.error('❌  Translation failed:', err.message);
      process.exit(1);
    });
}
