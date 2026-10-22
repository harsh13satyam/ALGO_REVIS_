/**
 * Codeforces Platform Adapter for AlgoRevis Chrome Extension
 */
function extractCodeforcesData() {
  const url = window.location.href;
  const pathname = window.location.pathname;

  // Codeforces URLs look like:
  // /problemset/problem/4/A
  // /contest/1234/problem/B
  const isProblemset = pathname.match(/\/problemset\/problem\/(\d+)\/([A-Z0-9]+)/i);
  const isContest = pathname.match(/\/contest\/(\d+)\/problem\/([A-Z0-9]+)/i);

  if (!isProblemset && !isContest) {
    return {
      isSupported: false,
      platform: 'Codeforces',
      message: 'Not an active Codeforces problem page. Navigate to a problem (e.g., /problemset/problem/4/A).'
    };
  }

  const contestId = (isProblemset ? isProblemset[1] : isContest[1]);
  const index = (isProblemset ? isProblemset[2] : isContest[2]).toUpperCase();
  const problemId = `${contestId}${index}`;
  const canonicalUrl = `https://codeforces.com/problemset/problem/${contestId}/${index}`;

  // 1. Extract Problem Title
  let title = '';
  const titleEl = document.querySelector('.problem-statement .header .title');
  if (titleEl) {
    title = titleEl.textContent.trim();
    // Titles in CF usually have index prefix like "A. Watermelon"
    // Keep it or clean index prefix
    if (/^[A-Z0-9]+\.\s*/i.test(title)) {
      title = title.replace(/^[A-Z0-9]+\.\s*/i, '');
    }
  }

  if (!title && document.title) {
    title = document.title
      .replace(/\s*-\s*Codeforces.*$/i, '')
      .replace(/Problem\s*-\s*/i, '')
      .trim();
  }

  if (!title) {
    title = `Problem ${problemId}`;
  }

  // 2. Extract Difficulty / Rating
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
  } else {
    // Search tags for difficulty number
    const tags = document.querySelectorAll('.tag-box');
    for (const tag of tags) {
      const txt = tag.textContent.trim();
      const m = txt.match(/\*(\d+)/);
      if (m) {
        const rating = parseInt(m[1], 10);
        if (rating < 1300) difficulty = 'Easy';
        else if (rating >= 1800) difficulty = 'Hard';
        else difficulty = 'Medium';
        break;
      }
    }
  }

  // 3. Extract Code & Language
  let code = '';
  let language = 'C++';
  let codeSource = 'empty';

  // Strategy A: Check source textarea on page if submit form is present
  const sourceTextarea = document.querySelector('textarea[name="source"]');
  if (sourceTextarea && sourceTextarea.value && sourceTextarea.value.trim()) {
    code = sourceTextarea.value.trim();
    codeSource = 'auto';
  }

  // Strategy B: Check ace editor if present on CF
  if (!code.trim()) {
    const aceLines = document.querySelectorAll('.ace_editor .ace_line');
    if (aceLines && aceLines.length > 0) {
      code = Array.from(aceLines).map(l => l.textContent || '').join('\n').trim();
      if (code) codeSource = 'auto';
    }
  }

  // Strategy C: Check language dropdown in submit form
  const langSelect = document.querySelector('select[name="programTypeId"]');
  if (langSelect && langSelect.selectedOptions && langSelect.selectedOptions.length > 0) {
    const selectedText = langSelect.selectedOptions[0].textContent;
    if (selectedText.includes('C++') || selectedText.includes('GNU C++')) language = 'C++';
    else if (selectedText.includes('Python') || selectedText.includes('PyPy')) language = 'Python3';
    else if (selectedText.includes('Java')) language = 'Java';
    else if (selectedText.includes('JavaScript') || selectedText.includes('Node')) language = 'JavaScript';
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { extractCodeforcesData };
}
