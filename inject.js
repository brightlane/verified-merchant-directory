#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════
//  BRIGHTLANE DAILY POST INJECTOR — v3.0 (no API required)
//  Run: node inject.js
//
//  What it does:
//    1. Reads next unused topic from post-topics.json
//    2. Builds post HTML from pre-written fields in the topic object
//    3. Injects into all 15 blog-xx.html files
//    4. Updates sitemap.xml with correct hreflang for all 15 languages
//    5. Marks topic as published and logs the run
//
//  No API key required — content comes from post-topics.json
//  auto-topic-generator.js handles topic generation (uses API separately)
// ═══════════════════════════════════════════════════════════════════════

const fs   = require('fs');
const path = require('path');

// ── Config
const BASE_URL   = 'https://brightlane.github.io/verified-merchant-directory';
const TODAY      = new Date().toISOString().slice(0, 10);
const LOG_FILE   = 'injector-log.json';
const TOPICS     = 'post-topics.json';

// ── All 15 language targets
const LANGUAGES = [
  { code: 'en',    file: 'blog.html',       lang: 'en',    label: 'English' },
  { code: 'zh',    file: 'blog-zh.html',    lang: 'zh',    label: 'Chinese' },
  { code: 'zh-tw', file: 'blog-zh-tw.html', lang: 'zh-tw', label: 'Traditional Chinese' },
  { code: 'es',    file: 'blog-es.html',    lang: 'es',    label: 'Spanish' },
  { code: 'fr',    file: 'blog-fr.html',    lang: 'fr',    label: 'French' },
  { code: 'de',    file: 'blog-de.html',    lang: 'de',    label: 'German' },
  { code: 'pt',    file: 'blog-pt.html',    lang: 'pt',    label: 'Portuguese' },
  { code: 'pt-br', file: 'blog-pt-br.html', lang: 'pt-br', label: 'Portuguese BR' },
  { code: 'ja',    file: 'blog-ja.html',    lang: 'ja',    label: 'Japanese' },
  { code: 'ko',    file: 'blog-ko.html',    lang: 'ko',    label: 'Korean' },
  { code: 'it',    file: 'blog-it.html',    lang: 'it',    label: 'Italian' },
  { code: 'nl',    file: 'blog-nl.html',    lang: 'nl',    label: 'Dutch' },
  { code: 'pl',    file: 'blog-pl.html',    lang: 'pl',    label: 'Polish' },
  { code: 'hi',    file: 'blog-hi.html',    lang: 'hi',    label: 'Hindi' },
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

// ── Build affiliate URL with UTM params
function affLink(merchantId, pos, slug, langCode) {
  const base = LINKS[merchantId];
  if (!base) return '#';
  const u = new URL(base);
  u.searchParams.set('utm_source', `brightlane-blog-${langCode}`);
  u.searchParams.set('utm_medium', 'affiliate');
  u.searchParams.set('utm_campaign', slug);
  u.searchParams.set('utm_content', `pos-${pos}`);
  return u.toString();
}

// ── Get field for a language, fall back gracefully
function field(topic, name, langCode) {
  // zh-tw falls back to zh, pt-br falls back to pt, everything falls back to en
  const fallbacks = [langCode];
  if (langCode === 'zh-tw') fallbacks.push('zh');
  if (langCode === 'pt-br') fallbacks.push('pt');
  fallbacks.push('en');

  for (const code of fallbacks) {
    const val = topic[`${name}_${code}`];
    if (val) return val;
  }
  return '';
}

// ── Get array field for a language, fall back gracefully
function arrayField(topic, name, langCode) {
  const fallbacks = [langCode];
  if (langCode === 'zh-tw') fallbacks.push('zh');
  if (langCode === 'pt-br') fallbacks.push('pt');
  fallbacks.push('en');

  for (const code of fallbacks) {
    const val = topic[`${name}_${code}`];
    if (Array.isArray(val) && val.length > 0) return val;
  }
  return [];
}

// ── Read times by language
const READ_TIMES = {
  en:    '4 min read',
  zh:    '4分钟阅读',
  'zh-tw': '4分鐘閱讀',
  es:    '4 min de lectura',
  fr:    '4 min de lecture',
  de:    '4 Min. Lesezeit',
  pt:    '4 min de leitura',
  'pt-br': '4 min de leitura',
  ja:    '4分で読めます',
  ko:    '4분 읽기',
  it:    '4 min di lettura',
  nl:    '4 min lezen',
  pl:    '4 min czytania',
  hi:    '4 मिनट पढ़ें'
};

// ── Build post body HTML from topic fields
function buildBodyHtml(topic, slug, langCode) {
  const merchantId   = topic.merchant;
  const link1        = affLink(merchantId, 1, slug, langCode);
  const link2        = affLink(merchantId, 2, slug, langCode);
  const intro        = field(topic, 'intro', langCode);
  const callout      = field(topic, 'callout', langCode);
  const h2a          = field(topic, 'h2a', langCode);
  const body1        = field(topic, 'body1', langCode);
  const bullets      = arrayField(topic, 'bullets', langCode);
  const verdictTitle = field(topic, 'verdict_title', langCode);
  const verdictDesc  = field(topic, 'verdict_desc', langCode);
  const cta          = field(topic, 'cta', langCode);
  const h2b          = field(topic, 'h2b', langCode);
  const body2        = field(topic, 'body2', langCode);
  const cta2         = field(topic, 'cta2', langCode);
  const bulletsHtml  = bullets.map(b => `<li>${b}</li>`).join('');

  return `
      <p>${intro}</p>
      <div class="callout"><strong>★</strong>${callout}</div>
      <h2>${h2a}</h2>
      <p>${body1}</p>
      <ul>${bulletsHtml}</ul>
      <div class="verdict">
        <div class="verdict-label">★</div>
        <div class="verdict-title">${verdictTitle}</div>
        <div class="verdict-desc">${verdictDesc}</div>
        <a href="${link1}" class="cta-btn" target="_blank" rel="noopener sponsored">${cta} →</a>
      </div>
      <h2>${h2b}</h2>
      <p>${body2}</p>
      <a href="${link2}" class="cta-btn-outline" target="_blank" rel="noopener sponsored" style="margin-top:12px;display:inline-flex">${cta2} →</a>
    `;
}

// ── Build the JS object string to inject into the blog HTML file
function buildPostObject(topic, slug, langCode) {
  const slugKey    = `${slug}__${TODAY}`;
  const title      = field(topic, 'title', langCode);
  const category   = field(topic, 'category', langCode);
  const metaDesc   = field(topic, 'metaDesc', langCode);
  const keywords   = field(topic, 'keywords', langCode);
  const faqs       = arrayField(topic, 'faqs', langCode);
  const bodyHtml   = buildBodyHtml(topic, slug, langCode);

  return `
    "${slugKey}": {
      title: ${JSON.stringify(title)},
      titleHl: ${JSON.stringify(title)},
      titleRest: "",
      category: ${JSON.stringify(category)},
      readTime: ${JSON.stringify(READ_TIMES[langCode] || '4 min read')},
      date: ${JSON.stringify(TODAY)},
      metaDesc: ${JSON.stringify(metaDesc)},
      keywords: ${JSON.stringify(keywords)},
      faqs: ${JSON.stringify(faqs)},
      render: (slug) => \`${bodyHtml.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`
    },`;
}

// ── Inject post object into blog HTML file
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

// ── Update sitemap with 15-language hreflang cross-references
function updateSitemap(slug) {
  const sitemapPath = 'sitemap.xml';
  if (!fs.existsSync(sitemapPath)) {
    console.warn('  ⚠ sitemap.xml not found — skipping');
    return;
  }

  const slugKey  = `${slug}__${TODAY}`;
  const xDefault = `${BASE_URL}/blog.html?p=${slugKey}`;

  const variants = LANGUAGES.map(l => ({
    lang: l.lang,
    url:  `${BASE_URL}/${l.file}?p=${slugKey}`
  }));

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
  console.log(`  ✓ sitemap.xml updated — ${LANGUAGES.length} URL blocks`);
}

// ── Log the run
function logRun(topic, results) {
  let log = [];
  if (fs.existsSync(LOG_FILE)) {
    try { log = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8')); } catch(e) {}
  }
  log.push({
    date:              TODAY,
    slug:              topic.slug,
    merchant:          topic.merchant,
    title:             topic.title_en || topic.slug,
    languages_injected: results.filter(r => r.ok).map(r => r.lang),
    languages_skipped:  results.filter(r => !r.ok).map(r => r.lang)
  });
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2), 'utf8');
}

// ═══════════════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════════════

function main() {
  console.log('\n🦅 BRIGHTLANE POST INJECTOR v3.0 — 15 Languages (No API Required)');
  console.log('═════════════════════════════════════════════════════════════════');
  console.log(`Date: ${TODAY}\n`);

  if (!fs.existsSync(TOPICS)) {
    console.error(`✗ ${TOPICS} not found.`);
    process.exit(1);
  }

  const topicsData = JSON.parse(fs.readFileSync(TOPICS, 'utf8'));
  const pending    = topicsData.topics.filter(t => !t.published);

  if (pending.length === 0) {
    console.log('✓ All topics published — nothing to inject today.');
    console.log('  auto-topic-generator.js will add more on next run.');
    process.exit(0);
  }

  const topic = pending[0];
  console.log(`Topic:    ${topic.title_en || topic.slug}`);
  console.log(`Merchant: ${topic.merchant}`);
  console.log(`Slug:     ${topic.slug}`);
  console.log(`Queue:    ${pending.length} topics remaining\n`);

  console.log('Injecting into blog files...');
  const results = [];

  for (const lang of LANGUAGES) {
    const objStr = buildPostObject(topic, topic.slug, lang.code);
    const ok     = injectIntoBlog(lang.file, objStr);
    results.push({ lang: lang.code, ok });
    if (ok) console.log(`  ✓ ${lang.file} (${lang.label})`);
  }

  console.log('\nUpdating sitemap...');
  updateSitemap(topic.slug);

  // Mark as published
  const topicIdx = topicsData.topics.findIndex(t => t.slug === topic.slug);
  topicsData.topics[topicIdx].published      = true;
  topicsData.topics[topicIdx].published_date = TODAY;
  fs.writeFileSync(TOPICS, JSON.stringify(topicsData, null, 2), 'utf8');

  logRun(topic, results);

  const injected = results.filter(r => r.ok).length;
  console.log(`\n✅ Done! ${injected}/${LANGUAGES.length} blog files updated.`);
  console.log(`\nTopics remaining: ${pending.length - 1}`);
  console.log('═════════════════════════════════════════════════════════════════\n');
}

main();
