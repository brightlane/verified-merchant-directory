// ═══════════════════════════════════════════════════════════════════════
//  BRIGHTLANE LANGUAGE DETECTOR
//  Add this script to index.html and all blog files
//  It reads the visitor's browser language and redirects silently
//  Works on GitHub Pages — no server required
// ═══════════════════════════════════════════════════════════════════════

(function() {

  // ── Don't redirect if user already chose a language manually
  // ── We store their choice in sessionStorage so it persists the session
  const STORAGE_KEY = 'brightlane_lang_chosen';
  if (sessionStorage.getItem(STORAGE_KEY)) return;

  // ── Get current page filename
  const current = window.location.pathname.split('/').pop() || 'index.html';

  // ── Get browser language (e.g. "de-DE", "zh-CN", "fr-FR")
  const lang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();

  // ── Language map — what prefix maps to which blog file
  const MAP = [
    { prefixes: ['de'],    file: 'blog-de.html' },
    { prefixes: ['zh'],    file: 'blog-zh.html' },
    { prefixes: ['es'],    file: 'blog-es.html' },
    { prefixes: ['fr'],    file: 'blog-fr.html' },
    { prefixes: ['en'],    file: 'blog.html'    },
  ];

  // ── Files that are language-specific blog pages
  const BLOG_FILES = ['blog.html','blog-de.html','blog-zh.html','blog-es.html','blog-fr.html'];

  // ── Only redirect if we're on a blog page or index
  const isIndex = current === 'index.html' || current === '';
  const isBlog  = BLOG_FILES.includes(current);
  if (!isIndex && !isBlog) return;

  // ── Find matching language
  let targetFile = 'blog.html'; // default English
  for (const entry of MAP) {
    if (entry.prefixes.some(p => lang.startsWith(p))) {
      targetFile = entry.file;
      break;
    }
  }

  // ── If we're already on the right file, do nothing
  if (current === targetFile) return;

  // ── If on index, only redirect to blog if language is non-English
  if (isIndex && targetFile === 'blog.html') return;

  // ── Preserve ?p= query param if present (so blog post links still work)
  const params = window.location.search;

  // ── Build redirect URL
  const base = window.location.href.replace(window.location.pathname + window.location.search, '');
  const dir  = window.location.pathname.replace(current, '');
  const target = base + dir + targetFile + params;

  // ── Redirect
  window.location.replace(target);

})();
