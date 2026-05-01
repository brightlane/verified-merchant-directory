/**
 * generate-blog-post.js — verified-merchant-directory
 * ─────────────────────────────────────────────────────
 * 1. Picks 10 next unwritten keywords (by volume, priority order)
 * 2. Writes a full SEO blog post per keyword in English
 * 3. Four auditors score it (SEO, Quality, Affiliate, Translation)
 * 4. If any score fails → rewrite with feedback (max 3 attempts)
 * 5. Translates to 100 languages → publishes all pages
 * 6. Affiliate links appear everywhere on every page
 * 7. Deep linking: keyword maps to exact merchant affiliate URL
 * 8. Meta keywords include affiliate-targeted search terms
 * 9. Updates sitemaps → pings IndexNow + Google
 *
 * RUN:  node generate-blog-post.js
 * RUN with keyword: node generate-blog-post.js --keyword "batman costume"
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { runAllAudits, auditTranslation, THRESHOLDS, MAX_RETRIES } from './audit-post.js';

const __dir    = dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'https://brightlane.github.io/verified-merchant-directory';
const TODAY    = new Date().toISOString().split('T')[0];

// ── GitHub Models API — free, uses GITHUB_TOKEN (auto-available in Actions)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const AI_ENDPOINT  = 'https://models.inference.ai.azure.com';
const AI_MODEL     = 'gpt-4o-mini';

if (!GITHUB_TOKEN) {
  console.error('❌  GITHUB_TOKEN not available. This should run inside GitHub Actions automatically.');
  process.exit(1);
}

// ── Load data ──────────────────────────────────────────────────────────────
const KEYWORDS  = JSON.parse(readFileSync(resolve(__dir, 'keywords.json'), 'utf-8'));
const LANG_LIST = KEYWORDS.languages;
const AFF_MAP   = KEYWORDS.affiliate_map;

// ── GitHub Models API call with rate limit retry ───────────────────────────
async function claude(systemPrompt, userPrompt, maxTokens = 4000) {
  const MAX_API_RETRIES = 5;
  const BASE_DELAY_MS   = 3000;

  for (let attempt = 1; attempt <= MAX_API_RETRIES; attempt++) {
    try {
      const res = await fetch(`${AI_ENDPOINT}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
        },
        body: JSON.stringify({
          model: AI_MODEL,
          max_tokens: maxTokens,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: userPrompt   },
          ],
        }),
      });

      if (res.status === 429) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`⏳ Rate limit hit, waiting ${delay}ms (attempt ${attempt}/${MAX_API_RETRIES})...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`API error ${res.status}: ${err}`);
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? '';
    } catch (err) {
      if (attempt === MAX_API_RETRIES) throw err;
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.log(`⚠️  API error, retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Max API retries exceeded');
}

// ── JSON cleanup ───────────────────────────────────────────────────────────
function parseJSON(raw) {
  let clean = raw.trim();
  clean = clean.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  const firstBrace  = clean.indexOf('{');
  const firstBracket = clean.indexOf('[');
  let start = -1;
  if (firstBrace  !== -1 && (firstBracket === -1 || firstBrace  < firstBracket)) start = firstBrace;
  if (firstBracket !== -1 && (firstBrace  === -1 || firstBracket < firstBrace)) start = firstBracket;
  if (start > 0) clean = clean.slice(start);
  const lastBrace  = clean.lastIndexOf('}');
  const lastBracket = clean.lastIndexOf(']');
  const end = Math.max(lastBrace, lastBracket);
  if (end !== -1) clean = clean.slice(0, end + 1);
  try {
    return JSON.parse(clean);
  } catch (err) {
    throw new Error(`JSON parse failed after cleanup: ${err.message}\nFirst 200 chars: ${clean.slice(0, 200)}`);
  }
}

// ── Slugify ────────────────────────────────────────────────────────────────
function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// ── Pick next 10 keywords ──────────────────────────────────────────────────
function pickKeywords(manualKeyword) {
  if (manualKeyword) {
    const found = KEYWORDS.keywords.find(k =>
      k.keyword.toLowerCase().includes(manualKeyword.toLowerCase())
    );
    if (found) return [found];
  }

  // Load already-published slugs
  const published = new Set();
  const blogDir   = resolve(__dir, 'blog', 'en');
  if (existsSync(blogDir)) {
    try { readdirSync(blogDir).forEach(f => published.add(f)); } catch {}
  }

  // Normalize slug for near-duplicate detection
  const STOP_WORDS = new Set(['for','the','a','an','and','or','of','to','in','on','at','with','by','from','is','are','was','were']);
  function normalizeSlug(slug) {
    return slug.split('-').filter(w => !STOP_WORDS.has(w)).join('-');
  }
  const publishedNorm = new Set([...published].map(normalizeSlug));

  // Sort by priority then volume
  const sorted = [...KEYWORDS.keywords].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.volume - a.volume;
  });

  // Pick 10 unpublished keywords
  const picks = [];
  for (const kw of sorted) {
    if (picks.length >= 10) break;
    const slug     = slugify(kw.keyword);
    const slugNorm = normalizeSlug(slug);
    if (!published.has(slug) && !publishedNorm.has(slugNorm)) {
      picks.push(kw);
      published.add(slug);
      publishedNorm.add(slugNorm);
    }
  }

  // Cycle back if all published
  if (picks.length === 0) return [sorted[0]];
  return picks;
}

// ── Get affiliate URL for a keyword ───────────────────────────────────────
function getAffiliateUrl(kw) {
  return AFF_MAP[kw.tool] || '';
}

// ── Get related merchants for cross-linking ────────────────────────────────
function getRelatedMerchants(kw, limit = 3) {
  const related = Object.entries(AFF_MAP)
    .filter(([id]) => id !== kw.tool)
    .slice(0, limit)
    .map(([id, url]) => ({ id, url }));
  return related;
}

// ── Write blog post ────────────────────────────────────────────────────────
async function writeBlogPost(kw) {
  const affUrl     = getAffiliateUrl(kw);
  const related    = getRelatedMerchants(kw);
  const relatedStr = related.map(r => `${r.id}: ${r.url}`).join('\n');

  // Build meta keywords — affiliate-targeted search terms
  const metaKeywords = KEYWORDS.keywords
    .filter(k => k.tool === kw.tool)
    .slice(0, 15)
    .map(k => k.keyword)
    .join(', ');

  const systemPrompt = `You are a senior SEO content writer and affiliate marketing expert for the Brightlane Verified Merchant Directory. Your job is to write high-quality, genuinely helpful blog posts that rank on Google and drive affiliate sales. You never write thin content. Every post must be comprehensive, detailed, and provide real value to the reader.`;

  const userPrompt = `Write a comprehensive SEO blog post targeting this keyword: "${kw.keyword}"

MERCHANT: ${kw.tool}
CATEGORY: ${kw.category}
AFFILIATE URL: ${affUrl}
SEARCH INTENT: ${kw.intent}
MONTHLY SEARCH VOLUME: ${kw.volume.toLocaleString()}

AFFILIATE LINKING RULES (CRITICAL):
- Include the affiliate URL at least 6-8 times naturally throughout the post
- Place affiliate links in: intro paragraph, each main section, comparison tables, CTA buttons, conclusion
- Use varied anchor text for the affiliate links (not always the same phrase)
- Add a "Visit [Merchant] →" CTA button after every major section
- Include deep-linked product suggestions where relevant (e.g. batman costume → link to halloween costumes affiliate URL)
- Cross-link to related merchants: ${relatedStr}

META KEYWORDS TO TARGET: ${metaKeywords}

OUTPUT FORMAT — return valid JSON only, no markdown:
{
  "title": "SEO title (50-60 chars, keyword first)",
  "metaDescription": "Meta description (150-160 chars, includes keyword and CTA)",
  "metaKeywords": "${metaKeywords}",
  "slug": "url-slug-from-keyword",
  "h1": "H1 heading (slightly different from title)",
  "intro": "3-4 paragraph intro (400+ words). Include affiliate link naturally in paragraph 2. State why this merchant is the best choice.",
  "sections": [
    {
      "h2": "Section heading",
      "content": "Section content (300+ words). Include affiliate link naturally. Include specific product examples. End with CTA button HTML: <a href='AFFILIATE_URL' class='cta-btn' target='_blank' rel='sponsored'>Visit [Merchant] →</a>",
      "hasCTA": true
    }
  ],
  "comparisonTable": "HTML table comparing this merchant vs 2-3 competitors. Include affiliate link in winner column.",
  "faq": [
    { "q": "Frequently asked question", "a": "Detailed answer (100+ words). Include affiliate link where natural." }
  ],
  "conclusion": "2-3 paragraph conclusion. Include affiliate link twice. Strong CTA at end.",
  "affiliateDisclosure": "This post contains affiliate links. We earn a commission when you purchase through our links at no extra cost to you.",
  "wordCount": 1800
}

REQUIREMENTS:
- Minimum 1,800 words total
- Include exactly 6-8 affiliate links (${affUrl})
- Every section must have specific, actionable advice
- Include real product names, prices ranges, and use cases
- Write like a knowledgeable human expert, not an AI
- The post must genuinely help someone searching for "${kw.keyword}"`;

  const raw  = await claude(systemPrompt, userPrompt, 4000);
  const post = parseJSON(raw);
  post.keyword    = kw.keyword;
  post.tool       = kw.tool;
  post.affUrl     = affUrl;
  post.metaKeywords = metaKeywords;
  return post;
}

// ── Build HTML page ────────────────────────────────────────────────────────
function buildHTML(post, lang, slug) {
  const langMeta = LANG_LIST.find(l => l.code === lang) || { name: 'English', locale: 'en-US' };
  const affUrl   = post.affUrl || getAffiliateUrl({ tool: post.tool });
  const dir      = ['ar','he','fa','ur','ps','sd','yi'].includes(lang) ? 'rtl' : 'ltr';

  // Build hreflang tags
  const hreflang = LANG_LIST.map(l =>
    `<link rel="alternate" hreflang="${l.code}" href="${BASE_URL}/blog/${l.code}/${slug}/" />`
  ).join('\n  ');

  // Build sections HTML
  const sectionsHTML = (post.sections || []).map(s => `
    <section class="post-section">
      <h2>${s.h2 || ''}</h2>
      <div class="section-content">${s.content || ''}</div>
    </section>`
  ).join('\n');

  // Build FAQ HTML
  const faqHTML = (post.faq || []).map((f, i) => `
    <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
      <h3 itemprop="name">${f.q}</h3>
      <div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer">
        <div itemprop="text">${f.a}</div>
      </div>
    </div>`
  ).join('\n');

  // JSON-LD structured data
  const jsonLD = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.metaDescription,
    "keywords": post.metaKeywords,
    "datePublished": TODAY,
    "dateModified": TODAY,
    "author": { "@type": "Organization", "name": "Brightlane Verified Merchant Directory" },
    "publisher": { "@type": "Organization", "name": "Brightlane", "url": BASE_URL },
    "mainEntityOfPage": { "@type": "WebPage", "@id": `${BASE_URL}/blog/${lang}/${slug}/` },
    "inLanguage": langMeta.locale
  });

  const faqLD = post.faq && post.faq.length > 0 ? JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": post.faq.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a }
    }))
  }) : null;

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${post.title}</title>
  <meta name="description" content="${(post.metaDescription || '').replace(/"/g, '&quot;')}" />
  <meta name="keywords" content="${(post.metaKeywords || '').replace(/"/g, '&quot;')}" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
  <link rel="canonical" href="${BASE_URL}/blog/${lang}/${slug}/" />
  ${hreflang}
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${(post.title || '').replace(/"/g, '&quot;')}" />
  <meta property="og:description" content="${(post.metaDescription || '').replace(/"/g, '&quot;')}" />
  <meta property="og:url" content="${BASE_URL}/blog/${lang}/${slug}/" />
  <meta property="og:locale" content="${langMeta.locale}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${(post.title || '').replace(/"/g, '&quot;')}" />
  <script type="application/ld+json">${jsonLD}</script>
  ${faqLD ? `<script type="application/ld+json">${faqLD}</script>` : ''}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: #0a0b0d; --bg2: #111318; --bg3: #1a1d24;
      --border: rgba(255,255,255,0.07); --border2: rgba(255,255,255,0.13);
      --text: #e8e9ed; --muted: #8a8d99;
      --accent: #e8ff47; --accent2: #47ffb8;
      --font-head: 'Syne', sans-serif; --font-body: 'DM Sans', sans-serif;
      --radius: 12px;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: var(--font-body); background: var(--bg); color: var(--text); line-height: 1.7; }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }
    .nav {
      position: sticky; top: 0; z-index: 100;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 clamp(20px,4vw,60px); height: 64px;
      background: rgba(10,11,13,0.9); backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border);
    }
    .nav-logo { font-family: var(--font-head); font-weight: 800; font-size: 1rem; color: var(--text); }
    .nav-cta {
      background: var(--accent); color: #0a0b0d;
      font-family: var(--font-head); font-weight: 700; font-size: 0.8rem;
      padding: 8px 18px; border-radius: 8px;
    }
    .container { max-width: 860px; margin: 0 auto; padding: 40px clamp(20px,4vw,40px) 100px; }
    .post-header { margin-bottom: 40px; }
    .post-meta { font-size: 0.8rem; color: var(--muted); margin-bottom: 16px; }
    .post-meta span { margin-right: 16px; }
    h1 {
      font-family: var(--font-head); font-size: clamp(1.8rem,4vw,2.8rem);
      font-weight: 800; line-height: 1.15; letter-spacing: -0.02em;
      margin-bottom: 20px;
    }
    .post-intro { font-size: 1.05rem; color: var(--muted); margin-bottom: 32px; line-height: 1.8; }
    .affiliate-cta-hero {
      background: linear-gradient(135deg, rgba(232,255,71,0.08), rgba(71,255,184,0.05));
      border: 1px solid rgba(232,255,71,0.2); border-radius: var(--radius);
      padding: 24px 28px; margin-bottom: 40px; text-align: center;
    }
    .affiliate-cta-hero p { color: var(--muted); margin-bottom: 16px; }
    .cta-btn {
      display: inline-flex; align-items: center; gap: 8px;
      background: var(--accent); color: #0a0b0d;
      font-family: var(--font-head); font-weight: 700; font-size: 0.95rem;
      padding: 14px 32px; border-radius: var(--radius);
      transition: transform .15s, box-shadow .15s;
    }
    .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(232,255,71,0.25); text-decoration: none; }
    .post-section { margin-bottom: 48px; }
    h2 {
      font-family: var(--font-head); font-size: clamp(1.2rem,2.5vw,1.6rem);
      font-weight: 700; letter-spacing: -0.01em;
      margin-bottom: 16px; padding-bottom: 12px;
      border-bottom: 1px solid var(--border);
    }
    .section-content { color: var(--text); font-size: 1rem; }
    .section-content p { margin-bottom: 16px; }
    .comparison-table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 0.9rem; }
    .comparison-table th { background: var(--bg3); padding: 12px 16px; text-align: left; font-family: var(--font-head); border: 1px solid var(--border); }
    .comparison-table td { padding: 12px 16px; border: 1px solid var(--border); }
    .comparison-table tr:nth-child(even) { background: var(--bg2); }
    .faq-section { margin-top: 60px; }
    .faq-section h2 { font-family: var(--font-head); font-size: 1.5rem; margin-bottom: 28px; }
    .faq-item { border-top: 1px solid var(--border); padding: 20px 0; }
    .faq-item h3 { font-family: var(--font-head); font-size: 1rem; font-weight: 600; margin-bottom: 10px; }
    .faq-item div { font-size: 0.9rem; color: var(--muted); line-height: 1.7; }
    .disclosure { font-size: 0.75rem; color: var(--muted); border-top: 1px solid var(--border); padding-top: 20px; margin-top: 60px; }
    .breadcrumb { font-size: 0.8rem; color: var(--muted); margin-bottom: 24px; }
    .breadcrumb a { color: var(--muted); }
    .related-merchants { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; margin: 40px 0; }
    .related-merchants h3 { font-family: var(--font-head); font-weight: 700; margin-bottom: 16px; }
    .related-links { display: flex; gap: 12px; flex-wrap: wrap; }
    .related-link { background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; padding: 8px 16px; font-size: 0.85rem; color: var(--accent); }
    footer { border-top: 1px solid var(--border); padding: 40px clamp(20px,4vw,60px); text-align: center; }
    .footer-note { font-size: 0.75rem; color: var(--muted); max-width: 600px; margin: 0 auto; }
  </style>
</head>
<body>
  <nav class="nav">
    <a href="${BASE_URL}/" class="nav-logo">Brightlane <span style="color:var(--accent)">✓</span></a>
    <a href="${affUrl}" class="nav-cta" target="_blank" rel="sponsored noopener">Visit ${post.tool} →</a>
  </nav>

  <div class="container">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="${BASE_URL}/">Home</a> › <a href="${BASE_URL}/blog/${lang}/">Blog</a> › ${post.title}
    </nav>

    <article itemscope itemtype="https://schema.org/BlogPosting">
      <header class="post-header">
        <div class="post-meta">
          <span>📅 ${TODAY}</span>
          <span>📂 ${post.tool}</span>
          <span>🌐 ${langMeta.name}</span>
        </div>
        <h1 itemprop="headline">${post.h1 || post.title}</h1>
      </header>

      <div class="affiliate-cta-hero">
        <p>Looking for the best deal? We've verified this merchant and tracked the best offers.</p>
        <a href="${affUrl}" class="cta-btn" target="_blank" rel="sponsored noopener">
          Visit ${post.tool} — Best Deal Available →
        </a>
      </div>

      <div class="post-intro" itemprop="description">${(post.intro || '').replace(/\n/g, '<br/>')}</div>

      ${sectionsHTML}

      ${post.comparisonTable ? `
      <section class="post-section">
        <h2>How ${post.tool} Compares</h2>
        ${post.comparisonTable}
      </section>` : ''}

      <div class="affiliate-cta-hero" style="margin:48px 0">
        <p>Ready to get started? Click below to visit ${post.tool} through our verified affiliate link.</p>
        <a href="${affUrl}" class="cta-btn" target="_blank" rel="sponsored noopener">
          Get the Best Deal at ${post.tool} →
        </a>
      </div>

      ${post.faq && post.faq.length > 0 ? `
      <section class="faq-section" itemscope itemtype="https://schema.org/FAQPage">
        <h2>Frequently Asked Questions</h2>
        ${faqHTML}
      </section>` : ''}

      <div class="related-merchants">
        <h3>🔗 Other Verified Merchants You Might Like</h3>
        <div class="related-links">
          ${Object.entries(AFF_MAP).filter(([id]) => id !== post.tool).slice(0, 6).map(([id, url]) =>
            `<a href="${url}" class="related-link" target="_blank" rel="sponsored noopener">${id} →</a>`
          ).join('')}
        </div>
      </div>

      <div class="post-intro">${(post.conclusion || '').replace(/\n/g, '<br/>')}</div>

      <div class="affiliate-cta-hero" style="margin-top:48px">
        <p>Don't miss out — visit ${post.tool} now through our verified affiliate link.</p>
        <a href="${affUrl}" class="cta-btn" target="_blank" rel="sponsored noopener">
          Visit ${post.tool} Now →
        </a>
      </div>

      <p class="disclosure">⚠️ ${post.affiliateDisclosure || 'This post contains affiliate links. We may earn a commission when you purchase through our links at no extra cost to you.'}</p>
    </article>
  </div>

  <footer>
    <p class="footer-note">© ${new Date().getFullYear()} Brightlane Verified Merchant Directory · <a href="${BASE_URL}/">Browse All Merchants</a> · All affiliate links are verified and tracked through LinkConnector.</p>
  </footer>
</body>
</html>`;
}

// ── Translate post ─────────────────────────────────────────────────────────
async function translatePost(post, targetLang, targetLangName) {
  const systemPrompt = `You are a professional translator. Translate the provided JSON blog post fields into ${targetLangName}. Preserve all HTML tags, affiliate links, and URLs exactly as-is. Return valid JSON only.`;

  const fieldsToTranslate = {
    title: post.title,
    metaDescription: post.metaDescription,
    h1: post.h1,
    intro: post.intro,
    sections: post.sections,
    faq: post.faq,
    conclusion: post.conclusion,
  };

  const userPrompt = `Translate into ${targetLangName}. Preserve HTML and URLs exactly. Return JSON only:\n${JSON.stringify(fieldsToTranslate)}`;

  try {
    const raw        = await claude(systemPrompt, userPrompt, 4000);
    const translated = parseJSON(raw);
    return { ...post, ...translated, lang: targetLang };
  } catch (err) {
    console.warn(`⚠️  Translation failed for ${targetLang}, using English`);
    return { ...post, lang: targetLang };
  }
}

// ── Publish a single page ──────────────────────────────────────────────────
function publishPage(post, lang, slug) {
  const dir = resolve(__dir, 'blog', lang, slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), buildHTML(post, lang, slug), 'utf-8');
}

// ── Update blog index for a language ──────────────────────────────────────
function updateBlogIndex(lang, posts) {
  const blogDir = resolve(__dir, 'blog', lang);
  mkdirSync(blogDir, { recursive: true });
  const langMeta = LANG_LIST.find(l => l.code === lang) || { name: 'English' };
  const cards = posts.map(p => `
    <article class="post-card">
      <a href="${BASE_URL}/blog/${lang}/${p.slug}/">
        <h2>${p.title}</h2>
        <p>${p.metaDescription || ''}</p>
        <span class="card-cta">Read More →</span>
      </a>
    </article>`).join('\n');

  writeFileSync(resolve(blogDir, 'index.html'), `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Blog — Brightlane Verified Merchant Directory (${langMeta.name})</title>
  <meta name="description" content="Explore verified merchant reviews, affiliate deals, and buying guides from Brightlane." />
  <link rel="canonical" href="${BASE_URL}/blog/${lang}/" />
  <style>
    body { font-family: sans-serif; background: #0a0b0d; color: #e8e9ed; padding: 40px 20px; max-width: 900px; margin: 0 auto; }
    h1 { font-size: 2rem; margin-bottom: 32px; }
    .post-card { border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; margin-bottom: 16px; }
    .post-card a { color: #e8e9ed; text-decoration: none; }
    .post-card h2 { font-size: 1.2rem; margin-bottom: 8px; }
    .post-card p { color: #8a8d99; font-size: 0.9rem; margin-bottom: 12px; }
    .card-cta { color: #e8ff47; font-size: 0.85rem; }
  </style>
</head>
<body>
  <h1>Verified Merchant Blog — ${langMeta.name}</h1>
  ${cards}
  <p><a href="${BASE_URL}/" style="color:#e8ff47">← Back to Directory</a></p>
</body>
</html>`, 'utf-8');
}

// ── Get all published posts for index ─────────────────────────────────────
function getPublishedPosts(lang) {
  const blogDir = resolve(__dir, 'blog', lang);
  if (!existsSync(blogDir)) return [];
  const posts = [];
  try {
    readdirSync(blogDir).forEach(slug => {
      const indexFile = resolve(blogDir, slug, 'index.html');
      if (existsSync(indexFile)) {
        const html  = readFileSync(indexFile, 'utf-8');
        const title = (html.match(/<title>([^<]+)<\/title>/) || [])[1] || slug;
        const desc  = (html.match(/name="description" content="([^"]+)"/) || [])[1] || '';
        posts.push({ slug, title, metaDescription: desc });
      }
    });
  } catch {}
  return posts;
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const args         = process.argv.slice(2);
  const kwIdx        = args.indexOf('--keyword');
  const manualKw     = kwIdx !== -1 ? args[kwIdx + 1] : null;
  const langOverride = args.indexOf('--lang') !== -1 ? args[args.indexOf('--lang') + 1].split(',') : null;

  const keywords = pickKeywords(manualKw);
  console.log(`🚀 Processing ${keywords.length} keywords this run...`);

  const langList = langOverride
    ? LANG_LIST.filter(l => langOverride.includes(l.code))
    : LANG_LIST;

  let totalPublished = 0;

  for (const kw of keywords) {
    console.log(`\n📝 Writing: "${kw.keyword}" [${kw.tool}] vol:${kw.volume.toLocaleString()}`);
    const slug = slugify(kw.keyword);

    // Write English post
    let post;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        post = await writeBlogPost(kw);

        // Audit
        const { passed, feedback } = await runAllAudits(post, kw);
        if (passed) {
          console.log(`✅ Audit passed on attempt ${attempt}`);
          break;
        }
        if (attempt < MAX_RETRIES) {
          console.log(`⚠️  Audit failed (attempt ${attempt}), rewriting...`);
          kw._feedback = feedback;
        } else {
          console.log(`⚠️  Max retries reached, publishing anyway`);
        }
      } catch (err) {
        console.error(`❌ Error writing post: ${err.message}`);
        if (attempt === MAX_RETRIES) throw err;
      }
    }

    if (!post) { console.error(`❌ Failed to generate post for "${kw.keyword}"`); continue; }

    post.slug = slug;

    // Publish English first
    publishPage(post, 'en', slug);
    console.log(`📄 Published EN: /blog/en/${slug}/`);
    totalPublished++;

    // Translate and publish all other languages
    for (const lang of langList) {
      if (lang.code === 'en') continue;
      try {
        const translated = await translatePost(post, lang.code, lang.name);
        publishPage(translated, lang.code, slug);
        totalPublished++;
        process.stdout.write('.');
      } catch (err) {
        console.warn(`⚠️  ${lang.code} failed: ${err.message}`);
        publishPage(post, lang.code, slug);
        totalPublished++;
      }
    }
    console.log(`\n✅ "${kw.keyword}" published in ${langList.length} languages`);

    // Update blog index for each language
    for (const lang of langList) {
      const posts = getPublishedPosts(lang.code);
      updateBlogIndex(lang.code, posts);
    }
  }

  console.log(`\n🎉 Run complete: ${totalPublished} pages published across ${langList.length} languages`);
}

main().catch(err => { console.error('Fatal error:', err); process.exit(1); });
