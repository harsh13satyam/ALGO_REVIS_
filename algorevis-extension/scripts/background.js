/**
 * AlgoRevis Chrome Extension - Background Service Worker (Manifest V3)
 */

const DEFAULT_API_BASE = 'https://algorevis-app.onrender.com';

// Set default configuration on installation
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[AlgoRevis Extension] Installed/Updated:', details.reason);
  const data = await chrome.storage.local.get(['apiBaseUrl']);
  if (!data.apiBaseUrl) {
    await chrome.storage.local.set({ apiBaseUrl: DEFAULT_API_BASE });
  }
});

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'GET_CONFIG') {
    chrome.storage.local.get(['apiBaseUrl', 'authToken', 'currentUser'], (res) => {
      sendResponse(res);
    });
    return true;
  }
  
  if (request.action === 'OPEN_URL') {
    if (request.url) {
      chrome.tabs.create({ url: request.url });
      sendResponse({ success: true });
    }
    return true;
  }
});
