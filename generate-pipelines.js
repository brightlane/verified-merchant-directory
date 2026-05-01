/**
 * generate-pipelines.js — verified-merchant-directory
 * Generates 25 parallel blog pipeline yml files
 * Each pipeline handles 4 languages, runs 8x/day
 * 25 × 8 × 10 keywords × 100 langs = 200,000 pages/28 days
 *
 * RUN: node generate-pipelines.js
 */

import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));

const PIPELINE_LANGUAGES = [
  ['en','es','fr','de'],
  ['pt','it','nl','pl'],
  ['ru','ja','zh','ko'],
  ['ar','hi','tr','sv'],
  ['da','no','fi','el'],
  ['uk','cs','ro','hu'],
  ['id','ms','th','vi'],
  ['bg','hr','sk','lt'],
  ['lv','et','he','fa'],
  ['bn','ta','sw','fil'],
  ['sq','sr','sl','mk'],
  ['bs','ca','gl','eu'],
  ['is','ga','cy','mt'],
  ['hy','ka','az','kk'],
  ['uz','tk','mn','ur'],
  ['ne','si','my','km'],
  ['lo','am','ha','ig'],
  ['yo','so','rw','tl'],
  ['ceb','jv','su','mg'],
  ['ps','sd','gu','mr'],
  ['pa','te','kn','ml'],
  ['or','xh','zu','af'],
  ['st','sn','ny','lb'],
  ['oc','br','fy','yi'],
  ['eo','la','haw','mi'],
];

// 8 runs per day — staggered every 3 hours
const CRON_HOURS = [0, 3, 6, 9, 12, 15, 18, 21];

function generatePipelineYml(index, langs) {
  const num      = String(index + 1).padStart(2, '0');
  const langStr  = langs.join(' ');
  const langList = langs.join(',');

  // Stagger start minutes by pipeline number (2 min apart)
  const startMin = (index * 2) % 58;

  const cronJobs = CRON_HOURS.map(h => `    - cron: '${startMin} ${h} * * *'`).join('\n');

  return `name: Blog Pipeline ${num} [${langStr}]

on:
  schedule:
${cronJobs}
  workflow_dispatch:

permissions:
  contents: write
  models: read

jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 55

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 1
          token: \${{ secrets.GITHUB_TOKEN }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci --prefer-offline || npm install

      - name: Expand languages if due
        run: node expand-languages.js
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}

      - name: Generate 10 blog posts [${langStr}]
        run: node generate-blog-post.js --lang ${langList}
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}

      - name: Update sitemaps
        run: node generate-sitemaps.js
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          INDEXNOW_KEY: \${{ secrets.INDEXNOW_KEY }}

      - name: Update llms files
        run: node generate-llms.js
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}

      - name: Commit and push
        run: |
          git config user.name "Seo-bot"
          git config user.email "seo-bot@brightlane.dev"
          git add -A
          git stash || true
          git pull --rebase origin main || true
          git stash pop || true
          git add -A
          git diff --cached --quiet || git commit -m "blog[${num}]: publish 10 keywords × 100 langs [${langStr}] [skip ci]"
          git push origin main
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`;
}

function main() {
  const workflowDir = resolve(__dir, '.github', 'workflows');
  mkdirSync(workflowDir, { recursive: true });

  for (let i = 0; i < PIPELINE_LANGUAGES.length; i++) {
    const langs    = PIPELINE_LANGUAGES[i];
    const num      = String(i + 1).padStart(2, '0');
    const filename = resolve(workflowDir, `blog-pipeline-${num}.yml`);
    writeFileSync(filename, generatePipelineYml(i, langs), 'utf-8');
    console.log(`✅ blog-pipeline-${num}.yml [${langs.join(' ')}]`);
  }

  console.log(`\n🎉 Generated ${PIPELINE_LANGUAGES.length} pipeline files`);
  console.log(`📊 Scale: 25 pipelines × 8 runs/day × 10 keywords × 100 langs = 200,000 pages/28 days`);
}

main();
