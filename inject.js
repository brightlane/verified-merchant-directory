#!/usr/bin/env node
const fs   = require('fs');
const path = require('path');

const BASE     = 'https://brightlane.github.io/verified-merchant-directory';
const LMSS     = path.join(__dirname, 'lmss.txt');
const AFF_FILE = path.join(__dirname, 'affiliate.json');
const OUT_DIR  = path.join(__dirname, 'blog');
const TODAY    = new Date().toISOString().split('T')[0];

const affiliateData = JSON.parse(fs.readFileSync(AFF_FILE, 'utf8'));
const LINKS = {};
affiliateData.affiliates.forEach(a => { LINKS[a.id] = a.url; });

function aff(id, pos, slug, lang) {
  if (!LINKS[id]) { console.warn(`⚠ Unknown affiliate id: "${id}"`); return '#'; }
  const u = new URL(LINKS[id]);
  u.searchParams.set('utm_source',   'brightlane-blog');
  u.searchParams.set('utm_medium',   'affiliate');
  u.searchParams.set('utm_campaign', slug);
  u.searchParams.set('utm_content',  `pos-${pos}-${lang}`);
  return u.toString();
}

const lmss  = JSON.parse(fs.readFileSync(LMSS, 'utf8'));
const topic = lmss.topics.find(t => !t.published);

if (!topic) {
  console.log('✅ All topics published — nothing to inject.');
  process.exit(0);
}

console.log(`🦅 Injecting: ${topic.slug}`);

const SHARED_CSS = `
  :root{--bg:#0a0b0d;--bg2:#111318;--bg3:#1a1d24;--border:rgba(255,255,255,0.07);--border2:rgba(255,255,255,0.13);--text:#e8e9ed;--muted:#8a8d99;--dim:#555866;--accent:#e8ff47;--accent2:#47ffb8;--font-head:'Syne',sans-serif;--font-body:'DM Sans',sans-serif;--radius:12px}
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
  .article-wrap{max-width:780px;margin:0 auto;padding:0 clamp(20px,4vw,60px) 100px}
  .disclosure-banner{background:rgba(232,255,71,0.06);border:1px solid rgba(232,255,71,0.18);border-radius:8px;padding:10px 16px;margin:24px 0 32px;font-size:0.78rem;color:var(--muted);display:flex;align-items:center;gap:8px}
  .disclosure-banner::before{content:'ℹ';color:var(--accent);font-weight:700;flex-shrink:0}
  .post-header{padding:32px 0 48px;border-bottom:1px solid var(--border);margin-bottom:48px}
  .post-cat{display:inline-flex;align-items:center;gap:6px;font-family:var(--font-head);font-size:0.68rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--accent);margin-bottom:16px}
  .post-cat::before{content:'';width:20px;height:2px;background:var(--accent);display:inline-block}
  .post-title{font-family:var(--font-head);font-size:clamp(1.8rem,4vw,3rem);font-weight:800;letter-spacing:-0.03em;line-height:1.1;margin-bottom:20px}
  .post-meta{display:flex;align-items:center;gap:16px;flex-wrap:wrap;font-size:0.78rem;color:var(--dim)}
  .post-meta .sep{color:var(--border2)}
  .updated{color:var(--accent2)}
  .post-body{font-size:1rem;line-height:1.8}
  .post-body p{margin-bottom:24px;color:var(--text)}
  .post-body h2{font-family:var(--font-head);font-size:1.4rem;font-weight:800;letter-spacing:-0.02em;margin:48px 0 20px;padding-bottom:12px;border-bottom:1px solid var(--border)}
  .post-body ul,.post-body ol{padding-left:0;margin-bottom:24px;list-style:none}
  .post-body ul li,.post-body ol li{padding:6px 0 6px 24px;position:relative;font-size:0.95rem;color:var(--muted);border-bottom:1px solid var(--border)}
  .post-body ul li:last-child,.post-body ol li:last-child{border-bottom:none}
  .post-body ul li::before{content:'→';position:absolute;left:0;color:var(--accent);font-weight:700}
  .post-body ol{counter-reset:ol}
  .post-body ol li{counter-increment:ol}
  .post-body ol li::before{content:counter(ol);position:absolute;left:0;color:var(--accent);font-weight:800;font-family:var(--font-head);font-size:0.85rem}
  .post-body strong{color:var(--text);font-weight:500}
  .callout{background:var(--bg2);border:1px solid var(--border2);border-left:3px solid var(--accent);border-radius:var(--radius);padding:20px 24px;margin:32px 0;font-size:0.9rem;color:var(--muted)}
  .callout strong{color:var(--accent);display:block;margin-bottom:6px;font-family:var(--font-head);font-size:0.75rem;letter-spacing:0.08em;text-transform:uppercase}
  .verdict{background:var(--bg2);border:1px solid var(--border2);border-radius:16px;padding:28px;margin:40px 0;position:relative;overflow:hidden}
  .verdict::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 90% 0%,rgba(232,255,71,0.05) 0%,transparent 60%);pointer-events:none}
  .verdict-label{font-family:var(--font-head);font-size:0.65rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--accent);margin-bottom:10px}
  .verdict-title{font-family:var(--font-head);font-size:1.1rem;font-weight:800;margin-bottom:10px}
  .verdict-desc{font-size:0.88rem;color:var(--muted);line-height:1.6;margin-bottom:20px}
  .cta-btn{display:inline-flex;align-items:center;gap:8px;background:var(--accent);color:#0a0b0d;font-family:var(--font-head);font-weight:700;font-size:0.9rem;padding:13px 28px;border-radius:var(--radius);transition:transform .15s,box-shadow .15s;margin-bottom:12px}
  .cta-btn:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(232,255,71,0.25)}
  .cta-btn-outline{display:inline-flex;align-items:center;gap:8px;background:transparent;color:var(--text);font-family:var(--font-head);font-weight:600;font-size:0.9rem;padding:13px 28px;border-radius:var(--radius);border:1px solid var(--border2);transition:border-color .2s;margin-top:8px}
  .cta-btn-outline:hover{border-color:var(--accent)}
  .faq-section{margin:60px 0}
  .faq-section h2{font-family:var(--font-head);font-size:1.3rem;font-weight:800;margin-bottom:24px;letter-spacing:-0.02em}
  .faq-item{border-top:1px solid var(--border)}
  .faq-item:last-child{border-bottom:1px solid var(--border)}
  .faq-q{font-family:var(--font-head);font-weight:600;font-size:0.92rem;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:20px;padding:18px 0;user-select:none}
  .faq-icon{width:22px;height:22px;flex-shrink:0;border:1px solid var(--border2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.9rem;transition:transform .25s;color:var(--accent)}
  .faq-item.open .faq-icon{transform:rotate(45deg)}
  .faq-a{font-size:0.88rem;color:var(--muted);line-height:1.7;max-height:0;overflow:hidden;transition:max-height .35s ease,padding .35s ease}
  .faq-item.open .faq-a{max-height:400px;padding-bottom:18px}
  .lang-switcher{display:flex;gap:8px;margin:20px 0 0;flex-wrap:wrap}
  .lang-btn{font-family:var(--font-head);font-size:0.72rem;font-weight:700;letter-spacing:0.06em;padding:5px 12px;border-radius:6px;border:1px solid var(--border2);color:var(--muted);cursor:pointer;background:transparent;transition:all .15s}
  .lang-btn.active,.lang-btn:hover{background:var(--accent);color:#0a0b0d;border-color:var(--accent)}
  .lang-content{display:none}
  .lang-content.active{display:block}
  @media(max-width:640px){.nav-link{display:none}}
`;

const FONTS = `
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,400&family=DM+Serif+Display&display=swap" rel="stylesheet"/>
`;

const LANGS = ['en','zh','es','fr'];
const LANG_LABELS = { en:'🇺🇸 English', zh:'🇨🇳 中文', es:'🇪🇸 Español', fr:'🇫🇷 Français' };
const FAQ_HEADING = { en:'Frequently Asked Questions', zh:'常见问题', es:'Preguntas Frecuentes', fr:'Questions Fréquentes' };
const DISCLOSURE  = {
  en:'This post contains affiliate links. We may earn a commission if you purchase through our links, at no extra cost to you.',
  zh:'本文包含附属链接。如果您通过我们的链接购买，我们可能会赚取佣金，对您没有额外费用。',
  es:'Este artículo contiene enlaces de afiliados. Podemos ganar una comisión si compras a través de nuestros enlaces, sin costo adicional para ti.',
  fr:'Cet article contient des liens affiliés. Nous pouvons gagner une commission si vous achetez via nos liens, sans frais supplémentaires pour vous.'
};
const DISC_FOOTER = {
  en:'Affiliate Disclosure: This article contains affiliate links. We may earn a commission when you purchase through our links at no additional cost to you. All merchants are verified partners through LinkConnector.',
  zh:'附属声明：本文包含附属链接。通过我们的链接购买时，我们可能会赚取佣金，对您没有额外费用。所有商家均为通过LinkConnector验证的合作伙伴。',
  es:'Divulgación de afiliados: Este artículo contiene enlaces de afiliados. Podemos ganar una comisión cuando compras a través de nuestros enlaces sin costo adicional. Todos los comerciantes son socios verificados a través de LinkConnector.',
  fr:"Divulgation d'affiliation : Cet article contient des liens affiliés. Nous pouvons gagner une commission lorsque vous achetez via nos liens sans frais supplémentaires. Tous les marchands sont des partenaires vérifiés via LinkConnector."
};
const DISC_LABEL = { en:'Affiliate Disclosure', zh:'附属声明', es:'Divulgación', fr:'Divulgation' };

function buildBody(t, lang, slug) {
  const affLink1   = aff(t.merchant, 1, slug, lang);
  const affLink2   = aff(t.merchant, 2, slug, lang);
  const bulletItems = (t[`bullets_${lang}`] || []).map(b => `<li>${b}</li>`).join('');
  const faqItems    = (t[`faqs_${lang}`]   || []).map(f => `
    <div class="faq-item">
      <div class="faq-q" tabindex="0">${f.q}<span class="faq-icon">+</span></div>
      <div class="faq-a">${f.a}</div>
    </div>`).join('');

  return `
    <p>${t[`intro_${lang}`]}</p>
    <div class="callout"><strong>⚡</strong> ${t[`callout_${lang}`]}</div>
    <h2>${t[`h2a_${lang}`]}</h2>
    <p>${t[`body1_${lang}`]}</p>
    <ul>${bulletItems}</ul>
    <div class="verdict">
      <div class="verdict-label">✓ Verdict</div>
      <div class="verdict-title">${t[`verdict_title_${lang}`]}</div>
      <div class="verdict-desc">${t[`verdict_desc_${lang}`]}</div>
      <a href="${affLink1}" class="cta-btn" target="_blank" rel="noopener sponsored">${t[`cta_${lang}`]} →</a><br>
      <a href="${affLink2}" class="cta-btn-outline" target="_blank" rel="noopener sponsored">${t[`cta2_${lang}`]} →</a>
    </div>
    <h2>${t[`h2b_${lang}`]}</h2>
    <p>${t[`body2_${lang}`]}</p>
    <section class="faq-section">
      <h2>${FAQ_HEADING[lang]}</h2>
      ${faqItems}
    </section>
  `;
}

function buildPage(t) {
  const slug    = t.slug;
  const pageUrl = `${BASE}/blog/${slug}.html`;
  const title   = t.title_en;

  const jsonLdArticle = JSON.stringify({
    "@context":"https://schema.org","@type":"Article",
    "headline":title,"description":t.metaDesc_en,"url":pageUrl,
    "datePublished":TODAY,"dateModified":TODAY,
    "author":{"@type":"Organization","name":"Brightlane Verified Merchant Directory"},
    "publisher":{"@type":"Organization","name":"Brightlane","url":`${BASE}/`}
  });

  const jsonLdFaq = JSON.stringify({
    "@context":"https://schema.org","@type":"FAQPage",
    "mainEntity":(t.faqs_en||[]).map(f=>({
      "@type":"Question","name":f.q,
      "acceptedAnswer":{"@type":"Answer","text":f.a}
    }))
  });

  const jsonLdBreadcrumb = JSON.stringify({
    "@context":"https://schema.org","@type":"BreadcrumbList",
    "itemListElement":[
      {"@type":"ListItem","position":1,"name":"Home","item":`${BASE}/`},
      {"@type":"ListItem","position":2,"name":"Blog","item":`${BASE}/blog/`},
      {"@type":"ListItem","position":3,"name":title,"item":pageUrl}
    ]
  });

  const langBtns   = LANGS.map((l,i) => `<button class="lang-btn${i===0?' active':''}" onclick="switchLang('${l}')">${LANG_LABELS[l]}</button>`).join('');
  const langBlocks = LANGS.map((l,i) => `
    <div class="lang-content${i===0?' active':''}" id="lang-${l}">
      <div class="disclosure-banner">${DISCLOSURE[l]}</div>
      <article class="post-body">${buildBody(t,l,slug)}</article>
      <div style="margin-top:48px;padding-top:24px;border-top:1px solid var(--border);font-size:0.75rem;color:var(--dim);line-height:1.6">
        <strong style="color:var(--muted)">${DISC_LABEL[l]}:</strong> ${DISC_FOOTER[l]}
      </div>
    </div>`).join('');

  return `<!DOCTYPE html>
<html lang="en" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title} | Brightlane</title>
  <meta name="description" content="${t.metaDesc_en}"/>
  <meta name="keywords"    content="${t.keywords_en}"/>
  <meta name="robots"      content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"/>
  <meta name="author"      content="Brightlane Verified Merchant Directory"/>
  <link rel="canonical"    href="${pageUrl}"/>
  <meta property="og:type"        content="article"/>
  <meta property="og:site_name"   content="Brightlane Verified Merchant Directory"/>
  <meta property="og:title"       content="${title}"/>
  <meta property="og:description" content="${t.metaDesc_en}"/>
  <meta property="og:url"         content="${pageUrl}"/>
  <meta property="og:image"       content="${BASE}/og-image.png"/>
  <meta property="og:image:width" content="1200"/>
  <meta property="og:image:height"content="630"/>
  <meta property="og:locale"      content="en_US"/>
  <meta name="twitter:card"        content="summary_large_image"/>
  <meta name="twitter:title"       content="${title}"/>
  <meta name="twitter:description" content="${t.metaDesc_en}"/>
  <meta name="twitter:image"       content="${BASE}/og-image.png"/>
  <script type="application/ld+json">${jsonLdArticle}</script>
  <script type="application/ld+json">${jsonLdFaq}</script>
  <script type="application/ld+json">${jsonLdBreadcrumb}</script>
  ${FONTS}
  <style>${SHARED_CSS}</style>
</head>
<body>
  <nav class="nav" role="navigation" aria-label="Main navigation">
    <a href="../index.html" class="nav-logo">Brightlane <span class="nav-badge">✓ Verified</span></a>
    <div class="nav-right">
      <a href="../index.html"           class="nav-link">Directory</a>
      <a href="index.html"              class="nav-link">Blog</a>
      <a href="../index.html#merchants" class="nav-cta">Browse Merchants →</a>
    </div>
  </nav>
  <div class="breadcrumb" aria-label="Breadcrumb">
    <a href="../index.html">Home</a><span>›</span>
    <a href="index.html">Blog</a><span>›</span>
    <span>${t.category_en}</span>
  </div>
  <div class="article-wrap">
    <header class="post-header">
      <div class="post-cat">${t.category_en}</div>
      <h1 class="post-title">${title}</h1>
      <div class="post-meta">
        <span>Brightlane Editorial</span>
        <span class="sep">·</span>
        <span>Published ${TODAY}</span>
        <span class="sep">·</span>
        <span class="updated">Reviewed ${TODAY}</span>
      </div>
      <div class="lang-switcher" role="group" aria-label="Language selector">${langBtns}</div>
    </header>
    ${langBlocks}
  </div>
  <script>
    function switchLang(lang) {
      document.querySelectorAll('.lang-content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.lang-btn').forEach(el => el.classList.remove('active'));
      document.getElementById('lang-' + lang).classList.add('active');
      event.target.classList.add('active');
    }
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
</body>
</html>`;
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const html    = buildPage(topic);
const outFile = path.join(OUT_DIR, `${topic.slug}.html`);
fs.writeFileSync(outFile, html, 'utf8');
console.log(`✓  Written: blog/${topic.slug}.html  (${(html.length/1024).toFixed(0)}KB)`);

topic.published      = true;
topic.published_date = TODAY;
fs.writeFileSync(LMSS, JSON.stringify(lmss, null, 2), 'utf8');
console.log(`✓  Marked published in lmss.txt`);

const remaining = lmss.topics.filter(t => !t.published).length;
console.log(`\n✅ Done — ${remaining} topics remaining in queue`);
