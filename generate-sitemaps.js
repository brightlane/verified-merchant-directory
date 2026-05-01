/**
 * generate-sitemaps.js — verified-merchant-directory
 * Builds per-language sitemaps + sitemap-index.xml
 * Pings Google and IndexNow after every update
 */

import { writeFileSync, readFileSync, readdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir    = dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'https://brightlane.github.io/verified-merchant-directory';
const TODAY    = new Date().toISOString().split('T')[0];
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '';

const KEYWORDS  = JSON.parse(readFileSync(resolve(__dir, 'keywords.json'), 'utf-8'));
const LANG_LIST = KEYWORDS.languages;

// ── Collect all published blog slugs per language ─────────────────────────
function getBlogSlugs(lang) {
  const blogDir = resolve(__dir, 'blog', lang);
  if (!existsSync(blogDir)) return [];
  try {
    return readdirSync(blogDir).filter(f => {
      return existsSync(resolve(blogDir, f, 'index.html'));
    });
  } catch { return []; }
}

// ── Build per-language sitemap ─────────────────────────────────────────────
function buildLangSitemap(lang) {
  const slugs = getBlogSlugs(lang);
  const urls  = [
    `  <url>\n    <loc>${BASE_URL}/blog/${lang}/</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`,
    ...slugs.map(slug =>
      `  <url>\n    <loc>${BASE_URL}/blog/${lang}/${slug}/</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`
    ),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
}

// ── Build main sitemap ─────────────────────────────────────────────────────
function buildMainSitemap() {
  const staticUrls = [
    { loc: `${BASE_URL}/`,           changefreq: 'weekly',  priority: '1.0' },
    { loc: `${BASE_URL}/blog/`,      changefreq: 'daily',   priority: '0.9' },
    { loc: `${BASE_URL}/merchants/`, changefreq: 'weekly',  priority: '0.8' },
    ...LANG_LIST.map(l => ({
      loc: `${BASE_URL}/blog/${l.code}/`,
      changefreq: 'daily',
      priority: '0.8',
    })),
  ];
  const urls = staticUrls.map(u =>
    `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
}

// ── Build sitemap index ────────────────────────────────────────────────────
function buildSitemapIndex() {
  const sitemaps = [
    `  <sitemap>\n    <loc>${BASE_URL}/sitemap-main.xml</loc>\n    <lastmod>${TODAY}</lastmod>\n  </sitemap>`,
    ...LANG_LIST.map(l =>
      `  <sitemap>\n    <loc>${BASE_URL}/sitemap-blog-${l.code}.xml</loc>\n    <lastmod>${TODAY}</lastmod>\n  </sitemap>`
    ),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemaps.join('\n')}\n</sitemapindex>`;
}

// ── Ping IndexNow ─────────────────────────────────────────────────────────
async function pingIndexNow(urls) {
  if (!INDEXNOW_KEY) return;
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: 'brightlane.github.io',
        key: INDEXNOW_KEY,
        keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: urls.slice(0, 10000),
      }),
    });
    console.log(`📡 IndexNow ping: ${res.status}`);
  } catch (err) {
    console.warn('⚠️  IndexNow ping failed:', err.message);
  }
}

// ── Ping Google ───────────────────────────────────────────────────────────
async function pingGoogle() {
  try {
    const res = await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(BASE_URL + '/sitemap-index.xml')}`);
    console.log(`🔍 Google ping: ${res.status}`);
  } catch (err) {
    console.warn('⚠️  Google ping failed:', err.message);
  }
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('🗺️  Generating sitemaps...');

  // Write main sitemap
  writeFileSync(resolve(__dir, 'sitemap-main.xml'), buildMainSitemap(), 'utf-8');
  console.log('✅ sitemap-main.xml');

  // Write per-language sitemaps
  const allUrls = [];
  for (const lang of LANG_LIST) {
    const xml = buildLangSitemap(lang.code);
    writeFileSync(resolve(__dir, `sitemap-blog-${lang.code}.xml`), xml, 'utf-8');
    const slugs = getBlogSlugs(lang.code);
    slugs.forEach(slug => allUrls.push(`${BASE_URL}/blog/${lang.code}/${slug}/`));
    process.stdout.write('.');
  }
  console.log(`\n✅ ${LANG_LIST.length} language sitemaps generated`);

  // Write sitemap index
  writeFileSync(resolve(__dir, 'sitemap-index.xml'), buildSitemapIndex(), 'utf-8');
  console.log('✅ sitemap-index.xml');

  // Ping search engines
  await pingIndexNow(allUrls);
  await pingGoogle();

  console.log(`\n🎉 Sitemaps complete — ${allUrls.length} blog URLs indexed`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
