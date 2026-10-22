/**
 * AlgoRevis Chrome Extension - Content Script
 * Dispatches platform-specific adapters and communicates with popup.
 */

// ============================================================================
// 1. LEETCODE ADAPTER
// ============================================================================
function extractLeetCode() {
  const pathname = window.location.pathname;
  const match = pathname.match(/\/problems\/([^/]+)/);
  if (!match) {
    return {
      isSupported: false,
      platform: 'LeetCode',
      message: 'Active tab is LeetCode, but not an individual problem page. Please open a problem.'
    };
  }

  const slug = match[1];
  const canonicalUrl = `https://leetcode.com/problems/${slug}/`;

  // Title
  let title = '';
  const titleSelectors = [
    'div[data-cy="question-title"]',
    'div.text-title-large',
    'div.flex.items-start h4',
    'a[href*="/problems/"][class*="title"]',
    '.mr-2.text-label-1',
    'h4.text-lg.font-medium'
  ];
  for (const s of titleSelectors) {
    const el = document.querySelector(s);
    if (el && el.textContent.trim()) {
      title = el.textContent.trim();
      break;
    }
  }

  if (!title && document.title) {
    title = document.title
      .replace(/\s*-\s*LeetCode.*$/i, '')
      .replace(/\s*-\s*Problems.*$/i, '')
      .trim();
  }

  if (!title) {
    title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  // Difficulty
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

  // Language
  let language = '';
  const langSelectors = [
    'button[id*="headlessui-listbox-button"]',
    'div.flex.items-center button.text-xs',
    'div[class*="select"] button',
    'div.relative button'
  ];
  const knownLanguages = [
    'C++', 'Java', 'Python', 'Python3', 'C', 'C#', 'JavaScript', 
    'TypeScript', 'PHP', 'Swift', 'Kotlin', 'Dart', 'Go', 
    'Ruby', 'Scala', 'Rust'
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

  // Code from Monaco editor
  let code = '';
  let codeSource = 'empty';
  const lines = document.querySelectorAll('.monaco-editor .view-lines .view-line');
  if (lines && lines.length > 0) {
    const codeLines = Array.from(lines).map(line => line.textContent || '');
    code = codeLines.join('\n');
    if (code.trim()) codeSource = 'auto';
  }

  if (!code.trim()) {
    const editorEl = document.querySelector('.monaco-editor');
    if (editorEl) {
      const text = editorEl.innerText || '';
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

// ============================================================================
// 2. GEEKSFORGEEKS ADAPTER
// ============================================================================
function extractGeeksforGeeks() {
  const pathname = window.location.pathname;
  const isProblem = pathname.includes('/problems/') || pathname.includes('/practice.geeksforgeeks.org/');
  if (!isProblem) {
    return {
      isSupported: false,
      platform: 'GeeksforGeeks',
      message: 'Active tab is GeeksforGeeks, but not a practice problem. Open a problem to save.'
    };
  }

  const slugMatch = pathname.match(/\/problems\/([^/]+)/);
  const slug = slugMatch ? slugMatch[1] : '';
  const canonicalUrl = slug 
    ? `https://www.geeksforgeeks.org/problems/${slug}/1`
    : window.location.href.split('?')[0];

  // Title
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
      .trim();
  }

  if (!title && slug) {
    title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  // Difficulty
  let difficulty = 'Medium';
  const diffSelectors = ['.problem-tab__difficulty', 'span[class*="difficulty"]', '.g-m-0.problem-level'];
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

  // Language
  let language = '';
  const langSelectors = ['.header-language', 'div[class*="language"]', '.select-language'];
  for (const sel of langSelectors) {
    const el = document.querySelector(sel);
    if (el && el.textContent.trim()) {
      language = el.textContent.trim();
      break;
    }
  }

  // Code
  let code = '';
  let codeSource = 'empty';
  const aceLines = document.querySelectorAll('.ace_editor .ace_line');
  if (aceLines && aceLines.length > 0) {
    code = Array.from(aceLines).map(l => l.textContent || '').join('\n');
    if (code.trim()) codeSource = 'auto';
  }

  if (!code.trim()) {
    const monacoLines = document.querySelectorAll('.monaco-editor .view-lines .view-line');
    if (monacoLines && monacoLines.length > 0) {
      code = Array.from(monacoLines).map(l => l.textContent || '').join('\n');
      if (code.trim()) codeSource = 'auto';
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

// ============================================================================
// 3. CODEFORCES ADAPTER
// ============================================================================
function extractCodeforces() {
  const pathname = window.location.pathname;
  const isProblemset = pathname.match(/\/problemset\/problem\/(\d+)\/([A-Z0-9]+)/i);
  const isContest = pathname.match(/\/contest\/(\d+)\/problem\/([A-Z0-9]+)/i);

  if (!isProblemset && !isContest) {
    return {
      isSupported: false,
      platform: 'Codeforces',
      message: 'Active tab is Codeforces, but not a problem page. Open a problem to save.'
    };
  }

  const contestId = isProblemset ? isProblemset[1] : isContest[1];
  const index = (isProblemset ? isProblemset[2] : isContest[2]).toUpperCase();
  const problemId = `${contestId}${index}`;
  const canonicalUrl = `https://codeforces.com/problemset/problem/${contestId}/${index}`;

  // Title
  let title = '';
  const titleEl = document.querySelector('.problem-statement .header .title');
  if (titleEl) {
    title = titleEl.textContent.trim().replace(/^[A-Z0-9]+\.\s*/i, '');
  }

  if (!title && document.title) {
    title = document.title.replace(/\s*-\s*Codeforces.*$/i, '').trim();
  }

  if (!title) {
    title = `Problem ${problemId}`;
  }

  // Difficulty
  let difficulty = 'Medium';
  const ratingEl = document.querySelector('span[title="Difficulty"]');
  if (ratingEl) {
    const ratingStr = ratingEl.textContent.replace('*', '').trim();
    const rating = parseInt(ratingStr, 10);
    if (!isNaN(rating)) {
      if (rating < 1300) difficulty = 'Easy';
      else if (rating >= 1800) difficulty = 'Hard';
      else difficulty = 'Medium';
    }
  }

  // Code
  let code = '';
  let language = 'C++';
  let codeSource = 'empty';

  const sourceTextarea = document.querySelector('textarea[name="source"]');
  if (sourceTextarea && sourceTextarea.value && sourceTextarea.value.trim()) {
    code = sourceTextarea.value.trim();
    codeSource = 'auto';
  }

  if (!code.trim()) {
    const aceLines = document.querySelectorAll('.ace_editor .ace_line');
    if (aceLines && aceLines.length > 0) {
      code = Array.from(aceLines).map(l => l.textContent || '').join('\n').trim();
      if (code) codeSource = 'auto';
    }
  }

  const langSelect = document.querySelector('select[name="programTypeId"]');
  if (langSelect && langSelect.selectedOptions && langSelect.selectedOptions.length > 0) {
    const selectedText = langSelect.selectedOptions[0].textContent;
    if (selectedText.includes('C++') || selectedText.includes('GNU C++')) language = 'C++';
    else if (selectedText.includes('Python') || selectedText.includes('PyPy')) language = 'Python3';
    else if (selectedText.includes('Java')) language = 'Java';
    else if (selectedText.includes('JavaScript')) language = 'JavaScript';
    else if (selectedText.includes('Rust')) language = 'Rust';
    else if (selectedText.includes('Go')) language = 'Go';
  }

  return {
    isSupported: true,
    platform: 'Codeforces',
    problemTitle: title,
    problemUrl: canonicalUrl,
    problemId: problemId,
    difficulty: difficulty,
    language: language,
    code: code,
    codeSource: code ? codeSource : 'empty'
  };
}

// ============================================================================
// 4. MAIN DISPATCHER
// ============================================================================
function extractProblemData() {
  const host = window.location.hostname.toLowerCase();

  if (host.includes('leetcode.com')) {
    return extractLeetCode();
  }
  if (host.includes('geeksforgeeks.org')) {
    return extractGeeksforGeeks();
  }
  if (host.includes('codeforces.com')) {
    return extractCodeforces();
  }

  return {
    isSupported: false,
    platform: 'Unknown',
    message: 'Current tab is not a supported coding platform (LeetCode, GeeksforGeeks, or Codeforces).'
  };
}

// Expose on window for scripting.executeScript fallback
window.__ALGO_REVIS_EXTRACT__ = extractProblemData;

// Listen for messages from popup
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'EXTRACT_PROBLEM_DATA') {
      try {
        const data = extractProblemData();
        sendResponse({ success: true, data });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
      return true;
    }
  });
}
