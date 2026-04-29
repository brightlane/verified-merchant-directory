#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════
//  BRIGHTLANE DAILY POST INJECTOR
//  Run: node post-injector.js
//  What it does:
//    1. Reads next unused topic from post-topics.json
//    2. Generates a full SEO post in EN, ZH, ES, FR
//    3. Injects each post into the matching blog file
//    4. Updates sitemap.xml with the 4 new URLs
//    5. Marks topic as used, logs the run
//  Then just: git add . && git commit -m "post: [topic]" && git push
// ═══════════════════════════════════════════════════════════════════════

const fs   = require('fs');
const path = require('path');

// ── Config
const BASE_URL  = 'https://brightlane.github.io/verified-merchant-directory';
const TODAY     = new Date().toISOString().slice(0,10);
const LOG_FILE  = 'injector-log.json';
const TOPICS    = 'post-topics.json';

// ── Affiliate links (all 24 campaigns)
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

function affLink(id, pos, slug, lang) {
  const base = LINKS[id];
  const u = new URL(base);
  u.searchParams.set('utm_source', `brightlane-blog-${lang}`);
  u.searchParams.set('utm_medium', 'affiliate');
  u.searchParams.set('utm_campaign', slug);
  u.searchParams.set('utm_content', `pos-${pos}`);
  return u.toString();
}

// ═══════════════════════════════════════════════════════════════════════
//  POST GENERATOR — takes a topic object, returns post in all 4 languages
// ═══════════════════════════════════════════════════════════════════════

function generatePost(topic) {
  const { slug, merchant, title_en, title_zh, title_es, title_fr,
          keywords_en, keywords_zh, keywords_es, keywords_fr,
          metaDesc_en, metaDesc_zh, metaDesc_es, metaDesc_fr,
          category_en, category_zh, category_es, category_fr } = topic;

  const id = merchant;
  const link1 = (lang) => affLink(id, 1, slug, lang);
  const link2 = (lang) => affLink(id, 2, slug, lang);

  // ── ENGLISH POST
  const en = {
    slug,
    title: title_en,
    category: category_en,
    readTime: '4 min read',
    date: TODAY,
    metaDesc: metaDesc_en,
    keywords: keywords_en,
    faqs: topic.faqs_en,
    bodyHtml: `
      <p>${topic.intro_en}</p>
      <div class="callout"><strong>Bottom Line</strong>${topic.callout_en}</div>
      <h2>${topic.h2a_en}</h2>
      <p>${topic.body1_en}</p>
      <ul>${topic.bullets_en.map(b=>`<li>${b}</li>`).join('')}</ul>
      <div class="verdict">
        <div class="verdict-label">Our Pick</div>
        <div class="verdict-title">${topic.verdict_title_en}</div>
        <div class="verdict-desc">${topic.verdict_desc_en}</div>
        <a href="${link1('en')}" class="cta-btn" target="_blank" rel="noopener sponsored">${topic.cta_en} →</a>
      </div>
      <h2>${topic.h2b_en}</h2>
      <p>${topic.body2_en}</p>
      <a href="${link2('en')}" class="cta-btn-outline" target="_blank" rel="noopener sponsored" style="margin-top:12px;display:inline-flex">${topic.cta2_en} →</a>
    `
  };

  // ── CHINESE POST
  const zh = {
    slug,
    title: title_zh,
    category: category_zh,
    readTime: '4分钟阅读',
    date: TODAY,
    metaDesc: metaDesc_zh,
    keywords: keywords_zh,
    faqs: topic.faqs_zh,
    bodyHtml: `
      <p>${topic.intro_zh}</p>
      <div class="callout"><strong>直接结论</strong>${topic.callout_zh}</div>
      <h2>${topic.h2a_zh}</h2>
      <p>${topic.body1_zh}</p>
      <ul>${topic.bullets_zh.map(b=>`<li>${b}</li>`).join('')}</ul>
      <div class="verdict">
        <div class="verdict-label">推荐</div>
        <div class="verdict-title">${topic.verdict_title_zh}</div>
        <div class="verdict-desc">${topic.verdict_desc_zh}</div>
        <a href="${link1('zh')}" class="cta-btn" target="_blank" rel="noopener sponsored">${topic.cta_zh} →</a>
      </div>
      <h2>${topic.h2b_zh}</h2>
      <p>${topic.body2_zh}</p>
      <a href="${link2('zh')}" class="cta-btn-outline" target="_blank" rel="noopener sponsored" style="margin-top:12px;display:inline-flex">${topic.cta2_zh} →</a>
    `
  };

  // ── SPANISH POST
  const es = {
    slug,
    title: title_es,
    category: category_es,
    readTime: '4 min de lectura',
    date: TODAY,
    metaDesc: metaDesc_es,
    keywords: keywords_es,
    faqs: topic.faqs_es,
    bodyHtml: `
      <p>${topic.intro_es}</p>
      <div class="callout"><strong>Conclusión Directa</strong>${topic.callout_es}</div>
      <h2>${topic.h2a_es}</h2>
      <p>${topic.body1_es}</p>
      <ul>${topic.bullets_es.map(b=>`<li>${b}</li>`).join('')}</ul>
      <div class="verdict">
        <div class="verdict-label">Nuestra Elección</div>
        <div class="verdict-title">${topic.verdict_title_es}</div>
        <div class="verdict-desc">${topic.verdict_desc_es}</div>
        <a href="${link1('es')}" class="cta-btn" target="_blank" rel="noopener sponsored">${topic.cta_es} →</a>
      </div>
      <h2>${topic.h2b_es}</h2>
      <p>${topic.body2_es}</p>
      <a href="${link2('es')}" class="cta-btn-outline" target="_blank" rel="noopener sponsored" style="margin-top:12px;display:inline-flex">${topic.cta2_es} →</a>
    `
  };

  // ── FRENCH POST
  const fr = {
    slug,
    title: title_fr,
    category: category_fr,
    readTime: '4 min de lecture',
    date: TODAY,
    metaDesc: metaDesc_fr,
    keywords: keywords_fr,
    faqs: topic.faqs_fr,
    bodyHtml: `
      <p>${topic.intro_fr}</p>
      <div class="callout"><strong>Conclusion Directe</strong>${topic.callout_fr}</div>
      <h2>${topic.h2a_fr}</h2>
      <p>${topic.body1_fr}</p>
      <ul>${topic.bullets_fr.map(b=>`<li>${b}</li>`).join('')}</ul>
      <div class="verdict">
        <div class="verdict-label">Notre Choix</div>
        <div class="verdict-title">${topic.verdict_title_fr}</div>
        <div class="verdict-desc">${topic.verdict_desc_fr}</div>
        <a href="${link1('fr')}" class="cta-btn" target="_blank" rel="noopener sponsored">${topic.cta_fr} →</a>
      </div>
      <h2>${topic.h2b_fr}</h2>
      <p>${topic.body2_fr}</p>
      <a href="${link2('fr')}" class="cta-btn-outline" target="_blank" rel="noopener sponsored" style="margin-top:12px;display:inline-flex">${topic.cta2_fr} →</a>
    `
  };

  return { en, zh, es, fr };
}

// ═══════════════════════════════════════════════════════════════════════
//  BUILD JS OBJECT STRING — formats a post as a JS object for injection
// ═══════════════════════════════════════════════════════════════════════

function buildPostObject(post, lang) {
  const faqsJson = JSON.stringify(post.faqs);
  return `
    "${post.slug}__${TODAY}": {
      title: ${JSON.stringify(post.title)},
      titleHl: ${JSON.stringify(post.title)},
      titleRest: "",
      category: ${JSON.stringify(post.category)},
      readTime: ${JSON.stringify(post.readTime)},
      date: ${JSON.stringify(post.date)},
      metaDesc: ${JSON.stringify(post.metaDesc)},
      keywords: ${JSON.stringify(post.keywords)},
      faqs: ${faqsJson},
      render: (slug) => \`${post.bodyHtml.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`
    },`;
}

// ═══════════════════════════════════════════════════════════════════════
//  INJECT INTO BLOG FILE
//  Finds the POSTS = { marker and injects the new post right after it
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
//  UPDATE SITEMAP — appends 4 new <url> blocks
// ═══════════════════════════════════════════════════════════════════════

function updateSitemap(slug) {
  const sitemapPath = 'sitemap.xml';
  if (!fs.existsSync(sitemapPath)) {
    console.warn('  ⚠ sitemap.xml not found — skipping sitemap update');
    return;
  }

  const slugKey = `${slug}__${TODAY}`;
  const files = [
    { file: 'blog.html',    lang: 'en' },
    { file: 'blog-zh.html', lang: 'zh' },
    { file: 'blog-es.html', lang: 'es' },
    { file: 'blog-fr.html', lang: 'fr' },
  ];

  const newBlocks = files.map(({ file, lang }) => {
    const loc = `${BASE_URL}/${file}?p=${slugKey}`;
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="${lang}" href="${loc}"/>
  </url>`;
  }).join('\n');

  let sitemap = fs.readFileSync(sitemapPath, 'utf8');
  sitemap = sitemap.replace('</urlset>', newBlocks + '\n</urlset>');
  fs.writeFileSync(sitemapPath, sitemap, 'utf8');
  console.log('  ✓ sitemap.xml updated with 4 new URLs');
}

// ═══════════════════════════════════════════════════════════════════════
//  LOG RUN
// ═══════════════════════════════════════════════════════════════════════

function logRun(topic) {
  let log = [];
  if (fs.existsSync(LOG_FILE)) {
    try { log = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8')); } catch(e) {}
  }
  log.push({ date: TODAY, slug: topic.slug, merchant: topic.merchant, title: topic.title_en });
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2), 'utf8');
}

// ═══════════════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════════════

function main() {
  console.log('\n🦅 BRIGHTLANE DAILY POST INJECTOR');
  console.log('══════════════════════════════════');
  console.log(`Date: ${TODAY}\n`);

  // Load topics
  if (!fs.existsSync(TOPICS)) {
    console.error('✗ post-topics.json not found. Run with --init to create it.');
    process.exit(1);
  }

  const topicsData = JSON.parse(fs.readFileSync(TOPICS, 'utf8'));
  const pending = topicsData.topics.filter(t => !t.published);

  if (pending.length === 0) {
    console.log('✓ All topics have been published! Add more to post-topics.json.');
    process.exit(0);
  }

  const topic = pending[0];
  console.log(`Topic: ${topic.title_en}`);
  console.log(`Merchant: ${topic.merchant}`);
  console.log(`Slug: ${topic.slug}\n`);

  // Generate posts in all 4 languages
  const posts = generatePost(topic);
  console.log('Generating posts...');

  // Inject into each blog file
  const files = [
    { path: 'blog.html',    post: posts.en, lang: 'en' },
    { path: 'blog-zh.html', post: posts.zh, lang: 'zh' },
    { path: 'blog-es.html', post: posts.es, lang: 'es' },
    { path: 'blog-fr.html', post: posts.fr, lang: 'fr' },
  ];

  let injected = 0;
  for (const { path: filePath, post, lang } of files) {
    const objStr = buildPostObject(post, lang);
    const ok = injectIntoBlog(filePath, objStr);
    if (ok) {
      console.log(`  ✓ Injected into ${filePath}`);
      injected++;
    }
  }

  // Update sitemap
  updateSitemap(topic.slug);

  // Mark topic as published
  const topicIdx = topicsData.topics.findIndex(t => t.slug === topic.slug);
  topicsData.topics[topicIdx].published = true;
  topicsData.topics[topicIdx].published_date = TODAY;
  fs.writeFileSync(TOPICS, JSON.stringify(topicsData, null, 2), 'utf8');

  // Log the run
  logRun(topic);

  console.log(`\n✅ Done! ${injected}/4 blog files updated.`);
  console.log(`\nNext step:`);
  console.log(`  git add . && git commit -m "post: ${topic.title_en}" && git push`);
  console.log(`\nTopics remaining: ${pending.length - 1}`);
  console.log('══════════════════════════════════\n');
}

main();
