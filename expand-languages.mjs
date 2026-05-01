/**
 * expand-languages.js — verified-merchant-directory
 * Expands language support in keywords.json in weekly batches:
 * Week 1: 20 langs → Week 2: 40 → Week 3: 60 → Week 4: 80 → Week 5: 100
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));

const ALL_LANGUAGES = [
  { code: 'en',  name: 'English',    locale: 'en-US' },
  { code: 'es',  name: 'Spanish',    locale: 'es-ES' },
  { code: 'fr',  name: 'French',     locale: 'fr-FR' },
  { code: 'de',  name: 'German',     locale: 'de-DE' },
  { code: 'pt',  name: 'Portuguese', locale: 'pt-BR' },
  { code: 'it',  name: 'Italian',    locale: 'it-IT' },
  { code: 'nl',  name: 'Dutch',      locale: 'nl-NL' },
  { code: 'pl',  name: 'Polish',     locale: 'pl-PL' },
  { code: 'ru',  name: 'Russian',    locale: 'ru-RU' },
  { code: 'ja',  name: 'Japanese',   locale: 'ja-JP' },
  { code: 'zh',  name: 'Chinese',    locale: 'zh-CN' },
  { code: 'ko',  name: 'Korean',     locale: 'ko-KR' },
  { code: 'ar',  name: 'Arabic',     locale: 'ar-SA' },
  { code: 'hi',  name: 'Hindi',      locale: 'hi-IN' },
  { code: 'tr',  name: 'Turkish',    locale: 'tr-TR' },
  { code: 'sv',  name: 'Swedish',    locale: 'sv-SE' },
  { code: 'da',  name: 'Danish',     locale: 'da-DK' },
  { code: 'no',  name: 'Norwegian',  locale: 'no-NO' },
  { code: 'fi',  name: 'Finnish',    locale: 'fi-FI' },
  { code: 'el',  name: 'Greek',      locale: 'el-GR' },
  { code: 'uk',  name: 'Ukrainian',  locale: 'uk-UA' },
  { code: 'cs',  name: 'Czech',      locale: 'cs-CZ' },
  { code: 'ro',  name: 'Romanian',   locale: 'ro-RO' },
  { code: 'hu',  name: 'Hungarian',  locale: 'hu-HU' },
  { code: 'id',  name: 'Indonesian', locale: 'id-ID' },
  { code: 'ms',  name: 'Malay',      locale: 'ms-MY' },
  { code: 'th',  name: 'Thai',       locale: 'th-TH' },
  { code: 'vi',  name: 'Vietnamese', locale: 'vi-VN' },
  { code: 'bg',  name: 'Bulgarian',  locale: 'bg-BG' },
  { code: 'hr',  name: 'Croatian',   locale: 'hr-HR' },
  { code: 'sk',  name: 'Slovak',     locale: 'sk-SK' },
  { code: 'lt',  name: 'Lithuanian', locale: 'lt-LT' },
  { code: 'lv',  name: 'Latvian',    locale: 'lv-LV' },
  { code: 'et',  name: 'Estonian',   locale: 'et-EE' },
  { code: 'he',  name: 'Hebrew',     locale: 'he-IL' },
  { code: 'fa',  name: 'Persian',    locale: 'fa-IR' },
  { code: 'bn',  name: 'Bengali',    locale: 'bn-BD' },
  { code: 'ta',  name: 'Tamil',      locale: 'ta-IN' },
  { code: 'sw',  name: 'Swahili',    locale: 'sw-KE' },
  { code: 'fil', name: 'Filipino',   locale: 'fil-PH' },
  { code: 'sq',  name: 'Albanian',   locale: 'sq-AL' },
  { code: 'sr',  name: 'Serbian',    locale: 'sr-RS' },
  { code: 'sl',  name: 'Slovenian',  locale: 'sl-SI' },
  { code: 'mk',  name: 'Macedonian', locale: 'mk-MK' },
  { code: 'bs',  name: 'Bosnian',    locale: 'bs-BA' },
  { code: 'ca',  name: 'Catalan',    locale: 'ca-ES' },
  { code: 'gl',  name: 'Galician',   locale: 'gl-ES' },
  { code: 'eu',  name: 'Basque',     locale: 'eu-ES' },
  { code: 'is',  name: 'Icelandic',  locale: 'is-IS' },
  { code: 'ga',  name: 'Irish',      locale: 'ga-IE' },
  { code: 'cy',  name: 'Welsh',      locale: 'cy-GB' },
  { code: 'mt',  name: 'Maltese',    locale: 'mt-MT' },
  { code: 'hy',  name: 'Armenian',   locale: 'hy-AM' },
  { code: 'ka',  name: 'Georgian',   locale: 'ka-GE' },
  { code: 'az',  name: 'Azerbaijani',locale: 'az-AZ' },
  { code: 'kk',  name: 'Kazakh',     locale: 'kk-KZ' },
  { code: 'uz',  name: 'Uzbek',      locale: 'uz-UZ' },
  { code: 'tk',  name: 'Turkmen',    locale: 'tk-TM' },
  { code: 'mn',  name: 'Mongolian',  locale: 'mn-MN' },
  { code: 'ur',  name: 'Urdu',       locale: 'ur-PK' },
  { code: 'ne',  name: 'Nepali',     locale: 'ne-NP' },
  { code: 'si',  name: 'Sinhala',    locale: 'si-LK' },
  { code: 'my',  name: 'Burmese',    locale: 'my-MM' },
  { code: 'km',  name: 'Khmer',      locale: 'km-KH' },
  { code: 'lo',  name: 'Lao',        locale: 'lo-LA' },
  { code: 'am',  name: 'Amharic',    locale: 'am-ET' },
  { code: 'ha',  name: 'Hausa',      locale: 'ha-NG' },
  { code: 'ig',  name: 'Igbo',       locale: 'ig-NG' },
  { code: 'yo',  name: 'Yoruba',     locale: 'yo-NG' },
  { code: 'so',  name: 'Somali',     locale: 'so-SO' },
  { code: 'rw',  name: 'Kinyarwanda',locale: 'rw-RW' },
  { code: 'tl',  name: 'Tagalog',    locale: 'tl-PH' },
  { code: 'ceb', name: 'Cebuano',    locale: 'ceb-PH' },
  { code: 'jv',  name: 'Javanese',   locale: 'jv-ID' },
  { code: 'su',  name: 'Sundanese',  locale: 'su-ID' },
  { code: 'mg',  name: 'Malagasy',   locale: 'mg-MG' },
  { code: 'ps',  name: 'Pashto',     locale: 'ps-AF' },
  { code: 'sd',  name: 'Sindhi',     locale: 'sd-PK' },
  { code: 'gu',  name: 'Gujarati',   locale: 'gu-IN' },
  { code: 'mr',  name: 'Marathi',    locale: 'mr-IN' },
  { code: 'pa',  name: 'Punjabi',    locale: 'pa-IN' },
  { code: 'te',  name: 'Telugu',     locale: 'te-IN' },
  { code: 'kn',  name: 'Kannada',    locale: 'kn-IN' },
  { code: 'ml',  name: 'Malayalam',  locale: 'ml-IN' },
  { code: 'or',  name: 'Odia',       locale: 'or-IN' },
  { code: 'xh',  name: 'Xhosa',      locale: 'xh-ZA' },
  { code: 'zu',  name: 'Zulu',       locale: 'zu-ZA' },
  { code: 'af',  name: 'Afrikaans',  locale: 'af-ZA' },
  { code: 'st',  name: 'Sesotho',    locale: 'st-ZA' },
  { code: 'sn',  name: 'Shona',      locale: 'sn-ZW' },
  { code: 'ny',  name: 'Chichewa',   locale: 'ny-MW' },
  { code: 'lb',  name: 'Luxembourgish',locale:'lb-LU'},
  { code: 'oc',  name: 'Occitan',    locale: 'oc-FR' },
  { code: 'br',  name: 'Breton',     locale: 'br-FR' },
  { code: 'fy',  name: 'Frisian',    locale: 'fy-NL' },
  { code: 'yi',  name: 'Yiddish',    locale: 'yi-001'},
  { code: 'eo',  name: 'Esperanto',  locale: 'eo'    },
  { code: 'la',  name: 'Latin',      locale: 'la'    },
  { code: 'haw', name: 'Hawaiian',   locale: 'haw-US'},
  { code: 'mi',  name: 'Maori',      locale: 'mi-NZ' },
];

const BATCH_SIZE = 20;

async function main() {
  const kwFile = resolve(__dir, 'keywords.json');
  const data   = JSON.parse(readFileSync(kwFile, 'utf-8'));
  const current = data.languages || [];
  const currentCodes = new Set(current.map(l => l.code));

  if (currentCodes.size >= ALL_LANGUAGES.length) {
    console.log(`✅ All ${ALL_LANGUAGES.length} languages already active`);
    return;
  }

  const nextBatch = ALL_LANGUAGES.filter(l => !currentCodes.has(l.code)).slice(0, BATCH_SIZE);
  if (nextBatch.length === 0) {
    console.log('✅ No new languages to add');
    return;
  }

  data.languages = [...current, ...nextBatch];
  writeFileSync(kwFile, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✅ Added ${nextBatch.length} new languages (total: ${data.languages.length})`);
  nextBatch.forEach(l => console.log(`  + ${l.code}: ${l.name}`));
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
