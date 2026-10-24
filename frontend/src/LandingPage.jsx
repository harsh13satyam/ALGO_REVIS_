import React, { useState, useEffect } from 'react';
import ChromeExtensionModal from './ChromeExtensionModal';

const LandingPage = ({ navigate }) => {
  // 1. Splash Screen States
  const [showSplash, setShowSplash] = useState(true);
  const [splashFade, setSplashFade] = useState(false);
  const [splashBarFilled, setSplashBarFilled] = useState(false);

  // Chrome Extension Modal State
  const [showExtensionModal, setShowExtensionModal] = useState(false);

  // 2. Mobile Menu State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 3. Hero Perspective Card State
  const [heroStreak, setHeroStreak] = useState(18);
  const [heroFeedback, setHeroFeedback] = useState(null);
  const [heroStatus, setHeroStatus] = useState('READY FOR RATING');

  // 4. Memory Decay Simulator State
  const [simDay, setSimDay] = useState(14);

  // 5. Interactive Demo Widget State
  const [demoTab, setDemoTab] = useState('intuition');
  const [demoFeedback, setDemoFeedback] = useState(null);

  // 6. Pricing Toggle
  const [billingPlan, setBillingPlan] = useState('monthly');

  // 7. Subscribe Input State
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // Handle Splash Screen Animation & Dismissal
  useEffect(() => {
    const barTimer = setTimeout(() => {
      setSplashBarFilled(true);
    }, 80);

    const fadeTimer = setTimeout(() => {
      setSplashFade(true);
    }, 1600);

    const removeTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2200);

    return () => {
      clearTimeout(barTimer);
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  const handleSkipSplash = () => {
    setSplashFade(true);
    setTimeout(() => setShowSplash(false), 300);
  };

  // Calculations for Memory Decay Simulator
  const standardRetention = Math.max(16, Math.round(100 / Math.pow(simDay, 0.45)));
  const algoRetention = Math.max(92, 98 - Math.round(simDay * 0.15));
  const hoursSaved = Math.round(simDay * 2.8);

  const handleHeroReview = (rating, intervalText) => {
    setHeroFeedback(intervalText);
    setHeroStatus(`COMPLETED (${rating.toUpperCase()})`);
    setHeroStreak((prev) => prev + 1);
  };

  const handleDemoRecall = (rating, intervalDays) => {
    setDemoFeedback(`✓ Recalled! Next review queued for Day ${intervalDays}. Synaptic weight updated.`);
  };

  const handleSubscribeSubmit = (e) => {
    e.preventDefault();
    if (subscribeEmail.trim()) {
      setSubscribed(true);
      setSubscribeEmail('');
    }
  };

  return (
    <div className="bg-[#0f131c] text-[#F8FAFC] min-h-screen selection:bg-[#00f2fe] selection:text-[#0a0e17] overflow-x-hidden font-sans">
      {/* ========================================================================= */}
      {/* 1. FULLSCREEN CINEMATIC SPLASH SCREEN ENTRANCE                            */}
      {/* ========================================================================= */}
      {showSplash && (
        <div
          className={`fixed inset-0 z-[100] bg-[#0a0e17] flex flex-col items-center justify-center transition-all duration-700 ease-out ${
            splashFade ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100'
          }`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,242,254,0.14)_0%,transparent_70%)] pointer-events-none animate-pulse"></div>

          <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-lg">
            {/* Glowing Logo Icon */}
            <div className="relative mb-6">
              <div className="absolute -inset-3 rounded-2xl bg-[#00f2fe]/20 blur-xl"></div>
              <div className="relative w-20 h-20 rounded-2xl bg-[#161B22] border border-[#00f2fe]/40 flex items-center justify-center text-[#00f2fe] shadow-[0_0_30px_rgba(0,242,254,0.35)] transform transition-transform hover:scale-105">
                <span className="material-symbols-outlined text-4xl">history_edu</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl text-white tracking-tight font-extrabold mb-3">
              Algo<span className="text-[#00f2fe] bg-clip-text text-transparent bg-gradient-to-r from-[#00f2fe] to-[#4facfe]">Revis</span>
            </h1>

            <p className="text-slate-400 text-sm md:text-base mb-8 tracking-wide">
              Mastering algorithms through discipline.
            </p>

            {/* Loading progress bar */}
            <div className="w-52 h-1 bg-slate-800 rounded-full overflow-hidden mb-6 relative">
              <div
                className="h-full bg-gradient-to-r from-[#00f2fe] to-[#4facfe] transition-all duration-[1400ms] ease-out rounded-full"
                style={{ width: splashBarFilled ? '100%' : '0%' }}
              ></div>
            </div>

            <button
              onClick={handleSkipSplash}
              className="text-xs font-mono text-slate-400 hover:text-[#00f2fe] border border-white/10 rounded-lg px-4 py-1.5 bg-slate-900/60 backdrop-blur-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>Skip Intro</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. STICKY GLASS NAVBAR                                                     */}
      {/* ========================================================================= */}
      <header className="bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
        <div className="flex justify-between items-center w-full max-w-7xl mx-auto px-6 h-16">
          {/* Brand Logo */}
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#161B22] border border-[#00f2fe]/40 flex items-center justify-center text-[#00f2fe] shadow-[0_0_12px_rgba(0,242,254,0.25)] transition-transform duration-200 group-hover:scale-105">
              <span className="material-symbols-outlined text-lg">history_edu</span>
            </div>
            <span className="font-bold text-lg tracking-tight text-white">AlgoRevis</span>
            <span className="text-[10px] font-mono font-semibold bg-[#00f2fe]/10 border border-[#00f2fe]/30 text-[#00f2fe] px-2 py-0.5 rounded tracking-wider">
              PRO
            </span>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#curriculum" className="hover:text-white transition-colors">Curriculum</a>
            <a href="#simulator-section" className="text-[#00f2fe] font-medium">Retention Engine</a>
            <a href="#demo-section" className="hover:text-white transition-colors">Live Demo</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
          </nav>

          {/* Actions: Sign In & Start Practicing */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setShowExtensionModal(true)}
              className="text-xs font-mono font-bold bg-indigo-950/80 border border-indigo-700/60 hover:border-indigo-400 text-indigo-300 hover:text-white px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-sm hover:shadow-indigo-500/20 cursor-pointer"
              title="Install Chrome Extension for LeetCode & GFG"
            >
              <span className="text-amber-400">⚡</span>
              <span>Chrome Extension</span>
            </button>
            <button
              onClick={() => navigate('login')}
              className="text-sm font-mono text-slate-300 hover:text-white hover:bg-slate-800/60 px-3.5 py-1.5 rounded-lg border border-transparent hover:border-white/10 transition"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('signup')}
              className="text-sm font-mono font-semibold bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-[#090D16] px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,242,254,0.4)] hover:brightness-105 active:scale-[0.98] flex items-center gap-1.5"
            >
              <span>Start Practicing</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-slate-400 hover:text-white p-2 focus:outline-none"
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#161B22] border-b border-white/10 px-6 py-4 flex flex-col gap-4">
            <a onClick={() => setMobileMenuOpen(false)} href="#curriculum" className="text-slate-300 hover:text-white py-1">Curriculum</a>
            <a onClick={() => setMobileMenuOpen(false)} href="#simulator-section" className="text-[#00f2fe] font-medium py-1">Retention Engine</a>
            <a onClick={() => setMobileMenuOpen(false)} href="#demo-section" className="text-slate-300 hover:text-white py-1">Live Demo</a>
            <a onClick={() => setMobileMenuOpen(false)} href="#pricing" className="text-slate-300 hover:text-white py-1">Pricing</a>
            <a onClick={() => setMobileMenuOpen(false)} href="#testimonials" className="text-slate-300 hover:text-white py-1">Testimonials</a>
            <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
              <button
                onClick={() => { setMobileMenuOpen(false); setShowExtensionModal(true); }}
                className="w-full text-center py-2 text-indigo-300 font-mono text-sm bg-indigo-950/60 border border-indigo-800 rounded-lg flex items-center justify-center gap-1.5"
              >
                <span>⚡ Chrome Extension Setup</span>
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); navigate('login'); }}
                className="w-full text-center py-2 text-slate-300 font-mono text-sm border border-white/10 rounded-lg hover:bg-slate-800"
              >
                Sign In
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); navigate('signup'); }}
                className="w-full text-center py-2 bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-[#090D16] font-mono text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(0,242,254,0.3)]"
              >
                Start Practicing Free
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 3. HERO SECTION                                                           */}
      {/* ========================================================================= */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
        {/* Ambient backlights */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#00f2fe]/10 blur-[130px] rounded-full pointer-events-none"></div>
        <div className="absolute top-40 right-10 w-[400px] h-[300px] bg-[#4facfe]/10 blur-[110px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Copy & Conversions */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Attention Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161B22] border border-[#00f2fe]/30 shadow-[0_0_12px_rgba(0,242,254,0.15)] mb-6">
              <span className="text-sm">🔥</span>
              <span className="font-mono text-xs text-[#00f2fe] font-medium">
                Stop forgetting LeetCode problems 3 weeks before your interview
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl text-white font-extrabold tracking-tight mb-6 leading-tight">
              Master Algorithms. <br />
              <span className="bg-gradient-to-r from-[#00f2fe] via-sky-300 to-[#4facfe] bg-clip-text text-transparent">
                Retain Patterns.
              </span> <br />
              Clear FAANG Interviews.
            </h1>

            <p className="text-slate-400 text-base md:text-lg max-w-xl mb-8 leading-relaxed">
              The intelligent spaced-repetition engine engineered specifically for algorithms. AlgoRevis detects your pattern weakness and schedules reviews precisely before synaptic memory decay occurs.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto mb-8">
              <button
                onClick={() => navigate('signup')}
                className="font-mono text-sm font-semibold bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-[#090D16] px-6 py-3.5 rounded-lg transition-all duration-200 hover:shadow-[0_0_24px_rgba(0,242,254,0.45)] hover:brightness-105 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>Start Practicing Free</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
              <button
                onClick={() => setShowExtensionModal(true)}
                className="font-mono text-sm text-indigo-300 bg-indigo-950/60 border border-indigo-700/60 hover:border-indigo-400 px-6 py-3.5 rounded-lg transition-all duration-200 hover:bg-indigo-900/40 flex items-center justify-center gap-2"
              >
                <span className="text-amber-400">⚡</span>
                <span>Chrome Extension</span>
              </button>
              <a
                href="#simulator-section"
                className="font-mono text-sm text-slate-300 bg-slate-900/60 border border-white/10 hover:border-[#00f2fe]/40 px-6 py-3.5 rounded-lg transition-all duration-200 hover:bg-slate-800 flex items-center justify-center gap-2"
              >
                <span>Explore Simulator</span>
              </a>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-3 text-slate-400 font-mono text-xs border-t border-white/10 pt-6 w-full">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Syncs with Striver SDE Sheet & NeetCode 150</span>
              </div>
              <span>•</span>
              <div>98.4% retention rate</div>
              <span className="hidden sm:inline">•</span>
              <div className="hidden sm:inline">No CC required</div>
            </div>
          </div>

          {/* Right Column: Interactive 3D Perspective Glass Card Problem Review */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md bg-[#161B22]/90 backdrop-blur-xl border border-[#00f2fe]/40 rounded-2xl p-6 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.8),0_0_24px_rgba(0,242,254,0.15)] relative">
              {/* Card Header Bar */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="font-mono text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded font-bold">
                    HARD
                  </span>
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    #42
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded border border-white/10">
                  <span className="text-xs">🔥</span>
                  <span className="font-mono text-xs text-[#00f2fe] font-semibold">
                    {heroStreak} Days Streak
                  </span>
                </div>
              </div>

              {/* Problem Metadata */}
              <div className="mb-5">
                <div className="text-slate-400 font-mono text-[11px] mb-1">CURRENT REVISION TARGET</div>
                <h3 className="text-xl text-white font-bold mb-2">Trapping Rain Water</h3>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="font-mono text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-white/5">
                    Two Pointers
                  </span>
                  <span className="font-mono text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-white/5">
                    Monotonic Stack
                  </span>
                  <span className="font-mono text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-white/5">
                    Dynamic Programming
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed bg-[#0a0e17]/80 p-3 rounded-lg border border-white/5 font-sans">
                  Given <code className="font-mono text-[#00f2fe]">n</code> non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.
                </p>
              </div>

              {/* Complexity Badge Row */}
              <div className="grid grid-cols-2 gap-2 mb-5 font-mono text-xs">
                <div className="bg-[#0a0e17] p-2.5 rounded-lg border border-white/5 flex justify-between items-center">
                  <span className="text-slate-400">Time</span>
                  <span className="text-emerald-400 font-semibold">O(N)</span>
                </div>
                <div className="bg-[#0a0e17] p-2.5 rounded-lg border border-white/5 flex justify-between items-center">
                  <span className="text-slate-400">Space</span>
                  <span className="text-emerald-400 font-semibold">O(1)</span>
                </div>
              </div>

              {/* Interactive SM-2 Interval Selector */}
              <div className="border-t border-white/10 pt-4">
                <div className="flex justify-between items-center mb-2.5">
                  <span className="font-mono text-[11px] text-slate-400">HOW WELL DID YOU RECALL?</span>
                  <span className="font-mono text-[10px] text-emerald-400 font-bold">{heroStatus}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => handleHeroReview('Again', '< 10m')}
                    className="p-2 rounded-lg bg-[#0a0e17] hover:bg-rose-500/15 border border-white/5 hover:border-rose-500/40 text-center transition-all"
                  >
                    <div className="font-mono text-xs text-rose-400 font-semibold">Again</div>
                    <div className="font-mono text-[10px] text-slate-500">&lt;10m</div>
                  </button>
                  <button
                    onClick={() => handleHeroReview('Hard', '1 day')}
                    className="p-2 rounded-lg bg-[#0a0e17] hover:bg-amber-500/15 border border-white/5 hover:border-amber-500/40 text-center transition-all"
                  >
                    <div className="font-mono text-xs text-amber-400 font-semibold">Hard</div>
                    <div className="font-mono text-[10px] text-slate-500">1d</div>
                  </button>
                  <button
                    onClick={() => handleHeroReview('Good', '4 days')}
                    className="p-2 rounded-lg bg-[#0a0e17] hover:bg-[#00f2fe]/15 border border-white/5 hover:border-[#00f2fe]/40 text-center transition-all"
                  >
                    <div className="font-mono text-xs text-[#00f2fe] font-semibold">Good</div>
                    <div className="font-mono text-[10px] text-slate-500">4d</div>
                  </button>
                  <button
                    onClick={() => handleHeroReview('Easy', '14 days')}
                    className="p-2 rounded-lg bg-[#0a0e17] hover:bg-emerald-500/15 border border-white/5 hover:border-emerald-500/40 text-center transition-all"
                  >
                    <div className="font-mono text-xs text-emerald-400 font-semibold">Easy</div>
                    <div className="font-mono text-[10px] text-slate-500">14d</div>
                  </button>
                </div>

                {heroFeedback && (
                  <div className="mt-3 p-2.5 bg-[#00f2fe]/10 border border-[#00f2fe]/30 rounded-lg text-center font-mono text-xs text-[#00f2fe]">
                    Scheduled! Next review queued in <span className="font-bold underline">{heroFeedback}</span>.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. INTERACTIVE 'MEMORY DECAY VS ALGOREVIS' SIMULATOR                      */}
      {/* ========================================================================= */}
      <section className="py-20 border-t border-white/10 bg-[#0a0e17] relative" id="simulator-section">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="font-mono text-xs text-[#00f2fe] uppercase tracking-widest mb-3 font-semibold">
              SYNAPTIC RETENTION ENGINE
            </div>
            <h2 className="text-3xl md:text-4xl text-white font-bold mb-4">
              The Ebbinghaus Trap vs. AlgoRevis
            </h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              Without spaced intervals, 82% of solved DSA problems vanish within 30 days. AlgoRevis tests you right at the critical decay threshold, creating permanent synaptic encoding.
            </p>
          </div>

          {/* Simulator Interactive Canvas */}
          <div className="bg-[#161B22] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
            {/* Interactive Controls Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-white/10">
              <div className="w-full md:w-auto text-left">
                <span className="font-mono text-xs text-slate-400 uppercase">Timeline Scrubber:</span>
                <div className="text-2xl text-white font-bold mt-1 font-sans">
                  Day <span className="text-[#00f2fe] font-mono">{simDay}</span> of Interview Prep
                </div>
              </div>

              {/* Quick Jump Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {[1, 3, 7, 14, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => setSimDay(d)}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-all ${
                      simDay === d
                        ? 'bg-[#00f2fe]/20 border border-[#00f2fe] text-[#00f2fe]'
                        : 'bg-slate-800 hover:bg-slate-700 border border-white/5 text-slate-300'
                    }`}
                  >
                    Day {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider Range Input */}
            <div className="py-6 border-b border-white/10">
              <div className="flex justify-between font-mono text-[10px] text-slate-400 mb-2">
                <span>DAY 1 (First Solve)</span>
                <span>DAY 7 (Weekly Review)</span>
                <span>DAY 14 (Pattern Consolidate)</span>
                <span>DAY 30 (Interview Day)</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                value={simDay}
                onChange={(e) => setSimDay(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#00f2fe]"
              />
            </div>

            {/* Metric Output Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              {/* Standard Grind Card */}
              <div className="p-5 rounded-xl bg-[#0a0e17] border border-white/5 flex flex-col justify-between text-left">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-slate-400">STANDARD LEETCODE GRIND</span>
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  </div>
                  <div className="text-3xl font-bold text-rose-500 font-mono mb-1">
                    {standardRetention}%
                  </div>
                  <p className="text-xs text-slate-400">
                    Ebbinghaus forgetting curve. You recognize the name, but freeze on writing the two-pointer condition.
                  </p>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-4">
                  <div
                    className="bg-rose-500 h-full transition-all duration-300"
                    style={{ width: `${standardRetention}%` }}
                  ></div>
                </div>
              </div>

              {/* AlgoRevis Active Recall Card */}
              <div className="p-5 rounded-xl bg-[#0a0e17] border border-[#00f2fe]/40 shadow-[0_0_15px_rgba(0,242,254,0.1)] flex flex-col justify-between text-left">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-[#00f2fe]">ALGOREVIS REPETITION</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  </div>
                  <div className="text-3xl font-bold text-[#00f2fe] font-mono mb-1">
                    {algoRetention}%
                  </div>
                  <p className="text-xs text-slate-400">
                    Pattern mapped to long-term memory. Intuition is instant, boundary conditions recall under 4 seconds.
                  </p>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-4">
                  <div
                    className="bg-[#00f2fe] h-full transition-all duration-300"
                    style={{ width: `${algoRetention}%` }}
                  ></div>
                </div>
              </div>

              {/* Time Efficiency Telemetry */}
              <div className="p-5 rounded-xl bg-[#0a0e17] border border-white/5 flex flex-col justify-between text-left">
                <div>
                  <span className="font-mono text-xs text-slate-400 mb-2 block">REDUNDANT HOURS SAVED</span>
                  <div className="text-3xl font-bold text-emerald-400 font-mono mb-1">
                    +{hoursSaved} Hrs
                  </div>
                  <p className="text-xs text-slate-400">
                    No repeated 45-minute re-solves. Focus 100% of study time on genuine edge case weaknesses.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between font-mono text-xs">
                  <span className="text-slate-400">Revision Efficiency</span>
                  <span className="text-white font-bold">4.2x Faster</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. BENTO BOX CORE FEATURES                                                */}
      {/* ========================================================================= */}
      <section className="py-24 max-w-7xl mx-auto px-6" id="curriculum">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="font-mono text-xs text-[#00f2fe] uppercase tracking-widest mb-3 font-semibold">
            ENGINEERED FOR SENIOR STANDARDS
          </div>
          <h2 className="text-3xl md:text-4xl text-white font-bold mb-4">
            Everything Needed to Clear FAANG Bars
          </h2>
          <p className="text-slate-400 text-sm md:text-base">
            A bespoke architecture combining neuro-scientific interval spacing with realistic technical interview simulators.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
          {/* Card 1: SM-2 Engine (7 Cols) */}
          <div className="md:col-span-7 bg-[#161B22] border border-white/10 rounded-2xl p-8 hover:border-[#00f2fe]/40 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#00f2fe]/10 border border-[#00f2fe]/30 flex items-center justify-center text-[#00f2fe] mb-6">
                <span className="material-symbols-outlined text-2xl">memory</span>
              </div>
              <span className="font-mono text-xs text-[#00f2fe] font-semibold">CORE ALGORITHM</span>
              <h3 className="text-2xl text-white font-bold mt-1 mb-3">
                SM-2 + Anki-Tuned Algorithmic Interval Engine
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Not all DSA problems are equal. AlgoRevis weighs pattern complexity (e.g. Dynamic Programming bitmask vs. simple Hash Map lookup) to assign personalized mathematical half-lives to every question you attempt.
              </p>
            </div>
            <div className="bg-[#0a0e17] p-4 rounded-xl border border-white/5 font-mono text-xs text-slate-400 overflow-x-auto">
              <div className="text-[#00f2fe] mb-1">// Synaptic decay calculation</div>
              <code>I(n) = I(n-1) * EF&apos; where EF&apos; = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))</code>
            </div>
          </div>

          {/* Card 2: Curated DSA Sheets (5 Cols) */}
          <div className="md:col-span-5 bg-[#161B22] border border-white/10 rounded-2xl p-8 hover:border-[#00f2fe]/40 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#4facfe]/10 border border-[#4facfe]/30 flex items-center justify-center text-[#4facfe] mb-6">
                <span className="material-symbols-outlined text-2xl">library_books</span>
              </div>
              <span className="font-mono text-xs text-[#4facfe] font-semibold">ONE-CLICK SYNC</span>
              <h3 className="text-2xl text-white font-bold mt-1 mb-3">
                Curated Sheets Built-In
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Zero-friction import from the world&apos;s most respected interview roadmaps:
              </p>
              <ul className="space-y-2.5 font-mono text-xs text-slate-300 mb-6">
                <li className="flex items-center gap-2"><span className="text-[#00f2fe]">✓</span> Striver’s SDE Sheet (180 Core Qs)</li>
                <li className="flex items-center gap-2"><span className="text-[#00f2fe]">✓</span> NeetCode 150 & Blind 75</li>
                <li className="flex items-center gap-2"><span className="text-[#00f2fe]">✓</span> Grind 75 & Pattern Sheets</li>
              </ul>
            </div>
            <div className="flex items-center gap-2 text-[#00f2fe] font-mono text-xs">
              <span>Synced with your active revision folders</span>
              <span className="material-symbols-outlined text-sm">sync</span>
            </div>
          </div>

          {/* Card 3: Timed Mock Arena (4 Cols) */}
          <div className="md:col-span-4 bg-[#161B22] border border-white/10 rounded-2xl p-8 hover:border-[#00f2fe]/40 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-6">
                <span className="material-symbols-outlined text-2xl">timer</span>
              </div>
              <span className="font-mono text-xs text-rose-400 font-semibold">PRESSURE SIMULATION</span>
              <h3 className="text-xl text-white font-bold mt-1 mb-3">Timed Mock Arena</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Strict countdowns with test case verification, live compiler execution, and whiteboarding notes.
              </p>
            </div>
            <div className="bg-[#0a0e17] p-3 rounded-lg border border-white/5 flex items-center justify-between font-mono text-xs">
              <span className="text-slate-400">Pace Requirement:</span>
              <span className="text-amber-400 font-semibold">18m / Medium</span>
            </div>
          </div>

          {/* Card 4: Pattern Vault (4 Cols) */}
          <div className="md:col-span-4 bg-[#161B22] border border-white/10 rounded-2xl p-8 hover:border-[#00f2fe]/40 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6">
                <span className="material-symbols-outlined text-2xl">category</span>
              </div>
              <span className="font-mono text-xs text-emerald-400 font-semibold">ABSTRACTION LIBRARY</span>
              <h3 className="text-xl text-white font-bold mt-1 mb-3">Pattern Vault</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Categorized by archetypes: Sliding Window, Monotonic Queue, Binary Tree DP, and Disjoint Sets.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
              <span className="bg-[#0a0e17] px-2.5 py-1 rounded border border-white/5 text-slate-300">Fast & Slow Ptrs</span>
              <span className="bg-[#0a0e17] px-2.5 py-1 rounded border border-white/5 text-slate-300">Topological Sort</span>
              <span className="bg-[#0a0e17] px-2.5 py-1 rounded border border-white/5 text-slate-300">Interval Trees</span>
            </div>
          </div>

          {/* Card 5: Monaco Sandbox (4 Cols) */}
          <div className="md:col-span-4 bg-[#161B22] border border-white/10 rounded-2xl p-8 hover:border-[#00f2fe]/40 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-[#00f2fe] border border-white/10 mb-6">
                <span className="material-symbols-outlined text-2xl">terminal</span>
              </div>
              <span className="font-mono text-xs text-[#00f2fe] font-semibold">MONACO ENGINE</span>
              <h3 className="text-xl text-white font-bold mt-1 mb-3">Sandbox & Hint Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Type-safe code editor with Python, C++, Java, and JS runtimes. Request progressive 3-tiered hints.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-t border-white/10 pt-3">
              <span>Latency: &lt;14ms</span>
              <span className="text-emerald-400">Memory Checked</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. HANDS-ON INTERACTIVE PROBLEM REVIEW DEMO WIDGET                        */}
      {/* ========================================================================= */}
      <section className="py-20 bg-[#0a0e17] border-y border-white/10" id="demo-section">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4 text-left">
            <div>
              <div className="font-mono text-xs text-[#00f2fe] uppercase tracking-widest mb-2 font-semibold">
                LIVE TEST RIG
              </div>
              <h2 className="text-3xl md:text-4xl text-white font-bold">
                Interactive Problem Review Session
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Test how AlgoRevis active recall works in your daily 15-minute morning routine.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-[#161B22] px-3.5 py-1.5 rounded-lg border border-white/10 font-mono text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Session: 1 of 8 Due Today</span>
            </div>
          </div>

          {/* Problem Rig Card */}
          <div className="bg-[#161B22] border border-white/10 rounded-2xl overflow-hidden shadow-2xl text-left">
            {/* Rig Header Bar */}
            <div className="bg-slate-900/60 px-6 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded font-bold">
                  MEDIUM
                </span>
                <h3 className="text-lg text-white font-semibold">15. 3Sum</h3>
                <span className="font-mono text-xs text-slate-500">LeetCode #15</span>
              </div>
              <div className="flex items-center gap-2">
                {['intuition', 'code', 'pitfalls'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDemoTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all ${
                      demoTab === tab
                        ? 'bg-slate-800 text-[#00f2fe] border border-[#00f2fe]/40 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab === 'intuition' ? 'Intuition' : tab === 'code' ? 'Optimal Code' : 'Common Pitfalls'}
                  </button>
                ))}
              </div>
            </div>

            {/* Rig Tab Content */}
            <div className="p-6 md:p-8 min-h-[220px]">
              {demoTab === 'intuition' && (
                <div className="space-y-4">
                  <div className="font-mono text-xs text-slate-400 uppercase">Pattern Mental Model:</div>
                  <p className="text-slate-200 text-sm md:text-base leading-relaxed">
                    Sort the input array first (<code className="font-mono text-[#00f2fe]">O(N log N)</code>). Iterate element <code className="font-mono text-[#00f2fe]">i</code> from left to right. Then treat the sub-problem as a standard <strong className="text-white">Two Sum II</strong> with two pointers (<code className="font-mono text-[#00f2fe]">left = i + 1</code>, <code className="font-mono text-[#00f2fe]">right = n - 1</code>).
                  </p>
                  <div className="p-4 rounded-xl bg-[#0a0e17] border border-white/5 flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#00f2fe] text-xl">lightbulb</span>
                    <div className="text-xs text-slate-400">
                      <strong className="text-slate-200">Key Edge Case:</strong> Avoid duplicate triplets by continuously incrementing pointers while consecutive values equal their predecessor: <code className="font-mono text-sky-300">while (left &lt; right &amp;&amp; nums[left] == nums[left+1]) left++</code>.
                    </div>
                  </div>
                </div>
              )}

              {demoTab === 'code' && (
                <div>
                  <div className="bg-[#0a0e17] rounded-xl border border-white/5 p-4 font-mono text-xs text-slate-300 overflow-x-auto">
                    <div className="text-slate-500 mb-2">// Language: C++20 | Time: O(N^2) | Space: O(1) auxiliary</div>
                    <pre className="text-slate-200 leading-relaxed">
{`vector<vector<int>> threeSum(vector<int>& nums) {
    sort(nums.begin(), nums.end());
    vector<vector<int>> res;
    for (int i = 0; i < nums.size(); ++i) {
        if (i > 0 && nums[i] == nums[i - 1]) continue;
        int l = i + 1, r = nums.size() - 1;
        while (l < r) {
            int sum = nums[i] + nums[l] + nums[r];
            if (sum == 0) {
                res.push_back({nums[i], nums[l], nums[r]});
                while (l < r && nums[l] == nums[l + 1]) l++;
                while (l < r && nums[r] == nums[r - 1]) r--;
                l++; r--;
            } else if (sum < 0) l++;
            else r--;
        }
    }
    return res;
}`}
                    </pre>
                  </div>
                </div>
              )}

              {demoTab === 'pitfalls' && (
                <div className="space-y-3 font-sans text-xs">
                  <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
                    ❌ <strong>Pitfall #1:</strong> Forgetting to sort first. Two-pointer convergence requires monotonic array ordering.
                  </div>
                  <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300">
                    ⚠️ <strong>Pitfall #2:</strong> Skipping duplicates for only <code className="font-mono">i</code>, but forgetting to advance <code className="font-mono">left</code> and <code className="font-mono">right</code> duplicates after finding a match.
                  </div>
                  <div className="p-3.5 rounded-lg bg-[#0a0e17] border border-white/5 text-slate-400">
                    💡 <strong>Interviewer Note:</strong> Mentioning why Hash Table 2Sum uses <code className="font-mono">O(N)</code> extra space makes this Two-Pointer approach superior for memory-constrained production systems.
                  </div>
                </div>
              )}
            </div>

            {/* Rating Action Bar */}
            <div className="bg-slate-900/60 px-6 py-4 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-slate-400 font-mono text-xs">
                <span className="material-symbols-outlined text-sm">psychology</span>
                <span>Rate your recall quality right now:</span>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() => handleDemoRecall('Again', 1)}
                  className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-[#0a0e17] hover:bg-rose-500/20 border border-white/10 hover:border-rose-500 text-rose-400 font-mono text-xs transition-all"
                >
                  Again (1d)
                </button>
                <button
                  onClick={() => handleDemoRecall('Hard', 3)}
                  className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-[#0a0e17] hover:bg-amber-500/20 border border-white/10 hover:border-amber-500 text-amber-400 font-mono text-xs transition-all"
                >
                  Hard (3d)
                </button>
                <button
                  onClick={() => handleDemoRecall('Good', 7)}
                  className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-[#0a0e17] hover:bg-[#00f2fe]/20 border border-white/10 hover:border-[#00f2fe] text-[#00f2fe] font-mono text-xs transition-all"
                >
                  Good (7d)
                </button>
                <button
                  onClick={() => handleDemoRecall('Easy', 21)}
                  className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-[#0a0e17] hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500 text-emerald-400 font-mono text-xs transition-all"
                >
                  Easy (21d)
                </button>
              </div>
            </div>

            {/* Demo Toast Notification */}
            {demoFeedback && (
              <div className="bg-[#00f2fe]/10 border-t border-[#00f2fe]/30 px-6 py-3 text-center font-mono text-xs text-[#00f2fe]">
                {demoFeedback}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. SOCIAL PROOF & METRICS                                                 */}
      {/* ========================================================================= */}
      <section className="py-24 max-w-7xl mx-auto px-6" id="testimonials">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20 text-center">
          <div className="p-6 rounded-2xl bg-[#161B22] border border-white/10">
            <div className="text-3xl md:text-4xl font-bold text-white font-mono mb-1">250K+</div>
            <div className="font-mono text-xs text-slate-400">Problems Mastered</div>
          </div>
          <div className="p-6 rounded-2xl bg-[#161B22] border border-white/10">
            <div className="text-3xl md:text-4xl font-bold text-[#00f2fe] font-mono mb-1">98.2%</div>
            <div className="font-mono text-xs text-slate-400">First-Round Pass Rate</div>
          </div>
          <div className="p-6 rounded-2xl bg-[#161B22] border border-white/10">
            <div className="text-3xl md:text-4xl font-bold text-white font-mono mb-1">1,200+</div>
            <div className="font-mono text-xs text-slate-400">FAANG / Tier-1 Offers</div>
          </div>
          <div className="p-6 rounded-2xl bg-[#161B22] border border-white/10">
            <div className="text-3xl md:text-4xl font-bold text-emerald-400 font-mono mb-1">68 Hrs</div>
            <div className="font-mono text-xs text-slate-400">Avg Study Time Saved</div>
          </div>
        </div>

        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="font-mono text-xs text-[#00f2fe] uppercase tracking-widest mb-3 font-semibold">
            ENGINEERING TESTIMONIALS
          </div>
          <h2 className="text-3xl md:text-4xl text-white font-bold">
            Engineered for the Pragmatic Developer
          </h2>
        </div>

        {/* Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-2xl bg-[#161B22] border border-white/10 flex flex-col justify-between">
            <div className="mb-6">
              <div className="flex items-center gap-1 text-[#00f2fe] mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="material-symbols-outlined text-sm">star</span>
                ))}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed italic">
                &ldquo;Before AlgoRevis, I had solved 400 LeetCode problems over two years and forgot nearly 80% when Meta called. With this system, 15 minutes a day during morning coffee kept all 180 core patterns primed in my working memory.&rdquo;
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <div>
                <div className="text-sm font-bold text-white">Alex Chen</div>
                <div className="font-mono text-xs text-slate-400">Senior SWE @ Meta (E5)</div>
              </div>
              <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                VERIFIED OFFER
              </span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#161B22] border border-white/10 flex flex-col justify-between">
            <div className="mb-6">
              <div className="flex items-center gap-1 text-[#00f2fe] mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="material-symbols-outlined text-sm">star</span>
                ))}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed italic">
                &ldquo;The pattern categorization is genuinely world-class. Instead of memorizing 15 different graph questions, I mastered topological sort and Dijkstra state machines. Cleared Google L4 onsite smoothly.&rdquo;
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <div>
                <div className="text-sm font-bold text-white">Devon Ross</div>
                <div className="font-mono text-xs text-slate-400">Software Engineer @ Google</div>
              </div>
              <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                VERIFIED OFFER
              </span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#161B22] border border-white/10 flex flex-col justify-between">
            <div className="mb-6">
              <div className="flex items-center gap-1 text-[#00f2fe] mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="material-symbols-outlined text-sm">star</span>
                ))}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed italic">
                &ldquo;The timed mock arena captures the exact heart-pumping panic of a live screen. Being able to practice with realistic time constraints made my Uber final round feel like routine muscle memory.&rdquo;
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <div>
                <div className="text-sm font-bold text-white">Priya Sharma</div>
                <div className="font-mono text-xs text-slate-400">Staff Engineer @ Uber</div>
              </div>
              <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                VERIFIED OFFER
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. PRICING SECTION                                                        */}
      {/* ========================================================================= */}
      <section className="py-24 bg-[#0a0e17] border-t border-white/10" id="pricing">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-12">
            <div className="font-mono text-xs text-[#00f2fe] uppercase tracking-widest mb-3 font-semibold">
              TRANSPARENT VALUE
            </div>
            <h2 className="text-3xl md:text-4xl text-white font-bold mb-4">
              Invest in Your Next Compensation Tier
            </h2>
            <p className="text-slate-400 text-sm">
              A single offer tier step produces a $40k–$80k differential. Build compounding interview confidence.
            </p>

            {/* Monthly / Annual Billing Toggle */}
            <div className="inline-flex items-center gap-3 bg-[#161B22] border border-white/10 p-1.5 rounded-xl mt-6">
              <button
                onClick={() => setBillingPlan('monthly')}
                className={`font-mono text-xs px-4 py-1.5 rounded-lg transition-all ${
                  billingPlan === 'monthly'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPlan('annual')}
                className={`font-mono text-xs px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  billingPlan === 'annual'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Annual</span>
                <span className="font-mono text-[10px] bg-[#00f2fe]/20 text-[#00f2fe] px-1.5 py-0.5 rounded">
                  SAVE 25%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch text-left">
            {/* Free Tier */}
            <div className="bg-[#161B22] border border-white/10 rounded-2xl p-8 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-bold text-white">Community Tier</span>
                  <span className="font-mono text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                    BASIC
                  </span>
                </div>
                <div className="text-4xl font-bold text-white font-mono mb-2">
                  $0 <span className="text-sm font-sans font-normal text-slate-400">/ forever</span>
                </div>
                <p className="text-xs text-slate-400 mb-6">
                  Standard interval revision for independent engineers preparing at their own pace.
                </p>
                <ul className="space-y-3 text-xs text-slate-300 mb-8">
                  <li className="flex items-center gap-2"><span className="text-[#00f2fe]">✓</span> Up to 50 active tracked problems</li>
                  <li className="flex items-center gap-2"><span className="text-[#00f2fe]">✓</span> Blind 75 Sheet built-in</li>
                  <li className="flex items-center gap-2"><span className="text-[#00f2fe]">✓</span> Standard SM-2 interval scheduler</li>
                  <li className="flex items-center gap-2 text-slate-500"><span className="text-slate-600">✗</span> Timed Mock Arena</li>
                  <li className="flex items-center gap-2 text-slate-500"><span className="text-slate-600">✗</span> Cloud sheet auto-sync</li>
                </ul>
              </div>
              <button
                onClick={() => navigate('signup')}
                className="w-full py-3 rounded-lg border border-white/10 bg-slate-900/60 hover:bg-slate-800 font-mono text-xs text-white transition-all text-center"
              >
                Get Started Free
              </button>
            </div>

            {/* Pro Tier (Hero Card) */}
            <div className="bg-[#161B22] border border-[#00f2fe]/40 rounded-2xl p-8 flex flex-col justify-between relative shadow-[0_0_30px_rgba(0,242,254,0.15)]">
              <div className="absolute -top-3 right-6 font-mono text-[10px] bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-[#090D16] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                FAANG CANDIDATE PICK
              </div>
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-bold text-white">Pro Architect</span>
                  <span className="font-mono text-[10px] bg-[#00f2fe]/20 text-[#00f2fe] px-2 py-0.5 rounded font-semibold">
                    UNLIMITED
                  </span>
                </div>
                <div className="text-4xl font-bold text-white font-mono mb-2">
                  {billingPlan === 'annual' ? '$7' : '$9'} <span className="text-sm font-sans font-normal text-slate-400">/ month</span>
                </div>
                <p className="text-xs text-slate-400 mb-6">
                  Complete automated neuro-spaced prep toolkit to guarantee peak recall on interview day.
                </p>
                <ul className="space-y-3 text-xs text-slate-200 mb-8">
                  <li className="flex items-center gap-2"><span className="text-[#00f2fe]">✓</span> <strong>Unlimited</strong> problem cards & folders</li>
                  <li className="flex items-center gap-2"><span className="text-[#00f2fe]">✓</span> Striver SDE, NeetCode 150 & custom sheets</li>
                  <li className="flex items-center gap-2"><span className="text-[#00f2fe]">✓</span> 45-Minute Timed Mock Interview Arena</li>
                  <li className="flex items-center gap-2"><span className="text-[#00f2fe]">✓</span> Monaco Sandbox & Multi-Tier Hint Engine</li>
                  <li className="flex items-center gap-2"><span className="text-[#00f2fe]">✓</span> Two-way cloud problem sync</li>
                </ul>
              </div>
              <button
                onClick={() => navigate('signup')}
                className="w-full py-3.5 rounded-lg bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-[#090D16] font-mono text-xs font-semibold transition-all hover:brightness-105 hover:shadow-[0_0_20px_rgba(0,242,254,0.4)] active:scale-[0.98] text-center"
              >
                Start 14-Day Free Trial
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. BOTTOM CTA BANNER & DEVELOPER RICH FOOTER                              */}
      {/* ========================================================================= */}
      <section className="py-20 relative overflow-hidden bg-slate-900/60 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <div className="font-mono text-xs text-[#00f2fe] uppercase tracking-widest mb-3 font-semibold">
            ZERO RISK REVISION
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to retain every algorithm you solve?
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto mb-8">
            Join thousands of candidates who stopped re-solving the same problems every interview season.
          </p>

          {/* Email quick subscription */}
          <form onSubmit={handleSubscribeSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-md mx-auto mb-4">
            <input
              type="email"
              value={subscribeEmail}
              onChange={(e) => setSubscribeEmail(e.target.value)}
              placeholder="Enter developer email..."
              required
              className="w-full bg-[#0a0e17] border border-white/10 rounded-lg px-4 py-3 text-white text-xs font-sans focus:outline-none focus:border-[#00f2fe]"
            />
            <button
              type="submit"
              className="w-full sm:w-auto font-mono text-xs font-semibold bg-[#00f2fe] text-[#090D16] px-6 py-3 rounded-lg hover:shadow-[0_0_15px_rgba(0,242,254,0.3)] transition-all whitespace-nowrap"
            >
              Claim Access
            </button>
          </form>

          {subscribed && (
            <div className="font-mono text-xs text-emerald-400">
              ✓ Direct invite link dispatched to your inbox.
            </div>
          )}
        </div>
      </section>

      {/* Developer Rich Footer */}
      <footer className="bg-[#0a0e17] border-t border-white/10">
        <div className="w-full max-w-7xl mx-auto px-6 py-12 flex flex-col gap-8 text-left">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00f2fe]">history_edu</span>
                <span>AlgoRevis</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Built for technical mastery & FAANG readiness.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-[#161B22] px-3 py-1.5 rounded-full border border-white/10 font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-400">All systems operational</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-3 font-mono text-xs text-slate-400">
            <button
              onClick={() => setShowExtensionModal(true)}
              className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 font-semibold"
            >
              <span>⚡</span>
              <span>Chrome Extension</span>
            </button>
            <a href="#curriculum" className="hover:text-[#00f2fe] transition-colors">Sheets Sync</a>
            <a href="#demo-section" className="hover:text-[#00f2fe] transition-colors">Monaco Sandbox</a>
            <a href="#simulator-section" className="text-[#00f2fe] hover:underline">Memory Engine</a>
            <button onClick={() => navigate('login')} className="hover:text-white transition-colors">Sign In</button>
            <button onClick={() => navigate('signup')} className="hover:text-white transition-colors">Create Account</button>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center font-mono text-xs text-slate-500 gap-4">
            <div>© {new Date().getFullYear()} AlgoRevis Inc. All rights reserved.</div>
            <div className="flex items-center gap-4">
              <span>v2.4.0-stable</span>
              <span>•</span>
              <span>Latency: 12ms</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Chrome Extension Setup Modal */}
      <ChromeExtensionModal
        isOpen={showExtensionModal}
        onClose={() => setShowExtensionModal(false)}
      />
    </div>
  );
};

export default LandingPage;
