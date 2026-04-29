#!/usr/bin/env node
// generate.js — Brightlane Static Site Generator
// Usage: node generate.js
// Output: dist/ folder with one .html per post + blog.html index

const fs   = require('fs');
const path = require('path');
const { buildPosts, RELATED } = require('./posts.js');

// ─── Load affiliate links from single source of truth ───────────────────────
const affiliateData = JSON.parse(fs.readFileSync('./affiliate.json', 'utf8'));
const LINKS = {};
affiliateData.affiliates.forEach(a => { LINKS[a.id] = a.url; });

// ─── Affiliate link builder (UTM-tagged) ─────────────────────────────────────
function aff(id, pos, slug) {
  if (!LINKS[id]) {
    console.warn(`⚠  Unknown affiliate id: "${id}" in post "${slug}"`);
    return '#';
  }
  const u = new URL(LINKS[id]);
  u.searchParams.set('utm_source',   'brightlane-blog');
  u.searchParams.set('utm_medium',   'affiliate');
  u.searchParams.set('utm_campaign', slug);
  u.searchParams.set('utm_content',  `pos-${pos}`);
  return u.toString();
}

const BASE  = 'https://brightlane.github.io/verified-merchant-directory';
const POSTS  = buildPosts(aff);
const SLUGS  = Object.keys(POSTS);

// ─── Shared CSS ──────────────────────────────────────────────────────────────
const SHARED_CSS = `
  :root {
    --bg:#0a0b0d;--bg2:#111318;--bg3:#1a1d24;
    --border:rgba(255,255,255,0.07);--border2:rgba(255,255,255,0.13);
    --text:#e8e9ed;--muted:#8a8d99;--dim:#555866;
    --accent:#e8ff47;--accent2:#47ffb8;--accent3:#ff6b35;--gold:#f5c842;
    --font-head:'Syne',sans-serif;--font-body:'DM Sans',sans-serif;
    --font-serif:'DM Serif Display',serif;--radius:12px;
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html{scroll-behavior:smooth}
  body{font-family:var(--font-body);background:var(--bg);color:var(--text);line-height:1.7;overflow-x:hidden}
  a{color:inherit;text-decoration:none}
  body::before{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");pointer-events:none;z-index:1000;opacity:.4}
  .nav{position:fixed;top:0;left:0;right:0;z-index:500;display:flex;align-items:center;justify-content:space-between;padding:0 clamp(20px,4vw,60px);height:64px;background:rgba(10,11,13,0.88);backdrop-filter:blur(16px);border-bottom:1px solid var(--border)}
  .nav-logo{font-family:var(--font-head);font-weight:800;font-size:1.05rem;letter-spacing:-0.02em;display:flex;align-items:center;gap:8px}
  .nav-badge{background:var(--accent);color:#0a0b0d;font-size:0.58rem;font-weight:700;letter-spacing:0.08em;padding:2px 7px;border-radius:20px;text-transform:uppercase}
  .nav-right{display:flex;align-items:center;gap:16px}
  .nav-link{font-size:0.82rem;color:var(--muted);transition:color .2s}
  .nav-link:hover{color:var(--text)}
  .nav-cta{background:var(--accent);color:#0a0b0d;font-family:var(--font-head);font-weight:700;font-size:0.8rem;padding:8px 18px;border-radius:8px;transition:transform .15s,box-shadow .15s}
  .nav-cta:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(232,255,71,0.3)}
  .breadcrumb{max-width:780px;margin:0 auto;padding:90px clamp(20px,4vw,60px) 0;display:flex;align-items:center;gap:8px;font-size:0.75rem;color:var(--dim)}
  .breadcrumb a{color:var(--dim);transition:color .15s}
  .breadcrumb a:hover{color:var(--accent)}
  .breadcrumb span{color:var(--dim)}
  .article-wrap{max-width:780px;margin:0 auto;padding:0 clamp(20px,4vw,60px) 100px}
  .disclosure-banner{background:rgba(232,255,71,0.06);border:1px solid rgba(232,255,71,0.18);border-radius:8px;padding:10px 16px;margin:24px 0 32px;font-size:0.78rem;color:var(--muted);display:flex;align-items:center;gap:8px}
  .disclosure-banner::before{content:'ℹ';color:var(--accent);font-weight:700;flex-shrink:0}
  .eeat-box{background:var(--bg2);border:1px solid var(--border);border-left:3px solid var(--accent2);border-radius:var(--radius);padding:16px 20px;margin-bottom:36px;font-size:0.82rem;color:var(--muted);line-height:1.6}
  .eeat-box strong{color:var(--accent2);display:block;margin-bottom:4px;font-family:var(--font-head);font-size:0.68rem;letter-spacing:0.08em;text-transform:uppercase}
  .post-header{padding:32px 0 48px;border-bottom:1px solid var(--border);margin-bottom:48px}
  .post-cat{display:inline-flex;align-items:center;gap:6px;font-family:var(--font-head);font-size:0.68rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--accent);margin-bottom:16px}
  .post-cat::before{content:'';width:20px;height:2px;background:var(--accent);display:inline-block}
  .post-title{font-family:var(--font-head);font-size:clamp(1.8rem,4vw,3rem);font-weight:800;letter-spacing:-0.03em;line-height:1.1;margin-bottom:20px}
  .post-title .hl{color:var(--accent)}
  .post-meta{display:flex;align-items:center;gap:16px;flex-wrap:wrap;font-size:0.78rem;color:var(--dim)}
  .post-meta .sep{color:var(--border2)}
  .read-time{display:flex;align-items:center;gap:4px}
  .updated{color:var(--accent2)}
  .post-body{font-size:1rem;line-height:1.8}
  .post-body p{margin-bottom:24px;color:var(--text)}
  .post-body h2{font-family:var(--font-head);font-size:1.4rem;font-weight:800;letter-spacing:-0.02em;margin:48px 0 20px;padding-bottom:12px;border-bottom:1px solid var(--border)}
  .post-body h3{font-family:var(--font-head);font-size:1.1rem;font-weight:700;margin:32px 0 14px;color:var(--text)}
  .post-body ul,.post-body ol{padding-left:0;margin-bottom:24px;list-style:none}
  .post-body ul li,.post-body ol li{padding:6px 0 6px 24px;position:relative;font-size:0.95rem;color:var(--muted);border-bottom:1px solid var(--border)}
  .post-body ul li:last-child,.post-body ol li:last-child{border-bottom:none}
  .post-body ul li::before{content:'→';position:absolute;left:0;color:var(--accent);font-weight:700}
  .post-body ol{counter-reset:ol}
  .post-body ol li{counter-increment:ol}
  .post-body ol li::before{content:counter(ol);position:absolute;left:0;color:var(--accent);font-weight:800;font-family:var(--font-head);font-size:0.85rem}
  .post-body strong{color:var(--text);font-weight:500}
  .post-body em{font-style:italic;color:var(--muted)}
  .callout{background:var(--bg2);border:1px solid var(--border2);border-left:3px solid var(--accent);border-radius:var(--radius);padding:20px 24px;margin:32px 0;font-size:0.9rem;color:var(--muted)}
  .callout strong{color:var(--accent);display:block;margin-bottom:6px;font-family:var(--font-head);font-size:0.75rem;letter-spacing:0.08em;text-transform:uppercase}
  .verdict{background:var(--bg2);border:1px solid var(--border2);border-radius:16px;padding:28px;margin:40px 0;position:relative;overflow:hidden}
  .verdict::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 90% 0%,rgba(232,255,71,0.05) 0%,transparent 60%);pointer-events:none}
  .verdict-label{font-family:var(--font-head);font-size:0.65rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--accent);margin-bottom:10px}
  .verdict-title{font-family:var(--font-head);font-size:1.1rem;font-weight:800;margin-bottom:10px}
  .verdict-desc{font-size:0.88rem;color:var(--muted);line-height:1.6;margin-bottom:20px}
  .verdict-score{display:flex;gap:24px;margin-bottom:20px;flex-wrap:wrap}
  .score-item{text-align:center}
  .score-num{font-family:var(--font-head);font-size:1.6rem;font-weight:800;color:var(--accent);display:block}
  .score-label{font-size:0.68rem;color:var(--dim);text-transform:uppercase;letter-spacing:0.06em}
  .cta-btn{display:inline-flex;align-items:center;gap:8px;background:var(--accent);color:#0a0b0d;font-family:var(--font-head);font-weight:700;font-size:0.9rem;padding:13px 28px;border-radius:var(--radius);transition:transform .15s,box-shadow .15s}
  .cta-btn:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(232,255,71,0.25)}
  .cta-btn-outline{display:inline-flex;align-items:center;gap:8px;background:transparent;color:var(--text);font-family:var(--font-head);font-weight:600;font-size:0.9rem;padding:13px 28px;border-radius:var(--radius);border:1px solid var(--border2);transition:border-color .2s}
  .cta-btn-outline:hover{border-color:var(--accent)}
  .comp-table{width:100%;border-collapse:collapse;margin:32px 0;font-size:0.88rem}
  .comp-table thead tr{background:var(--bg3)}
  .comp-table th{padding:12px 16px;text-align:left;font-family:var(--font-head);font-size:0.68rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--border2)}
  .comp-table td{padding:12px 16px;border-bottom:1px solid var(--border);color:var(--muted);vertical-align:middle}
  .comp-table tr:hover td{background:rgba(255,255,255,0.02)}
  .comp-table tr.winner td{background:rgba(232,255,71,0.04)}
  .comp-table tr.winner td:first-child{border-left:2px solid var(--accent)}
  .comp-table .badge-winner{background:rgba(232,255,71,0.12);color:var(--accent);font-size:0.65rem;font-weight:700;padding:2px 8px;border-radius:10px;font-family:var(--font-head);letter-spacing:0.05em;text-transform:uppercase;margin-left:6px}
  .comp-table .check{color:var(--accent2);font-weight:700}
  .comp-table .cross{color:var(--dim)}
  .comp-table td strong{color:var(--text)}
  .comp-table a{color:var(--accent);text-decoration:underline;text-underline-offset:3px}
  .pros-cons{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:28px 0}
  @media(max-width:600px){.pros-cons{grid-template-columns:1fr}}
  .pros,.cons{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);padding:20px}
  .pros{border-top:2px solid var(--accent2)}
  .cons{border-top:2px solid rgba(255,71,87,0.5)}
  .pros h4,.cons h4{font-family:var(--font-head);font-size:0.72rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:14px}
  .pros h4{color:var(--accent2)}
  .cons h4{color:rgba(255,71,87,0.8)}
  .pros ul li::before{content:'✓';color:var(--accent2)}
  .cons ul li::before{content:'✗';color:rgba(255,71,87,0.7)}
  .faq-section{margin:60px 0}
  .faq-section h2{font-family:var(--font-head);font-size:1.3rem;font-weight:800;margin-bottom:24px;letter-spacing:-0.02em}
  .faq-item{border-top:1px solid var(--border)}
  .faq-item:last-child{border-bottom:1px solid var(--border)}
  .faq-q{font-family:var(--font-head);font-weight:600;font-size:0.92rem;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:20px;padding:18px 0;user-select:none}
  .faq-icon{width:22px;height:22px;flex-shrink:0;border:1px solid var(--border2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.9rem;transition:transform .25s;color:var(--accent)}
  .faq-item.open .faq-icon{transform:rotate(45deg)}
  .faq-a{font-size:0.88rem;color:var(--muted);line-height:1.7;max-height:0;overflow:hidden;transition:max-height .35s ease,padding .35s ease}
  .faq-item.open .faq-a{max-height:400px;padding-bottom:18px}
  .related{margin:60px 0 0;padding-top:40px;border-top:1px solid var(--border)}
  .related h2{font-family:var(--font-head);font-weight:700;letter-spacing:-0.01em;margin-bottom:20px;color:var(--muted);text-transform:uppercase;font-size:0.72rem;letter-spacing:0.1em}
  .related-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
  .related-card{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);padding:18px;transition:border-color .15s,transform .15s;cursor:pointer;display:block}
  .related-card:hover{border-color:var(--border2);transform:translateY(-2px)}
  .related-cat{font-size:0.65rem;color:var(--accent);font-family:var(--font-head);font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px}
  .related-title{font-family:var(--font-head);font-size:0.88rem;font-weight:700;line-height:1.3;color:var(--text)}
  .blog-index{max-width:960px;margin:0 auto;padding:clamp(90px,10vw,120px) clamp(20px,4vw,60px) 100px}
  .blog-index-header{margin-bottom:48px}
  .blog-index-header h1{font-family:var(--font-head);font-size:clamp(2rem,5vw,3.5rem);font-weight:800;letter-spacing:-0.03em;margin-bottom:12px}
  .blog-index-header p{color:var(--muted);font-size:1rem}
  .post-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
  .post-card{background:var(--bg2);border:1px solid var(--border);border-radius:16px;padding:24px;transition:border-color .2s,transform .2s;display:flex;flex-direction:column;gap:12px}
  .post-card:hover{border-color:var(--border2);transform:translateY(-3px)}
  .post-card-cat{font-size:0.65rem;color:var(--accent);font-family:var(--font-head);font-weight:700;letter-spacing:0.1em;text-transform:uppercase}
  .post-card-title{font-family:var(--font-head);font-size:1rem;font-weight:700;letter-spacing:-0.01em;line-height:1.3}
  .post-card-desc{font-size:0.82rem;color:var(--muted);line-height:1.5;flex:1}
  .post-card-meta{font-size:0.72rem;color:var(--dim);display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px solid var(--border)}
  .post-card-read{color:var(--accent);font-family:var(--font-head);font-weight:700;font-size:0.72rem}
  @media(max-width:640px){.nav-link{display:none}}
`;

const FONTS = `
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,400&family=DM+Serif+Display&display=swap" rel="stylesheet"/>
`;

const NAV = `
  <nav class="nav" role="navigation" aria-label="Main navigation">
    <a href="../index.html" class="nav-logo">Brightlane <span class="nav-badge">✓ Verified</span></a>
    <div class="nav-right">
      <a href="../index.html"  class="nav-link">Directory</a>
      <a href="index.html"     class="nav-link">Blog</a>
      <a href="../index.html#merchants" class="nav-cta">Browse Merchants →</a>
    </div>
  </nav>
`;

const FAQ_JS = `
  <script>
    document.querySelectorAll('.faq-q').forEach(q => {
      q.addEventListener('click', () => {
        const item = q.closest('.faq-item');
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
      q.addEventListener('keydown', e => { if(e.key==='Enter'||e.key===' ') q.click(); });
    });
  </script>
`;

// ─── Generate one post HTML file ─────────────────────────────────────────────
function generatePost(slug, post) {
  const pageUrl = `${BASE}/blog/${slug}.html`;

  const relatedSlugs = RELATED[slug] || [];
  const relatedHTML = relatedSlugs.map(rs => {
    const rp = POSTS[rs];
    if (!rp) return '';
    return `<a href="${rs}.html" class="related-card">
      <div class="related-cat">${rp.category}</div>
      <div class="related-title">${rp.title}</div>
    </a>`;
  }).join('');

  const faqHTML = post.faqs.map(f => `
    <div class="faq-item">
      <div class="faq-q" tabindex="0">${f.q}<span class="faq-icon">+</span></div>
      <div class="faq-a">${f.a}</div>
    </div>`).join('');

  const jsonLdArticle = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.metaDesc,
    "url": pageUrl,
    "datePublished": post.date,
    "dateModified": post.lastReviewed,
    "author": { "@type": "Organization", "name": "Brightlane Verified Merchant Directory" },
    "publisher": { "@type": "Organization", "name": "Brightlane", "url": `${BASE}/` }
  });

  const jsonLdFaq = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": post.faqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a }
    }))
  });

  const jsonLdBreadcrumb = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home",  "item": `${BASE}/` },
      { "@type": "ListItem", "position": 2, "name": "Blog",  "item": `${BASE}/blog/` },
      { "@type": "ListItem", "position": 3, "name": post.title, "item": pageUrl }
    ]
  });

  return `<!DOCTYPE html>
<html lang="en" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${post.title} | Brightlane</title>
  <meta name="description"  content="${post.metaDesc}"/>
  <meta name="keywords"     content="${post.keywords}"/>
  <meta name="robots"       content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"/>
  <meta name="author"       content="Brightlane Verified Merchant Directory"/>
  <link rel="canonical"     href="${pageUrl}"/>
  <meta property="og:type"        content="article"/>
  <meta property="og:site_name"   content="Brightlane Verified Merchant Directory"/>
  <meta property="og:title"       content="${post.title}"/>
  <meta property="og:description" content="${post.metaDesc}"/>
  <meta property="og:url"         content="${pageUrl}"/>
  <meta property="og:image"       content="${BASE}/og-image.png"/>
  <meta property="og:image:width" content="1200"/>
  <meta property="og:image:height"content="630"/>
  <meta property="og:locale"      content="en_US"/>
  <meta name="twitter:card"        content="summary_large_image"/>
  <meta name="twitter:title"       content="${post.title}"/>
  <meta name="twitter:description" content="${post.metaDesc}"/>
  <meta name="twitter:image"       content="${BASE}/og-image.png"/>
  <script type="application/ld+json">${jsonLdArticle}</script>
  <script type="application/ld+json">${jsonLdFaq}</script>
  <script type="application/ld+json">${jsonLdBreadcrumb}</script>
  ${FONTS}
  <style>${SHARED_CSS}</style>
</head>
<body>
  ${NAV}

  <div class="breadcrumb" aria-label="Breadcrumb">
    <a href="../index.html">Home</a>
    <span>›</span>
    <a href="index.html">Blog</a>
    <span>›</span>
    <span>${post.category}</span>
  </div>

  <div class="article-wrap">

    <div class="disclosure-banner">
      This post contains affiliate links. We may earn a commission if you purchase through our links, at no extra cost to you. <a href="../index.html#disclosure" style="color:var(--accent);margin-left:4px">Learn more</a>
    </div>

    <header class="post-header">
      <div class="post-cat">${post.category}</div>
      <h1 class="post-title">
        <span class="hl">${post.titleHl}</span> ${post.titleRest}
      </h1>
      <div class="post-meta">
        <span>Brightlane Editorial</span>
        <span class="sep">·</span>
        <span class="read-time">⏱ ${post.readTime}</span>
        <span class="sep">·</span>
        <span>Published ${post.date}</span>
        <span class="sep">·</span>
        <span class="updated">Reviewed ${post.lastReviewed}</span>
      </div>
    </header>

    <div class="eeat-box">
      <strong>How we reviewed this</strong>
      ${post.eeat}
    </div>

    <article class="post-body">
      ${post.render(aff)}
    </article>

    <section class="faq-section" aria-labelledby="faq-h">
      <h2 id="faq-h">Frequently Asked Questions</h2>
      ${faqHTML}
    </section>

    <div class="related">
      <h2>Related Articles</h2>
      <div class="related-grid">${relatedHTML}</div>
    </div>

    <div style="margin-top:48px;padding-top:24px;border-top:1px solid var(--border);font-size:0.75rem;color:var(--dim);line-height:1.6">
      <strong style="color:var(--muted)">Affiliate Disclosure:</strong> This article contains affiliate links. We may earn a commission when you purchase through our links at no additional cost to you. All merchants are verified partners through LinkConnector.
    </div>

  </div>

  ${FAQ_JS}
</body>
</html>`;
}

// ─── Generate blog index ──────────────────────────────────────────────────────
function generateIndex() {
  const cards = SLUGS.map(slug => {
    const post = POSTS[slug];
    return `<a href="${slug}.html" class="post-card">
      <div class="post-card-cat">${post.category}</div>
      <div class="post-card-title">${post.title}</div>
      <div class="post-card-desc">${post.metaDesc}</div>
      <div class="post-card-meta">
        <span>${post.readTime} · ${post.date}</span>
        <span class="post-card-read">Read →</span>
      </div>
    </a>`;
  }).join('\n');

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Brightlane Blog",
    "url": `${BASE}/blog/`,
    "description": "Honest buyer guides and product comparisons with verified affiliate links.",
    "publisher": { "@type": "Organization", "name": "Brightlane", "url": `${BASE}/` }
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Blog — Brightlane Verified Merchant Directory</title>
  <meta name="description" content="Honest buyer guides and product comparisons with verified affiliate links to the best prices."/>
  <meta name="robots" content="index, follow"/>
  <link rel="canonical" href="${BASE}/blog/"/>
  <script type="application/ld+json">${jsonLd}</script>
  ${FONTS}
  <style>${SHARED_CSS}</style>
</head>
<body>
  <nav class="nav" role="navigation" aria-label="Main navigation">
    <a href="../index.html" class="nav-logo">Brightlane <span class="nav-badge">✓ Verified</span></a>
    <div class="nav-right">
      <a href="../index.html"  class="nav-link">Directory</a>
      <a href="index.html"     class="nav-link">Blog</a>
      <a href="../index.html#merchants" class="nav-cta">Browse Merchants →</a>
    </div>
  </nav>
  <div class="blog-index">
    <div class="blog-index-header">
      <div style="font-family:var(--font-head);font-size:0.7rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--accent);margin-bottom:10px">Brightlane Blog</div>
      <h1>Buyer Guides &amp; Reviews</h1>
      <p>Honest reviews and comparisons to help you find the right product — with verified affiliate links to the best prices.</p>
    </div>
    <div class="post-grid">${cards}</div>
  </div>
</body>
</html>`;
}

// ─── Write files ──────────────────────────────────────────────────────────────
const outDir = path.join(__dirname, 'dist');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

let generated = 0;
SLUGS.forEach(slug => {
  const html = generatePost(slug, POSTS[slug]);
  const outPath = path.join(outDir, `${slug}.html`);
  fs.writeFileSync(outPath, html, 'utf8');
  console.log(`✓  ${slug}.html  (${(html.length/1024).toFixed(0)}KB)`);
  generated++;
});

const indexHtml = generateIndex();
fs.writeFileSync(path.join(outDir, 'index.html'), indexHtml, 'utf8');
console.log(`✓  index.html  (${(indexHtml.length/1024).toFixed(0)}KB)`);

console.log(`\n✅ Generated ${generated} posts + index → dist/`);
console.log(`   Affiliate links loaded from affiliate.json (${affiliateData.affiliates.length} merchants)`);

// ─── Sanity check: warn about unused affiliates ───────────────────────────────
const usedIds = new Set();
SLUGS.forEach(slug => {
  const html = generatePost(slug, POSTS[slug]);
  affiliateData.affiliates.forEach(a => {
    if (html.includes(a.id)) usedIds.add(a.id);
  });
});
const unusedIds = affiliateData.affiliates.map(a => a.id).filter(id => !usedIds.has(id));
if (unusedIds.length) {
  console.log(`\n⚠  Affiliates with no posts yet: ${unusedIds.join(', ')}`);
}
