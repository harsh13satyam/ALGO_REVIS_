/**
 * GeeksforGeeks Platform Adapter for AlgoRevis Chrome Extension
 */
function extractGeeksforGeeksData() {
  const url = window.location.href;
  const pathname = window.location.pathname;

  // Check if problem page
  const isProblem = pathname.includes('/problems/') || pathname.includes('/practice.geeksforgeeks.org/');
  if (!isProblem) {
    return {
      isSupported: false,
      platform: 'GeeksforGeeks',
      message: 'Not an active GeeksforGeeks problem page. Navigate to a problem in practice/problems.'
    };
  }

  // 1. Extract Problem Slug / ID
  const slugMatch = pathname.match(/\/problems\/([^/]+)/);
  const slug = slugMatch ? slugMatch[1] : '';
  const canonicalUrl = slug 
    ? `https://www.geeksforgeeks.org/problems/${slug}/1`
    : url.split('?')[0];

  // 2. Extract Problem Title
  let title = '';
  const titleSelectors = [
    'h3.problem-tab__title',
    '.problems_header_content__title',
    'h1.problem-name',
    'h2.g-m-0',
    'h3[class*="title"]',
    'h1',
    'h2',
    'h3'
  ];

  for (const sel of titleSelectors) {
    const el = document.querySelector(sel);
    if (el && el.textContent.trim()) {
      const text = el.textContent.trim();
      // Skip generic text
      if (!text.toLowerCase().includes('problems') && !text.toLowerCase().includes('geeksforgeeks') && text.length > 2) {
        title = text;
        break;
      }
    }
  }

  if (!title && document.title) {
    title = document.title
      .replace(/\s*\|\s*Practice.*$/i, '')
      .replace(/\s*-\s*GeeksforGeeks.*$/i, '')
      .replace(/Practice Problems\s*\|\s*/i, '')
      .trim();
  }

  if (!title && slug) {
    title = slug
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  // 3. Extract Difficulty
  let difficulty = 'Medium';
  const diffSelectors = [
    '.problem-tab__difficulty',
    'span[class*="difficulty"]',
    'div[class*="difficulty"]',
    '.g-m-0.problem-level'
  ];

  for (const sel of diffSelectors) {
    const el = document.querySelector(sel);
    if (el && el.textContent) {
      const text = el.textContent.trim().toLowerCase();
      if (text.includes('school') || text.includes('basic') || text.includes('easy')) {
        difficulty = 'Easy';
        break;
      }
      if (text.includes('medium')) {
        difficulty = 'Medium';
        break;
      }
      if (text.includes('hard')) {
        difficulty = 'Hard';
        break;
      }
    }
  }

  // 4. Extract Language
  let language = '';
  const langSelectors = [
    '.header-language',
    'div[class*="language"]',
    '.select-language',
    'button[class*="language"]'
  ];

  for (const sel of langSelectors) {
    const el = document.querySelector(sel);
    if (el && el.textContent.trim()) {
      language = el.textContent.trim();
      break;
    }
  }

  // 5. Extract Code
  let code = '';
  let codeSource = 'empty';

  // Strategy A: Ace Editor in GFG
  const aceLines = document.querySelectorAll('.ace_editor .ace_line');
  if (aceLines && aceLines.length > 0) {
    const lines = Array.from(aceLines).map(l => l.textContent || '');
    code = lines.join('\n');
    if (code.trim()) codeSource = 'auto';
  }

  // Strategy B: Monaco Editor in newer GFG
  if (!code.trim()) {
    const monacoLines = document.querySelectorAll('.monaco-editor .view-lines .view-line');
    if (monacoLines && monacoLines.length > 0) {
      const lines = Array.from(monacoLines).map(l => l.textContent || '');
      code = lines.join('\n');
      if (code.trim()) codeSource = 'auto';
    }
  }

  // Strategy C: Textarea fallback
  if (!code.trim()) {
    const textarea = document.querySelector('textarea.ace_text-input, textarea.inputarea');
    if (textarea && textarea.value && textarea.value.trim().length > 10) {
      code = textarea.value.trim();
      codeSource = 'auto';
    }
  }

  return {
    isSupported: true,
    platform: 'GeeksforGeeks',
    problemTitle: title,
    problemUrl: canonicalUrl,
    problemId: slug || '',
    difficulty: difficulty,
    language: language || 'C++',
    code: code.trim(),
    codeSource: code.trim() ? codeSource : 'empty'
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { extractGeeksforGeeksData };
}
