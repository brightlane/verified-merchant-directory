#!/usr/bin/env node
// auto-topic-generator.js — Brightlane Auto Topic Generator
// Checks lmss.txt queue. If fewer than MIN_QUEUE topics remain,
// calls Claude API to generate NEW_BATCH new topics and appends them.
// Runs before inject.js in the Vulture Titan workflow.

const fs    = require('fs');
const path  = require('path');
const https = require('https');

const LMSS      = path.join(__dirname, 'lmss.txt');
const MIN_QUEUE = 10;   // generate more when queue drops below this
const NEW_BATCH = 20;   // how many new topics to generate each time

// ─── All 24 merchants ────────────────────────────────────────────────────────
const MERCHANTS = [
  { id: 'movavi',           name: 'Movavi',                    category: 'Software',       description: 'Video editing software with one-time purchase option' },
  { id: 'iskysoft',         name: 'iSkysoft',                  category: 'Software',       description: 'Multimedia suite including data recovery, PDF editor, video converter' },
  { id: 'tenorshare',       name: 'Tenorshare',                category: 'Software',       description: 'iPhone and Android tools — data recovery, unlock, repair, backup' },
  { id: 'wondershare',      name: 'Wondershare',               category: 'Software',       description: 'Creative software suite — Filmora video editor, PDFelement, Recoverit' },
  { id: 'appypie',          name: 'Appy Pie',                  category: 'Software',       description: 'No-code platform for apps, chatbots, websites, and automation' },
  { id: 'knowledgehut',     name: 'KnowledgeHut',              category: 'Education',      description: 'Tech certifications — AWS, PMP, data science, cybersecurity, agile' },
  { id: 'pmtraining',       name: 'PM Training',               category: 'Education',      description: 'Project management certifications — PMP, PRINCE2, Agile, 98% pass rate' },
  { id: 'cpraedcourse',     name: 'CPR AED Course',            category: 'Education',      description: 'Online CPR and AED certification — instant certificate' },
  { id: 'cprcare',          name: 'CPR Care',                  category: 'Education',      description: 'CPR, BLS, and first aid certification for individuals and organizations' },
  { id: 'ahca',             name: 'AHCA',                      category: 'Education',      description: 'Healthcare compliance training — OSHA, HIPAA, BLS, bloodborne pathogens' },
  { id: 'discountpetcare',  name: 'Discount Pet Care',         category: 'Pet Care',       description: 'Online pet pharmacy — flea treatment, heartworm, prescription pet meds at discount' },
  { id: 'canadapetcare',    name: 'Canada Pet Care',           category: 'Pet Care',       description: 'Licensed Canadian online pet pharmacy — Health Canada approved medications' },
  { id: 'buildasign',       name: 'BuildASign',                category: 'Print & Signs',  description: 'Custom banners, yard signs, canvas prints for business and events' },
  { id: 'easycanvasprints', name: 'Easy Canvas Prints',        category: 'Print & Signs',  description: 'Photo canvas prints — gifts, home decor, gallery wrap' },
  { id: 'canvasdiscount',   name: 'Canvas Discount',           category: 'Print & Signs',  description: 'Discount canvas and photo prints — everyday competitive pricing' },
  { id: 'canvasonthecheap', name: 'Canvas on the Cheap',       category: 'Print & Signs',  description: 'Budget canvas prints with frequent 40-70% off sales' },
  { id: 'infinitealoe',     name: 'Infinite Aloe',             category: 'Health',         description: 'Organic aloe vera skincare — sensitive skin, eczema, fragrance-free' },
  { id: 'littletoe',        name: 'Little Toe',                category: 'Health',         description: 'Orthopedic foot care — bunion correctors, toe separators, orthotics' },
  { id: 'combatflipflops',  name: 'Combat Flip Flops',         category: 'Lifestyle',      description: 'Mission-driven footwear by Army Rangers — funds landmine removal in Afghanistan' },
  { id: 'halloweencostumes',name: 'Halloween Costumes',        category: 'Lifestyle',      description: 'Halloween costume retailer — 10,000+ costumes for adults, kids, and pets' },
  { id: 'shoplww',          name: 'Shop LWW',                  category: 'Education',      description: 'Official Lippincott store — nursing and medical textbooks, NCLEX prep' },
  { id: 'bgmgirl',          name: 'BGM Girl',                  category: 'Services',       description: 'Royalty-free background music for YouTube, Twitch, podcasts, and creators' },
  { id: 'lafuent',          name: 'Lafuent',                   category: 'Services',       description: 'OEM and aftermarket auto parts — European, Asian, and American vehicles' },
  { id: 'taxextension',     name: 'Tax Extension',             category: 'Services',       description: 'Online federal tax extension filing — IRS Form 4868' },
];

// ─── Claude API call ──────────────────────────────────────────────────────────
function callClaude(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
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
          resolve(clean);
        } catch(e) {
          reject(new Error('Parse error: ' + e.message));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── Generate new topics ──────────────────────────────────────────────────────
async function generateTopics(existingSlugs, count) {
  // Pick merchants to write about — rotate through all 24
  const selected = [];
  const shuffled = [...MERCHANTS].sort(() => Math.random() - 0.5);
  for (let i = 0; i < count; i++) {
    selected.push(shuffled[i % shuffled.length]);
  }

  const merchantList = selected.map((m, i) =>
    `${i+1}. merchant_id: "${m.id}", name: "${m.name}", category: "${m.category}", description: "${m.description}"`
  ).join('\n');

  const existingList = Array.from(existingSlugs).slice(-30).join(', ');

  const prompt = `You are a content strategist for Brightlane, an affiliate blog covering 24 verified merchants.

Generate ${count} blog topic objects in JSON array format. Each topic should be a unique buyer guide, product review, comparison, or how-to article that targets real search intent.

Merchants to write about (use these exactly):
${merchantList}

Recently published slugs to AVOID duplicating:
${existingList}

Return ONLY a valid JSON array of ${count} topic objects. No markdown, no explanation.

Each object must have exactly these fields:
{
  "slug": "unique-url-slug-2026",
  "merchant": "merchant_id from list above",
  "published": false,
  "title_en": "Article title with year",
  "category_en": "Category matching the merchant",
  "metaDesc_en": "150 character SEO meta description",
  "keywords_en": "5 comma-separated keywords",
  "intro_en": "2-3 sentence introduction paragraph",
  "callout_en": "1 key insight or tip in a callout box",
  "h2a_en": "First H2 heading",
  "body1_en": "2-3 sentence body paragraph for h2a",
  "bullets_en": ["bullet 1", "bullet 2", "bullet 3", "bullet 4", "bullet 5"],
  "verdict_title_en": "Verdict headline",
  "verdict_desc_en": "2 sentence verdict description",
  "h2b_en": "Second H2 heading",
  "body2_en": "2-3 sentence body paragraph for h2b",
  "cta_en": "Primary CTA button text",
  "cta2_en": "Secondary CTA button text",
  "faqs_en": [
    {"q": "Question 1?", "a": "Answer 1."},
    {"q": "Question 2?", "a": "Answer 2."},
    {"q": "Question 3?", "a": "Answer 3."}
  ]
}

Topic angle ideas to use (mix these up):
- Product review with honest pros/cons
- Comparison vs competitor
- Buyer's guide for specific use case
- How-to guide using the product
- Money-saving guide
- Seasonal buying guide
- Problem-solution article
- Career/professional certification guide
- Step-by-step tutorial

Make each article genuinely useful to someone searching for that topic. Write naturally for English-speaking readers.`;

  console.log(`  🤖 Calling Claude API to generate ${count} topics...`);
  const result = await callClaude(prompt);
  const topics = JSON.parse(result);
  console.log(`  ✓ Generated ${topics.length} topics`);
  return topics;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const lmss = JSON.parse(fs.readFileSync(LMSS, 'utf8'));
  const queued = lmss.topics.filter(t => !t.published).length;
  const total  = lmss.topics.length;

  console.log(`📋 Queue check: ${queued} topics remaining of ${total} total`);

  if (queued >= MIN_QUEUE) {
    console.log(`✅ Queue healthy — no new topics needed (threshold: ${MIN_QUEUE})`);
    return;
  }

  console.log(`⚠️  Queue low (${queued} < ${MIN_QUEUE}) — generating ${NEW_BATCH} new topics...`);

  const existingSlugs = new Set(lmss.topics.map(t => t.slug));

  try {
    const newTopics = await generateTopics(existingSlugs, NEW_BATCH);

    // Filter out any duplicate slugs
    const unique = newTopics.filter(t => {
      if (existingSlugs.has(t.slug)) {
        console.log(`  ⚠ Skipping duplicate slug: ${t.slug}`);
        return false;
      }
      existingSlugs.add(t.slug);
      return true;
    });

    // Append to lmss
    lmss.topics.push(...unique);
    lmss.meta.total = lmss.topics.length;
    lmss.meta.last_updated = new Date().toISOString().split('T')[0];

    fs.writeFileSync(LMSS, JSON.stringify(lmss, null, 2), 'utf8');

    console.log(`✅ Added ${unique.length} new topics to queue`);
    console.log(`   Total topics: ${lmss.topics.length}`);
    console.log(`   New queue size: ${lmss.topics.filter(t => !t.published).length}`);

  } catch(e) {
    console.error(`❌ Auto-generation failed: ${e.message}`);
    console.log('   Continuing with existing queue...');
    // Don't exit with error — let inject.js run with whatever is in the queue
  }
}

main().catch(err => {
  console.error('❌ Fatal error in auto-topic-generator:', err.message);
  // Don't crash — let the workflow continue to inject.js
  process.exit(0);
});
