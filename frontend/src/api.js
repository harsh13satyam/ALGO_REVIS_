const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const request = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;

  const headers = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers,
    credentials: 'include' // Strictly rely on secure HTTP-only cookies
  };

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const api = {
  // Authentication & OTP Verification
  registerInitiate: (payload) => request('/api/auth/register-initiate', { method: 'POST', body: JSON.stringify(payload) }),
  verifyEmailCode: (payload) => request('/api/auth/verify-email-code', { method: 'POST', body: JSON.stringify(payload) }),
  verifyPhoneCode: (payload) => request('/api/auth/verify-phone-code', { method: 'POST', body: JSON.stringify(payload) }),
  resendEmailCode: (payload) => request('/api/auth/resend-email-code', { method: 'POST', body: JSON.stringify(payload) }),
  resendPhoneCode: (payload) => request('/api/auth/resend-phone-code', { method: 'POST', body: JSON.stringify(payload) }),
  signup: (payload) => request('/api/auth/signup', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  getMe: () => request('/api/auth/me'),
  sendEmailOTP: () => request('/api/auth/send-email-otp', { method: 'POST' }),
  verifyEmailOTP: (otp) => request('/api/auth/verify-email-otp', { method: 'POST', body: JSON.stringify({ otp }) }),
  sendPhoneOTP: () => request('/api/auth/send-phone-otp', { method: 'POST' }),
  verifyPhoneOTP: (otp) => request('/api/auth/verify-phone-otp', { method: 'POST', body: JSON.stringify({ otp }) }),
  updatePreferences: (payload) => request('/api/auth/preferences', { method: 'PUT', body: JSON.stringify(payload) }),

  // Problems Management
  getProblems: () => request('/api/problems'),
  getDueProblems: () => request('/api/problems/queue/due'),
  createProblem: (payload) => request('/api/problems', { method: 'POST', body: JSON.stringify(payload) }),
  editProblem: (id, payload) => request(`/api/problems/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteProblem: (id) => request(`/api/problems/${id}`, { method: 'DELETE' }),
  renameFolder: (userName, oldPattern, newPattern) => 
    request(`/api/problems/folder/${encodeURIComponent(userName)}/${encodeURIComponent(oldPattern)}`, {
      method: 'PUT',
      body: JSON.stringify({ newPattern })
    }),
  deleteFolder: (userName, pattern) => 
    request(`/api/problems/folder/${encodeURIComponent(userName)}/${encodeURIComponent(pattern)}`, {
      method: 'DELETE'
    }),

  // Challenges, Compiler Workspace & Scheduler
  getTodayChallenge: () => request('/api/challenges/today'),
  getChallengeById: (id) => request(`/api/challenges/${id}`),
  getRandomChallenge: (folder = '', excludeId = '', problemId = '') => 
    request(`/api/challenges/random?folder=${encodeURIComponent(folder)}&excludeId=${encodeURIComponent(excludeId)}&problemId=${encodeURIComponent(problemId)}`),
  generateSimilarAIQuestion: (payload) => 
    request('/api/challenges/generate-similar', { method: 'POST', body: JSON.stringify(payload) }),
  getPracticeHistory: () => request('/api/challenges/practice-history'),
  simulateChallenge: () => request('/api/challenges/simulate', { method: 'POST' }),
  runCode: (payload) => request('/api/challenges/run-code', { method: 'POST', body: JSON.stringify(payload) }),
  submitCode: (payload) => request('/api/challenges/submit-code', { method: 'POST', body: JSON.stringify(payload) }),
  saveDraft: (payload) => request('/api/challenges/save-draft', { method: 'POST', body: JSON.stringify(payload) }),
  revealSolution: (payload) => request('/api/challenges/reveal-solution', { method: 'POST', body: JSON.stringify(payload) }),
  getChallengeHistory: () => request('/api/challenges/history/all'),

  // Health
  getHealth: () => request('/api/health')
};

export default api;
