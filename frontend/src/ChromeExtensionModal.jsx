import React, { useState } from 'react';

const ChromeExtensionModal = ({ isOpen, onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState('install'); // 'install' or 'features'

  if (!isOpen) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText('chrome://extensions');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleDownload = () => {
    // Triggers direct download of static zip file
    const link = document.createElement('a');
    link.href = '/algorevis-extension.zip';
    link.download = 'algorevis-extension.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Glow Background */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 pointer-events-none blur-2xl"></div>

        {/* Modal Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 text-white font-bold text-xl">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline font-bold text-lg text-white">AlgoRevis Chrome Extension</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold">
                  Manifest V3
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Capture code, problem metadata & notes from LeetCode, GFG & Codeforces in 1 click
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Action Tabs & Direct Download Hero Banner */}
        <div className="px-6 py-4 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('install')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'install'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900'
              }`}
            >
              🛠️ 3-Step Setup
            </button>
            <button
              onClick={() => setActiveTab('features')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'features'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900'
              }`}
            >
              ✨ What it Captures
            </button>
          </div>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition transform hover:scale-105 cursor-pointer"
          >
            <span>📥 Download Extension (.zip)</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'install' ? (
            <div className="space-y-4">
              <div className="bg-indigo-950/40 border border-indigo-800/50 rounded-xl p-3.5 flex items-start gap-3">
                <span className="text-xl">💡</span>
                <p className="text-xs text-indigo-200 leading-relaxed">
                  You can install this right now in Chrome in <strong>under 30 seconds</strong> using Chrome's built-in <strong>Developer Mode</strong>. No Chrome Web Store signups or approval wait needed!
                </p>
              </div>

              {/* Step 1 */}
              <div className="flex items-start gap-3.5 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500 text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Download & Extract Package</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Click the green <strong>"Download Extension (.zip)"</strong> button above, then right-click the downloaded file and select <strong>"Extract All"</strong> to unzip it into a folder.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3.5 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500 text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Open Chrome Extensions</h4>
                    <button
                      onClick={handleCopyUrl}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 transition flex items-center gap-1"
                    >
                      <span>{copiedLink ? '✓ Copied' : '📋 Copy URL'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    In Google Chrome, paste this URL into your address bar and press Enter:
                  </p>
                  <div className="mt-1.5 bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-emerald-400">
                    chrome://extensions/
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3.5 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500 text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Turn ON "Developer mode" & Load Unpacked</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    In the top-right corner of the Extensions page, switch the <strong>"Developer mode"</strong> toggle to <strong>ON</strong>.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Next, click the <strong>"Load unpacked"</strong> button in the top-left corner and select your extracted <code className="text-purple-300 font-mono">algorevis-extension</code> folder.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-3.5 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <div className="w-7 h-7 rounded-full bg-emerald-600/30 border border-emerald-500 text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  ✓
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Done! Pin & Solve</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Click the puzzle icon 🧩 in Chrome's top toolbar, click the pin 📌 next to AlgoRevis, and open any problem on LeetCode or GFG to capture it instantly!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex flex-col">
                  <span className="text-lg">🟧 LeetCode</span>
                  <p className="text-xs text-slate-400 mt-1">
                    Reads problem title, difficulty (Easy/Med/Hard), tags, and extracts your latest JavaScript, Python, or C++ Monaco editor code automatically.
                  </p>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex flex-col">
                  <span className="text-lg">🟩 GeeksforGeeks</span>
                  <p className="text-xs text-slate-400 mt-1">
                    Auto-captures problem description, canonical URL, language, and extracts written solution code directly from the GFG editor.
                  </p>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex flex-col">
                  <span className="text-lg">🟦 Codeforces</span>
                  <p className="text-xs text-slate-400 mt-1">
                    Detects problem rating, contest tag (e.g. 4A), problem name, and links it directly to your AlgoRevis spaced-repetition folders.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-bold text-white">✨ Key Superpowers:</h4>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
                  <li><strong>Duplicate Prevention:</strong> If you revisit a problem, it automatically updates your existing notes rather than creating messy duplicates.</li>
                  <li><strong>Aha! Intuition Field:</strong> Write down your exact thought process and the mental trick that unlocked the solution.</li>
                  <li><strong>Complexity Tags:</strong> Fast one-click buttons for O(1), O(log n), O(n), O(n²).</li>
                  <li><strong>Cloud Sync:</strong> Saves directly into your hosted AlgoRevis account (or localhost during dev).</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>AlgoRevis v2.0 • Chrome Manifest V3</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChromeExtensionModal;
