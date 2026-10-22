/**
 * AlgoRevis Chrome Extension - Popup Controller
 */

// Configuration constants
const DEFAULT_API_BASE = 'https://algorevis-backend.onrender.com';
const LOCAL_API_BASE = 'http://localhost:5000';

// State management
let state = {
  apiBaseUrl: DEFAULT_API_BASE,
  authToken: null,
  currentUser: null,
  activeTab: null,
  detectedData: null,
  existingProblemId: null,
  isCodeManuallyEdited: false
};

// DOM Elements
const elements = {
  // Header
  connectionStatus: document.getElementById('connectionStatus'),
  statusLabel: document.getElementById('statusLabel'),
  settingsToggleBtn: document.getElementById('settingsToggleBtn'),
  userChip: document.getElementById('userChip'),
  userAvatar: document.getElementById('userAvatar'),
  userName: document.getElementById('userName'),
  logoutBtn: document.getElementById('logoutBtn'),
  
  // Settings Drawer
  settingsDrawer: document.getElementById('settingsDrawer'),
  closeSettingsBtn: document.getElementById('closeSettingsBtn'),
  apiBaseInput: document.getElementById('apiBaseInput'),
  btnPresetProd: document.getElementById('btnPresetProd'),
  btnPresetLocal: document.getElementById('btnPresetLocal'),
  saveSettingsBtn: document.getElementById('saveSettingsBtn'),

  // Views
  viewAuth: document.getElementById('viewAuth'),
  viewWorkspace: document.getElementById('viewWorkspace'),

  // Auth elements
  loginForm: document.getElementById('loginForm'),
  loginEmail: document.getElementById('loginEmail'),
  loginPassword: document.getElementById('loginPassword'),
  authError: document.getElementById('authError'),
  loginSubmitBtn: document.getElementById('loginSubmitBtn'),
  loginSpinner: document.getElementById('loginSpinner'),
  openSignupLink: document.getElementById('openSignupLink'),

  // Workspace elements
  platformBanner: document.getElementById('platformBanner'),
  platformBadge: document.getElementById('platformBadge'),
  platformMessage: document.getElementById('platformMessage'),
  refreshDetectionBtn: document.getElementById('refreshDetectionBtn'),
  duplicateAlert: document.getElementById('duplicateAlert'),

  // Form Fields
  problemTitle: document.getElementById('problemTitle'),
  problemUrl: document.getElementById('problemUrl'),
  openOriginalUrlLink: document.getElementById('openOriginalUrlLink'),
  difficultyGroup: document.getElementById('difficultyGroup'),
  diffButtons: document.querySelectorAll('.diff-btn'),
  codeLanguage: document.getElementById('codeLanguage'),
  codeSourceBadge: document.getElementById('codeSourceBadge'),
  solutionCode: document.getElementById('solutionCode'),
  approachSelect: document.getElementById('approachSelect'),
  problemIntuition: document.getElementById('problemIntuition'),
  timeComplexity: document.getElementById('timeComplexity'),
  spaceComplexity: document.getElementById('spaceComplexity'),
  personalNotes: document.getElementById('personalNotes'),

  // Toast & Footer
  toastBanner: document.getElementById('toastBanner'),
  toastIcon: document.getElementById('toastIcon'),
  toastMessage: document.getElementById('toastMessage'),
  resetBtn: document.getElementById('resetBtn'),
  saveProblemBtn: document.getElementById('saveProblemBtn'),
  saveBtnLabel: document.getElementById('saveBtnLabel'),
  saveSpinner: document.getElementById('saveSpinner'),
  openWebLibraryLink: document.getElementById('openWebLibraryLink')
};

// ============================================================================
// Initialization
// ============================================================================
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await loadStoredConfig();
  await checkAuthSession();
});

// Load storage configuration
async function loadStoredConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['apiBaseUrl', 'authToken', 'currentUser'], (res) => {
      let base = res.apiBaseUrl || DEFAULT_API_BASE;
      if (base === 'https://algorevis-app.onrender.com' || base.includes('algorevis-app.onrender.com')) {
        base = DEFAULT_API_BASE;
        chrome.storage.local.set({ apiBaseUrl: DEFAULT_API_BASE });
      }
      state.apiBaseUrl = base;
      state.authToken = res.authToken || null;
      state.currentUser = res.currentUser || null;

      elements.apiBaseInput.value = state.apiBaseUrl;
      updatePresetButtons(state.apiBaseUrl);
      resolve();
    });
  });
}

// Check session with server
async function checkAuthSession() {
  if (!state.authToken) {
    showAuthView();
    return;
  }

  try {
    const res = await fetch(`${state.apiBaseUrl}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${state.authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.ok) {
      const data = await res.json();
      state.currentUser = data.user || state.currentUser;
      chrome.storage.local.set({ currentUser: state.currentUser });
      showWorkspaceView();
      await inspectActiveTab();
    } else {
      // Token invalid or expired
      state.authToken = null;
      state.currentUser = null;
      await chrome.storage.local.remove(['authToken', 'currentUser']);
      showAuthView('Session expired. Please sign in again.');
    }
  } catch (err) {
    console.warn('Session verification network error:', err);
    // If backend is waking up or offline, but we have cached token, proceed to workspace
    if (state.currentUser) {
      showWorkspaceView();
      await inspectActiveTab();
      setConnectionStatus(false, 'Backend waking up / offline');
    } else {
      showAuthView('Cannot connect to AlgoRevis server. Check network.');
    }
  }
}

// ============================================================================
// View Transitions
// ============================================================================
function showAuthView(errorMsg = null) {
  elements.viewAuth.classList.remove('hidden');
  elements.viewWorkspace.classList.add('hidden');
  elements.userChip.classList.add('hidden');

  if (errorMsg) {
    elements.authError.textContent = errorMsg;
    elements.authError.classList.remove('hidden');
  } else {
    elements.authError.classList.add('hidden');
  }
}

function showWorkspaceView() {
  elements.viewAuth.classList.add('hidden');
  elements.viewWorkspace.classList.remove('hidden');

  if (state.currentUser) {
    elements.userChip.classList.remove('hidden');
    elements.userName.textContent = state.currentUser.name || 'User';
    elements.userAvatar.textContent = (state.currentUser.name || 'U').charAt(0).toUpperCase();
  }
  setConnectionStatus(true, 'Connected');
}

function setConnectionStatus(isConnected, label) {
  const dot = elements.connectionStatus.querySelector('.status-dot');
  if (isConnected) {
    dot.className = 'status-dot connected';
    elements.statusLabel.textContent = label || 'Connected';
  } else {
    dot.className = 'status-dot offline';
    elements.statusLabel.textContent = label || 'Offline';
  }
}

// ============================================================================
// Platform Detection & Tab Inspection
// ============================================================================
async function inspectActiveTab() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) {
      setUnsupportedPlatform('No active tab detected');
      return;
    }

    const activeTab = tabs[0];
    state.activeTab = activeTab;

    const url = activeTab.url || '';
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
      setUnsupportedPlatform('System tab');
      return;
    }

    // Attempt message to content script
    try {
      const response = await chrome.tabs.sendMessage(activeTab.id, { action: 'EXTRACT_PROBLEM_DATA' });
      if (response && response.success && response.data) {
        handleExtractedData(response.data);
        return;
      }
    } catch {
      // Content script may not be injected yet (e.g. tab opened before extension load)
      console.log('Injecting content script programmatically...');
    }

    // Fallback: programmatically inject content script
    try {
      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ['scripts/content.js']
      });

      // Retry message
      const retryResponse = await chrome.tabs.sendMessage(activeTab.id, { action: 'EXTRACT_PROBLEM_DATA' });
      if (retryResponse && retryResponse.success && retryResponse.data) {
        handleExtractedData(retryResponse.data);
      } else {
        setUnsupportedPlatform('Unsupported webpage');
      }
    } catch (injErr) {
      console.warn('Script injection failed:', injErr);
      setUnsupportedPlatform('Not a supported coding platform');
    }

  } catch (err) {
    console.error('Inspect active tab error:', err);
    setUnsupportedPlatform('Tab inspection error');
  }
}

function handleExtractedData(data) {
  state.detectedData = data;

  if (!data.isSupported) {
    setUnsupportedPlatform(data.message || 'Unsupported page');
    return;
  }

  // Update platform badge
  elements.platformBadge.className = `platform-badge ${data.platform.toLowerCase()}`;
  elements.platformBadge.textContent = data.platform;
  elements.platformMessage.textContent = `${data.platform} problem detected`;

  // Pre-fill fields
  if (data.problemTitle) {
    elements.problemTitle.value = data.problemTitle;
  }
  if (data.problemUrl) {
    elements.problemUrl.value = data.problemUrl;
    elements.openOriginalUrlLink.classList.remove('hidden');
    elements.openOriginalUrlLink.href = data.problemUrl;
  }
  if (data.difficulty) {
    setSelectedDifficulty(data.difficulty);
  }
  if (data.language) {
    selectLanguageOption(data.language);
  }

  // Code population
  if (data.code && data.code.trim()) {
    elements.solutionCode.value = data.code;
    setCodeSourceBadge('auto');
    state.isCodeManuallyEdited = false;
  } else {
    setCodeSourceBadge('empty');
  }

  // Check if problem already exists in user's AlgoRevis library
  checkProblemExistence(data.problemUrl, data.problemId, data.platform);
}

function setUnsupportedPlatform(msg) {
  elements.platformBadge.className = 'platform-badge unsupported';
  elements.platformBadge.textContent = 'Manual Mode';
  elements.platformMessage.textContent = msg || 'Not a recognized problem page. You can still save manually.';
  setCodeSourceBadge('manual');
}

function setCodeSourceBadge(type) {
  if (type === 'auto') {
    elements.codeSourceBadge.className = 'code-source-badge auto';
    elements.codeSourceBadge.textContent = '⚡ Auto-Captured';
  } else if (type === 'manual') {
    elements.codeSourceBadge.className = 'code-source-badge manual';
    elements.codeSourceBadge.textContent = '✍ Manual Entry';
  } else {
    elements.codeSourceBadge.className = 'code-source-badge empty';
    elements.codeSourceBadge.textContent = 'No Code Detected';
  }
}

function setSelectedDifficulty(diff) {
  elements.diffButtons.forEach(btn => {
    if (btn.getAttribute('data-diff') === diff) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function getSelectedDifficulty() {
  const activeBtn = document.querySelector('.diff-btn.active');
  return activeBtn ? activeBtn.getAttribute('data-diff') : 'Medium';
}

function selectLanguageOption(langName) {
  const select = elements.codeLanguage;
  const target = langName.toLowerCase();
  for (let i = 0; i < select.options.length; i++) {
    const optVal = select.options[i].value.toLowerCase();
    if (optVal === target || (target.startsWith('py') && optVal.includes('python'))) {
      select.selectedIndex = i;
      return;
    }
  }
  // If not in standard list, set to 'Other'
  select.value = 'Other';
}

// ============================================================================
// Duplicate Detection & Check Endpoint
// ============================================================================
async function checkProblemExistence(url, problemId, platform) {
  if (!state.authToken || (!url && !problemId)) return;

  try {
    const queryParams = new URLSearchParams();
    if (url) queryParams.set('url', url);
    if (problemId) queryParams.set('problemId', problemId);
    if (platform) queryParams.set('platform', platform);

    const res = await fetch(`${state.apiBaseUrl}/api/problems/check?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${state.authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.exists && data.problem) {
        state.existingProblemId = data.problem._id;
        elements.duplicateAlert.classList.remove('hidden');
        elements.saveBtnLabel.textContent = 'Update in AlgoRevis';
        elements.saveProblemBtn.classList.add('update-mode');

        // Pre-fill any notes if currently empty
        if (!elements.problemIntuition.value && data.problem.intuition) {
          elements.problemIntuition.value = data.problem.intuition;
        }
        if (!elements.timeComplexity.value && data.problem.timeComplexity) {
          elements.timeComplexity.value = data.problem.timeComplexity;
        }
        if (!elements.spaceComplexity.value && data.problem.spaceComplexity) {
          elements.spaceComplexity.value = data.problem.spaceComplexity;
        }
        if (!elements.personalNotes.value && data.problem.notes) {
          elements.personalNotes.value = data.problem.notes;
        }
        if (data.problem.approach) {
          elements.approachSelect.value = data.problem.approach;
        }
      } else {
        resetDuplicateState();
      }
    }
  } catch (err) {
    console.warn('Check problem existence error:', err);
  }
}

function resetDuplicateState() {
  state.existingProblemId = null;
  elements.duplicateAlert.classList.add('hidden');
  elements.saveBtnLabel.textContent = 'Save Problem to AlgoRevis';
  elements.saveProblemBtn.classList.remove('update-mode');
}

// ============================================================================
// Save / Update Problem Flow
// ============================================================================
async function handleSaveProblem() {
  hideToast();

  const title = elements.problemTitle.value.trim();
  const link = elements.problemUrl.value.trim();
  const difficulty = getSelectedDifficulty();
  const language = elements.codeLanguage.value;
  const code = elements.solutionCode.value.trim();
  const approach = elements.approachSelect.value;
  const intuition = elements.problemIntuition.value.trim();
  const timeComplexity = elements.timeComplexity.value.trim();
  const spaceComplexity = elements.spaceComplexity.value.trim();
  const personalNotes = elements.personalNotes.value.trim();
  const platform = state.detectedData?.platform || 'Other';
  const problemId = state.detectedData?.problemId || '';

  if (!title) {
    showToast('error', 'Please enter a problem title');
    elements.problemTitle.focus();
    return;
  }

  // Prevent duplicate submissions while in-flight
  setSavingState(true);

  try {
    const payload = {
      name: title,
      title: title,
      link: link,
      url: link,
      difficulty: difficulty,
      platform: platform,
      problemId: problemId,
      language: language,
      code: code,
      approach: approach,
      pattern: approach,
      topic: approach,
      intuition: intuition,
      timeComplexity: timeComplexity,
      spaceComplexity: spaceComplexity,
      notes: personalNotes,
      updateIfDuplicate: true
    };

    let url = `${state.apiBaseUrl}/api/problems`;
    let method = 'POST';

    if (state.existingProblemId) {
      url = `${state.apiBaseUrl}/api/problems/${state.existingProblemId}`;
      method = 'PUT';
    }

    const response = await fetch(url, {
      method: method,
      headers: {
        'Authorization': `Bearer ${state.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => ({}));

    if (response.ok) {
      const savedProblem = result.problem;
      if (savedProblem && savedProblem._id) {
        state.existingProblemId = savedProblem._id;
      }
      elements.saveBtnLabel.textContent = 'Update in AlgoRevis';
      elements.saveProblemBtn.classList.add('update-mode');
      elements.duplicateAlert.classList.remove('hidden');

      showToast('success', state.existingProblemId ? 'Problem updated in AlgoRevis!' : 'Saved & scheduled for review tomorrow!');
    } else if (response.status === 409) {
      // Backend reported conflict
      elements.duplicateAlert.classList.remove('hidden');
      if (result.problem && result.problem._id) {
        state.existingProblemId = result.problem._id;
        elements.saveBtnLabel.textContent = 'Update in AlgoRevis';
        elements.saveProblemBtn.classList.add('update-mode');
        showToast('info', 'Problem already exists in your library. Click Update to save changes.');
      } else {
        showToast('error', result.message || 'Problem already exists in library');
      }
    } else if (response.status === 401) {
      showAuthView('Session expired. Please sign in again.');
    } else {
      showToast('error', result.message || `Failed to save (${response.status})`);
    }
  } catch (err) {
    console.error('Save problem error:', err);
    showToast('error', 'Network failure. Unable to reach AlgoRevis server.');
  } finally {
    setSavingState(false);
  }
}

function setSavingState(isSaving) {
  elements.saveProblemBtn.disabled = isSaving;
  elements.resetBtn.disabled = isSaving;
  if (isSaving) {
    elements.saveSpinner.classList.remove('hidden');
    elements.saveBtnLabel.textContent = state.existingProblemId ? 'Updating...' : 'Saving...';
  } else {
    elements.saveSpinner.classList.add('hidden');
    elements.saveBtnLabel.textContent = state.existingProblemId ? 'Update in AlgoRevis' : 'Save Problem to AlgoRevis';
  }
}

// ============================================================================
// Toast & Feedback
// ============================================================================
function showToast(type, message) {
  elements.toastBanner.className = `toast-banner ${type}`;
  elements.toastMessage.textContent = message;
  elements.toastBanner.classList.remove('hidden');
}

function hideToast() {
  elements.toastBanner.classList.add('hidden');
}

// ============================================================================
// Event Listeners
// ============================================================================
function setupEventListeners() {
  // Difficulty selection
  elements.diffButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.diffButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Code editor manual editing flag
  elements.solutionCode.addEventListener('input', () => {
    if (!state.isCodeManuallyEdited) {
      state.isCodeManuallyEdited = true;
      setCodeSourceBadge('manual');
    }
  });

  // Quick tags for time complexity
  document.getElementById('timeQuickTags')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('tag-btn')) {
      elements.timeComplexity.value = e.target.getAttribute('data-val');
    }
  });

  // Quick tags for space complexity
  document.getElementById('spaceQuickTags')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('tag-btn')) {
      elements.spaceComplexity.value = e.target.getAttribute('data-val');
    }
  });

  // Refresh detection
  elements.refreshDetectionBtn.addEventListener('click', async () => {
    elements.platformMessage.textContent = 'Re-analyzing tab...';
    await inspectActiveTab();
  });

  // Open problem in tab
  elements.openOriginalUrlLink.addEventListener('click', (e) => {
    e.preventDefault();
    const url = elements.problemUrl.value.trim();
    if (url) chrome.tabs.create({ url });
  });

  // Open web library
  elements.openWebLibraryLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://algorevis-app.onrender.com' });
  });

  // Open signup link
  elements.openSignupLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://algorevis-app.onrender.com' });
  });

  // Reset form
  elements.resetBtn.addEventListener('click', () => {
    if (confirm('Clear form fields and re-inspect current page?')) {
      elements.problemTitle.value = '';
      elements.problemUrl.value = '';
      elements.solutionCode.value = '';
      elements.problemIntuition.value = '';
      elements.timeComplexity.value = '';
      elements.spaceComplexity.value = '';
      elements.personalNotes.value = '';
      resetDuplicateState();
      inspectActiveTab();
    }
  });

  // Save button
  elements.saveProblemBtn.addEventListener('click', handleSaveProblem);

  // Login form submit
  elements.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    elements.authError.classList.add('hidden');
    elements.loginSubmitBtn.disabled = true;
    elements.loginSpinner.classList.remove('hidden');

    const email = elements.loginEmail.value.trim();
    const password = elements.loginPassword.value;

    try {
      const res = await fetch(`${state.apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.token) {
        state.authToken = data.token;
        state.currentUser = data.user || { name: data.name || email.split('@')[0], email };
        await chrome.storage.local.set({
          authToken: state.authToken,
          currentUser: state.currentUser
        });
        showWorkspaceView();
        await inspectActiveTab();
      } else {
        elements.authError.textContent = data.message || 'Invalid email or password';
        elements.authError.classList.remove('hidden');
      }
    } catch (err) {
      console.error('Login error:', err);
      elements.authError.textContent = 'Connection error. Verify server is running.';
      elements.authError.classList.remove('hidden');
    } finally {
      elements.loginSubmitBtn.disabled = false;
      elements.loginSpinner.classList.add('hidden');
    }
  });

  // Logout
  elements.logoutBtn.addEventListener('click', async () => {
    try {
      if (state.authToken) {
        await fetch(`${state.apiBaseUrl}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${state.authToken}` }
        }).catch(() => {});
      }
    } finally {
      state.authToken = null;
      state.currentUser = null;
      await chrome.storage.local.remove(['authToken', 'currentUser']);
      showAuthView('Logged out successfully.');
    }
  });

  // Settings drawer toggles
  elements.settingsToggleBtn.addEventListener('click', () => {
    elements.settingsDrawer.classList.toggle('hidden');
  });

  elements.closeSettingsBtn.addEventListener('click', () => {
    elements.settingsDrawer.classList.add('hidden');
  });

  elements.btnPresetProd.addEventListener('click', () => {
    elements.apiBaseInput.value = DEFAULT_API_BASE;
    updatePresetButtons(DEFAULT_API_BASE);
  });

  elements.btnPresetLocal.addEventListener('click', () => {
    elements.apiBaseInput.value = LOCAL_API_BASE;
    updatePresetButtons(LOCAL_API_BASE);
  });

  elements.saveSettingsBtn.addEventListener('click', async () => {
    const newUrl = elements.apiBaseInput.value.trim().replace(/\/+$/, '');
    if (!newUrl) return;

    state.apiBaseUrl = newUrl;
    await chrome.storage.local.set({ apiBaseUrl: newUrl });
    elements.settingsDrawer.classList.add('hidden');
    updatePresetButtons(newUrl);

    // Re-verify session with new API URL
    await checkAuthSession();
  });
}

function updatePresetButtons(url) {
  if (url === DEFAULT_API_BASE) {
    elements.btnPresetProd.classList.add('active');
    elements.btnPresetLocal.classList.remove('active');
  } else if (url === LOCAL_API_BASE) {
    elements.btnPresetLocal.classList.add('active');
    elements.btnPresetProd.classList.remove('active');
  } else {
    elements.btnPresetProd.classList.remove('active');
    elements.btnPresetLocal.classList.remove('active');
  }
}
