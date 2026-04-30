#!/usr/bin/env node
// inject.js — Brightlane LMSS Injector v3 — Full Enterprise SEO
// Every page generated has:
//   - Region hreflang pairs (en-us, en-gb, pt-br, zh-tw, zh-cn etc.)
//   - Stacked JSON-LD: SoftwareApplication/Product/Course + Organization + FAQPage + BreadcrumbList
//   - AggregateRating schema for star snippets
//   - Full OG suite with 8 locale alternates
//   - Twitter Card large image
//   - robots max-image-preview:large
//   - Semantic h1→h2→h3 hierarchy
//   - Aria labels on all interactive elements
//   - Sticky nav CTA
//   - Social proof inline
//   - UTM per position AND per language
//   - Publisher schema with logo
//   - Disclosure above first affiliate link

const fs    = require('fs');
const path  = require('path');
const https = require('https');

const BASE     = 'https://brightlane.github.io/verified-merchant-directory';
const LMSS     = path.join(__dirname, 'lmss.txt');
const AFF_FILE = path.join(__dirname, 'affiliate.json');
const OUT_DIR  = path.join(__dirname, 'blog');
const TODAY    = new Date().toISOString().split('T')[0];

// ─── 15 Languages with region pairs ──────────────────────────────────────────
const LANGUAGES = [
  { code: 'en', name: 'English',    flag: '🇺🇸', locale: 'en_US', dir: 'ltr',
    regions: ['en-us', 'en-gb', 'en-au', 'en-ca'] },
  { code: 'zh', name: '中文',       flag: '🇨🇳', locale: 'zh_CN', dir: 'ltr',
    regions: ['zh-cn', 'zh-tw', 'zh-hk'] },
  { code: 'es', name: 'Español',    flag: '🇪🇸', locale: 'es_ES', dir: 'ltr',
    regions: ['es', 'es-mx', 'es-ar', 'es-co'] },
  { code: 'fr', name: 'Français',   flag: '🇫🇷', locale: 'fr_FR', dir: 'ltr',
    regions: ['fr', 'fr-ca', 'fr-be', 'fr-ch'] },
  { code: 'de', name: 'Deutsch',    flag: '🇩🇪', locale: 'de_DE', dir: 'ltr',
    regions: ['de', 'de-at', 'de-ch'] },
  { code: 'pt', name: 'Português',  flag: '🇧🇷', locale: 'pt_BR', dir: 'ltr',
    regions: ['pt-br', 'pt'] },
  { code: 'ar', name: 'العربية',    flag: '🇸🇦', locale: 'ar_SA', dir: 'rtl',
    regions: ['ar', 'ar-sa', 'ar-ae', 'ar-eg'] },
  { code: 'hi', name: 'हिन्दी',     flag: '🇮🇳', locale: 'hi_IN', dir: 'ltr',
    regions: ['hi'] },
  { code: 'ru', name: 'Русский',    flag: '🇷🇺', locale: 'ru_RU', dir: 'ltr',
    regions: ['ru'] },
  { code: 'ja', name: '日本語',     flag: '🇯🇵', locale: 'ja_JP', dir: 'ltr',
    regions: ['ja'] },
  { code: 'ko', name: '한국어',     flag: '🇰🇷', locale: 'ko_KR', dir: 'ltr',
    regions: ['ko'] },
  { code: 'id', name: 'Indonesia',  flag: '🇮🇩', locale: 'id_ID', dir: 'ltr',
    regions: ['id'] },
  { code: 'it', name: 'Italiano',   flag: '🇮🇹', locale: 'it_IT', dir: 'ltr',
    regions: ['it'] },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱', locale: 'nl_NL', dir: 'ltr',
    regions: ['nl', 'nl-be'] },
  { code: 'pl', name: 'Polski',     flag: '🇵🇱', locale: 'pl_PL', dir: 'ltr',
    regions: ['pl'] },
];

const LANG_MAP = {};
LANGUAGES.forEach(l => { LANG_MAP[l.code] = l; });

// ─── Merchant schema types and social proof ───────────────────────────────────
const MERCHANT_META = {
  movavi:           { schemaType: 'SoftwareApplication', rating: 4.6, ratingCount: 12847, category: 'MultimediaApplication', proof: '15M+ users worldwide' },
  iskysoft:         { schemaType: 'SoftwareApplication', rating: 4.5, ratingCount: 8934,  category: 'MultimediaApplication', proof: '10M+ downloads' },
  tenorshare:       { schemaType: 'SoftwareApplication', rating: 4.7, ratingCount: 15234, category: 'MobileApplication',     proof: '50M+ users trust Tenorshare' },
  wondershare:      { schemaType: 'SoftwareApplication', rating: 4.6, ratingCount: 21456, category: 'MultimediaApplication', proof: '100M+ users globally' },
  appypie:          { schemaType: 'SoftwareApplication', rating: 4.5, ratingCount: 9823,  category: 'BusinessApplication',   proof: '10M+ apps created' },
  knowledgehut:     { schemaType: 'Course',              rating: 4.7, ratingCount: 6734,  category: 'Education',             proof: '500K+ professionals trained' },
  pmtraining:       { schemaType: 'Course',              rating: 4.8, ratingCount: 4521,  category: 'Education',             proof: '98% first-time pass rate' },
  cpraedcourse:     { schemaType: 'Course',              rating: 4.8, ratingCount: 7823,  category: 'Education',             proof: '500K+ certifications issued' },
  cprcare:          { schemaType: 'Course',              rating: 4.7, ratingCount: 5234,  category: 'Education',             proof: 'Trusted by 10,000+ organizations' },
  ahca:             { schemaType: 'Course',              rating: 4.6, ratingCount: 3456,  category: 'Education',             proof: 'OSHA and HIPAA compliant training' },
  discountpetcare:  { schemaType: 'Product',             rating: 4.7, ratingCount: 11234, category: 'PetCare',               proof: 'Same FDA-approved medications, 30-50% less' },
  canadapetcare:    { schemaType: 'Product',             rating: 4.6, ratingCount: 4532,  category: 'PetCare',               proof: 'Licensed Health Canada pharmacy' },
  buildasign:       { schemaType: 'Product',             rating: 4.6, ratingCount: 18923, category: 'PrintService',          proof: '10M+ signs produced' },
  easycanvasprints: { schemaType: 'Product',             rating: 4.7, ratingCount: 9234,  category: 'PrintService',          proof: 'Premium gallery-quality prints' },
  canvasdiscount:   { schemaType: 'Product',             rating: 4.5, ratingCount: 7823,  category: 'PrintService',          proof: 'Archival inks rated 75+ years' },
  canvasonthecheap: { schemaType: 'Product',             rating: 4.5, ratingCount: 8934,  category: 'PrintService',          proof: 'Up to 70% off — genuine canvas quality' },
  infinitealoe:     { schemaType: 'Product',             rating: 4.8, ratingCount: 3456,  category: 'HealthProduct',         proof: 'Organic aloe vera — fragrance-free formula' },
  littletoe:        { schemaType: 'Product',             rating: 4.6, ratingCount: 2834,  category: 'HealthProduct',         proof: 'Medical-grade orthopedic materials' },
  combatflipflops:  { schemaType: 'Product',             rating: 4.8, ratingCount: 2134,  category: 'Footwear',              proof: 'Founded by US Army Rangers' },
  halloweencostumes:{ schemaType: 'Product',             rating: 4.6, ratingCount: 24567, category: 'Clothing',              proof: '10,000+ costumes — guaranteed delivery' },
  shoplww:          { schemaType: 'Book',                rating: 4.8, ratingCount: 5634,  category: 'EducationalMaterial',   proof: '200+ years of medical publishing' },
  bgmgirl:          { schemaType: 'MusicRecording',      rating: 4.7, ratingCount: 3234,  category: 'Music',                 proof: 'Licensed for YouTube, Twitch, and podcasts' },
  lafuent:          { schemaType: 'Product',             rating: 4.5, ratingCount: 6823,  category: 'AutoPart',              proof: 'OEM and aftermarket — global shipping' },
  taxextension:     { schemaType: 'FinancialProduct',    rating: 4.7, ratingCount: 4234,  category: 'TaxService',            proof: 'IRS-compliant Form 4868 filing' },
};

// ─── UI strings per language ──────────────────────────────────────────────────
const UI = {
  en: { faq: 'Frequently Asked Questions', disclosure: 'This post contains affiliate links. We may earn a commission if you purchase through our links, at no extra cost to you. All merchants are verified partners.', disc_label: 'Affiliate Disclosure', editorial: 'Brightlane Editorial Team', published: 'Published', updated: 'Updated', read_time: 'min read', verified: 'Verified', top_pick: 'Top Pick', our_verdict: 'Our Verdict', read_in: 'Read in' },
  zh: { faq: '常见问题', disclosure: '本文包含附属链接。如果您通过我们的链接购买，我们可能会赚取佣金，对您没有额外费用。所有商家均为经过验证的合作伙伴。', disc_label: '附属声明', editorial: 'Brightlane编辑团队', published: '发布于', updated: '更新于', read_time: '分钟阅读', verified: '已验证', top_pick: '首选', our_verdict: '我们的评价', read_in: '阅读语言' },
  es: { faq: 'Preguntas Frecuentes', disclosure: 'Este artículo contiene enlaces de afiliados. Podemos ganar una comisión si compras a través de nuestros enlaces, sin costo adicional para ti. Todos los comerciantes son socios verificados.', disc_label: 'Divulgación de Afiliados', editorial: 'Equipo Editorial Brightlane', published: 'Publicado', updated: 'Actualizado', read_time: 'min de lectura', verified: 'Verificado', top_pick: 'Mejor Opción', our_verdict: 'Nuestro Veredicto', read_in: 'Leer en' },
  fr: { faq: 'Questions Fréquentes', disclosure: "Cet article contient des liens affiliés. Nous pouvons gagner une commission si vous achetez via nos liens, sans frais supplémentaires pour vous. Tous les marchands sont des partenaires vérifiés.", disc_label: "Divulgation d'Affiliation", editorial: 'Équipe Éditoriale Brightlane', published: 'Publié', updated: 'Mis à jour', read_time: 'min de lecture', verified: 'Vérifié', top_pick: 'Meilleur Choix', our_verdict: 'Notre Verdict', read_in: 'Lire en' },
  de: { faq: 'Häufig gestellte Fragen', disclosure: 'Dieser Artikel enthält Affiliate-Links. Wir erhalten möglicherweise eine Provision, wenn Sie über unsere Links kaufen, ohne zusätzliche Kosten für Sie. Alle Händler sind verifizierte Partner.', disc_label: 'Affiliate-Offenlegung', editorial: 'Brightlane Redaktionsteam', published: 'Veröffentlicht', updated: 'Aktualisiert', read_time: 'Min. Lesezeit', verified: 'Verifiziert', top_pick: 'Top-Auswahl', our_verdict: 'Unser Urteil', read_in: 'Lesen auf' },
  pt: { faq: 'Perguntas Frequentes', disclosure: 'Este artigo contém links de afiliados. Podemos ganhar uma comissão se você comprar através dos nossos links, sem custo adicional para você. Todos os comerciantes são parceiros verificados.', disc_label: 'Divulgação de Afiliados', editorial: 'Equipe Editorial Brightlane', published: 'Publicado', updated: 'Atualizado', read_time: 'min de leitura', verified: 'Verificado', top_pick: 'Melhor Escolha', our_verdict: 'Nosso Veredicto', read_in: 'Ler em' },
  ar: { faq: 'الأسئلة الشائعة', disclosure: 'يحتوي هذا المقال على روابط تابعة. قد نكسب عمولة إذا اشتريت من خلال روابطنا، دون أي تكلفة إضافية عليك. جميع التجار شركاء معتمدون.', disc_label: 'إفصاح الشراكة', editorial: 'فريق تحرير برايتلين', published: 'نُشر', updated: 'تم التحديث', read_time: 'دقيقة قراءة', verified: 'موثق', top_pick: 'الأفضل', our_verdict: 'حكمنا', read_in: 'اقرأ بالـ' },
  hi: { faq: 'अक्सर पूछे जाने वाले प्रश्न', disclosure: 'इस पोस्ट में affiliate links हैं। यदि आप हमारे links के माध्यम से खरीदते हैं तो हम commission कमा सकते हैं, आपको कोई अतिरिक्त लागत नहीं। सभी merchants verified partners हैं।', disc_label: 'Affiliate प्रकटीकरण', editorial: 'Brightlane संपादकीय टीम', published: 'प्रकाशित', updated: 'अपडेट किया', read_time: 'मिनट पढ़ें', verified: 'सत्यापित', top_pick: 'शीर्ष चयन', our_verdict: 'हमारा फैसला', read_in: 'में पढ़ें' },
  ru: { faq: 'Часто задаваемые вопросы', disclosure: 'Эта статья содержит партнёрские ссылки. Мы можем получить комиссию, если вы совершите покупку по нашим ссылкам, без дополнительных затрат для вас. Все продавцы — проверенные партнёры.', disc_label: 'Партнёрское раскрытие', editorial: 'Редакция Brightlane', published: 'Опубликовано', updated: 'Обновлено', read_time: 'мин чтения', verified: 'Проверено', top_pick: 'Лучший выбор', our_verdict: 'Наш вердикт', read_in: 'Читать на' },
  ja: { faq: 'よくある質問', disclosure: 'この記事にはアフィリエイトリンクが含まれています。リンクを通じてご購入いただいた場合、追加費用なしでコミッションを受け取る場合があります。すべての加盟店は認定パートナーです。', disc_label: 'アフィリエイト開示', editorial: 'Brightlane編集チーム', published: '公開日', updated: '更新日', read_time: '分で読める', verified: '認定済み', top_pick: 'トップピック', our_verdict: '私たちの評価', read_in: '言語で読む' },
  ko: { faq: '자주 묻는 질문', disclosure: '이 게시물에는 제휴 링크가 포함되어 있습니다. 링크를 통해 구매하시면 추가 비용 없이 커미션을 받을 수 있습니다. 모든 판매자는 검증된 파트너입니다.', disc_label: '제휴 공개', editorial: 'Brightlane 편집팀', published: '게시일', updated: '업데이트', read_time: '분 읽기', verified: '검증됨', top_pick: '최고 선택', our_verdict: '우리의 평결', read_in: '언어로 읽기' },
  id: { faq: 'Pertanyaan yang Sering Diajukan', disclosure: 'Artikel ini mengandung tautan afiliasi. Kami mungkin mendapat komisi jika Anda membeli melalui tautan kami, tanpa biaya tambahan untuk Anda. Semua merchant adalah mitra terverifikasi.', disc_label: 'Pengungkapan Afiliasi', editorial: 'Tim Editorial Brightlane', published: 'Diterbitkan', updated: 'Diperbarui', read_time: 'menit baca', verified: 'Terverifikasi', top_pick: 'Pilihan Terbaik', our_verdict: 'Verdict Kami', read_in: 'Baca dalam' },
  it: { faq: 'Domande Frequenti', disclosure: 'Questo articolo contiene link di affiliazione. Potremmo guadagnare una commissione se acquisti tramite i nostri link, senza costi aggiuntivi per te. Tutti i commercianti sono partner verificati.', disc_label: 'Informativa sugli Affiliati', editorial: 'Redazione Brightlane', published: 'Pubblicato', updated: 'Aggiornato', read_time: 'min di lettura', verified: 'Verificato', top_pick: 'Scelta Migliore', our_verdict: 'Il Nostro Verdetto', read_in: 'Leggi in' },
  nl: { faq: 'Veelgestelde Vragen', disclosure: 'Dit artikel bevat affiliate links. We kunnen een commissie verdienen als u via onze links koopt, zonder extra kosten voor u. Alle verkopers zijn geverifieerde partners.', disc_label: 'Affiliate Openbaarmaking', editorial: 'Brightlane Redactieteam', published: 'Gepubliceerd', updated: 'Bijgewerkt', read_time: 'min lezen', verified: 'Geverifieerd', top_pick: 'Beste Keuze', our_verdict: 'Ons Oordeel', read_in: 'Lees in' },
  pl: { faq: 'Często Zadawane Pytania', disclosure: 'Ten artykuł zawiera linki partnerskie. Możemy zarobić prowizję, jeśli dokonasz zakupu przez nasze linki, bez dodatkowych kosztów dla Ciebie. Wszyscy sprzedawcy są zweryfikowanymi partnerami.', disc_label: 'Ujawnienie Partnerskie', editorial: 'Zespół Redakcyjny Brightlane', published: 'Opublikowano', updated: 'Zaktualizowano', read_time: 'min czytania', verified: 'Zweryfikowany', top_pick: 'Najlepszy Wybór', our_verdict: 'Nasz Werdykt', read_in: 'Czytaj w' },
};

// ─── Load affiliate links ─────────────────────────────────────────────────────
const affiliateData = JSON.parse(fs.readFileSync(AFF_FILE, 'utf8'));
const LINKS = {};
affiliateData.affiliates.forEach(a => { LINKS[a.id] = a.url; });

function aff(id, pos, slug, lang) {
  if (!LINKS[id]) { console.warn(`⚠ Unknown affiliate: "${id}"`); return '#'; }
  try {
    const u = new URL(LINKS[id]);
    u.searchParams.set('utm_source',   'brightlane-blog');
    u.searchParams.set('utm_medium',   'affiliate');
    u.searchParams.set('utm_campaign', slug);
    u.searchParams.set('utm_content',  `pos-${pos}-${lang}`);
    return u.toString();
  } catch(e) { return LINKS[id]; }
}

// ─── Load lmss ────────────────────────────────────────────────────────────────
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
- Keep product names, brand names, and URLs unchanged
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
        } catch(e) { reject(new Error(`Parse error for ${targetLang}: ${e.message}`)); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── Build all translations ───────────────────────────────────────────────────
async function buildAllTranslations(topic) {
  const englishFields = {
    title: topic.title_en, category: topic.category_en,
    metaDesc: topic.metaDesc_en, keywords: topic.keywords_en,
    intro: topic.intro_en, callout: topic.callout_en,
    h2a: topic.h2a_en, body1: topic.body1_en, bullets: topic.bullets_en,
    verdict_title: topic.verdict_title_en, verdict_desc: topic.verdict_desc_en,
    h2b: topic.h2b_en, body2: topic.body2_en,
    cta: topic.cta_en, cta2: topic.cta2_en, faqs: topic.faqs_en,
  };

  const translations = { en: englishFields };

  const existing = {
    zh: topic.title_zh ? { title: topic.title_zh, category: topic.category_zh, metaDesc: topic.metaDesc_zh, keywords: topic.keywords_zh, intro: topic.intro_zh, callout: topic.callout_zh, h2a: topic.h2a_zh, body1: topic.body1_zh, bullets: topic.bullets_zh, verdict_title: topic.verdict_title_zh, verdict_desc: topic.verdict_desc_zh, h2b: topic.h2b_zh, body2: topic.body2_zh, cta: topic.cta_zh, cta2: topic.cta2_zh, faqs: topic.faqs_zh } : null,
    es: topic.title_es ? { title: topic.title_es, category: topic.category_es, metaDesc: topic.metaDesc_es, keywords: topic.keywords_es, intro: topic.intro_es, callout: topic.callout_es, h2a: topic.h2a_es, body1: topic.body1_es, bullets: topic.bullets_es, verdict_title: topic.verdict_title_es, verdict_desc: topic.verdict_desc_es, h2b: topic.h2b_es, body2: topic.body2_es, cta: topic.cta_es, cta2: topic.cta2_es, faqs: topic.faqs_es } : null,
    fr: topic.title_fr ? { title: topic.title_fr, category: topic.category_fr, metaDesc: topic.metaDesc_fr, keywords: topic.keywords_fr, intro: topic.intro_fr, callout: topic.callout_fr, h2a: topic.h2a_fr, body1: topic.body1_fr, bullets: topic.bullets_fr, verdict_title: topic.verdict_title_fr, verdict_desc: topic.verdict_desc_fr, h2b: topic.h2b_fr, body2: topic.body2_fr, cta: topic.cta_fr, cta2: topic.cta2_fr, faqs: topic.faqs_fr } : null,
  };

  for (const lang of LANGUAGES) {
    if (lang.code === 'en') continue;
    if (existing[lang.code]) {
      console.log(`  ✓ ${lang.code} — existing translation`);
      translations[lang.code] = existing[lang.code];
    } else {
      console.log(`  🔄 ${lang.code} — translating...`);
      try {
        translations[lang.code] = await claudeTranslate(englishFields, lang.code, lang.name);
        console.log(`  ✓ ${lang.code}`);
      } catch(e) {
        console.warn(`  ⚠ ${lang.code} — fallback to English`);
        translations[lang.code] = englishFields;
      }
    }
  }
  return translations;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fileName(slug, lang) {
  return lang === 'en' ? `${slug}.html` : `${slug}-${lang}.html`;
}
function pageUrl(slug, lang) {
  return `${BASE}/blog/${fileName(slug, lang)}`;
}

// ─── Full hreflang with region pairs ─────────────────────────────────────────
function buildHreflang(slug) {
  const lines = [];
  for (const lang of LANGUAGES) {
    // Main language tag
    lines.push(`  <link rel="alternate" hreflang="${lang.code}" href="${pageUrl(slug, lang.code)}"/>`);
    // Region-specific pairs
    for (const region of lang.regions) {
      lines.push(`  <link rel="alternate" hreflang="${region}" href="${pageUrl(slug, lang.code)}"/>`);
    }
  }
  lines.push(`  <link rel="alternate" hreflang="x-default" href="${pageUrl(slug, 'en')}"/>`);
  return lines.join('\n');
}

// ─── Language switcher bar ────────────────────────────────────────────────────
function buildLangBar(slug, currentLang) {
  return LANGUAGES.map(l => {
    const active = l.code === currentLang ? ' aria-current="page" class="lang-pill active"' : ' class="lang-pill"';
    return `<a href="${fileName(slug, l.code)}"${active} hreflang="${l.code}" aria-label="Read in ${l.name}">${l.flag} ${l.name}</a>`;
  }).join('\n    ');
}

// ─── Stacked JSON-LD schemas ──────────────────────────────────────────────────
function buildSchemas(topic, t, lang, url, merchantMeta) {
  const schemas = [];
  const { schemaType, rating, ratingCount, category } = merchantMeta;

  // 1. Main entity schema (SoftwareApplication / Product / Course / Book etc.)
  const mainSchema = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    'name': t.title,
    'description': t.metaDesc,
    'url': url,
    'inLanguage': lang,
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': rating.toString(),
      'reviewCount': ratingCount.toString(),
      'bestRating': '5',
      'worstRating': '1',
    },
  };

  if (schemaType === 'SoftwareApplication') {
    mainSchema.applicationCategory = category;
    mainSchema.operatingSystem = 'Windows, macOS';
    mainSchema.offers = { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD', 'description': 'Free trial available' };
  } else if (schemaType === 'Course') {
    mainSchema.provider = { '@type': 'Organization', 'name': 'Brightlane', 'sameAs': BASE };
    mainSchema.hasCourseInstance = { '@type': 'CourseInstance', 'courseMode': 'online' };
  }

  schemas.push(mainSchema);

  // 2. Article schema
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': t.title,
    'description': t.metaDesc,
    'url': url,
    'datePublished': TODAY,
    'dateModified': TODAY,
    'inLanguage': lang,
    'keywords': t.keywords || '',
    'author': {
      '@type': 'Organization',
      'name': 'Brightlane Editorial Team',
      'url': `${BASE}/`,
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'Brightlane Verified Merchant Directory',
      'url': `${BASE}/`,
      'logo': {
        '@type': 'ImageObject',
        'url': `${BASE}/og-image.png`,
        'width': 1200,
        'height': 630,
      },
    },
    'image': {
      '@type': 'ImageObject',
      'url': `${BASE}/og-image.png`,
      'width': 1200,
      'height': 630,
    },
    'mainEntityOfPage': { '@type': 'WebPage', '@id': url },
  });

  // 3. FAQPage schema
  if (t.faqs && t.faqs.length) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': t.faqs.map(f => ({
        '@type': 'Question',
        'name': f.q,
        'acceptedAnswer': { '@type': 'Answer', 'text': f.a },
      })),
    });
  }

  // 4. BreadcrumbList schema
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Home',     'item': `${BASE}/` },
      { '@type': 'ListItem', 'position': 2, 'name': 'Blog',     'item': `${BASE}/blog/` },
      { '@type': 'ListItem', 'position': 3, 'name': t.category, 'item': `${BASE}/blog/` },
      { '@type': 'ListItem', 'position': 4, 'name': t.title,    'item': url },
    ],
  });

  return schemas.map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n  ');
}

// ─── OG locale alternates ─────────────────────────────────────────────────────
function buildOGLocales(currentLocale) {
  const alternates = LANGUAGES
    .filter(l => l.locale !== currentLocale)
    .slice(0, 7)
    .map(l => `  <meta property="og:locale:alternate" content="${l.locale}"/>`)
    .join('\n');
  return alternates;
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  :root{--bg:#0a0b0d;--bg2:#111318;--bg3:#1a1d24;--border:rgba(255,255,255,0.07);--border2:rgba(255,255,255,0.13);--text:#e8e9ed;--muted:#8a8d99;--dim:#555866;--accent:#e8ff47;--accent2:#47ffb8;--accent3:#ff6b35;--font-head:'Syne',sans-serif;--font-body:'DM Sans',sans-serif;--radius:12px}
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html{scroll-behavior:smooth}
  body{font-family:var(--font-body);background:var(--bg);color:var(--text);line-height:1.75;overflow-x:hidden;font-size:15px}
  a{color:inherit;text-decoration:none}
  img{max-width:100%;height:auto}

  /* Noise texture */
  body::before{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");pointer-events:none;z-index:1000;opacity:.4}

  /* Sticky nav */
  .nav{position:fixed;top:0;left:0;right:0;z-index:500;display:flex;align-items:center;justify-content:space-between;padding:0 clamp(20px,4vw,60px);height:64px;background:rgba(10,11,13,0.92);backdrop-filter:blur(20px);border-bottom:1px solid var(--border)}
  .nav-logo{font-family:var(--font-head);font-weight:800;font-size:1.05rem;letter-spacing:-0.02em;display:flex;align-items:center;gap:8px}
  .nav-badge{background:var(--accent);color:#0a0b0d;font-size:0.58rem;font-weight:700;letter-spacing:0.08em;padding:2px 7px;border-radius:20px;text-transform:uppercase}
  .nav-right{display:flex;align-items:center;gap:12px}
  .nav-link{font-size:0.82rem;color:var(--muted);transition:color .2s}
  .nav-link:hover{color:var(--text)}
  .nav-cta{background:var(--accent);color:#0a0b0d;font-family:var(--font-head);font-weight:700;font-size:0.8rem;padding:8px 18px;border-radius:8px;transition:transform .15s,box-shadow .15s;white-space:nowrap}
  .nav-cta:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(232,255,71,0.3)}

  /* Language bar */
  .lang-bar{background:var(--bg2);border-bottom:1px solid var(--border);padding:10px clamp(20px,4vw,60px);display:flex;gap:6px;flex-wrap:wrap;margin-top:64px;overflow-x:auto}
  .lang-pill{font-size:0.7rem;font-family:var(--font-head);font-weight:600;padding:4px 10px;border-radius:20px;border:1px solid var(--border2);color:var(--muted);transition:all .15s;white-space:nowrap;cursor:pointer}
  .lang-pill:hover,.lang-pill.active{background:var(--accent);color:#0a0b0d;border-color:var(--accent)}

  /* Disclosure */
  .disclosure{background:rgba(232,255,71,0.05);border:1px solid rgba(232,255,71,0.15);border-radius:8px;padding:12px 16px;margin:24px 0;font-size:0.78rem;color:var(--muted);display:flex;align-items:flex-start;gap:10px}
  .disclosure-icon{color:var(--accent);font-size:1rem;flex-shrink:0;margin-top:1px}
  .disclosure strong{color:var(--accent2)}

  /* Social proof bar */
  .proof-bar{display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:12px 0;margin-bottom:20px;border-bottom:1px solid var(--border)}
  .proof-item{display:flex;align-items:center;gap:6px;font-size:0.75rem;color:var(--muted)}
  .proof-dot{width:6px;height:6px;border-radius:50%;background:var(--accent2);flex-shrink:0}
  .stars{color:#f5c842;letter-spacing:-1px;font-size:0.85rem}

  /* Breadcrumb */
  .breadcrumb{max-width:800px;margin:0 auto;padding:16px clamp(20px,4vw,60px) 0;display:flex;align-items:center;gap:6px;font-size:0.73rem;color:var(--dim);flex-wrap:wrap}
  .breadcrumb a{color:var(--dim);transition:color .15s}
  .breadcrumb a:hover{color:var(--accent)}
  .breadcrumb span.sep{color:var(--border2)}

  /* Article */
  .article-wrap{max-width:800px;margin:0 auto;padding:0 clamp(20px,4vw,60px) 100px}
  .post-header{padding:32px 0 40px;border-bottom:1px solid var(--border);margin-bottom:40px}
  .post-cat{display:inline-flex;align-items:center;gap:6px;font-family:var(--font-head);font-size:0.68rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--accent);margin-bottom:14px}
  .post-cat::before{content:'';width:20px;height:2px;background:var(--accent);display:inline-block}
  .post-title{font-family:var(--font-head);font-size:clamp(1.7rem,3.5vw,2.8rem);font-weight:800;line-height:1.1;letter-spacing:-0.025em;margin-bottom:18px}
  .post-meta{display:flex;align-items:center;gap:12px;flex-wrap:wrap;font-size:0.78rem;color:var(--dim)}
  .post-meta .sep{color:var(--border2)}
  .updated{color:var(--accent2)}
  .verified-badge{display:inline-flex;align-items:center;gap:4px;background:rgba(71,255,184,0.1);color:var(--accent2);font-size:0.65rem;font-weight:700;padding:2px 8px;border-radius:10px;border:1px solid rgba(71,255,184,0.2)}

  /* Body */
  .post-body{font-size:1rem;line-height:1.85}
  .post-body p{margin-bottom:22px;color:var(--text)}
  .post-body h2{font-family:var(--font-head);font-size:1.35rem;font-weight:800;margin:48px 0 18px;padding-bottom:12px;border-bottom:1px solid var(--border);letter-spacing:-0.02em}
  .post-body h3{font-family:var(--font-head);font-size:1.05rem;font-weight:700;margin:28px 0 12px;color:var(--text)}
  .post-body ul,.post-body ol{padding-left:0;margin-bottom:22px;list-style:none}
  .post-body ul li,.post-body ol li{padding:8px 0 8px 28px;position:relative;font-size:0.95rem;color:var(--muted);border-bottom:1px solid var(--border)}
  .post-body ul li:last-child,.post-body ol li:last-child{border-bottom:none}
  .post-body ul li::before{content:'→';position:absolute;left:0;color:var(--accent);font-weight:700}
  .post-body ol{counter-reset:ol}
  .post-body ol li{counter-increment:ol}
  .post-body ol li::before{content:counter(ol);position:absolute;left:0;color:var(--accent);font-weight:800;font-family:var(--font-head);font-size:0.85rem}
  .post-body strong{color:var(--text);font-weight:500}

  /* Callout */
  .callout{background:var(--bg2);border:1px solid var(--border2);border-left:3px solid var(--accent);border-radius:var(--radius);padding:18px 22px;margin:28px 0;font-size:0.92rem;color:var(--muted)}
  .callout strong{color:var(--accent);display:block;margin-bottom:6px;font-family:var(--font-head);font-size:0.72rem;letter-spacing:0.08em;text-transform:uppercase}

  /* Verdict card */
  .verdict{background:var(--bg2);border:1px solid var(--border2);border-radius:16px;padding:28px;margin:36px 0;position:relative;overflow:hidden}
  .verdict::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 90% 0%,rgba(232,255,71,0.06) 0%,transparent 60%);pointer-events:none}
  .verdict-label{font-family:var(--font-head);font-size:0.65rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--accent);margin-bottom:8px;display:flex;align-items:center;gap:6px}
  .verdict-label::before{content:'✓';background:var(--accent);color:#0a0b0d;width:16px;height:16px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:0.6rem;font-weight:900;flex-shrink:0}
  .verdict-title{font-family:var(--font-head);font-size:1.15rem;font-weight:800;margin-bottom:10px;letter-spacing:-0.02em}
  .verdict-desc{font-size:0.9rem;color:var(--muted);line-height:1.7;margin-bottom:20px}
  .verdict-proof{font-size:0.78rem;color:var(--accent2);margin-bottom:20px;display:flex;align-items:center;gap:6px}
  .verdict-proof::before{content:'★';color:#f5c842}
  .cta-btn{display:inline-flex;align-items:center;gap:8px;background:var(--accent);color:#0a0b0d;font-family:var(--font-head);font-weight:700;font-size:0.9rem;padding:13px 28px;border-radius:var(--radius);transition:transform .15s,box-shadow .15s;margin-right:10px;margin-bottom:10px}
  .cta-btn:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(232,255,71,0.25)}
  .cta-btn-outline{display:inline-flex;align-items:center;gap:8px;background:transparent;color:var(--text);font-family:var(--font-head);font-weight:600;font-size:0.9rem;padding:13px 28px;border-radius:var(--radius);border:1px solid var(--border2);transition:border-color .2s,background .2s;margin-bottom:10px}
  .cta-btn-outline:hover{border-color:var(--accent);background:rgba(232,255,71,0.05)}

  /* FAQ */
  .faq-section{margin:56px 0}
  .faq-section h2{font-family:var(--font-head);font-size:1.25rem;font-weight:800;margin-bottom:22px;letter-spacing:-0.02em}
  .faq-item{border-top:1px solid var(--border)}
  .faq-item:last-child{border-bottom:1px solid var(--border)}
  .faq-q{font-family:var(--font-head);font-weight:600;font-size:0.92rem;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:20px;padding:17px 0;user-select:none}
  .faq-icon{width:22px;height:22px;flex-shrink:0;border:1px solid var(--border2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.9rem;transition:transform .25s;color:var(--accent)}
  .faq-item.open .faq-icon{transform:rotate(45deg)}
  .faq-a{font-size:0.88rem;color:var(--muted);line-height:1.75;max-height:0;overflow:hidden;transition:max-height .35s ease,padding .35s ease}
  .faq-item.open .faq-a{max-height:500px;padding-bottom:17px}

  /* Footer disclosure */
  .footer-disc{margin-top:44px;padding-top:22px;border-top:1px solid var(--border);font-size:0.75rem;color:var(--dim);line-height:1.7}
  .footer-disc strong{color:var(--muted)}

  /* RTL support */
  .rtl{direction:rtl;text-align:right}
  .rtl .post-body ul li,.rtl .post-body ol li{padding:8px 28px 8px 0}
  .rtl .post-body ul li::before{left:auto;right:0}
  .rtl .post-body ol li::before{left:auto;right:0}
  .rtl .callout{border-left:none;border-right:3px solid var(--accent)}
  .rtl .post-cat::before{display:none}
  .rtl .breadcrumb{flex-direction:row-reverse}

  @media(max-width:640px){.nav-link{display:none}.proof-bar{gap:10px}}
`;

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,400&display=swap" rel="stylesheet"/>`;

// ─── Build article body ───────────────────────────────────────────────────────
function buildBody(t, lang, slug, merchantId, merchantMeta) {
  const affLink1 = aff(merchantId, 1, slug, lang);
  const affLink2 = aff(merchantId, 2, slug, lang);
  const ui = UI[lang] || UI.en;

  const bulletItems = (t.bullets || []).map(b => `<li>${b}</li>`).join('');
  const faqItems = (t.faqs || []).map(f => `
    <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
      <div class="faq-q" tabindex="0" role="button" aria-expanded="false" itemprop="name">${f.q}<span class="faq-icon" aria-hidden="true">+</span></div>
      <div class="faq-a" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer"><span itemprop="text">${f.a}</span></div>
    </div>`).join('');

  return `
    <p>${t.intro}</p>

    <div class="callout" role="note" aria-label="Key insight">
      <strong>💡 Key Insight</strong>
      ${t.callout}
    </div>

    <h2>${t.h2a}</h2>
    <p>${t.body1}</p>
    <ul role="list" aria-label="Key features">
      ${bulletItems}
    </ul>

    <div class="verdict" role="region" aria-label="${ui.our_verdict}">
      <div class="verdict-label" aria-label="${ui.top_pick}">${ui.top_pick}</div>
      <h3 class="verdict-title">${t.verdict_title}</h3>
      <p class="verdict-desc">${t.verdict_desc}</p>
      <div class="verdict-proof" aria-label="Social proof">
        ${merchantMeta.proof}
      </div>
      <div class="cta-group">
        <a href="${affLink1}" class="cta-btn" target="_blank" rel="noopener sponsored" aria-label="${t.cta}">${t.cta} →</a>
        <a href="${affLink2}" class="cta-btn-outline" target="_blank" rel="noopener sponsored" aria-label="${t.cta2}">${t.cta2} →</a>
      </div>
    </div>

    <h2>${t.h2b}</h2>
    <p>${t.body2}</p>

    <section class="faq-section" aria-labelledby="faq-heading" itemscope itemtype="https://schema.org/FAQPage">
      <h2 id="faq-heading">${ui.faq}</h2>
      ${faqItems}
    </section>
  `;
}

// ─── Build full HTML page ─────────────────────────────────────────────────────
function buildPage(topic, lang, translations) {
  const slug        = topic.slug;
  const t           = translations[lang];
  const langObj     = LANG_MAP[lang];
  const ui          = UI[lang] || UI.en;
  const isRtl       = langObj && langObj.dir === 'rtl';
  const url         = pageUrl(slug, lang);
  const merchantId  = topic.merchant;
  const merchantMeta = MERCHANT_META[merchantId] || { schemaType: 'Article', rating: 4.5, ratingCount: 1000, category: 'General', proof: 'Verified merchant' };
  const starRating  = '★'.repeat(Math.round(merchantMeta.rating)) + '☆'.repeat(5 - Math.round(merchantMeta.rating));

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${langObj ? langObj.dir : 'ltr'}" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${t.title} | Brightlane</title>
  <meta name="description"  content="${(t.metaDesc||'').replace(/"/g,'&quot;')}"/>
  <meta name="keywords"     content="${(t.keywords||'').replace(/"/g,'&quot;')}"/>
  <meta name="robots"       content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"/>
  <meta name="author"       content="Brightlane Editorial Team"/>
  <meta name="language"     content="${lang}"/>
  <link rel="canonical"     href="${url}"/>

  <!-- Hreflang — all 15 languages with region pairs -->
${buildHreflang(slug)}

  <!-- Open Graph — full suite -->
  <meta property="og:type"        content="article"/>
  <meta property="og:site_name"   content="Brightlane Verified Merchant Directory"/>
  <meta property="og:title"       content="${(t.title||'').replace(/"/g,'&quot;')}"/>
  <meta property="og:description" content="${(t.metaDesc||'').replace(/"/g,'&quot;')}"/>
  <meta property="og:url"         content="${url}"/>
  <meta property="og:image"       content="${BASE}/og-image.png"/>
  <meta property="og:image:width" content="1200"/>
  <meta property="og:image:height"content="630"/>
  <meta property="og:image:alt"   content="${(t.title||'').replace(/"/g,'&quot;')}"/>
  <meta property="og:locale"      content="${langObj ? langObj.locale : 'en_US'}"/>
  <meta property="article:published_time" content="${TODAY}T00:00:00Z"/>
  <meta property="article:modified_time"  content="${TODAY}T00:00:00Z"/>
  <meta property="article:author"         content="Brightlane Editorial Team"/>
  <meta property="article:section"        content="${t.category||'General'}"/>
${buildOGLocales(langObj ? langObj.locale : 'en_US')}

  <!-- Twitter Card -->
  <meta name="twitter:card"        content="summary_large_image"/>
  <meta name="twitter:site"        content="@BrightlaneHQ"/>
  <meta name="twitter:title"       content="${(t.title||'').replace(/"/g,'&quot;')}"/>
  <meta name="twitter:description" content="${(t.metaDesc||'').replace(/"/g,'&quot;')}"/>
  <meta name="twitter:image"       content="${BASE}/og-image.png"/>
  <meta name="twitter:image:alt"   content="${(t.title||'').replace(/"/g,'&quot;')}"/>

  <!-- Stacked JSON-LD Schemas -->
  ${buildSchemas(topic, t, lang, url, merchantMeta)}

  ${FONTS}
  <style>${CSS}</style>
</head>
<body${isRtl ? ' class="rtl"' : ''}>

  <!-- Sticky Navigation -->
  <nav class="nav" role="navigation" aria-label="Main navigation">
    <a href="../index.html" class="nav-logo" aria-label="Brightlane Home">
      Brightlane <span class="nav-badge" aria-label="Verified">✓ Verified</span>
    </a>
    <div class="nav-right">
      <a href="../index.html" class="nav-link" aria-label="Merchant Directory">Directory</a>
      <a href="index.html"    class="nav-link" aria-label="Blog">Blog</a>
      <a href="../index.html#merchants" class="nav-cta" aria-label="Browse verified merchants">Browse Merchants →</a>
    </div>
  </nav>

  <!-- Language Switcher -->
  <nav class="lang-bar" role="navigation" aria-label="Language selector">
    ${buildLangBar(slug, lang)}
  </nav>

  <!-- Breadcrumb -->
  <nav class="breadcrumb" aria-label="Breadcrumb">
    <a href="../index.html">Home</a>
    <span class="sep" aria-hidden="true">›</span>
    <a href="index.html">Blog</a>
    <span class="sep" aria-hidden="true">›</span>
    <a href="index.html">${t.category||'General'}</a>
    <span class="sep" aria-hidden="true">›</span>
    <span aria-current="page">${t.title}</span>
  </nav>

  <main class="article-wrap" role="main">

    <!-- Affiliate Disclosure — above first link -->
    <aside class="disclosure" role="note" aria-label="${ui.disc_label}">
      <span class="disclosure-icon" aria-hidden="true">ℹ</span>
      <div><strong>${ui.disc_label}:</strong> ${ui.disclosure}</div>
    </aside>

    <header class="post-header">
      <div class="post-cat" aria-label="Category">${t.category||'General'}</div>
      <h1 class="post-title">${t.title}</h1>

      <!-- Social proof bar -->
      <div class="proof-bar" aria-label="Trust signals">
        <div class="proof-item">
          <span class="proof-dot" aria-hidden="true"></span>
          <span class="stars" aria-label="${merchantMeta.rating} out of 5 stars">${starRating}</span>
          <span>${merchantMeta.rating}/5 (${merchantMeta.ratingCount.toLocaleString()} reviews)</span>
        </div>
        <div class="proof-item">
          <span class="proof-dot" aria-hidden="true"></span>
          <span>${merchantMeta.proof}</span>
        </div>
        <div class="proof-item">
          <span class="verified-badge" aria-label="${ui.verified} merchant">✓ ${ui.verified}</span>
        </div>
      </div>

      <div class="post-meta">
        <span>${ui.editorial}</span>
        <span class="sep" aria-hidden="true">·</span>
        <span>${ui.published} <time datetime="${TODAY}">${TODAY}</time></span>
        <span class="sep" aria-hidden="true">·</span>
        <span class="updated">${ui.updated} <time datetime="${TODAY}">${TODAY}</time></span>
      </div>
    </header>

    <article class="post-body" itemscope itemtype="https://schema.org/Article">
      <meta itemprop="datePublished" content="${TODAY}"/>
      <meta itemprop="dateModified"  content="${TODAY}"/>
      <meta itemprop="author"        content="Brightlane Editorial Team"/>
      ${buildBody(t, lang, slug, merchantId, merchantMeta)}
    </article>

    <footer class="footer-disc" role="contentinfo">
      <strong>${ui.disc_label}:</strong> ${ui.disclosure}
    </footer>

  </main>

  <script>
    // FAQ accordion
    document.querySelectorAll('.faq-q').forEach(q => {
      q.addEventListener('click', () => {
        const item    = q.closest('.faq-item');
        const isOpen  = item.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach(i => {
          i.classList.remove('open');
          i.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          item.classList.add('open');
          q.setAttribute('aria-expanded', 'true');
        }
      });
      q.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); q.click(); }
      });
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
    console.log(`  ✓ ${fileName(topic.slug, lang.code)} (${Math.round(html.length/1024)}KB)`);
    filesWritten++;
  }

  // Mark published
  topic.published       = true;
  topic.published_date  = TODAY;
  topic.files_generated = LANGUAGES.map(l => fileName(topic.slug, l.code));
  lmss.meta.last_updated = TODAY;

  fs.writeFileSync(LMSS, JSON.stringify(lmss, null, 2), 'utf8');

  const remaining = lmss.topics.filter(t => !t.published).length;
  console.log(`\n✅ Done — ${filesWritten} files written`);
  console.log(`   ${remaining} topics remaining in queue`);
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
