/**
 * generate-keywords.js — verified-merchant-directory
 * Adds 50 new high-volume keywords every week via GitHub Models
 * Targets all 22 merchants proportionally
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir        = dirname(fileURLToPath(import.meta.url));
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const AI_ENDPOINT  = 'https://models.inference.ai.azure.com';
const AI_MODEL     = 'gpt-4o-mini';

async function claude(prompt, maxTokens = 3000) {
  const res = await fetch(`${AI_ENDPOINT}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GITHUB_TOKEN}` },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

function parseJSON(raw) {
  let clean = raw.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  const start = clean.indexOf('[');
  const end   = clean.lastIndexOf(']');
  if (start !== -1 && end !== -1) clean = clean.slice(start, end + 1);
  return JSON.parse(clean);
}

async function main() {
  const kwFile = resolve(__dir, 'keywords.json');
  const data   = JSON.parse(readFileSync(kwFile, 'utf-8'));

  const existing  = new Set(data.keywords.map(k => k.keyword.toLowerCase()));
  const merchants = Object.keys(data.affiliate_map);
  const sample    = merchants.slice(0, 10).join(', ');

  const prompt = `You are an SEO keyword research expert. Generate 50 NEW high-volume search keywords for these affiliate merchants: ${sample}.

Rules:
- Each keyword must be genuinely searched (min 5,000 searches/month)
- Focus on buyer intent: review, vs, best, cheap, how to, alternatives
- No duplicates from this list: ${[...existing].slice(0, 30).join(', ')}
- Spread keywords across different merchants

Return ONLY a JSON array, no markdown:
[
  {
    "keyword": "keyword phrase here",
    "volume": 50000,
    "tool": "merchant_id",
    "category": "category",
    "intent": "commercial|informational|transactional",
    "priority": 2
  }
]

Merchants available: ${merchants.join(', ')}`;

  console.log('🔍 Generating 50 new keywords...');
  const raw      = await claude(prompt, 3000);
  const newKws   = parseJSON(raw);
  const filtered = newKws.filter(k =>
    k.keyword && k.tool && merchants.includes(k.tool) && !existing.has(k.keyword.toLowerCase())
  );

  data.keywords = [...data.keywords, ...filtered];
  data.meta.total_keywords = data.keywords.length;
  data.meta.last_updated   = new Date().toISOString().split('T')[0];

  writeFileSync(kwFile, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✅ Added ${filtered.length} new keywords (total: ${data.keywords.length})`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
