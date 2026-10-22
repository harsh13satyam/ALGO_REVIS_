/**
 * LeetCode Platform Adapter for AlgoRevis Chrome Extension
 */
function extractLeetCodeData() {
  const url = window.location.href;
  const pathname = window.location.pathname;

  // Verify this is a problem page
  const match = pathname.match(/\/problems\/([^/]+)/);
  if (!match) {
    return {
      isSupported: false,
      platform: 'LeetCode',
      message: 'Not an active LeetCode problem page. Open a problem (e.g., /problems/two-sum/) to save.'
    };
  }

  const slug = match[1];
  const canonicalUrl = `https://leetcode.com/problems/${slug}/`;

  // 1. Extract Problem Title
  let title = '';
  
  // Selector candidates in modern LeetCode UI
  const titleSelectors = [
    'div[data-cy="question-title"]',
    'div.text-title-large',
    'div.flex.items-start h4',
    'a[href*="/problems/"][class*="title"]',
    '.mr-2.text-label-1',
    'h4.text-lg.font-medium'
  ];

  for (const selector of titleSelectors) {
    const el = document.querySelector(selector);
    if (el && el.textContent.trim()) {
      title = el.textContent.trim();
      break;
    }
  }

  // Fallback: document.title usually looks like "1. Two Sum - LeetCode" or "Two Sum - LeetCode"
  if (!title && document.title) {
    const cleanTitle = document.title
      .replace(/\s*-\s*LeetCode.*$/i, '')
      .replace(/\s*-\s*Problems.*$/i, '')
      .trim();
    if (cleanTitle) title = cleanTitle;
  }

  // Fallback: slug formatted (two-sum -> Two Sum)
  if (!title) {
    title = slug
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  // 2. Extract Difficulty
  let difficulty = 'Medium';
  const diffSelectors = [
    'div[class*="text-difficulty-"]',
    'div[class*="text-olive"]',
    'div[class*="text-yellow"]',
    'div[class*="text-pink"]',
    'span[class*="text-olive"]',
    'span[class*="text-yellow"]',
    'span[class*="text-pink"]',
    'div.text-sd-easy',
    'div.text-sd-medium',
    'div.text-sd-hard'
  ];

  for (const sel of diffSelectors) {
    const el = document.querySelector(sel);
    if (el && el.textContent) {
      const text = el.textContent.trim().toLowerCase();
      if (text.includes('easy')) { difficulty = 'Easy'; break; }
      if (text.includes('medium')) { difficulty = 'Medium'; break; }
      if (text.includes('hard')) { difficulty = 'Hard'; break; }
    }
  }

  // Additional difficulty search in page text if still default
  if (difficulty === 'Medium') {
    const badgeElements = document.querySelectorAll('div, span');
    for (const b of badgeElements) {
      if (b.children.length === 0) {
        const txt = b.textContent.trim();
        if (txt === 'Easy') { difficulty = 'Easy'; break; }
        if (txt === 'Hard') { difficulty = 'Hard'; break; }
      }
    }
  }

  // 3. Extract Programming Language
  let language = '';
  // Try language button selector in LeetCode toolbar
  const langSelectors = [
    'button[id*="headlessui-listbox-button"]',
    'button.rounded.items-center',
    'div.flex.items-center button.text-xs',
    'div[class*="select"] button',
    'div.relative button'
  ];

  const knownLanguages = [
    'C++', 'Java', 'Python', 'Python3', 'C', 'C#', 'JavaScript', 
    'TypeScript', 'PHP', 'Swift', 'Kotlin', 'Dart', 'Go', 
    'Ruby', 'Scala', 'Rust', 'Racket', 'Erlang', 'Elixir'
  ];

  for (const sel of langSelectors) {
    const els = document.querySelectorAll(sel);
    for (const el of els) {
      const text = el.textContent.trim();
      const matched = knownLanguages.find(l => l.toLowerCase() === text.toLowerCase());
      if (matched) {
        language = matched;
        break;
      }
    }
    if (language) break;
  }

  // 4. Extract Editor Code
  let code = '';
  let codeSource = 'empty';

  // Strategy A: Collect Monaco editor view lines
  const lines = document.querySelectorAll('.monaco-editor .view-lines .view-line');
  if (lines && lines.length > 0) {
    const codeLines = Array.from(lines).map(line => line.textContent || '');
    code = codeLines.join('\n');
    if (code.trim()) {
      codeSource = 'auto';
    }
  }

  // Strategy B: Monaco text area or hidden inputs fallback
  if (!code.trim()) {
    const editorEl = document.querySelector('.monaco-editor');
    if (editorEl) {
      const text = editorEl.innerText || '';
      // Exclude line numbers if present
      const cleanLines = text.split('\n').filter(l => !/^\d+$/.test(l.trim()));
      if (cleanLines.length > 0) {
        code = cleanLines.join('\n');
        if (code.trim()) codeSource = 'auto';
      }
    }
  }

  return {
    isSupported: true,
    platform: 'LeetCode',
    problemTitle: title,
    problemUrl: canonicalUrl,
    problemId: slug,
    difficulty: difficulty,
    language: language || 'Python3',
    code: code.trim(),
    codeSource: code.trim() ? codeSource : 'empty'
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { extractLeetCodeData };
}
