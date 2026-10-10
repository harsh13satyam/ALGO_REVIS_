import React, { useState, useEffect } from 'react';
import api from './api';

const RevisionModeDashboard = ({ navigate }) => {
  const [problems, setProblems] = useState([]);
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue', 'topics', 'history'
  const [topicSearchTerm, setTopicSearchTerm] = useState('');
  const [expandedTopics, setExpandedTopics] = useState({});

  const calculateStreak = (problemsArray) => {
    if (!problemsArray || problemsArray.length === 0) return 0;
    const dates = [...new Set(problemsArray.map(p => {
      try {
        return new Date(p.createdAt).toISOString().split('T')[0];
      } catch (e) {
        return null;
      }
    }).filter(Boolean))].sort().reverse();

    if (dates.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    let currentStr = currentDate.toISOString().split('T')[0];

    if (!dates.includes(currentStr)) {
      currentDate.setDate(currentDate.getDate() - 1);
      currentStr = currentDate.toISOString().split('T')[0];
      if (!dates.includes(currentStr)) return 0;
    }

    while (dates.includes(currentStr)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
      currentStr = currentDate.toISOString().split('T')[0];
    }
    return streak;
  };

  const currentStreak = calculateStreak(problems);

  const fetchProblems = async () => {
    setIsLoading(true);
    try {
      const data = await api.getProblems();
      if (Array.isArray(data)) {
        setProblems(data);

        // Smart Daily Challenge Selection
        if (data.length > 0) {
          const todayStr = new Date().toISOString().split('T')[0];
          const storedDate = localStorage.getItem('dailyChallengeDate');
          const storedProblemId = localStorage.getItem('dailyChallengeId');
          let recentChallenges = JSON.parse(localStorage.getItem('recentChallenges') || '[]');

          if (storedDate === todayStr && storedProblemId) {
            const todayProb = data.find(p => p._id === storedProblemId);
            if (todayProb) {
              setDailyChallenge(todayProb);
            } else {
              setDailyChallenge(data[0]);
            }
          } else {
            let availableProblems = data.filter(p => !recentChallenges.includes(p._id));
            if (availableProblems.length === 0) {
              recentChallenges = recentChallenges.slice(-1);
              availableProblems = data.filter(p => !recentChallenges.includes(p._id));
              if (availableProblems.length === 0) availableProblems = data;
            }
            const randomProb = availableProblems[Math.floor(Math.random() * availableProblems.length)] || data[0];
            setDailyChallenge(randomProb);
            localStorage.setItem('dailyChallengeDate', todayStr);
            localStorage.setItem('dailyChallengeId', randomProb._id);
            recentChallenges.push(randomProb._id);
            if (recentChallenges.length > 5) recentChallenges.shift();
            localStorage.setItem('recentChallenges', JSON.stringify(recentChallenges));
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch problems", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  // Group problems by topic/pattern for the Topics section
  const topicsMap = problems.reduce((acc, p) => {
    const topic = (p.pattern || 'General').trim();
    if (!acc[topic]) acc[topic] = [];
    acc[topic].push(p);
    return acc;
  }, {});

  const topicList = Object.keys(topicsMap).sort();

  const filteredTopics = topicList.filter(topic => {
    const matchesTopic = topic.toLowerCase().includes(topicSearchTerm.toLowerCase());
    const hasMatchingProblem = topicsMap[topic].some(p => p.name.toLowerCase().includes(topicSearchTerm.toLowerCase()));
    return matchesTopic || hasMatchingProblem;
  });

  const toggleTopicExpand = (topic) => {
    setExpandedTopics(prev => ({ ...prev, [topic]: !prev[topic] }));
  };

  return (
    <div className="bg-surface font-body text-on-surface">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm dark:shadow-none border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between px-6 py-3 w-full">
          <div className="flex items-center gap-8">
            <span 
              onClick={() => navigate('dashboard_home')}
              className="text-xl font-bold tracking-tighter text-slate-900 dark:text-white font-headline cursor-pointer"
            >
              AlgoRevis
            </span>
            <nav className="hidden md:flex items-center gap-6 font-headline font-semibold tracking-tight">
              <a 
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-3 py-1 rounded-lg cursor-pointer" 
                onClick={(e) => { e.preventDefault(); navigate('folders'); }}
                href="#"
              >
                Problems
              </a>
              <a 
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-3 py-1 rounded-lg cursor-pointer" 
                onClick={(e) => { e.preventDefault(); navigate('sheets'); }}
                href="#"
              >
                Sheets
              </a>
              <a 
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-3 py-1 rounded-lg cursor-pointer" 
                onClick={(e) => { e.preventDefault(); navigate('mock_tests'); }}
                href="#"
              >
                Mock Tests
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('add_problem')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow transition"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>Add Problem</span>
            </button>
            <button 
              onClick={() => navigate('daily_challenge', { mode: 'today' })}
              className="signature-gradient text-white px-5 py-2 rounded-xl font-headline font-semibold text-sm active:scale-95 transition-transform"
            >
              Start Session
            </button>
          </div>
        </div>
      </header>

      {/* SideNavBar */}
      <aside className="h-screen w-64 fixed left-0 top-0 z-40 bg-slate-50 dark:bg-slate-950 flex flex-col p-4 space-y-2 border-r border-slate-100 dark:border-slate-800">
        <div className="mb-8 pt-16 px-2">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 signature-gradient rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
            </div>
            <h2 className="font-headline font-extrabold text-indigo-600 text-lg">Revision Mode</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium px-1">The Disciplined Curator</p>
        </div>

        <nav className="flex-grow space-y-1">
          <a 
            className="flex items-center gap-3 px-3 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-all duration-200 ease-in-out font-body text-sm font-medium cursor-pointer" 
            href="#" 
            onClick={(e) => { e.preventDefault(); navigate('dashboard_home'); }}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span>Dashboard</span>
          </a>

          <a 
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ease-in-out font-body text-sm font-medium cursor-pointer ${
              activeTab === 'queue'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`} 
            href="#" 
            onClick={(e) => { e.preventDefault(); setActiveTab('queue'); }}
          >
            <span className="material-symbols-outlined">event_repeat</span>
            <span>Revision Queue ({problems.length})</span>
          </a>

          <a 
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ease-in-out font-body text-sm font-medium cursor-pointer ${
              activeTab === 'topics'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`} 
            href="#" 
            onClick={(e) => { e.preventDefault(); setActiveTab('topics'); }}
          >
            <span className="material-symbols-outlined">category</span>
            <span>Topics ({topicList.length})</span>
          </a>

          <a 
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ease-in-out font-body text-sm font-medium cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`} 
            href="#" 
            onClick={(e) => { e.preventDefault(); setActiveTab('history'); }}
          >
            <span className="material-symbols-outlined">history</span>
            <span>History</span>
          </a>
        </nav>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <button 
            onClick={() => navigate('daily_challenge', { mode: 'random' })}
            className="w-full signature-gradient text-white py-2 rounded-xl font-headline font-semibold text-sm active:scale-95 transition-transform"
          >
            🎲 Quick Practice
          </button>
          <button 
            onClick={() => navigate('add_problem')}
            className="w-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 py-2 rounded-xl font-headline font-semibold text-xs transition"
          >
            + Add New Problem
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="pl-64 pt-20 min-h-screen bg-surface text-left">
        <div className="max-w-7xl mx-auto px-8 py-8">
          {/* Hero Revision Status */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            <div className="lg:col-span-2 bg-surface-container-lowest p-8 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[220px]">
              <div className="relative z-10">
                <span className="font-label font-bold text-primary tracking-[0.1em] uppercase text-xs mb-2 block">Current Status</span>
                <h1 className="text-4xl font-headline font-extrabold text-on-surface mb-2">Revision Mode</h1>
                <p className="text-on-surface-variant max-w-md">Your personalized queue is optimized for maximum retention. Focus on today's core challenges.</p>
              </div>
              <div className="flex items-center gap-6 mt-6 relative z-10">
                <div className="flex items-center gap-3 bg-tertiary-fixed text-on-tertiary-fixed px-4 py-2 rounded-full border border-tertiary/10">
                  <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                  <span className="font-headline font-bold text-sm">{currentStreak} Day Streak</span>
                </div>
                <div className="flex items-center gap-3 bg-primary-fixed text-on-primary-fixed px-4 py-2 rounded-full">
                  <span className="material-symbols-outlined text-primary text-sm">task_alt</span>
                  <span className="font-headline font-bold text-sm">{problems.length} Problems Due</span>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-full bg-primary/5 -skew-x-12 translate-x-16 pointer-events-none"></div>
              <div className="absolute top-0 right-0 w-32 h-full bg-primary/10 -skew-x-12 translate-x-8 pointer-events-none"></div>
            </div>

            {/* Quick Actions */}
            <div className="bg-surface-container-low p-8 rounded-2xl flex flex-col justify-center space-y-4">
              <button 
                onClick={() => navigate('daily_challenge', { mode: 'today' })}
                className="signature-gradient text-white w-full py-4 rounded-xl font-headline font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 border-none cursor-pointer"
              >
                <span className="material-symbols-outlined">play_circle</span>
                Start Today's Revision
              </button>
              <button 
                onClick={() => navigate('daily_challenge', { mode: 'random' })}
                className="bg-surface-container-lowest text-on-surface w-full py-4 rounded-xl font-headline font-bold text-lg border border-outline-variant/20 hover:bg-surface-bright transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <span className="material-symbols-outlined">shuffle</span>
                Random Practice
              </button>
            </div>
          </section>

          {/* MAIN VIEW: TOPICS SECTION */}
          {activeTab === 'topics' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-headline font-bold text-on-surface">All Topics ({topicList.length})</h3>
                  <p className="text-xs text-slate-500 mt-1">Review all questions organized by algorithmic patterns and folders.</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                    <input
                      type="text"
                      value={topicSearchTerm}
                      onChange={(e) => setTopicSearchTerm(e.target.value)}
                      placeholder="Search topics or problems..."
                      className="bg-surface-container-high rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20 w-64"
                    />
                  </div>

                  <button
                    onClick={() => navigate('add_problem')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    <span>Add Problem</span>
                  </button>
                </div>
              </div>

              {filteredTopics.length === 0 ? (
                <div className="text-center py-16 bg-surface-container-lowest rounded-2xl border border-slate-100 p-8 space-y-4">
                  <span className="material-symbols-outlined text-slate-400 text-5xl">folder_off</span>
                  <p className="text-base font-bold text-slate-700">No topics found</p>
                  <p className="text-xs text-slate-500">Save questions in folders to populate your topic library!</p>
                  <button
                    onClick={() => navigate('add_problem')}
                    className="px-4 py-2 signature-gradient text-white rounded-xl text-xs font-bold shadow"
                  >
                    + Add First Problem
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredTopics.map((topic) => {
                    const topicProblems = topicsMap[topic] || [];
                    const isExpanded = expandedTopics[topic] !== false; // Default expanded
                    const easyCount = topicProblems.filter(p => p.difficulty === 'Easy').length;
                    const medCount = topicProblems.filter(p => p.difficulty === 'Medium').length;
                    const hardCount = topicProblems.filter(p => p.difficulty === 'Hard').length;

                    return (
                      <div key={topic} className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleTopicExpand(topic)}>
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                              <span className="material-symbols-outlined text-xl">folder</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xl font-headline font-bold text-slate-900">{topic}</h4>
                                <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                                  {topicProblems.length} {topicProblems.length === 1 ? 'Problem' : 'Problems'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-500">
                                {easyCount > 0 && <span className="text-emerald-600 font-semibold">{easyCount} Easy</span>}
                                {medCount > 0 && <span className="text-amber-600 font-semibold">{medCount} Medium</span>}
                                {hardCount > 0 && <span className="text-rose-600 font-semibold">{hardCount} Hard</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate('daily_challenge', { mode: 'random', folder: topic })}
                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
                            >
                              <span className="material-symbols-outlined text-sm">shuffle</span>
                              <span>Practice Topic</span>
                            </button>

                            <button
                              onClick={() => navigate('add_problem')}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-sm">add</span>
                              <span>Add</span>
                            </button>

                            <button
                              onClick={() => toggleTopicExpand(topic)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                            >
                              <span className="material-symbols-outlined text-sm">
                                {isExpanded ? 'expand_less' : 'expand_more'}
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* List of Problems inside this Topic */}
                        {isExpanded && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                            {topicProblems.map((prob) => (
                              <div 
                                key={prob._id} 
                                className="p-4 rounded-xl bg-slate-50/70 hover:bg-slate-100/80 border border-slate-100 flex flex-col justify-between gap-3 transition"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h5 className="font-headline font-bold text-slate-900 text-base">{prob.name}</h5>
                                    <span className="text-[11px] text-slate-500 font-mono">
                                      Reviews: {prob.reviewCount || 0} • Recall: {prob.recallStatus || 'new'}
                                    </span>
                                  </div>

                                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                    prob.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-800' :
                                    prob.difficulty === 'Hard' ? 'bg-rose-100 text-rose-800' :
                                    'bg-amber-100 text-amber-800'
                                  }`}>
                                    {prob.difficulty}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                                  {prob.link ? (
                                    <a
                                      href={prob.link}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                    >
                                      <span>Solve Online</span>
                                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                                    </a>
                                  ) : (
                                    <span className="text-xs text-slate-400">No link recorded</span>
                                  )}

                                  <button
                                    onClick={() => navigate('daily_challenge', { mode: 'random', folder: topic })}
                                    className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow hover:bg-indigo-700 transition"
                                  >
                                    Practice Now
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* MAIN VIEW: REVISION QUEUE SECTION (Default) */}
          {activeTab === 'queue' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Revision Queue (Left) */}
              <div className="lg:col-span-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-headline font-bold text-on-surface">Revision Queue</h3>
                    <span className="text-xs font-bold font-mono bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded-full">
                      {problems.length} Due
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate('add_problem')}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1 transition"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      <span>Add Problem</span>
                    </button>
                  </div>
                </div>

                {/* Bento Style List */}
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="text-center py-10 text-on-surface-variant font-bold">Loading Queue...</div>
                  ) : problems.length === 0 ? (
                    <div className="text-center py-16 bg-surface-container-lowest rounded-2xl p-8 space-y-3">
                      <span className="material-symbols-outlined text-4xl text-slate-400">task_alt</span>
                      <p className="text-base font-bold text-slate-700">No problems due right now!</p>
                      <p className="text-xs text-slate-500">Add new coding problems to start scheduling your daily revisions.</p>
                      <button 
                        onClick={() => navigate('add_problem')}
                        className="px-4 py-2 signature-gradient text-white rounded-xl text-xs font-bold shadow"
                      >
                        + Add Problem Now
                      </button>
                    </div>
                  ) : (
                    problems.map((prob) => (
                      <div key={prob._id} className="bg-surface-container-lowest p-5 rounded-2xl flex items-center justify-between group hover:shadow-md transition-all border border-transparent hover:border-primary/10">
                        <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${prob.difficulty === 'Easy' ? 'bg-secondary-container/30 text-secondary' : prob.difficulty === 'Hard' ? 'bg-error-container/30 text-error' : 'bg-tertiary-fixed/30 text-tertiary'}`}>
                            <span className="material-symbols-outlined">
                              {prob.difficulty === 'Easy' ? 'history' : prob.difficulty === 'Hard' ? 'warning' : 'analytics'}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-headline font-bold text-on-surface text-lg truncate max-w-[200px] sm:max-w-[300px]">{prob.name}</h4>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs font-bold text-primary/70 tracking-wider uppercase">{prob.pattern || 'Uncategorized'}</span>
                              <span className="w-1 h-1 rounded-full bg-outline-variant/50"></span>
                              <span className="text-xs text-on-surface-variant">Ready for review</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${prob.difficulty === 'Easy' ? 'bg-secondary-container text-on-secondary-container' : prob.difficulty === 'Hard' ? 'bg-error-container text-on-error-container' : 'bg-tertiary-fixed text-on-tertiary-fixed-variant'}`}>{prob.difficulty}</span>
                          <div className="text-right flex items-center gap-2">
                            {prob.link ? (
                              <a href={prob.link} target="_blank" rel="noreferrer" className="text-primary text-sm font-bold flex items-center gap-1 group-hover:underline">
                                Solve <span className="material-symbols-outlined text-sm">arrow_forward</span>
                              </a>
                            ) : (
                              <button 
                                onClick={() => navigate('daily_challenge', { mode: 'random' })}
                                className="text-primary text-sm font-bold"
                              >
                                Practice
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Sidebar (Right) */}
              <div className="lg:col-span-4 space-y-6">
                {/* Daily Challenge Card - WORKING ADD & SOLVE */}
                <div 
                  onClick={() => !dailyChallenge && navigate('add_problem')}
                  className={`signature-gradient p-6 rounded-2xl shadow-xl shadow-primary/20 text-white relative overflow-hidden ${!dailyChallenge ? 'cursor-pointer hover:brightness-105 transition' : ''}`}
                >
                  <div className="relative z-10">
                    <span className="text-[10px] font-bold tracking-widest uppercase opacity-80 mb-2 block">Daily Challenge</span>
                    <h4 
                      onClick={(e) => { e.stopPropagation(); if (!dailyChallenge) navigate('add_problem'); }}
                      className="font-headline font-bold text-xl mb-3 cursor-pointer hover:underline"
                    >
                      {dailyChallenge ? dailyChallenge.name : "Add more problems"}
                    </h4>
                    <p className="text-white/70 text-sm mb-4">
                      {dailyChallenge 
                        ? "Complete this challenge to boost your pattern recognition score."
                        : "Add coding questions to your library to build your spaced-repetition daily challenge queue."}
                    </p>

                    {dailyChallenge ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => navigate('daily_challenge', { challengeId: dailyChallenge._id, mode: 'random' })}
                          className="bg-white text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold shadow hover:bg-slate-100 active:scale-95 transition-all"
                        >
                          Solve Now
                        </button>
                        {dailyChallenge.link && (
                          <a
                            href={dailyChallenge.link}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-1 transition"
                            title="Open problem link"
                          >
                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                          </a>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => navigate('add_problem')}
                        className="bg-white text-indigo-700 hover:bg-slate-100 px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-all flex items-center gap-2 shadow"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                        <span>Add Problem Now</span>
                      </button>
                    )}
                  </div>
                  <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-white/10 text-9xl pointer-events-none">school</span>
                </div>

                {/* Direct Add Problem Card */}
                <div className="bg-surface-container-high/50 p-6 rounded-2xl border border-outline-variant/10 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-600 font-bold">
                    <span className="material-symbols-outlined">add_circle</span>
                    <span className="text-sm">Expand Your Library</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Insert problems with links from LeetCode, GFG, or Codeforces to automatically schedule active recall revisions.
                  </p>
                  <button
                    onClick={() => navigate('add_problem')}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow"
                  >
                    + Add New Problem
                  </button>
                </div>

                {/* Retention Tip */}
                <div className="bg-surface-container-high/50 p-6 rounded-2xl border border-outline-variant/10">
                  <div className="flex items-center gap-2 mb-2 text-tertiary">
                    <span className="material-symbols-outlined text-sm">lightbulb</span>
                    <span className="text-xs font-bold uppercase tracking-wider">Curator's Tip</span>
                  </div>
                  <p className="text-sm text-on-surface-variant italic leading-relaxed">
                    "Active recall is most effective when done 24 hours after initial learning. Don't skip your 1-day reviews!"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* MAIN VIEW: HISTORY SECTION */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-headline font-bold text-on-surface">Revision History</h3>
              <p className="text-xs text-slate-500">View recent problem revisions and recall status.</p>

              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
                {problems.map(prob => (
                  <div key={prob._id} className="p-4 rounded-xl bg-slate-50 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">{prob.name}</h4>
                      <span className="text-xs text-slate-500 font-mono">
                        Pattern: {prob.pattern} • Reviews Completed: {prob.reviewCount || 0}
                      </span>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-100 text-indigo-700">
                      {prob.recallStatus || 'new'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default RevisionModeDashboard;
