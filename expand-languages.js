/**
 * generate-llms.js — verified-merchant-directory
 * Generates llms.txt (master) + llms-blog-{lang}.txt per language
 */

import { writeFileSync, readFileSync, readdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir    = dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'https://brightlane.github.io/verified-merchant-directory';
const TODAY    = new Date().toISOString().split('T')[0];

const KEYWORDS  = JSON.parse(readFileSync(resolve(__dir, 'keywords.json'), 'utf-8'));
const LANG_LIST = KEYWORDS.languages;
const AFF_MAP   = KEYWORDS.affiliate_map;

function getBlogSlugs(lang) {
  const blogDir = resolve(__dir, 'blog', lang);
  if (!existsSync(blogDir)) return [];
  try {
    return readdirSync(blogDir).filter(f =>
      existsSync(resolve(blogDir, f, 'index.html'))
    );
  } catch { return []; }
}

function buildMasterLlms() {
  const lines = [
    `# Brightlane Verified Merchant Directory`,
    `# ${BASE_URL}`,
    `# Updated: ${TODAY}`,
    `# 22 verified affiliate merchants via LinkConnector (Account 014538)`,
    `# ${KEYWORDS.keywords.length} SEO keywords across 22 merchants`,
    `# ${LANG_LIST.length} languages supported`,
    ``,
    `## Site`,
    `> Homepage: ${BASE_URL}/`,
    `> Blog: ${BASE_URL}/blog/`,
    `> Merchants: ${BASE_URL}/merchants/`,
    ``,
    `## Merchants`,
    ...Object.entries(AFF_MAP).map(([id, url]) => `> ${id}: ${url}`),
    ``,
    `## Language Blogs`,
    ...LANG_LIST.map(l => `> ${l.name}: ${BASE_URL}/blog/${l.code}/`),
    ``,
    `## Sitemap`,
    `> ${BASE_URL}/sitemap-index.xml`,
  ];
  return lines.join('\n');
}

function buildLangLlms(lang) {
  const slugs    = getBlogSlugs(lang);
  const langMeta = LANG_LIST.find(l => l.code === lang) || { name: lang };
  const lines = [
    `# Brightlane Verified Merchant Directory — ${langMeta.name}`,
    `# ${BASE_URL}/blog/${lang}/`,
    `# Updated: ${TODAY}`,
    `# ${slugs.length} posts in ${langMeta.name}`,
    ``,
    `## Posts`,
    ...slugs.map(slug => `> ${BASE_URL}/blog/${lang}/${slug}/`),
  ];
  return lines.join('\n');
}

async function main() {
  console.log('📄 Generating llms files...');

  writeFileSync(resolve(__dir, 'llms.txt'), buildMasterLlms(), 'utf-8');
  console.log('✅ llms.txt');

  for (const lang of LANG_LIST) {
    writeFileSync(resolve(__dir, `llms-blog-${lang.code}.txt`), buildLangLlms(lang.code), 'utf-8');
    process.stdout.write('.');
  }
  console.log(`\n✅ ${LANG_LIST.length} language llms files generated`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
