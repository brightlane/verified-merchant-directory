#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════
//  BRIGHTLANE DAILY POST INJECTOR — v2.0 (15-language edition)
//  Run: node post-injector.js
//
//  What it does:
//    1. Reads next unused topic from post-topics.json
//    2. Calls Claude API to generate full SEO post in English
//    3. Calls Claude API to translate into all 14 other languages
//    4. Injects each post into its matching blog-xx.html file
//    5. Updates sitemap.xml with correct hreflang cross-references
//       for all 15 language variants
//    6. Marks topic as used and logs the run
//
//  Then: git add . && git commit -m "post: [topic]" && git push
//
//  Requirements:
//    - ANTHROPIC_API_KEY environment variable set
//    - All 15 blog-xx.html files present in repo root
//    - post-topics.json present with pending topics
// ═══════════════════════════════════════════════════════════════════════

const fs      = require('fs');
const path    = require('path');
const https   = require('https');

// ── Config
const BASE_URL   = 'https://brightlane.github.io/verified-merchant-directory';
const TODAY      = new Date().toISOString().slice(0, 10);
const LOG_FILE   = 'injector-log.json';
const TOPICS     = 'post-topics.json';
const API_KEY    = process.env.ANTHROPIC_API_KEY;
const MODEL      = 'claude-opus-4-5';
const MAX_TOKENS = 4000;

if (!API_KEY) {
  console.error('✗ ANTHROPIC_API_KEY environment variable not set.');
  process.exit(1);
}

// ── All 15 language targets
// file: the blog HTML file to inject into
// lang: hreflang code
// locale: human-readable name for prompts
// rtl: right-to-left text direction
const LANGUAGES = [
  { code: 'en',    file: 'blog.html',       lang: 'en',    locale: 'English',                    rtl: false },
  { code: 'zh',    file: 'blog-zh.html',    lang: 'zh',    locale: 'Simplified Chinese',          rtl: false },
  { code: 'zh-tw', file: 'blog-zh-tw.html', lang: 'zh-tw', locale: 'Traditional Chinese (Taiwan)',rtl: false },
  { code: 'es',    file: 'blog-es.html',    lang: 'es',    locale: 'Spanish',                    rtl: false },
  { code: 'fr',    file: 'blog-fr.html',    lang: 'fr',    locale: 'French',                     rtl: false },
  { code: 'de',    file: 'blog-de.html',    lang: 'de',    locale: 'German',                     rtl: false },
  { code: 'pt',    file: 'blog-pt.html',    lang: 'pt',    locale: 'Portuguese (European)',       rtl: false },
  { code: 'pt-br', file: 'blog-pt-br.html', lang: 'pt-br', locale: 'Portuguese (Brazilian)',      rtl: false },
  { code: 'ja',    file: 'blog-ja.html',    lang: 'ja',    locale: 'Japanese',                   rtl: false },
  { code: 'ko',    file: 'blog-ko.html',    lang: 'ko',    locale: 'Korean',                     rtl: false },
  { code: 'it',    file: 'blog-it.html',    lang: 'it',    locale: 'Italian',                    rtl: false },
  { code: 'nl',    file: 'blog-nl.html',    lang: 'nl',    locale: 'Dutch',                      rtl: false },
  { code: 'pl',    file: 'blog-pl.html',    lang: 'pl',    locale: 'Polish',                     rtl: false },
  { code: 'hi',    file: 'blog-hi.html',    lang: 'hi',    locale: 'Hindi',                      rtl: false },
];

// ── Affiliate links
const LINKS = {
  movavi:           'https://www.linkconnector.com/ta.php?lc=014538108972006513&atid=movavi&lcpt=0&lcpf=3',
  iskysoft:         'https://www.linkconnector.com/ta.php?lc=014538080056005679&atid=iskysoft&lcpt=0&lcpf=3',
  tenorshare:       'https://www.linkconnector.com/ta.php?lc=014538147585006847&atid=tenorshare&lcpt=0&lcpf=3',
  wondershare:      'https://www.linkconnector.com/ta.php?lc=014538165262004532&atid=wondershare&lcpt=0&lcpf=3',
  appypie:          'https://www.linkconnector.com/ta.php?lc=014538139894005541&atid=appypie',
  knowledgehut:     'https://www.linkconnector.com/ta.php?lc=014538151487007786&atid=knowledgehut&lcpt=0&lcpf=',
  pmtraining:       'https://www.linkconnector.com/ta.php?lc=014538081796006139&atid=pmtraining',
  cpraedcourse:     'https://www.linkconnector.com/ta.php?lc=014538047418004897&atid=cpraedcourse&lcpt=0&lcpf=3',
  cprcare:          'https://www.linkconnector.com/ta.php?lc=014538104426006955&atid=cprcare&lcpt=0&lcpf=',
  ahca:             'https://www.linkconnector.com/ta.php?lc=014538092157004897&atid=ahca&lcpt=0&lcpf=3',
  discountpetcare:  'https://www.linkconnector.com/ta.php?lc=014538154581007847&atid=discountpetcare&lcpt=0&lcpf=',
  canadapetcare:    'https://www.linkconnector.com/ta.php?lc=014538000012006219&atid=canadapetcare',
  buildasign:       'https://www.linkconnector.com/ta.php?lc=014538059259004756&atid=buildasign&lcpt=0&lcpf=3',
  easycanvasprints: 'https://www.linkconnector.com/ta.php?lc=014538095217004760&atid=easycanvasprints&lcpt=0&lcpf=3',
  canvasdiscount:   'https://www.linkconnector.com/ta.php?lc=014538165146007920&atid=canvasdiscount&lcpt=0&lcpf=3',
  canvasonthecheap: 'https://www.linkconnector.com/ta.php?lc=014538153308006216&atid=canvasonthecheap&lcpt=0&lcpf=3',
  infinitealoe:     'https://www.linkconnector.com/ta.php?lc=014538155218007855&atid=infinitealoe&lcpt=0&lcpf=0',
  littletoe:        'https://www.linkconnector.com/ta.php?lc=014538126445007124&atid=littletoe',
  combatflipflops:  'https://www.linkconnector.com/ta.php?lc=014538089787006486&atid=combatflipflops&lcpt=0&lcpf=0',
  halloweencostumes:'https://www.linkconnector.com/ta.php?lc=014538069092004909&atid=halloweencostumes&lcpt=0&lcpf=',
  shoplww:          'https://www.linkconnector.com/ta.php?lc=014538165369003224&atid=shoplww&lcpt=0&lcpf=3',
  bgmgirl:          'https://www.linkconnector.com/ta.php?lc=014538163184007840&atid=bgmgirl&lcpt=0&lcpf=',
  lafuent:          'https://www.linkconnector.com/ta.php?lc=014538034203001545&atid=lafuent&lcpt=0&lcpf=0',
  taxextension:     'https://www.linkconnector.com/ta.php?lc=014538121293006198&atid=taxextension'
};

function affLink(id, pos, slug, langCode) {
  const base = LINKS[id];
  if (!base) return '#';
  const u = new URL(base);
  u.searchParams.set('utm_source', `brightlane-blog-${langCode}`);
  u.searchParams.set('utm_medium', 'affiliate');
  u.searchParams.set('utm_campaign', slug);
  u.searchParams.set('utm_content', `pos-${pos}`);
  return u.toString();
}

// ═══════════════════════════════════════════════════════════════════════
//  CLAUDE API CALL
// ═══════════════════════════════════════════════════════════════════════

function claudeAPI(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: 'user', content: prompt }]
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error.message));
          const text = parsed.content?.[0]?.text || '';
          resolve(text);
        } catch (e) {
          reject(new Error(`API parse error: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Sleep helper for rate limiting
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════════════
//  GENERATE ENGLISH POST
//  Returns a JSON object with all post fields
// ═══════════════════════════════════════════════════════════════════════

async function generateEnglishPost(topic) {
  const prompt = `You are an SEO content writer for Brightlane, a verified affiliate merchant directory. Write a high-quality blog post in English for the following topic.

Merchant: ${topic.merchant}
Topic: ${topic.title_en || topic.slug}
Affiliate URL: ${LINKS[topic.merchant] || '#'}
Category: ${topic.category_en || 'General'}

Return ONLY a valid JSON object with exactly these fields (no markdown, no backticks, no explanation):
{
  "title": "compelling SEO title under 60 chars",
  "metaDesc": "meta description 150-160 chars with primary keyword",
  "keywords": "5-8 comma-separated keywords",
  "category": "category name",
  "readTime": "X min read",
  "intro": "2-3 sentence intro paragraph",
  "callout": "1-2 sentence bottom-line summary",
  "h2a": "first H2 heading",
  "body1": "2-3 sentence paragraph after h2a",
  "bullets": ["benefit 1", "benefit 2", "benefit 3", "benefit 4", "benefit 5"],
  "verdict_title": "merchant name + short verdict phrase",
  "verdict_desc": "2-3 sentence verdict paragraph",
  "cta": "CTA button text (e.g. Visit Movavi)",
  "h2b": "second H2 heading",
  "body2": "2-3 sentence paragraph after h2b",
  "cta2": "secondary CTA button text",
  "faqs": [
    {"q": "question 1", "a": "answer 1"},
    {"q": "question 2", "a": "answer 2"},
    {"q": "question 3", "a": "answer 3"},
    {"q": "question 4", "a": "answer 4"}
  ]
}`;

  const raw = await claudeAPI(prompt);
  try {
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    throw new Error(`Failed to parse English post JSON: ${e.message}\nRaw: ${raw.slice(0, 200)}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  TRANSLATE POST TO TARGET LANGUAGE
//  Takes English post object, returns translated version
// ═══════════════════════════════════════════════════════════════════════

async function translatePost(enPost, targetLocale, langCode) {
  const prompt = `You are a professional translator and SEO content writer. Translate the following blog post data from English to ${targetLocale}.

IMPORTANT RULES:
- Translate all text content naturally for native ${targetLocale} speakers
- Keep SEO best practices for ${targetLocale} search engines
- Do NOT translate the following: JSON keys, URLs, affiliate links, the "readTime" format (use local equivalent e.g. "4分钟阅读" for Chinese)
- Adapt idioms and expressions naturally — do not literal-translate
- For RTL languages, ensure text flows correctly
- Return ONLY valid JSON, no markdown, no backticks, no explanation

Input English data:
${JSON.stringify(enPost, null, 2)}

Return the same JSON structure with all text values translated to ${targetLocale}:`;

  const raw = await claudeAPI(prompt);
  try {
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    console.warn(`  ⚠ Translation parse failed for ${targetLocale}, using English fallback`);
    return enPost;
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  BUILD POST OBJECT STRING
//  Formats a post as a JS object string for injection into blog HTML
// ═══════════════════════════════════════════════════════════════════════

function buildPostObject(post, slug, langCode, merchantId) {
  const link1 = affLink(merchantId, 1, slug, langCode);
  const link2 = affLink(merchantId, 2, slug, langCode);

  const bulletsHtml = (post.bullets || []).map(b => `<li>${b}</li>`).join('');
  const faqsJson = JSON.stringify(post.faqs || []);

  const bodyHtml = `
      <p>${post.intro}</p>
      <div class="callout"><strong>${langCode === 'en' ? 'Bottom Line' : '★'}</strong>${post.callout}</div>
      <h2>${post.h2a}</h2>
      <p>${post.body1}</p>
      <ul>${bulletsHtml}</ul>
      <div class="verdict">
        <div class="verdict-label">${langCode === 'en' ? 'Our Pick' : '★'}</div>
        <div class="verdict-title">${post.verdict_title}</div>
        <div class="verdict-desc">${post.verdict_desc}</div>
        <a href="${link1}" class="cta-btn" target="_blank" rel="noopener sponsored">${post.cta} →</a>
      </div>
      <h2>${post.h2b}</h2>
      <p>${post.body2}</p>
      <a href="${link2}" class="cta-btn-outline" target="_blank" rel="noopener sponsored" style="margin-top:12px;display:inline-flex">${post.cta2} →</a>
    `;

  const slugKey = `${slug}__${TODAY}`;

  return `
    "${slugKey}": {
      title: ${JSON.stringify(post.title)},
      titleHl: ${JSON.stringify(post.title)},
      titleRest: "",
      category: ${JSON.stringify(post.category)},
      readTime: ${JSON.stringify(post.readTime)},
      date: ${JSON.stringify(TODAY)},
      metaDesc: ${JSON.stringify(post.metaDesc)},
      keywords: ${JSON.stringify(post.keywords)},
      faqs: ${faqsJson},
      render: (slug) => \`${bodyHtml.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`
    },`;
}

// ═══════════════════════════════════════════════════════════════════════
//  INJECT INTO BLOG FILE
// ═══════════════════════════════════════════════════════════════════════

function injectIntoBlog(filePath, postObjStr) {
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠ ${filePath} not found — skipping`);
    return false;
  }
  let html = fs.readFileSync(filePath, 'utf8');
  const marker = 'const POSTS = {';
  const idx = html.indexOf(marker);
  if (idx === -1) {
    console.warn(`  ⚠ POSTS marker not found in ${filePath}`);
    return false;
  }
  const insertAt = idx + marker.length;
  html = html.slice(0, insertAt) + postObjStr + html.slice(insertAt);
  fs.writeFileSync(filePath, html, 'utf8');
  return true;
}

// ═══════════════════════════════════════════════════════════════════════
//  UPDATE SITEMAP
//  Adds one <url> block per language, each cross-referencing all 15
// ═══════════════════════════════════════════════════════════════════════

function updateSitemap(slug) {
  const sitemapPath = 'sitemap.xml';
  if (!fs.existsSync(sitemapPath)) {
    console.warn('  ⚠ sitemap.xml not found — skipping');
    return;
  }

  const slugKey = `${slug}__${TODAY}`;

  // Build the URL for each language variant
  const variants = LANGUAGES.map(l => ({
    lang: l.lang,
    url: `${BASE_URL}/${l.file}?p=${slugKey}`
  }));

  // x-default always points to English
  const xDefault = variants.find(v => v.lang === 'en').url;

  // Build one <url> block per language
  // Every block cross-references ALL 15 variants
  const newBlocks = variants.map(({ lang, url }) => {
    const links = [
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${xDefault}"/>`,
      ...variants.map(v =>
        `    <xhtml:link rel="alternate" hreflang="${v.lang}" href="${v.url}"/>`
      )
    ].join('\n');

    return `  <url>
    <loc>${url}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
${links}
  </url>`;
  }).join('\n');

  let sitemap = fs.readFileSync(sitemapPath, 'utf8');
  sitemap = sitemap.replace('</urlset>', newBlocks + '\n</urlset>');
  fs.writeFileSync(sitemapPath, sitemap, 'utf8');

  console.log(`  ✓ sitemap.xml updated — ${LANGUAGES.length} URL blocks, full hreflang cross-references`);
}

// ═══════════════════════════════════════════════════════════════════════
//  LOG RUN
// ═══════════════════════════════════════════════════════════════════════

function logRun(topic, results) {
  let log = [];
  if (fs.existsSync(LOG_FILE)) {
    try { log = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8')); } catch(e) {}
  }
  log.push({
    date: TODAY,
    slug: topic.slug,
    merchant: topic.merchant,
    title: topic.title_en || topic.slug,
    languages_injected: results.filter(r => r.ok).map(r => r.lang),
    languages_failed: results.filter(r => !r.ok).map(r => r.lang)
  });
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2), 'utf8');
}

// ═══════════════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════════════

async function main() {
  console.log('\n🦅 BRIGHTLANE DAILY POST INJECTOR v2.0 — 15 Languages');
  console.log('══════════════════════════════════════════════════════');
  console.log(`Date: ${TODAY}\n`);

  // Load topics
  if (!fs.existsSync(TOPICS)) {
    console.error('✗ post-topics.json not found.');
    process.exit(1);
  }

  const topicsData = JSON.parse(fs.readFileSync(TOPICS, 'utf8'));
  const pending = topicsData.topics.filter(t => !t.published);

  if (pending.length === 0) {
    console.log('✓ All topics published. Add more to post-topics.json.');
    process.exit(0);
  }

  const topic = pending[0];
  console.log(`Topic:    ${topic.title_en || topic.slug}`);
  console.log(`Merchant: ${topic.merchant}`);
  console.log(`Slug:     ${topic.slug}\n`);

  // ── Step 1: Generate English post
  console.log('Step 1/3 — Generating English post via Claude API...');
  let enPost;
  try {
    enPost = await generateEnglishPost(topic);
    console.log(`  ✓ English post generated: "${enPost.title}"`);
  } catch (e) {
    console.error(`  ✗ English generation failed: ${e.message}`);
    process.exit(1);
  }

  // ── Step 2: Translate into all other languages
  console.log('\nStep 2/3 — Translating into 14 languages...');
  const posts = { en: enPost };

  for (const lang of LANGUAGES.filter(l => l.code !== 'en')) {
    try {
      console.log(`  Translating → ${lang.locale}...`);
      await sleep(500); // rate limit buffer
      posts[lang.code] = await translatePost(enPost, lang.locale, lang.code);
      console.log(`  ✓ ${lang.locale} done`);
    } catch (e) {
      console.warn(`  ⚠ ${lang.locale} failed: ${e.message} — using English fallback`);
      posts[lang.code] = enPost;
    }
  }

  // ── Step 3: Inject into all blog files
  console.log('\nStep 3/3 — Injecting into blog files...');
  const results = [];

  for (const lang of LANGUAGES) {
    const post = posts[lang.code] || enPost;
    const objStr = buildPostObject(post, topic.slug, lang.code, topic.merchant);
    const ok = injectIntoBlog(lang.file, objStr);
    results.push({ lang: lang.code, ok });
    if (ok) {
      console.log(`  ✓ ${lang.file}`);
    }
  }

  // ── Update sitemap
  console.log('\nUpdating sitemap...');
  updateSitemap(topic.slug);

  // ── Mark topic as published
  const topicIdx = topicsData.topics.findIndex(t => t.slug === topic.slug);
  topicsData.topics[topicIdx].published = true;
  topicsData.topics[topicIdx].published_date = TODAY;
  fs.writeFileSync(TOPICS, JSON.stringify(topicsData, null, 2), 'utf8');

  // ── Log run
  logRun(topic, results);

  const injected = results.filter(r => r.ok).length;
  console.log(`\n✅ Done! ${injected}/${LANGUAGES.length} blog files updated.`);
  console.log(`\nNext step:`);
  console.log(`  git add . && git commit -m "post: ${enPost.title}" && git push`);
  console.log(`\nTopics remaining: ${pending.length - 1}`);
  console.log('══════════════════════════════════════════════════════\n');
}

main().catch(e => {
  console.error(`\n✗ Fatal error: ${e.message}`);
  process.exit(1);
});
