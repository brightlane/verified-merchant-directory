// ═══════════════════════════════════════════════════════════════════════
//  UPDATE SITEMAP — appends 4 new <url> blocks with correct hreflang
//  FIX: each language points to its own blog-xx.html file, not ?hl= param
//  FIX: all 4 variants cross-reference each other + x-default → English
// ═══════════════════════════════════════════════════════════════════════

function updateSitemap(slug) {
  const sitemapPath = 'sitemap.xml';
  if (!fs.existsSync(sitemapPath)) {
    console.warn('  ⚠ sitemap.xml not found — skipping sitemap update');
    return;
  }

  const slugKey = `${slug}__${TODAY}`;

  // The 4 blog language files — each gets its own <url> block
  const blogFiles = [
    { file: 'blog.html',    lang: 'en' },
    { file: 'blog-zh.html', lang: 'zh' },
    { file: 'blog-es.html', lang: 'es' },
    { file: 'blog-fr.html', lang: 'fr' },
  ];

  // Pre-build the canonical URL for each language variant
  const variants = blogFiles.map(({ file, lang }) => ({
    lang,
    url: `${BASE_URL}/${file}?p=${slugKey}`
  }));

  // Build one <url> block per language file
  // Every block cross-references ALL 4 variants + x-default → English
  const newBlocks = variants.map(({ lang, url }) => {
    // x-default always points to English
    const xdefault = variants.find(v => v.lang === 'en').url;

    const links = [
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${xdefault}"/>`,
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

  console.log('  ✓ sitemap.xml updated — 4 URL blocks, correct hreflang cross-references');
}
