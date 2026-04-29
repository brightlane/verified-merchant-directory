#!/usr/bin/env node
// keyword-injector.js — Brightlane Keyword SEO Injector
// Scans published blog HTML files and injects/updates:
//   - Optimized title tags per language
//   - Meta description with primary keyword
//   - Meta keywords tag
//   - JSON-LD keyword signals
//   - Open Graph optimization
// Runs after inject.js in Vulture Titan. Zero manual work.

const fs   = require('fs');
const path = require('path');
const https = require('https');

const BASE     = 'https://brightlane.github.io/verified-merchant-directory';
const BLOG_DIR = path.join(__dirname, 'blog');
const LMSS     = path.join(__dirname, 'lmss.txt');
const TODAY    = new Date().toISOString().split('T')[0];

// ─── Priority keywords by merchant — ordered by global search volume ──────────
const KEYWORD_MAP = {
  tenorshare: {
    primary:    'iPhone data recovery 2026',
    secondary:  ['recover deleted photos iPhone', 'unlock disabled iPhone', 'fix iPhone boot loop', 'recover WhatsApp messages', 'Android data recovery'],
    longTail:   ['how to recover deleted photos from iPhone without backup', 'iPhone stuck on apple logo fix without losing data', 'recover deleted WhatsApp messages without backup 2026'],
    schema:     'SoftwareApplication',
  },
  movavi: {
    primary:    'best video editing software 2026',
    secondary:  ['video editor free trial', 'screen recorder no watermark', 'video editor for YouTube', 'Movavi vs DaVinci Resolve', 'video editor Mac Apple Silicon'],
    longTail:   ['best free video editing software no watermark 2026', 'easiest video editor for beginners 2026', 'video editor one time purchase no subscription'],
    schema:     'SoftwareApplication',
  },
  wondershare: {
    primary:    'Filmora video editor 2026',
    secondary:  ['best PDF editor', 'data recovery software', 'Filmora free trial', 'PDFelement vs Adobe Acrobat', 'Recoverit review'],
    longTail:   ['Filmora vs Adobe Premiere Pro 2026', 'best PDF editor cheaper than Adobe Acrobat', 'recover deleted files free before buying'],
    schema:     'SoftwareApplication',
  },
  iskysoft: {
    primary:    'data recovery software 2026',
    secondary:  ['recover deleted files Mac', 'recover deleted files Windows', 'video converter fast', 'PDF editor one time purchase', 'screen recorder Mac'],
    longTail:   ['how to recover deleted files from emptied recycle bin', 'best video converter without quality loss 2026', 'edit PDF without Adobe subscription'],
    schema:     'SoftwareApplication',
  },
  appypie: {
    primary:    'no code app builder 2026',
    secondary:  ['build app without coding', 'chatbot builder no code', 'website builder no code', 'Zapier alternative cheap', 'ecommerce app no code'],
    longTail:   ['how to build an iPhone app without coding 2026', 'best no code chatbot for small business', 'Zapier alternative cheaper 2026'],
    schema:     'SoftwareApplication',
  },
  knowledgehut: {
    primary:    'AWS certification training 2026',
    secondary:  ['PMP certification course', 'data science course online', 'cybersecurity certification', 'agile scrum certification', 'best online certification courses'],
    longTail:   ['AWS certified solutions architect associate study guide 2026', 'best data science bootcamp online 2026', 'CompTIA Security+ online course pass first time'],
    schema:     'Course',
  },
  pmtraining: {
    primary:    'PMP certification 2026',
    secondary:  ['PRINCE2 certification', 'agile scrum master certification', 'project management certification', 'PMP exam prep', 'PRINCE2 vs PMP'],
    longTail:   ['PMP certification cost 2026 worth it salary increase', 'PRINCE2 vs PMP which is better for career', 'agile certification that pays the most 2026'],
    schema:     'Course',
  },
  cpraedcourse: {
    primary:    'online CPR certification 2026',
    secondary:  ['CPR certification instant', 'CPR AED training', 'CPR for teachers', 'CPR recertification online', 'workplace CPR training'],
    longTail:   ['get CPR certified online same day certificate 2026', 'CPR certification accepted by employers online', 'how long does online CPR certification take'],
    schema:     'Course',
  },
  cprcare: {
    primary:    'BLS certification online 2026',
    secondary:  ['CPR for coaches', 'group CPR training', 'BLS for healthcare providers', 'CPR Care certification', 'first aid certification online'],
    longTail:   ['BLS certification online accepted by hospitals 2026', 'CPR certification for sports coaches youth league', 'group CPR training for companies online'],
    schema:     'Course',
  },
  ahca: {
    primary:    'HIPAA training online 2026',
    secondary:  ['bloodborne pathogen training', 'healthcare compliance training', 'OSHA healthcare training', 'BLS certification healthcare', 'AHCA certification'],
    longTail:   ['annual HIPAA training online certificate 2026', 'OSHA bloodborne pathogen training healthcare workers', 'BLS vs CPR difference healthcare workers'],
    schema:     'Course',
  },
  discountpetcare: {
    primary:    'cheap pet medications online 2026',
    secondary:  ['NexGard cheapest price', 'Heartgard Plus online', 'Bravecto online discount', 'Frontline Plus cheap', 'pet pharmacy online'],
    longTail:   ['NexGard for dogs cheapest price online vs vet 2026', 'Heartgard Plus online pharmacy save money', 'buy Bravecto online without vet markup'],
    schema:     'Product',
  },
  canadapetcare: {
    primary:    'online pet pharmacy Canada 2026',
    secondary:  ['buy pet meds online Canada', 'cat medications Canada cheap', 'dog medications Canada online', 'Revolution cats Canada', 'NexGard Canada online'],
    longTail:   ['buy NexGard online Canada cheaper than vet', 'licensed online pet pharmacy Canada Health Canada approved', 'save on pet medications Canada 2026'],
    schema:     'Product',
  },
  buildasign: {
    primary:    'custom banners online 2026',
    secondary:  ['yard signs cheap custom', 'real estate signs online', 'trade show banners', 'event signage custom', 'business banners fast'],
    longTail:   ['custom vinyl banners cheap online same week delivery', 'real estate yard signs bulk discount 2026', 'trade show retractable banners fast turnaround'],
    schema:     'Product',
  },
  easycanvasprints: {
    primary:    'canvas prints photo gifts 2026',
    secondary:  ['wedding gift canvas print', 'family photo canvas', 'canvas prints home decor', 'personalized canvas gift', 'gallery wrap canvas'],
    longTail:   ['best canvas print for wedding gift 2026 quality', 'turn family photos into canvas wall art', 'canvas prints gallery wall ideas sizes'],
    schema:     'Product',
  },
  canvasdiscount: {
    primary:    'discount canvas prints 2026',
    secondary:  ['canvas prints everyday low price', 'photo canvas cheap quality', 'canvas discount review', 'canvas prints vs photo prints', 'metal prints vs canvas'],
    longTail:   ['canvas discount vs canvas on the cheap quality comparison', 'best everyday price canvas prints no sale needed', 'acrylic photo prints vs canvas which better'],
    schema:     'Product',
  },
  canvasonthecheap: {
    primary:    'cheapest canvas prints online 2026',
    secondary:  ['canvas prints sale 50 off', 'canvas on the cheap review', 'cheap canvas prints quality', 'canvas prints coupon', 'canvas prints mothers day'],
    longTail:   ['canvas on the cheap 50 percent off sale 2026', 'cheapest quality canvas prints online free shipping', 'canvas prints cheap mothers day gift 2026'],
    schema:     'Product',
  },
  infinitealoe: {
    primary:    'aloe vera skincare sensitive skin 2026',
    secondary:  ['aloe vera eczema treatment', 'fragrance free moisturizer', 'organic aloe vera moisturizer', 'natural skincare sensitive skin', 'aloe vera sunburn relief'],
    longTail:   ['does aloe vera help eczema 2026 clinical evidence', 'best fragrance free moisturizer for sensitive skin 2026', 'organic aloe vera vs regular moisturizer difference'],
    schema:     'Product',
  },
  littletoe: {
    primary:    'bunion corrector 2026',
    secondary:  ['toe separator bunion', 'bunion relief without surgery', 'orthopedic foot care', 'foot pain running fix', 'plantar fasciitis insoles'],
    longTail:   ['best bunion corrector that actually works 2026 clinical evidence', 'bunion surgery alternatives non surgical treatment 2026', 'toe separators for overlapping toes review'],
    schema:     'Product',
  },
  combatflipflops: {
    primary:    'veteran owned footwear brand 2026',
    secondary:  ['ethical footwear mission brand', 'army ranger founded brand', 'gifts for veterans meaningful', 'combat flip flops review', 'footwear that gives back'],
    longTail:   ['best ethical gifts for veterans 2026 mission driven', 'combat flip flops quality review worth buying', 'footwear brands that donate to military causes'],
    schema:     'Product',
  },
  halloweencostumes: {
    primary:    'best Halloween costumes 2026',
    secondary:  ['couples Halloween costumes', 'group Halloween costumes', 'kids Halloween costumes safe', 'Halloween costume ideas trending', 'Halloween costume delivery guarantee'],
    longTail:   ['best Halloween costumes adults 2026 trending ideas order online', 'group Halloween costume themes for 5 people 2026', 'kids Halloween costumes safe flame resistant 2026'],
    schema:     'Product',
  },
  shoplww: {
    primary:    'nursing textbooks Lippincott 2026',
    secondary:  ['NCLEX review book best', 'medical surgical nursing textbook', 'Brunner Suddarth textbook', 'nursing pharmacology book', 'NCLEX prep materials'],
    longTail:   ['best NCLEX review book 2026 pass first time Lippincott', 'Brunner Suddarth medical surgical nursing current edition', 'where to buy Lippincott nursing books cheapest price'],
    schema:     'Book',
  },
  bgmgirl: {
    primary:    'royalty free music YouTube 2026',
    secondary:  ['DMCA safe music Twitch', 'podcast background music licensed', 'no copyright music content creators', 'BGM Girl review', 'music for monetized YouTube'],
    longTail:   ['royalty free music YouTube monetized channel no claims 2026', 'DMCA safe music for Twitch streaming VODs clips', 'best background music podcast no copyright issues'],
    schema:     'MusicRecording',
  },
  lafuent: {
    primary:    'OEM car parts online 2026',
    secondary:  ['aftermarket parts vs OEM', 'European car parts online', 'BMW parts online cheap', 'Mercedes parts online', 'auto parts international shipping'],
    longTail:   ['OEM vs aftermarket car parts which to buy safety guide 2026', 'BMW parts online cheaper than dealership 2026', 'European car parts international shipping reliable'],
    schema:     'Product',
  },
  taxextension: {
    primary:    'file tax extension online 2026',
    secondary:  ['IRS tax extension deadline', 'form 4868 online', 'self employed tax extension', 'business tax extension LLC', 'tax extension no penalty'],
    longTail:   ['how to file IRS tax extension online 2026 free no penalty', 'self employed tax extension estimate payment deadline', 'LLC S-Corp tax extension deadline March 15 2026'],
    schema:     'FinancialProduct',
  },
};

// ─── Language-specific keyword prefixes ──────────────────────────────────────
const LANG_MODIFIERS = {
  en: '', zh: '2026年', es: '2026', fr: '2026', de: '2026',
  pt: '2026', ar: '2026', hi: '2026', ru: '2026', ja: '2026年',
  ko: '2026', id: '2026', it: '2026', nl: '2026', pl: '2026',
};

// ─── Claude API for keyword optimization ─────────────────────────────────────
function optimizeKeywords(merchantId, slug, lang, currentTitle, currentDesc) {
  return new Promise((resolve, reject) => {
    const kw = KEYWORD_MAP[merchantId];
    if (!kw) { resolve(null); return; }

    const prompt = `You are an SEO expert. Optimize these meta tags for maximum search ranking.

Merchant: ${merchantId}
Primary keyword: ${kw.primary}
Secondary keywords: ${kw.secondary.join(', ')}
Long-tail targets: ${kw.longTail.join(', ')}
Language: ${lang}
Current title: ${currentTitle}
Current description: ${currentDesc}

Return ONLY valid JSON with exactly these fields:
{
  "title": "Optimized title tag — include primary keyword, under 60 chars",
  "description": "Optimized meta description — include primary + one secondary keyword, under 155 chars, includes call to action",
  "keywords": "primary keyword, secondary 1, secondary 2, long tail 1, long tail 2"
}

Rules:
- If lang is not 'en', translate the optimized tags into that language naturally
- Keep brand names in English regardless of language
- Title must contain the primary keyword naturally
- Description must be compelling and include a benefit`;

    const body = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
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
          if (parsed.error) { resolve(null); return; }
          const text = parsed.content[0].text.trim();
          const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
          resolve(JSON.parse(clean));
        } catch(e) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.write(body);
    req.end();
  });
}

// ─── Inject keywords into HTML file ──────────────────────────────────────────
function injectKeywords(html, optimized, merchantId, lang) {
  const kw = KEYWORD_MAP[merchantId];
  if (!kw || !optimized) return html;

  let updated = html;

  // Update title tag
  if (optimized.title) {
    updated = updated.replace(
      /<title>[^<]*<\/title>/i,
      `<title>${escapeHtml(optimized.title)}</title>`
    );
  }

  // Update meta description
  if (optimized.description) {
    updated = updated.replace(
      /<meta name="description"\s+content="[^"]*"/i,
      `<meta name="description" content="${escapeHtml(optimized.description)}"`
    );
  }

  // Update or add meta keywords
  if (optimized.keywords) {
    if (updated.includes('name="keywords"')) {
      updated = updated.replace(
        /<meta name="keywords"\s+content="[^"]*"/i,
        `<meta name="keywords" content="${escapeHtml(optimized.keywords)}"`
      );
    } else {
      updated = updated.replace(
        '</head>',
        `  <meta name="keywords" content="${escapeHtml(optimized.keywords)}"/>\n</head>`
      );
    }
  }

  // Update OG title and description
  if (optimized.title) {
    updated = updated.replace(
      /<meta property="og:title"\s+content="[^"]*"/i,
      `<meta property="og:title" content="${escapeHtml(optimized.title)}"`
    );
    updated = updated.replace(
      /<meta name="twitter:title"\s+content="[^"]*"/i,
      `<meta name="twitter:title" content="${escapeHtml(optimized.title)}"`
    );
  }
  if (optimized.description) {
    updated = updated.replace(
      /<meta property="og:description"\s+content="[^"]*"/i,
      `<meta property="og:description" content="${escapeHtml(optimized.description)}"`
    );
    updated = updated.replace(
      /<meta name="twitter:description"\s+content="[^"]*"/i,
      `<meta name="twitter:description" content="${escapeHtml(optimized.description)}"`
    );
  }

  // Add keyword-rich JSON-LD if not present
  if (!updated.includes('"keywords"') && kw.secondary) {
    const keywordSignal = JSON.stringify(kw.secondary.join(', '));
    updated = updated.replace(
      /("@type":\s*"Article")/,
      `$1,"keywords":${keywordSignal}`
    );
  }

  return updated;
}

function escapeHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(BLOG_DIR)) {
    console.log('No blog/ directory yet — skipping keyword injection');
    return;
  }

  const lmss = JSON.parse(fs.readFileSync(LMSS, 'utf8'));

  // Find the most recently published topic to inject keywords into
  const recentlyPublished = lmss.topics
    .filter(t => t.published && t.published_date === TODAY)
    .slice(-1); // just the most recent from today

  if (recentlyPublished.length === 0) {
    console.log('🔑 No new posts today — skipping keyword injection');
    return;
  }

  const topic = recentlyPublished[0];
  const merchant = topic.merchant;
  const kw = KEYWORD_MAP[merchant];

  if (!kw) {
    console.log(`🔑 No keyword map for merchant: ${merchant}`);
    return;
  }

  console.log(`🔑 Injecting keywords for: ${topic.slug} (${merchant})`);
  console.log(`   Primary keyword: ${kw.primary}`);

  const languages = ['en','zh','es','fr','de','pt','ar','hi','ru','ja','ko','id','it','nl','pl'];
  let updated = 0;

  for (const lang of languages) {
    const filename = lang === 'en' ? `${topic.slug}.html` : `${topic.slug}-${lang}.html`;
    const filepath = path.join(BLOG_DIR, filename);

    if (!fs.existsSync(filepath)) continue;

    const html = fs.readFileSync(filepath, 'utf8');

    // Extract current title and desc for optimization
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const descMatch  = html.match(/name="description"\s+content="([^"]*)"/i);
    const currentTitle = titleMatch ? titleMatch[1] : '';
    const currentDesc  = descMatch  ? descMatch[1]  : '';

    // For English — optimize with Claude API
    // For other languages — use simple keyword injection without API call
    let optimized = null;

    if (lang === 'en') {
      optimized = await optimizeKeywords(merchant, topic.slug, lang, currentTitle, currentDesc);
    } else {
      // Simple optimization without API — just ensure keywords field is present
      optimized = {
        title: currentTitle, // keep existing translated title
        description: currentDesc, // keep existing translated description
        keywords: kw.secondary.slice(0, 5).join(', '), // add English keywords (search engines understand)
      };
    }

    if (optimized) {
      const updatedHtml = injectKeywords(html, optimized, merchant, lang);
      if (updatedHtml !== html) {
        fs.writeFileSync(filepath, updatedHtml, 'utf8');
        updated++;
      }
    }
  }

  console.log(`✅ Keyword injection complete — ${updated} files updated`);
  console.log(`   Keywords: ${kw.primary} + ${kw.secondary.length} secondary terms`);
}

main().catch(err => {
  console.error('❌ Keyword injector error:', err.message);
  process.exit(0); // never crash the workflow
});
