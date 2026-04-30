#!/usr/bin/env node
// inject.js — Brightlane LMSS Injector v2
// Reads lmss.txt, picks first unpublished topic,
// auto-translates to 15 languages via Claude API,
// generates one static HTML file per language with hreflang tags,
// marks topic published, saves back.

const fs   = require('fs');
const path = require('path');
const https = require('https');

// ─── Config ──────────────────────────────────────────────────────────────────
const BASE     = 'https://brightlane.github.io/verified-merchant-directory';
const LMSS     = path.join(__dirname, 'lmss.txt');
const AFF_FILE = path.join(__dirname, 'affiliate.json');
const OUT_DIR  = path.join(__dirname, 'blog');
const TODAY    = new Date().toISOString().split('T')[0];

// ─── 15 Languages ────────────────────────────────────────────────────────────
const LANGUAGES = [
  { code: 'en', name: 'English',    flag: '🇺🇸', locale: 'en_US', dir: 'ltr' },
  { code: 'zh', name: '中文',       flag: '🇨🇳', locale: 'zh_CN', dir: 'ltr' },
  { code: 'es', name: 'Español',    flag: '🇪🇸', locale: 'es_ES', dir: 'ltr' },
  { code: 'fr', name: 'Français',   flag: '🇫🇷', locale: 'fr_FR', dir: 'ltr' },
  { code: 'de', name: 'Deutsch',    flag: '🇩🇪', locale: 'de_DE', dir: 'ltr' },
  { code: 'pt', name: 'Português',  flag: '🇧🇷', locale: 'pt_BR', dir: 'ltr' },
  { code: 'ar', name: 'العربية',    flag: '🇸🇦', locale: 'ar_SA', dir: 'rtl' },
  { code: 'hi', name: 'हिन्दी',     flag: '🇮🇳', locale: 'hi_IN', dir: 'ltr' },
  { code: 'ru', name: 'Русский',    flag: '🇷🇺', locale: 'ru_RU', dir: 'ltr' },
  { code: 'ja', name: '日本語',     flag: '🇯🇵', locale: 'ja_JP', dir: 'ltr' },
  { code: 'ko', name: '한국어',     flag: '🇰🇷', locale: 'ko_KR', dir: 'ltr' },
  { code: 'id', name: 'Indonesia',  flag: '🇮🇩', locale: 'id_ID', dir: 'ltr' },
  { code: 'it', name: 'Italiano',   flag: '🇮🇹', locale: 'it_IT', dir: 'ltr' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱', locale: 'nl_NL', dir: 'ltr' },
  { code: 'pl', name: 'Polski',     flag: '🇵🇱', locale: 'pl_PL', dir: 'ltr' },
];

const LANG_MAP = {};
LANGUAGES.forEach(l => { LANG_MAP[l.code] = l; });

// ─── UI strings per language ──────────────────────────────────────────────────
const UI = {
  en: { faq: 'Frequently Asked Questions', disclosure: 'This post contains affiliate links. We may earn a commission if you purchase through our links, at no extra cost to you.', disc_label: 'Affiliate Disclosure', editorial: 'Brightlane Editorial', published: 'Published', reviewed: 'Reviewed', read_in: 'Read in' },
  zh: { faq: '常见问题', disclosure: '本文包含附属链接。如果您通过我们的链接购买，我们可能会赚取佣金，对您没有额外费用。', disc_label: '附属声明', editorial: 'Brightlane编辑部', published: '发布于', reviewed: '审核于', read_in: '阅读语言' },
  es: { faq: 'Preguntas Frecuentes', disclosure: 'Este artículo contiene enlaces de afiliados. Podemos ganar una comisión si compras a través de nuestros enlaces, sin costo adicional para ti.', disc_label: 'Divulgación de Afiliados', editorial: 'Redacción Brightlane', published: 'Publicado', reviewed: 'Revisado', read_in: 'Leer en' },
  fr: { faq: 'Questions Fréquentes', disclosure: "Cet article contient des liens affiliés. Nous pouvons gagner une commission si vous achetez via nos liens, sans frais supplémentaires pour vous.", disc_label: "Divulgation d'Affiliation", editorial: 'Rédaction Brightlane', published: 'Publié', reviewed: 'Révisé', read_in: 'Lire en' },
  de: { faq: 'Häufig gestellte Fragen', disclosure: 'Dieser Artikel enthält Affiliate-Links. Wir erhalten möglicherweise eine Provision, wenn Sie über unsere Links kaufen, ohne zusätzliche Kosten für Sie.', disc_label: 'Affiliate-Offenlegung', editorial: 'Brightlane Redaktion', published: 'Veröffentlicht', reviewed: 'Überprüft', read_in: 'Lesen auf' },
  pt: { faq: 'Perguntas Frequentes', disclosure: 'Este artigo contém links de afiliados. Podemos ganhar uma comissão se você comprar através dos nossos links, sem custo adicional para você.', disc_label: 'Divulgação de Afiliados', editorial: 'Redação Brightlane', published: 'Publicado', reviewed: 'Revisado', read_in: 'Ler em' },
  ar: { faq: 'الأسئلة الشائعة', disclosure: 'يحتوي هذا المقال على روابط تابعة. قد نكسب عمولة إذا اشتريت من خلال روابطنا، دون أي تكلفة إضافية عليك.', disc_label: 'إفصاح الشراكة', editorial: 'تحرير برايتلين', published: 'نُشر', reviewed: 'راجعه', read_in: 'اقرأ بالـ' },
  hi: { faq: 'अक्सर पूछे जाने वाले प्रश्न', disclosure: 'इस पोस्ट में affiliate links हैं। यदि आप हमारे links के माध्यम से खरीदते हैं तो हम commission कमा सकते हैं, आपको कोई अतिरिक्त लागत नहीं।', disc_label: 'Affiliate प्रकटीकरण', editorial: 'Brightlane संपादकीय', published: 'प्रकाशित', reviewed: 'समीक्षित', read_in: 'में पढ़ें' },
  ru: { faq: 'Часто задаваемые вопросы', disclosure: 'Эта статья содержит партнёрские ссылки. Мы можем получить комиссию, если вы совершите покупку по нашим ссылкам, без дополнительных затрат для вас.', disc_label: 'Партнёрское раскрытие', editorial: 'Редакция Brightlane', published: 'Опубликовано', reviewed: 'Проверено', read_in: 'Читать на' },
  ja: { faq: 'よくある質問', disclosure: 'この記事にはアフィリエイトリンクが含まれています。リンクを通じてご購入いただいた場合、追加費用なしでコミッションを受け取る場合があります。', disc_label: 'アフィリエイト開示', editorial: 'Brightlane編集部', published: '公開日', reviewed: 'レビュー日', read_in: '言語で読む' },
  ko: { faq: '자주 묻는 질문', disclosure: '이 게시물에는 제휴 링크가 포함되어 있습니다. 링크를 통해 구매하시면 추가 비용 없이 커미션을 받을 수 있습니다.', disc_label: '제휴 공개', editorial: 'Brightlane 편집부', published: '게시일', reviewed: '검토일', read_in: '언어로 읽기' },
  id: { faq: 'Pertanyaan yang Sering Diajukan', disclosure: 'Artikel ini mengandung tautan afiliasi. Kami mungkin mendapat komisi jika Anda membeli melalui tautan kami, tanpa biaya tambahan untuk Anda.', disc_label: 'Pengungkapan Afiliasi', editorial: 'Redaksi Brightlane', published: 'Diterbitkan', reviewed: 'Ditinjau', read_in: 'Baca dalam' },
  it: { faq: 'Domande Frequenti', disclosure: 'Questo articolo contiene link di affiliazione. Potremmo guadagnare una commissione se acquisti tramite i nostri link, senza costi aggiuntivi per te.', disc_label: 'Informativa sugli Affiliati', editorial: 'Redazione Brightlane', published: 'Pubblicato', reviewed: 'Revisionato', read_in: 'Leggi in' },
  nl: { faq: 'Veelgestelde Vragen', disclosure: 'Dit artikel bevat affiliate links. We kunnen een commissie verdienen als u via onze links koopt, zonder extra kosten voor u.', disc_label: 'Affiliate Openbaarmaking', editorial: 'Brightlane Redactie', published: 'Gepubliceerd', reviewed: 'Beoordeeld', read_in: 'Lees in' },
  pl: { faq: 'Często Zadawane Pytania', disclosure: 'Ten artykuł zawiera linki partnerskie. Możemy zarobić prowizję, jeśli dokonasz zakupu przez nasze linki, bez dodatkowych kosztów dla Ciebie.', disc_label: 'Ujawnienie Partnerskie', editorial: 'Redakcja Brightlane', published: 'Opublikowano', reviewed: 'Sprawdzono', read_in: 'Czytaj w' },
};

// ─── Load affiliate links ─────────────────────────────────────────────────────
const affiliateData = JSON.parse(fs.readFileSync(AFF_FILE, 'utf8'));
const LINKS = {};
affiliateData.affiliates.forEach(a => { LINKS[a.id] = a.url; });

function aff(id, pos, slug, lang) {
  if (!LINKS[id]) { console.warn(`⚠ Unknown affiliate: "${id}"`); return '#'; }
  const u = new URL(LINKS[id]);
  u.searchParams.set('utm_source',   'brightlane-blog');
  u.searchParams.set('utm_medium',   'affiliate');
  u.searchParams.set('utm_campaign', slug);
  u.searchParams.set('utm_content',  `pos-${pos}-${lang}`);
  return u.toString();
}

// ─── Load lmss.txt ────────────────────────────────────────────────────────────
const lmss  = JSON.parse(fs.readFileSync(LMSS, 'utf8'));
const topic = lmss.topics.find(t => !t.published);

if (!topic) {
  console.log('✅ All topics published — nothing to inject.');
  process.exit(0);
}

console.log(`🦅 Injecting: ${topic.slug}`);

// ─── Claude API translation ───────────────────────────────────────────────────
function claudeTranslate(fields, targetLang, targetLangName) {
  return new Promise((resolve, reject) => {
    const prompt = `You are a professional translator. Translate the following JSON fields from English to ${targetLangName} (language code: ${targetLang}).

Rules:
- Translate ALL text values naturally and fluently for native ${targetLangName} speakers
- Keep product names, brand names, and URLs unchanged (Movavi, Filmora, BuildASign, etc.)
- Keep JSON structure exactly the same
- For bullets array, translate each item
- For faqs array, translate both q and a fields
- Return ONLY valid JSON, no markdown, no explanation

JSON to translate:
${JSON.stringify(fields, null, 2)}`;

    const body = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      }
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) { reject(new Error(parsed.error.message)); return; }
          const text = parsed.content[0].text.trim();
          const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
          resolve(JSON.parse(clean));
        } catch(e) {
          reject(new Error(`Parse error for ${targetLang}: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── Build translations for all 15 languages ─────────────────────────────────
async function buildAllTranslations(topic) {
  const englishFields = {
    title:         topic.title_en,
    category:      topic.category_en,
    metaDesc:      topic.metaDesc_en,
    keywords:      topic.keywords_en,
    intro:         topic.intro_en,
    callout:       topic.callout_en,
    h2a:           topic.h2a_en,
    body1:         topic.body1_en,
    bullets:       topic.bullets_en,
    verdict_title: topic.verdict_title_en,
    verdict_desc:  topic.verdict_desc_en,
    h2b:           topic.h2b_en,
    body2:         topic.body2_en,
    cta:           topic.cta_en,
    cta2:          topic.cta2_en,
    faqs:          topic.faqs_en,
  };

  const translations = { en: englishFields };

  // Use existing translations from lmss.txt if available
  const existing = {
    zh: topic.title_zh ? { title: topic.title_zh, category: topic.category_zh, metaDesc: topic.metaDesc_zh, keywords: topic.keywords_zh, intro: topic.intro_zh, callout: topic.callout_zh, h2a: topic.h2a_zh, body1: topic.body1_zh, bullets: topic.bullets_zh, verdict_title: topic.verdict_title_zh, verdict_desc: topic.verdict_desc_zh, h2b: topic.h2b_zh, body2: topic.body2_zh, cta: topic.cta_zh, cta2: topic.cta2_zh, faqs: topic.faqs_zh } : null,
    es: topic.title_es ? { title: topic.title_es, category: topic.category_es, metaDesc: topic.metaDesc_es, keywords: topic.keywords_es, intro: topic.intro_es, callout: topic.callout_es, h2a: topic.h2a_es, body1: topic.body1_es, bullets: topic.bullets_es, verdict_title: topic.verdict_title_es, verdict_desc: topic.verdict_desc_es, h2b: topic.h2b_es, body2: topic.body2_es, cta: topic.cta_es, cta2: topic.cta2_es, faqs: topic.faqs_es } : null,
    fr: topic.title_fr ? { title: topic.title_fr, category: topic.category_fr, metaDesc: topic.metaDesc_fr, keywords: topic.keywords_fr, intro: topic.intro_fr, callout: topic.callout_fr, h2a: topic.h2a_fr, body1: topic.body1_fr, bullets: topic.bullets_fr, verdict_title: topic.verdict_title_fr, verdict_desc: topic.verdict_desc_fr, h2b: topic.h2b_fr, body2: topic.body2_fr, cta: topic.cta_fr, cta2: topic.cta2_fr, faqs: topic.faqs_fr } : null,
  };

  for (const lang of LANGUAGES) {
    if (lang.code === 'en') continue;
    if (existing[lang.code]) {
      console.log(`  ✓ ${lang.code} — using existing translation`);
      translations[lang.code] = existing[lang.code];
    } else {
      console.log(`  🔄 ${lang.code} — translating via Claude API...`);
      try {
        translations[lang.code] = await claudeTranslate(englishFields, lang.code, lang.name);
        console.log(`  ✓ ${lang.code} — done`);
      } catch(e) {
        console.warn(`  ⚠ ${lang.code} — failed (${e.message}), falling back to English`);
        translations[lang.code] = englishFields;
      }
    }
  }

  return translations;
}

// ─── Shared CSS ───────────────────────────────────────────────────────────────
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
  .nav-right{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
  .nav-link{font-size:0.82rem;color:var(--muted);transition:color .2s}
  .nav-link:hover{color:var(--text)}
  .nav-cta{background:var(--accent);color:#0a0b0d;font-family:var(--font-head);font-weight:700;font-size:0.8rem;padding:8px 18px;border-radius:8px;transition:transform .15s,box-shadow .15s}
  .nav-cta:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(232,255,71,0.3)}
  .lang-bar{background:var(--bg2);border-bottom:1px solid var(--border);padding:8px clamp(20px,4vw,60px);display:flex;gap:6px;flex-wrap:wrap;margin-top:64px}
  .lang-pill{font-size:0.72rem;font-family:var(--font-head);font-weight:700;padding:4px 10px;border-radius:20px;border:1px solid var(--border2);color:var(--muted);transition:all .15s;white-space:nowrap}
  .lang-pill:hover,.lang-pill.active{background:var(--accent);color:#0a0b0d;border-color:var(--accent)}
  .breadcrumb{max-width:780px;margin:0 auto;padding:16px clamp(20px,4vw,60px) 0;display:flex;align-items:center;gap:8px;font-size:0.75rem;color:var(--dim)}
  .breadcrumb a{color:var(--dim);transition:color .15s}
  .breadcrumb a:hover{color:var(--accent)}
  .article-wrap{max-width:780px;margin:0 auto;padding:0 clamp(20px,4vw,60px) 100px}
  .disclosure-banner{background:rgba(232,255,71,0.06);border:1px solid rgba(232,255,71,0.18);border-radius:8px;padding:10px 16px;margin:24px 0 32px;font-size:0.78rem;color:var(--muted);display:flex;align-items:center;gap:8px}
  .disclosure-banner::before{content:'ℹ';color:var(--accent);font-weight:700;flex-shrink:0}
  .post-header{padding:32px 0 44px;border-bottom:1px solid var(--border);margin-bottom:44px}
  .post-cat{display:inline-flex;align-items:center;gap:6px;font-family:var(--font-head);font-size:0.68rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--accent);margin-bottom:14px}
  .post-cat::before{content:'';width:20px;height:2px;background:var(--accent);display:inline-block}
  .post-title{font-family:var(--font-head);font-size:clamp(1.8rem,4vw,3rem);font-weight:800;letter-spacing:-0.03em;line-height:1.1;margin-bottom:18px}
  .post-meta{display:flex;align-items:center;gap:14px;flex-wrap:wrap;font-size:0.78rem;color:var(--dim)}
  .post-meta .sep{color:var(--border2)}
  .updated{color:var(--accent2)}
  .post-body{font-size:1rem;line-height:1.85}
  .post-body p{margin-bottom:22px;color:var(--text)}
  .post-body h2{font-family:var(--font-head);font-size:1.35rem;font-weight:800;letter-spacing:-0.02em;margin:44px 0 18px;padding-bottom:12px;border-bottom:1px solid var(--border)}
  .post-body ul,.post-body ol{padding-left:0;margin-bottom:22px;list-style:none}
  .post-body ul li,.post-body ol li{padding:6px 0 6px 26px;position:relative;font-size:0.95rem;color:var(--muted);border-bottom:1px solid var(--border)}
  .post-body ul li:last-child,.post-body ol li:last-child{border-bottom:none}
  .post-body ul li::before{content:'→';position:absolute;left:0;color:var(--accent);font-weight:700}
  .post-body ol{counter-reset:ol}
  .post-body ol li{counter-increment:ol}
  .post-body ol li::before{content:counter(ol);position:absolute;left:0;color:var(--accent);font-weight:800;font-family:var(--font-head);font-size:0.85rem}
  .post-body strong{color:var(--text);font-weight:500}
  .callout{background:var(--bg2);border:1px solid var(--border2);border-left:3px solid var(--accent);border-radius:var(--radius);padding:20px 24px;margin:28px 0;font-size:0.9rem;color:var(--muted)}
  .callout strong{color:var(--accent);display:block;margin-bottom:6px;font-family:var(--font-head);font-size:0.72rem;letter-spacing:0.08em;text-transform:uppercase}
  .verdict{background:var(--bg2);border:1px solid var(--border2);border-radius:16px;padding:26px;margin:36px 0;position:relative;overflow:hidden}
  .verdict::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 90% 0%,rgba(232,255,71,0.05) 0%,transparent 60%);pointer-events:none}
  .verdict-label{font-family:var(--font-head);font-size:0.65rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--accent);margin-bottom:8px}
  .verdict-title{font-family:var(--font-head);font-size:1.1rem;font-weight:800;margin-bottom:10px}
  .verdict-desc{font-size:0.88rem;color:var(--muted);line-height:1.6;margin-bottom:18px}
  .cta-btn{display:inline-flex;align-items:center;gap:8px;background:var(--accent);color:#0a0b0d;font-family:var(--font-head);font-weight:700;font-size:0.9rem;padding:13px 28px;border-radius:var(--radius);transition:transform .15s,box-shadow .15s;margin-bottom:10px}
  .cta-btn:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(232,255,71,0.25)}
  .cta-btn-outline{display:inline-flex;align-items:center;gap:8px;background:transparent;color:var(--text);font-family:var(--font-head);font-weight:600;font-size:0.9rem;padding:13px 28px;border-radius:var(--radius);border:1px solid var(--border2);transition:border-color .2s;margin-top:8px}
  .cta-btn-outline:hover{border-color:var(--accent)}
  .faq-section{margin:56px 0}
  .faq-section h2{font-family:var(--font-head);font-size:1.25rem;font-weight:800;margin-bottom:22px;letter-spacing:-0.02em}
  .faq-item{border-top:1px solid var(--border)}
  .faq-item:last-child{border-bottom:1px solid var(--border)}
  .faq-q{font-family:var(--font-head);font-weight:600;font-size:0.92rem;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:20px;padding:17px 0;user-select:none}
  .faq-icon{width:22px;height:22px;flex-shrink:0;border:1px solid var(--border2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.9rem;transition:transform .25s;color:var(--accent)}
  .faq-item.open .faq-icon{transform:rotate(45deg)}
  .faq-a{font-size:0.88rem;color:var(--muted);line-height:1.7;max-height:0;overflow:hidden;transition:max-height .35s ease,padding .35s ease}
  .faq-item.open .faq-a{max-height:400px;padding-bottom:17px}
  .rtl{direction:rtl;text-align:right}
  .rtl .post-body ul li,.rtl .post-body ol li{padding:6px 26px 6px 0}
  .rtl .post-body ul li::before{left:auto;right:0}
  .rtl .post-body ol li::before{left:auto;right:0}
  .rtl .callout{border-left:none;border-right:3px solid var(--accent)}
  @media(max-width:640px){.nav-link{display:none}}
`;

const FONTS = `
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,400&family=DM+Serif+Display&display=swap" rel="stylesheet"/>
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fileName(slug, lang) {
  return lang === 'en' ? `${slug}.html` : `${slug}-${lang}.html`;
}

function pageUrl(slug, lang) {
  return `${BASE}/blog/${fileName(slug, lang)}`;
}

function buildHreflang(slug) {
  return LANGUAGES.map(l =>
    `  <link rel="alternate" hreflang="${l.code}" href="${pageUrl(slug, l.code)}"/>`
  ).join('\n') +
  `\n  <link rel="alternate" hreflang="x-default" href="${pageUrl(slug, 'en')}"/>`;
}

function buildLangBar(slug, currentLang) {
  return LANGUAGES.map(l => {
    const active = l.code === currentLang ? ' active' : '';
    return `<a href="${fileName(slug, l.code)}" class="lang-pill${active}">${l.flag} ${l.name}</a>`;
  }).join('\n    ');
}

// ─── Build article body ───────────────────────────────────────────────────────
function buildBody(t, lang, slug) {
  const affLink1 = aff(topic.merchant, 1, slug, lang);
  const affLink2 = aff(topic.merchant, 2, slug, lang);
  const ui       = UI[lang] || UI.en;

  const bulletItems = (t.bullets || []).map(b => `<li>${b}</li>`).join('');
  const faqItems    = (t.faqs   || []).map(f => `
    <div class="faq-item">
      <div class="faq-q" tabindex="0">${f.q}<span class="faq-icon">+</span></div>
      <div class="faq-a">${f.a}</div>
    </div>`).join('');

  return `
    <p>${t.intro}</p>
    <div class="callout"><strong>⚡</strong> ${t.callout}</div>
    <h2>${t.h2a}</h2>
    <p>${t.body1}</p>
    <ul>${bulletItems}</ul>
    <div class="verdict">
      <div class="verdict-label">✓ Verdict</div>
      <div class="verdict-title">${t.verdict_title}</div>
      <div class="verdict-desc">${t.verdict_desc}</div>
      <a href="${affLink1}" class="cta-btn" target="_blank" rel="noopener sponsored">${t.cta} →</a><br>
      <a href="${affLink2}" class="cta-btn-outline" target="_blank" rel="noopener sponsored">${t.cta2} →</a>
    </div>
    <h2>${t.h2b}</h2>
    <p>${t.body2}</p>
    <section class="faq-section">
      <h2>${ui.faq}</h2>
      ${faqItems}
    </section>
  `;
}

// ─── Build full HTML page ─────────────────────────────────────────────────────
function buildPage(topic, lang, translations) {
  const slug    = topic.slug;
  const t       = translations[lang];
  const langObj = LANG_MAP[lang];
  const ui      = UI[lang] || UI.en;
  const isRtl   = langObj && langObj.dir === 'rtl';
  const url     = pageUrl(slug, lang);

  const jsonLdArticle = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": t.title,
    "description": t.metaDesc,
    "url": url,
    "datePublished": TODAY,
    "dateModified": TODAY,
    "inLanguage": lang,
    "author": { "@type": "Organization", "name": "Brightlane Verified Merchant Directory" },
    "publisher": { "@type": "Organization", "name": "Brightlane", "url": `${BASE}/` }
  });

  const jsonLdFaq = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": (t.faqs || []).map(f => ({
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
      { "@type": "ListItem", "position": 3, "name": t.title, "item": url }
    ]
  });

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${langObj ? langObj.dir : 'ltr'}" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${t.title} | Brightlane</title>
  <meta name="description"  content="${t.metaDesc}"/>
  <meta name="keywords"     content="${t.keywords}"/>
  <meta name="robots"       content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"/>
  <meta name="author"       content="Brightlane Verified Merchant Directory"/>
  <link rel="canonical"     href="${url}"/>
${buildHreflang(slug)}
  <meta property="og:type"        content="article"/>
  <meta property="og:site_name"   content="Brightlane Verified Merchant Directory"/>
  <meta property="og:title"       content="${t.title}"/>
  <meta property="og:description" content="${t.metaDesc}"/>
  <meta property="og:url"         content="${url}"/>
  <meta property="og:image"       content="${BASE}/og-image.png"/>
  <meta property="og:image:width" content="1200"/>
  <meta property="og:image:height"content="630"/>
  <meta property="og:locale"      content="${langObj ? langObj.locale : 'en_US'}"/>
  <meta name="twitter:card"        content="summary_large_image"/>
  <meta name="twitter:title"       content="${t.title}"/>
  <meta name="twitter:description" content="${t.metaDesc}"/>
  <meta name="twitter:image"       content="${BASE}/og-image.png"/>
  <script type="application/ld+json">${jsonLdArticle}</script>
  <script type="application/ld+json">${jsonLdFaq}</script>
  <script type="application/ld+json">${jsonLdBreadcrumb}</script>
  ${FONTS}
  <style>${SHARED_CSS}</style>
</head>
<body${isRtl ? ' class="rtl"' : ''}>

  <nav class="nav" role="navigation">
    <a href="../index.html" class="nav-logo">Brightlane <span class="nav-badge">✓ Verified</span></a>
    <div class="nav-right">
      <a href="../index.html" class="nav-link">Directory</a>
      <a href="index.html"    class="nav-link">Blog</a>
      <a href="../index.html#merchants" class="nav-cta">Browse →</a>
    </div>
  </nav>

  <div class="lang-bar" role="navigation" aria-label="Language selector">
    ${buildLangBar(slug, lang)}
  </div>

  <div class="breadcrumb">
    <a href="../index.html">Home</a><span>›</span>
    <a href="index.html">Blog</a><span>›</span>
    <span>${t.category}</span>
  </div>

  <div class="article-wrap">

    <div class="disclosure-banner">${ui.disclosure}</div>

    <header class="post-header">
      <div class="post-cat">${t.category}</div>
      <h1 class="post-title">${t.title}</h1>
      <div class="post-meta">
        <span>${ui.editorial}</span>
        <span class="sep">·</span>
        <span>${ui.published} ${TODAY}</span>
        <span class="sep">·</span>
        <span class="updated">${ui.reviewed} ${TODAY}</span>
      </div>
    </header>

    <article class="post-body">
      ${buildBody(t, lang, slug)}
    </article>

    <div style="margin-top:44px;padding-top:22px;border-top:1px solid var(--border);font-size:0.75rem;color:var(--dim);line-height:1.6">
      <strong style="color:var(--muted)">${ui.disc_label}:</strong> ${ui.disclosure}
    </div>

  </div>

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

</body>
</html>`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log(`\n🌍 Building translations for ${LANGUAGES.length} languages...`);
  const translations = await buildAllTranslations(topic);

  console.log(`\n📝 Writing HTML files...`);
  let filesWritten = 0;

  for (const lang of LANGUAGES) {
    const html    = buildPage(topic, lang.code, translations);
    const outFile = path.join(OUT_DIR, fileName(topic.slug, lang.code));
    fs.writeFileSync(outFile, html, 'utf8');
    console.log(`  ✓ ${fileName(topic.slug, lang.code)}  (${(html.length/1024).toFixed(0)}KB)`);
    filesWritten++;
  }

  topic.published       = true;
  topic.published_date  = TODAY;
  topic.files_generated = LANGUAGES.map(l => fileName(topic.slug, l.code));

  fs.writeFileSync(LMSS, JSON.stringify(lmss, null, 2), 'utf8');

  const remaining = lmss.topics.filter(t => !t.published).length;
  console.log(`\n✅ Done — ${filesWritten} files written`);
  console.log(`   ${remaining} topics remaining in queue`);
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
 
