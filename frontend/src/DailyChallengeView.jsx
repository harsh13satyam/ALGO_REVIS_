import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import api from './api';

const DEFAULT_STARTER_CODE = {
  javascript: `// Write your algorithmic solution here
function solution(input) {
  // Your code here
  return input;
}`,
  python: `# Write your algorithmic solution here
def solution(*args):
    # Your code here
    return args[0] if args else None
`,
  cpp: `// Write your algorithmic solution here
#include <iostream>
#include <vector>
#include <string>

using namespace std;

int main() {
    // Read input from stdin if applicable
    string input;
    if (cin >> input) {
        cout << input << endl;
    }
    return 0;
}
`
};

const DailyChallengeView = ({ navigate, params = {} }) => {
  const [challenge, setChallenge] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workspaceMode, setWorkspaceMode] = useState('daily'); // 'daily' or 'random'
  const [activeQuestion, setActiveQuestion] = useState('A'); // 'A' (Saved) or 'B' (AI)
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(DEFAULT_STARTER_CODE.javascript);
  const [customInput, setCustomInput] = useState('');
  const [useCustomInput, setUseCustomInput] = useState(false);
  const [outputConsole, setOutputConsole] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftSavedMsg, setDraftSavedMsg] = useState('');
  const [revealedSolution, setRevealedSolution] = useState(null);
  const [revealError, setRevealError] = useState('');

  // Random Practice & Folder state
  const [availableFolders, setAvailableFolders] = useState([]);
  const [allSavedProblems, setAllSavedProblems] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [isFetchingRandom, setIsFetchingRandom] = useState(false);
  const [randomNotice, setRandomNotice] = useState('');

  // AI Generation state
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiGenError, setAiGenError] = useState('');

  // Practice History modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [practiceHistory, setPracticeHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all', 'saved', 'ai'

  // Verification modals state
  const [showEmailOtpModal, setShowEmailOtpModal] = useState(false);
  const [showPhoneOtpModal, setShowPhoneOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpStatusMsg, setOtpStatusMsg] = useState('');
  const [otpErrorMsg, setOtpErrorMsg] = useState('');

  // Simulation & Settings state
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [dueProblems, setDueProblems] = useState([]);
  const [history, setHistory] = useState([]);
  const [deliveryLogs, setDeliveryLogs] = useState([]);

  // Preferences form
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [whatsappConsent, setWhatsappConsent] = useState(false);
  const [emailConsent, setEmailConsent] = useState(true);
  const [deliveryTime, setDeliveryTime] = useState('09:00');
  const [deliveryTimezone, setDeliveryTimezone] = useState('UTC');
  const [prefSavedMsg, setPrefSavedMsg] = useState('');

  const loadData = async (forceRandom = false, targetFolder = null) => {
    setLoading(true);
    setRandomNotice('');
    setAiGenError('');
    try {
      // 1. Fetch user profile
      const meData = await api.getMe();
      if (meData?.user) {
        setUser(meData.user);
        setEmailEnabled(meData.user.deliveryPreferences?.emailEnabled ?? true);
        setWhatsappEnabled(meData.user.deliveryPreferences?.whatsappEnabled ?? false);
        setPhoneInput(meData.user.phone || '');
        setWhatsappConsent(meData.user.whatsappConsent || false);
        setEmailConsent(meData.user.emailConsent ?? true);
        setDeliveryTime(meData.user.deliveryPreferences?.time || '09:00');
        setDeliveryTimezone(meData.user.deliveryPreferences?.timezone || 'UTC');
      }

      // Check URL query params & params props
      const urlParams = new URLSearchParams(window.location.search);
      const isRandomMode = forceRandom || params.mode === 'random' || urlParams.get('mode') === 'random';
      const targetChallengeId = params.challengeId || urlParams.get('challengeId');
      const targetQ = params.q || urlParams.get('q');
      const initFolder = targetFolder || params.folder || urlParams.get('folder') || 'all';

      if (isRandomMode) {
        setWorkspaceMode('random');
        setSelectedFolder(initFolder);
        await fetchRandomQuestion(initFolder);
      } else {
        setWorkspaceMode('daily');
        if (targetQ === 'A' || targetQ === 'B') {
          setActiveQuestion(targetQ);
        } else {
          setActiveQuestion('B'); // Default daily view
        }

        let chalData = null;
        if (targetChallengeId) {
          try {
            chalData = await api.getChallengeById(targetChallengeId);
          } catch {
            chalData = await api.getTodayChallenge();
          }
        } else {
          chalData = await api.getTodayChallenge();
        }

        setChallenge(chalData);
        initializeEditorCode(chalData, targetQ || 'B');
      }

      // Fetch distinct problem folders and saved problems
      try {
        const probs = await api.getProblems();
        if (Array.isArray(probs)) {
          setAllSavedProblems(probs);
          const uniquePatterns = [...new Set(probs.map(p => p.pattern).filter(Boolean))];
          setAvailableFolders(uniquePatterns);
        }
      } catch {}

      // Fetch due problems for revision queue
      try {
        const dues = await api.getDueProblems();
        if (Array.isArray(dues)) setDueProblems(dues);
      } catch {}

      // Fetch history & audit logs
      try {
        const histData = await api.getChallengeHistory();
        if (histData?.challenges) setHistory(histData.challenges);
        if (histData?.deliveryLogs) setDeliveryLogs(histData.deliveryLogs);
      } catch {}

    } catch (err) {
      console.error('Failed to load workspace data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const initializeEditorCode = (chalData, qKey) => {
    const currentQKey = qKey === 'A' ? 'questionA' : 'questionB';
    const existingDraft = chalData?.userDrafts?.[currentQKey];
    if (existingDraft?.code) {
      setCode(existingDraft.code);
      setLanguage(existingDraft.language || 'javascript');
    } else if (qKey === 'B' && chalData?.questionB?.starterCode?.[language]) {
      setCode(chalData.questionB.starterCode[language]);
    } else if (qKey === 'B' && chalData?.questionB?.referenceSolution) {
      setCode(DEFAULT_STARTER_CODE[language] || chalData.questionB.referenceSolution);
    } else {
      setCode(DEFAULT_STARTER_CODE[language]);
    }
  };

  // Fetch a random saved question from user's MongoDB collection
  const fetchRandomQuestion = async (folderToUse = selectedFolder) => {
    setIsFetchingRandom(true);
    setRandomNotice('');
    setAiGenError('');
    setOutputConsole(null);
    setRevealedSolution(null);
    try {
      const folderQuery = folderToUse === 'all' ? '' : folderToUse;
      const currentProbId = challenge?.questionA?.problemId || '';
      const res = await api.getRandomChallenge(folderQuery, currentProbId);

      if (res?.challenge) {
        setChallenge(res.challenge);
        setActiveQuestion('A'); // Start on the saved question
        initializeEditorCode(res.challenge, 'A');
        if (res.folders) setAvailableFolders(res.folders);
        setRandomNotice(`Loaded "${res.challenge.questionA.name}" from folder "${res.challenge.questionA.pattern}".`);
        setTimeout(() => setRandomNotice(''), 4000);
      }
    } catch (err) {
      setRandomNotice(err.message || 'No saved questions found in this folder.');
    } finally {
      setIsFetchingRandom(false);
    }
  };

  // Switch between Daily Challenge mode and Random Practice mode
  const handleToggleMode = (newMode) => {
    setWorkspaceMode(newMode);
    if (newMode === 'random') {
      fetchRandomQuestion(selectedFolder);
    } else {
      loadData(false);
    }
  };

  // Switch between Question A and Question B tabs
  const handleSelectQuestion = (qKey) => {
    setActiveQuestion(qKey);
    setRevealedSolution(null);
    setOutputConsole(null);
    initializeEditorCode(challenge, qKey);
  };

  // Generate an original similar question using AI inspired by Question A
  const handleGenerateSimilarAI = async () => {
    if (!challenge?._id) return;
    setIsGeneratingAI(true);
    setAiGenError('');
    setOutputConsole(null);
    try {
      const res = await api.generateSimilarAIQuestion({
        challengeId: challenge._id,
        sourceQuestionId: challenge.questionA.problemId
      });

      if (res?.challenge) {
        setChallenge(res.challenge);
        setActiveQuestion('B'); // Automatically open newly generated question
        initializeEditorCode(res.challenge, 'B');
      }
    } catch (err) {
      setAiGenError(err.message || 'AI problem generation failed. Please try again.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Open practice history modal
  const handleOpenPracticeHistory = async () => {
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const res = await api.getPracticeHistory();
      setPracticeHistory(res?.attempts || []);
    } catch (err) {
      console.error('Failed to load practice history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Change programming language in editor
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    const starter = activeQuestion === 'B' && challenge?.questionB?.starterCode?.[newLang]
      ? challenge.questionB.starterCode[newLang]
      : DEFAULT_STARTER_CODE[newLang] || '';
    setCode(starter);
  };

  // Run Code (sample or custom input)
  const handleRunCode = async () => {
    setIsRunning(true);
    setOutputConsole(null);
    try {
      const q = activeQuestion === 'A' ? challenge.questionA : challenge.questionB;
      const sampleInput = useCustomInput 
        ? customInput 
        : (q.testCases?.[0]?.input || q.examples?.[0]?.input || '');

      const res = await api.runCode({
        code,
        language,
        customInput: sampleInput
      });

      setOutputConsole({
        type: 'run',
        input: sampleInput,
        stdout: res.stdout,
        stderr: res.stderr,
        error: res.error,
        executionTimeMs: res.executionTimeMs
      });
    } catch (err) {
      setOutputConsole({
        type: 'run',
        error: err.message
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Submit Code (evaluates against test cases suite)
  const handleSubmitCode = async () => {
    if (!challenge?._id) return;
    setIsSubmitting(true);
    setOutputConsole(null);
    try {
      const evalRes = await api.submitCode({
        challengeId: challenge._id,
        questionType: activeQuestion,
        code,
        language,
        customInput: useCustomInput ? customInput : ''
      });

      setOutputConsole({
        type: 'submit',
        allPassed: evalRes.allPassed,
        passedCount: evalRes.passedCount,
        totalCount: evalRes.totalCount,
        results: evalRes.results
      });

      if (evalRes.completed) {
        // Refresh challenge completion state
        if (challenge._id) {
          try {
            const updated = await api.getChallengeById(challenge._id);
            setChallenge(updated);
          } catch {}
        }
      }
    } catch (err) {
      setOutputConsole({
        type: 'submit',
        error: err.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Draft in MongoDB
  const handleSaveDraft = async () => {
    if (!challenge?._id) return;
    try {
      await api.saveDraft({
        challengeId: challenge._id,
        questionType: activeQuestion,
        code,
        language
      });
      setDraftSavedMsg('Draft saved in MongoDB');
      setTimeout(() => setDraftSavedMsg(''), 3000);
    } catch (err) {
      alert('Error saving draft: ' + err.message);
    }
  };

  // Reveal Reference Solution (gated by attempt)
  const handleRevealSolution = async () => {
    setRevealError('');
    try {
      const res = await api.revealSolution({
        challengeId: challenge._id,
        questionType: activeQuestion
      });
      setRevealedSolution(res);
    } catch (err) {
      setRevealError(err.message);
    }
  };

  // Send & Verify Email OTP
  const handleSendEmailOtp = async () => {
    setOtpErrorMsg('');
    setOtpStatusMsg('Sending code...');
    try {
      const res = await api.sendEmailOTP();
      setOtpStatusMsg(res.message);
    } catch (err) {
      setOtpErrorMsg(err.message);
      setOtpStatusMsg('');
    }
  };

  const handleVerifyEmailOtp = async () => {
    setOtpErrorMsg('');
    try {
      const res = await api.verifyEmailOTP(otpInput);
      setUser(res.user);
      setShowEmailOtpModal(false);
      setOtpInput('');
      alert('Email verified successfully!');
    } catch (err) {
      setOtpErrorMsg(err.message);
    }
  };

  // Send & Verify Phone OTP
  const handleSendPhoneOtp = async () => {
    setOtpErrorMsg('');
    setOtpStatusMsg('Sending verification code...');
    try {
      const res = await api.sendPhoneOTP();
      setOtpStatusMsg(res.message);
    } catch (err) {
      setOtpErrorMsg(err.message);
      setOtpStatusMsg('');
    }
  };

  const handleVerifyPhoneOtp = async () => {
    setOtpErrorMsg('');
    try {
      const res = await api.verifyPhoneOTP(otpInput);
      setUser(res.user);
      setShowPhoneOtpModal(false);
      setOtpInput('');
      alert('Phone number verified successfully!');
    } catch (err) {
      setOtpErrorMsg(err.message);
    }
  };

  // Immediate Simulation Trigger
  const handleSimulate = async () => {
    setSimulating(true);
    setSimulationResult(null);
    try {
      const res = await api.simulateChallenge();
      setSimulationResult(res);
      await loadData();
    } catch (err) {
      setSimulationResult({ error: err.message });
    } finally {
      setSimulating(false);
    }
  };

  // Save Notification Preferences
  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setPrefSavedMsg('');
    try {
      const res = await api.updatePreferences({
        deliveryPreferences: {
          emailEnabled,
          whatsappEnabled,
          time: deliveryTime,
          timezone: deliveryTimezone
        },
        phone: phoneInput,
        whatsappConsent,
        emailConsent
      });
      setUser(res.user);
      setPrefSavedMsg('Settings saved successfully!');
      setTimeout(() => setPrefSavedMsg(''), 4000);
    } catch (err) {
      alert('Error saving preferences: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-mono text-sm">Loading AlgoRevis Coding Workspace...</p>
        </div>
      </div>
    );
  }

  const currentQ = activeQuestion === 'A' ? challenge?.questionA : challenge?.questionB;
  const isQuestionA = activeQuestion === 'A';
  const hasQuestionBGenerated = challenge?.questionB?.statement && 
    !challenge?.questionB?.statement.includes('Click the "⚡ Generate Similar AI Question"');

  const filteredHistory = practiceHistory.filter(item => {
    if (historyFilter === 'saved') return item.questionSource === 'saved';
    if (historyFilter === 'ai') return item.questionSource === 'ai';
    return true;
  });

  // Collect all available URL links for this problem (including same-name problems across folders)
  const resolveProblemLinks = () => {
    if (!isQuestionA) return [];

    const normUrl = (url) => (url ? url.trim().replace(/\/+$/, '') : '');
    const rawLinks = challenge?.questionA?.allLinks || [];
    const primaryLink = challenge?.questionA?.link;
    const currentTitle = (challenge?.questionA?.name || challenge?.questionA?.title || '').trim().toLowerCase();

    const collected = [];
    const seenUrls = new Set();

    // 1. Add links from challenge.questionA.allLinks (populated by backend)
    rawLinks.forEach((item) => {
      if (item && item.link && item.link.trim()) {
        const norm = normUrl(item.link);
        if (!seenUrls.has(norm)) {
          seenUrls.add(norm);
          collected.push({
            link: item.link.trim(),
            pattern: item.pattern || challenge?.questionA?.pattern || 'General',
            title: item.title || challenge?.questionA?.name
          });
        }
      }
    });

    // 2. Add primaryLink if present and not yet collected
    if (primaryLink && primaryLink.trim()) {
      const norm = normUrl(primaryLink);
      if (!seenUrls.has(norm)) {
        seenUrls.add(norm);
        collected.unshift({
          link: primaryLink.trim(),
          pattern: challenge?.questionA?.pattern || 'General',
          title: challenge?.questionA?.name
        });
      }
    }

    // 3. Fallback: also check allSavedProblems loaded from user's account for same problem name
    if (allSavedProblems && allSavedProblems.length > 0 && currentTitle) {
      allSavedProblems.forEach((p) => {
        if (p.name && p.name.trim().toLowerCase() === currentTitle && p.link && p.link.trim()) {
          const norm = normUrl(p.link);
          if (!seenUrls.has(norm)) {
            seenUrls.add(norm);
            collected.push({
              link: p.link.trim(),
              pattern: p.pattern || 'General',
              title: p.name
            });
          }
        }
      });
    }

    return collected;
  };

  const getLinkLabel = (item, idx, allItems) => {
    if (!item?.link) return 'Link';
    let provider = 'Link';
    try {
      const parsed = new URL(item.link);
      if (parsed.hostname.includes('leetcode.com')) provider = 'LeetCode';
      else if (parsed.hostname.includes('geeksforgeeks.org')) provider = 'GFG';
      else if (parsed.hostname.includes('codeforces.com')) provider = 'Codeforces';
      else if (parsed.hostname.includes('hackerrank.com')) provider = 'HackerRank';
      else if (parsed.hostname.includes('neetcode.io')) provider = 'NeetCode';
      else {
        const parts = parsed.hostname.replace('www.', '').split('.');
        provider = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Link';
      }
    } catch {
      if (item.link.includes('leetcode')) provider = 'LeetCode';
      else if (item.link.includes('geeksforgeeks')) provider = 'GFG';
    }

    if (!allItems || allItems.length <= 1) return provider;

    const distinctPatterns = new Set(allItems.map((l) => l.pattern).filter(Boolean));
    if (distinctPatterns.size === allItems.length && item.pattern) {
      return `${provider} (${item.pattern})`;
    }

    let slug = '';
    try {
      const parsed = new URL(item.link);
      const segments = parsed.pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        slug = segments[segments.length - 1];
      }
    } catch {}

    if (slug && slug.length <= 20) {
      return `${provider} #${idx + 1} (${slug})`;
    }

    return `${provider} #${idx + 1}${item.pattern ? ` (${item.pattern})` : ''}`;
  };

  const problemLinks = resolveProblemLinks();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-body pb-24">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40 px-6 py-3 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('dashboard_home')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            ← Home
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline font-bold text-base text-white">AlgoRevis Practice Workspace</h1>
              <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold border ${
                workspaceMode === 'random' 
                  ? 'bg-purple-950 text-purple-300 border-purple-800' 
                  : 'bg-indigo-950 text-indigo-400 border border-indigo-800'
              }`}>
                {workspaceMode === 'random' ? '🎲 Random Practice' : '📅 Daily Challenge'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {workspaceMode === 'random' 
                ? 'Random questions from your saved folders with AI variations'
                : (challenge?.scheduledDate ? `Scheduled for: ${challenge.scheduledDate}` : 'Today\'s Coding Challenge')}
            </p>
          </div>
        </div>

        {/* Mode Switcher & Workspace Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mode Switch Buttons */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
            <button
              onClick={() => handleToggleMode('daily')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                workspaceMode === 'daily'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => handleToggleMode('random')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                workspaceMode === 'random'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🎲 Random</span>
            </button>
          </div>

          {/* Folder filter dropdown for random practice */}
          {workspaceMode === 'random' && (
            <div className="flex items-center gap-2">
              <select
                value={selectedFolder}
                onChange={(e) => {
                  setSelectedFolder(e.target.value);
                  fetchRandomQuestion(e.target.value);
                }}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-purple-500 font-mono"
              >
                <option value="all">📁 All Saved Folders</option>
                {availableFolders.map((f, i) => (
                  <option key={i} value={f}>📂 {f}</option>
                ))}
              </select>

              <button
                onClick={() => fetchRandomQuestion(selectedFolder)}
                disabled={isFetchingRandom}
                className="flex items-center gap-1 px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold rounded-lg shadow transition disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-sm ${isFetchingRandom ? 'animate-spin' : ''}`}>shuffle</span>
                {isFetchingRandom ? 'Picking...' : 'Next Random Question'}
              </button>
            </div>
          )}

          {/* Practice History Button */}
          <button
            onClick={handleOpenPracticeHistory}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
          >
            <span className="material-symbols-outlined text-sm">history</span>
            History
          </button>

          {draftSavedMsg && (
            <span className="text-[11px] font-mono text-emerald-400 font-bold animate-pulse">
              ✓ {draftSavedMsg}
            </span>
          )}

          <button
            onClick={handleSaveDraft}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
          >
            💾 Save Draft
          </button>

          {workspaceMode === 'daily' && (
            <button
              onClick={handleSimulate}
              disabled={simulating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold rounded-lg shadow-md transition disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">bolt</span>
              {simulating ? 'Delivering...' : '⚡ Test Delivery'}
            </button>
          )}
        </div>
      </header>

      {/* Random Question Toast / Notice */}
      {randomNotice && (
        <div className="bg-purple-950/80 border-b border-purple-800 px-6 py-2 text-xs text-purple-200 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-400 text-sm">info</span>
            {randomNotice}
          </span>
          <button onClick={() => setRandomNotice('')} className="text-purple-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Verification Alert Banner */}
      {user && (!user.isEmailVerified || !user.isPhoneVerified) && (
        <div className="bg-amber-950/70 border-b border-amber-800/80 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-400 text-base">verified_user</span>
            <span>
              <strong>Account Verification:</strong> Verify email and phone to enable automated challenge alerts.
            </span>
          </div>
          <div className="flex gap-2">
            {!user.isEmailVerified && (
              <button
                onClick={() => { setShowEmailOtpModal(true); handleSendEmailOtp(); }}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded text-[11px] transition"
              >
                Verify Email
              </button>
            )}
            {!user.isPhoneVerified && (
              <button
                onClick={() => { setShowPhoneOtpModal(true); handleSendPhoneOtp(); }}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded text-[11px] transition"
              >
                Verify Phone
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* Dual Question Source Toggle Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-2">
          <div className="flex items-center gap-2">
            {/* Tab A: Saved Question */}
            <button
              onClick={() => handleSelectQuestion('A')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeQuestion === 'A'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-sm">bookmark</span>
              <span>Saved Question (Folder: {challenge?.questionA?.pattern || 'General'})</span>
              {challenge?.questionA?.completed && <span className="text-[10px] text-emerald-300 font-mono">✓ Passed</span>}
            </button>

            {/* Tab B: AI-Generated Similar Question */}
            <button
              onClick={() => handleSelectQuestion('B')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeQuestion === 'B'
                  ? 'bg-purple-600 text-white shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              <span>AI-Generated Similar Challenge</span>
              {challenge?.questionB?.completed && <span className="text-[10px] text-emerald-300 font-mono">✓ Passed</span>}
            </button>
          </div>

          <div className="flex items-center gap-3 pr-2">
            {/* Generate Similar AI Question Shortcut Button on Tab A */}
            {activeQuestion === 'A' && (
              <button
                onClick={handleGenerateSimilarAI}
                disabled={isGeneratingAI}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold rounded-lg shadow transition disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-sm ${isGeneratingAI ? 'animate-spin' : ''}`}>
                  {isGeneratingAI ? 'sync' : 'auto_awesome'}
                </span>
                {isGeneratingAI ? 'Generating AI Problem...' : '⚡ Generate Similar AI Question'}
              </button>
            )}

            <span className="text-xs text-slate-400 font-mono">
              Status: {currentQ?.completed ? '✅ Solved' : '⏳ In Progress'}
            </span>
          </div>
        </div>

        {/* AI Generation Error Alert with Retry */}
        {aiGenError && (
          <div className="bg-rose-950/80 border border-rose-800 rounded-xl p-4 text-xs text-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-400">error</span>
              <span>{aiGenError}</span>
            </div>
            <button
              onClick={handleGenerateSimilarAI}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-xs transition"
            >
              Retry AI Generation
            </button>
          </div>
        )}

        {/* Workspace Split (Problem Statement vs Monaco Editor) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[640px]">
          
          {/* Left Column: Problem Details & Constraints (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between overflow-y-auto max-h-[740px]">
            <div className="space-y-4">
              {/* Header Badges: Source Badge + Difficulty + Pattern */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded border ${
                    isQuestionA 
                      ? 'bg-blue-950 text-blue-300 border-blue-800' 
                      : 'bg-purple-950 text-purple-300 border-purple-800'
                  }`}>
                    {isQuestionA ? '📌 Saved Question' : '✨ AI-Generated'}
                  </span>

                  <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    currentQ?.difficulty === 'Easy' ? 'bg-emerald-950 text-emerald-400' :
                    currentQ?.difficulty === 'Hard' ? 'bg-rose-950 text-rose-400' :
                    'bg-amber-950 text-amber-400'
                  }`}>
                    {currentQ?.difficulty || 'Medium'}
                  </span>
                </div>

                <span className="text-xs font-mono text-slate-400">
                  Pattern: <strong className="text-slate-200">{currentQ?.pattern || 'General'}</strong>
                </span>
              </div>

              {/* Title & Problem URL Links */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <h2 className="text-xl font-headline font-bold text-white leading-snug">
                  {currentQ?.title || currentQ?.name || 'Algorithmic Problem'}
                </h2>

                {/* Display all matching problem links (e.g. if two questions have same name with different URLs) */}
                {isQuestionA && problemLinks.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                    {problemLinks.map((item, idx) => (
                      <a
                        key={idx}
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        title={`Open ${item.link} (${item.pattern || 'General'})`}
                        className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 text-[11px] font-semibold rounded-lg transition border border-indigo-900/50 shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[13px]">link</span>
                        <span>{getLinkLabel(item, idx, problemLinks)}</span>
                        <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* If on Question B and AI question not yet generated for this session */}
              {!isQuestionA && !hasQuestionBGenerated ? (
                <div className="bg-slate-950 border border-purple-900/60 rounded-xl p-5 text-center space-y-3">
                  <div className="w-10 h-10 mx-auto rounded-full bg-purple-950 flex items-center justify-center text-purple-400">
                    <span className="material-symbols-outlined text-xl">auto_awesome</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">Generate Similar AI Problem</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Generate an original, solvable coding challenge testing the <strong>{challenge?.questionA?.pattern || 'General'}</strong> pattern inspired by <strong>"{challenge?.questionA?.name}"</strong>.
                  </p>
                  <button
                    onClick={handleGenerateSimilarAI}
                    disabled={isGeneratingAI}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg shadow-lg transition disabled:opacity-50"
                  >
                    {isGeneratingAI ? 'Generating Problem...' : '⚡ Generate Similar AI Question'}
                  </button>
                </div>
              ) : (
                <>
                  {/* Problem Description / Statement */}
                  <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {currentQ?.statement || currentQ?.description || currentQ?.notes || 'No description provided.'}
                  </div>

                  {/* Input / Output Format */}
                  {(currentQ?.inputFormat || currentQ?.outputFormat) && (
                    <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-xs space-y-1">
                      {currentQ.inputFormat && (
                        <div><strong className="text-indigo-400 font-mono">Input Format:</strong> <span className="text-slate-300">{currentQ.inputFormat}</span></div>
                      )}
                      {currentQ.outputFormat && (
                        <div><strong className="text-emerald-400 font-mono">Output Format:</strong> <span className="text-slate-300">{currentQ.outputFormat}</span></div>
                      )}
                    </div>
                  )}

                  {/* Examples */}
                  {currentQ?.examples?.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Examples</span>
                      {currentQ.examples.map((ex, idx) => (
                        <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono space-y-1">
                          <div><strong className="text-indigo-400">Input:</strong> {ex.input}</div>
                          <div><strong className="text-emerald-400">Output:</strong> {ex.output}</div>
                          {ex.explanation && <div className="text-slate-400 text-[11px] font-sans pt-1">{ex.explanation}</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Constraints */}
                  {currentQ?.constraints?.length > 0 && (
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Constraints</span>
                      <ul className="list-disc list-inside text-xs font-mono text-slate-400 space-y-0.5">
                        {currentQ.constraints.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Notes for Question A */}
                  {isQuestionA && currentQ?.notes && (
                    <div className="bg-indigo-950/30 border border-indigo-900/40 rounded-xl p-3 text-xs text-indigo-200">
                      <strong className="block text-[11px] uppercase font-mono mb-1 text-indigo-400">Your Saved Revision Notes:</strong>
                      {currentQ.notes}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Reference Solution Reveal (gated) */}
            <div className="pt-4 border-t border-slate-800 mt-6">
              {revealedSolution ? (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono space-y-2">
                  <div className="flex justify-between items-center text-slate-400 font-bold">
                    <span>Reference Solution</span>
                    <button onClick={() => setRevealedSolution(null)} className="text-[10px] hover:text-white">Hide</button>
                  </div>
                  <pre className="text-emerald-400 overflow-x-auto whitespace-pre-wrap">{revealedSolution.referenceSolution}</pre>
                  {revealedSolution.explanation && (
                    <p className="text-slate-300 font-sans pt-2 border-t border-slate-800">{revealedSolution.explanation}</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleRevealSolution}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline"
                  >
                    👁 Reveal Reference Solution (Attempt Required)
                  </button>
                  {revealError && (
                    <p className="text-[11px] text-amber-400">{revealError}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Code Editor & Execution Panel (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
            
            {/* Editor Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold">Language:</span>
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="javascript">JavaScript (Node.js VM)</option>
                  <option value="python">Python 3.12</option>
                  <option value="cpp">C++ (g++ MinGW)</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                {isQuestionA && problemLinks.length > 0 && (
                  <div className="hidden sm:flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 rounded-lg px-2 py-1">
                    <span className="text-[10px] text-slate-400 font-mono font-semibold uppercase">Links:</span>
                    {problemLinks.map((item, idx) => (
                      <a
                        key={idx}
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        title={`Open ${item.link}`}
                        className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 bg-slate-900 hover:bg-slate-800 px-2 py-0.5 rounded border border-indigo-900/40 transition"
                      >
                        <span>{getLinkLabel(item, idx, problemLinks)}</span>
                        <span className="material-symbols-outlined text-[11px]">open_in_new</span>
                      </a>
                    ))}
                  </div>
                )}

                <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCustomInput}
                    onChange={(e) => setUseCustomInput(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800"
                  />
                  <span>Custom Input</span>
                </label>
              </div>
            </div>

            {/* Monaco Editor Container */}
            <div className="rounded-xl overflow-hidden border border-slate-800 h-[380px] bg-[#1e1e1e]">
              <Editor
                height="100%"
                language={language === 'cpp' ? 'cpp' : language}
                theme="vs-dark"
                value={code}
                onChange={(val) => setCode(val || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2
                }}
              />
            </div>

            {/* Custom Input Drawer (if toggled) */}
            {useCustomInput && (
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Custom Test Input (stdin / JSON args):</label>
                <textarea
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  rows={2}
                  placeholder='e.g. [1, 2, 3] or "hello world"'
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-white outline-none"
                />
              </div>
            )}

            {/* Console Output Drawer */}
            {outputConsole && (
              <div className={`p-4 rounded-xl border text-xs font-mono space-y-2 ${
                outputConsole.allPassed || (!outputConsole.error && outputConsole.type === 'run')
                  ? 'bg-slate-950 border-emerald-900/80 text-emerald-300'
                  : 'bg-slate-950 border-rose-900/80 text-rose-300'
              }`}>
                <div className="flex justify-between items-center font-bold">
                  <span>
                    {outputConsole.type === 'run' 
                      ? 'Console Execution Result' 
                      : (outputConsole.allPassed 
                          ? `🎉 Accepted: All ${outputConsole.passedCount}/${outputConsole.totalCount} Test Cases Passed`
                          : `❌ Wrong Answer: ${outputConsole.passedCount}/${outputConsole.totalCount} Test Cases Passed`)}
                  </span>
                  {outputConsole.executionTimeMs && (
                    <span className="text-[10px] text-slate-400">{outputConsole.executionTimeMs}ms</span>
                  )}
                </div>

                {outputConsole.stdout && (
                  <div className="bg-slate-900/80 p-2.5 rounded whitespace-pre-wrap text-slate-200">
                    <strong>Output:</strong> {outputConsole.stdout}
                  </div>
                )}

                {outputConsole.error && (
                  <div className="text-rose-400 whitespace-pre-wrap">
                    ❌ {outputConsole.error}
                  </div>
                )}

                {/* Test results breakdown for Submit */}
                {outputConsole.results && (
                  <div className="space-y-1 pt-2 border-t border-slate-800 max-h-40 overflow-y-auto">
                    {outputConsole.results.map((r, i) => (
                      <div key={i} className={`p-2 rounded text-[11px] flex justify-between items-center ${
                        r.passed ? 'bg-emerald-950/40 text-emerald-300' : 'bg-rose-950/40 text-rose-300'
                      }`}>
                        <span>Test Case {r.testCaseIndex}: {r.passed ? '✓ Passed' : '✗ Failed'}</span>
                        <span className="text-[10px] text-slate-400">Got: {r.output || 'null'} | Expected: {r.expected}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bottom Action Buttons */}
            <div className="flex flex-wrap justify-between items-center gap-3 pt-2">
              <span className="text-[11px] text-slate-500 font-mono">
                Isolated sandbox • JavaScript VM / Python 3.12 / MinGW C++
              </span>

              <div className="flex gap-3">
                <button
                  onClick={handleRunCode}
                  disabled={isRunning || isSubmitting}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition disabled:opacity-50"
                >
                  {isRunning ? 'Running...' : '▶ Run Code'}
                </button>
                <button
                  onClick={handleSubmitCode}
                  disabled={isRunning || isSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-lg shadow-lg transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Evaluating...' : '🚀 Submit Solution'}
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Due Revision Queue Section */}
        {dueProblems.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-headline font-bold text-white">Due for Active Revision Today</h3>
                <p className="text-xs text-slate-400">Saved problems that have reached their spaced repetition review interval.</p>
              </div>
              <span className="px-2.5 py-1 bg-amber-950 text-amber-400 border border-amber-800 text-xs font-bold rounded">
                {dueProblems.length} Overdue / Due
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dueProblems.map((prob) => (
                <div key={prob._id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] uppercase font-mono text-indigo-400">{prob.pattern}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        prob.difficulty === 'Easy' ? 'bg-emerald-950 text-emerald-400' :
                        prob.difficulty === 'Hard' ? 'bg-rose-950 text-rose-400' :
                        'bg-amber-950 text-amber-400'
                      }`}>
                        {prob.difficulty}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-1">{prob.name}</h4>
                    {prob.notes && <p className="text-xs text-slate-400 line-clamp-2 mt-1">{prob.notes}</p>}
                  </div>
                  <div className="flex justify-between items-center text-[11px] pt-2 border-t border-slate-800/80">
                    <span className="text-slate-500">Reviews: {prob.reviewCount || 0}</span>
                    <a
                      href={prob.link || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      Open ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Automated Delivery Settings & Preferences Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-headline font-bold text-white">Daily Revision Notification Channels</h3>
              <p className="text-xs text-slate-400">Configure email and WhatsApp delivery schedules, IANA timezones, and consent.</p>
            </div>
            {prefSavedMsg && (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-3 py-1 rounded">
                ✓ {prefSavedMsg}
              </span>
            )}
          </div>

          <form onSubmit={handleSavePreferences} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Channel 1: Email */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-indigo-400 text-base">mail</span>
                      Email Delivery
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">Recipient: {user?.email || 'N/A'}</p>
                    <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                      user?.isEmailVerified ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                    }`}>
                      {user?.isEmailVerified ? '✓ Verified' : '⚠ Unverified'}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailEnabled}
                      onChange={(e) => setEmailEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                  <input
                    type="checkbox"
                    id="emailConsent"
                    checked={emailConsent}
                    onChange={(e) => setEmailConsent(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600"
                  />
                  <label htmlFor="emailConsent">I consent to receiving daily algorithmic challenges via email.</label>
                </div>
              </div>

              {/* Channel 2: WhatsApp */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-400 text-base">chat</span>
                      WhatsApp Delivery
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">Meta WhatsApp Business API</p>
                    <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                      user?.isPhoneVerified ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                    }`}>
                      {user?.isPhoneVerified ? '✓ Verified' : '⚠ Unverified'}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={whatsappEnabled}
                      onChange={(e) => setWhatsappEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Phone Number (E.164 with Country Code)</label>
                  <input
                    type="text"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="+919876543210"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                  <input
                    type="checkbox"
                    id="whatsappConsent"
                    checked={whatsappConsent}
                    onChange={(e) => setWhatsappConsent(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-emerald-600"
                  />
                  <label htmlFor="whatsappConsent">I give explicit consent to receive daily challenges on WhatsApp.</label>
                </div>
              </div>
            </div>

            {/* Schedule Timing & IANA Timezone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950 border border-slate-800 rounded-xl p-5">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Preferred Daily Delivery Time (24h format)</label>
                <input
                  type="time"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">User IANA Timezone</label>
                <select
                  value={deliveryTimezone}
                  onChange={(e) => setDeliveryTimezone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                  <option value="America/New_York">America/New_York (EST / EDT)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST / PDT)</option>
                  <option value="Europe/London">Europe/London (GMT / BST)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST +9:00)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT +8:00)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
              >
                Save Preferences
              </button>
            </div>
          </form>
        </div>

        {/* Delivery Audit Logs */}
        {deliveryLogs.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-headline font-bold text-white mb-4">Notification Delivery Audit Trail</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="pb-2">Date / Time</th>
                    <th className="pb-2">Channel</th>
                    <th className="pb-2">Recipient</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {deliveryLogs.slice(0, 8).map((log, i) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="py-2.5 text-slate-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 uppercase font-bold text-slate-300">
                        {log.channel}
                      </td>
                      <td className="py-2.5 text-slate-300">
                        {log.recipient}
                      </td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'sent' || log.status === 'delivered' ? 'bg-emerald-950 text-emerald-400' :
                          log.status === 'mock_sent' ? 'bg-cyan-950 text-cyan-400' :
                          'bg-rose-950 text-rose-400'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-400 truncate max-w-xs">
                        {log.subjectOrSummary || (log.error ? `Error: ${log.error}` : 'Delivered')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Practice History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-headline font-bold text-lg text-white">Your Practice & Submission History</h3>
                <p className="text-xs text-slate-400">Review all saved question revisions and AI-generated challenge attempts.</p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
              >
                ✕
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="px-5 pt-3 flex gap-2 border-b border-slate-800 pb-3">
              <button
                onClick={() => setHistoryFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${historyFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                All Attempts ({practiceHistory.length})
              </button>
              <button
                onClick={() => setHistoryFilter('saved')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${historyFilter === 'saved' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Saved Questions ({practiceHistory.filter(h => h.questionSource === 'saved').length})
              </button>
              <button
                onClick={() => setHistoryFilter('ai')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${historyFilter === 'ai' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                AI-Generated ({practiceHistory.filter(h => h.questionSource === 'ai').length})
              </button>
            </div>

            {/* List */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {historyLoading ? (
                <div className="py-12 text-center text-slate-400 text-xs font-mono">Loading history records...</div>
              ) : filteredHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">No practice submissions recorded yet for this filter.</div>
              ) : (
                filteredHistory.map((item, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          item.questionSource === 'saved' ? 'bg-blue-950 text-blue-300' : 'bg-purple-950 text-purple-300'
                        }`}>
                          {item.questionSource === 'saved' ? 'Saved' : 'AI-Generated'}
                        </span>
                        <strong className="text-white text-sm">{item.questionTitle}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">({item.pattern})</span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-3">
                        <span>Language: <strong className="text-slate-300 uppercase">{item.language}</strong></span>
                        <span>Date: {new Date(item.timestamp).toLocaleString()}</span>
                        <span>Tests: {item.passedCount}/{item.totalCount}</span>
                      </div>
                    </div>

                    <div>
                      <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                        item.submissionStatus === 'passed' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {item.submissionStatus === 'passed' ? '✓ Accepted' : '✗ Failed'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Email OTP Modal */}
      {showEmailOtpModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-headline font-bold text-lg text-white">Verify Your Email</h3>
            <p className="text-xs text-slate-400">
              We sent a 6-digit verification code to <strong>{user?.email}</strong>.
            </p>
            {otpStatusMsg && <p className="text-xs text-emerald-400 font-semibold">{otpStatusMsg}</p>}
            {otpErrorMsg && <p className="text-xs text-rose-400">{otpErrorMsg}</p>}
            <input
              type="text"
              maxLength={6}
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              placeholder="123456"
              className="w-full text-center tracking-widest font-mono text-xl bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-indigo-500"
            />
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => { setShowEmailOtpModal(false); setOtpInput(''); }}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyEmailOtp}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition"
              >
                Verify Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phone OTP Modal */}
      {showPhoneOtpModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-headline font-bold text-lg text-white">Verify Your Phone Number</h3>
            <p className="text-xs text-slate-400">
              We dispatched an OTP to <strong>{user?.phone}</strong> via WhatsApp / SMS.
            </p>
            {otpStatusMsg && <p className="text-xs text-emerald-400 font-semibold">{otpStatusMsg}</p>}
            {otpErrorMsg && <p className="text-xs text-rose-400">{otpErrorMsg}</p>}
            <input
              type="text"
              maxLength={6}
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              placeholder="123456"
              className="w-full text-center tracking-widest font-mono text-xl bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500"
            />
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => { setShowPhoneOtpModal(false); setOtpInput(''); }}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyPhoneOtp}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition"
              >
                Verify Code
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DailyChallengeView;
