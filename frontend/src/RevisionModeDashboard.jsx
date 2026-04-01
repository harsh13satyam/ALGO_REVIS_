import React, { useState, useEffect } from 'react';

const RevisionModeDashboard = ({ navigate }) => {
  const [problems, setProblems] = useState([]);
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
      const uName = localStorage.getItem('userName') || 'testUser';
      const res = await fetch(`http://localhost:5000/api/problems/${uName}`);
      if(res.ok) {
        const data = await res.json();
        setProblems(data);
        
        // Smart Daily Challenge Logic
        if (data.length > 0) {
          const todayStr = new Date().toISOString().split('T')[0];
          const storedDate = localStorage.getItem('dailyChallengeDate');
          const storedProblemId = localStorage.getItem('dailyChallengeId');
          let recentChallenges = JSON.parse(localStorage.getItem('recentChallenges') || '[]');

          if (storedDate === todayStr && storedProblemId) {
            const todayProb = data.find(p => p._id === storedProblemId);
            if (todayProb) {
              setDailyChallenge(todayProb);
            }
          } else {
            let availableProblems = data.filter(p => !recentChallenges.includes(p._id));
            if (availableProblems.length === 0) {
              recentChallenges = recentChallenges.slice(-1); // Keep only the last one
              availableProblems = data.filter(p => !recentChallenges.includes(p._id));
              if (availableProblems.length === 0) availableProblems = data;
            }
            const randomProb = availableProblems[Math.floor(Math.random() * availableProblems.length)];
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

  return (
    <div className="bg-surface font-body text-on-surface">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm dark:shadow-none border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between px-6 py-3 w-full">
          <div className="flex items-center gap-8">
            <span className="text-xl font-bold tracking-tighter text-slate-900 dark:text-white font-headline">AlgoRevis</span>
            <nav className="hidden md:flex items-center gap-6 font-headline font-semibold tracking-tight">
              <a className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-3 py-1 rounded-lg" href="#">Problems</a>
              <a className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-3 py-1 rounded-lg" href="#">Sheets</a>
              <a className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-3 py-1 rounded-lg" href="#">Mock Tests</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-500">notifications</span>
              <span className="material-symbols-outlined text-slate-500">settings</span>
            </div>
            <button className="signature-gradient text-white px-5 py-2 rounded-xl font-headline font-semibold text-sm active:scale-95 transition-transform">Start Session</button>
            <img alt="User Profile Avatar" className="w-8 h-8 rounded-full border border-outline-variant/15" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjDclPsg81aPuTGBxmXpIxe9xXvlbLEQzMoHrmrPkNQ1reqc7r6vHiahX5-y5tlhwE6yCnPNGlHpkqArulp6iPiv0_5LvYUQwWJIU7wR9xvc2aseIuw9wkG032pdd80-6P3VX7fEdNO3shlEd-EHNhsMEnD1EzoPlst3AFUekhZ8SxJxDwZ71pBEP7vQmDt3nm20JTjHkGmR0BHh6I0cmMmW6lAix923fFyj158NMwDWeDbx87xz0tMIrwxLDZp8rGoe8VilBKPEK4" />
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
          <a className="flex items-center gap-3 px-3 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-all duration-200 ease-in-out font-body text-sm font-medium" href="#" onClick={(e) => { e.preventDefault(); navigate('dashboard_home'); }}>
            <span className="material-symbols-outlined">dashboard</span>
            <span>Dashboard</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm rounded-lg transition-all duration-200 ease-in-out font-body text-sm font-medium" href="#" onClick={(e) => { e.preventDefault(); navigate('revision_dashboard'); }}>
            <span className="material-symbols-outlined">event_repeat</span>
            <span>Revision Queue</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-all duration-200 ease-in-out font-body text-sm font-medium" href="#">
            <span className="material-symbols-outlined">category</span>
            <span>Topics</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-all duration-200 ease-in-out font-body text-sm font-medium" href="#">
            <span className="material-symbols-outlined">history</span>
            <span>History</span>
          </a>
        </nav>
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <button className="w-full signature-gradient text-white py-2 rounded-xl font-headline font-semibold text-sm mb-4 active:scale-95 transition-transform">Quick Practice</button>
          <a className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-slate-900 transition-colors font-body text-sm font-medium" href="#">
            <span className="material-symbols-outlined">help_outline</span>
            <span>Support</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-slate-900 transition-colors font-body text-sm font-medium" href="#">
            <span className="material-symbols-outlined">logout</span>
            <span>Sign Out</span>
          </a>
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
              {/* Abstract Background Pattern */}
              <div className="absolute top-0 right-0 w-64 h-full bg-primary/5 -skew-x-12 translate-x-16 pointer-events-none"></div>
              <div className="absolute top-0 right-0 w-32 h-full bg-primary/10 -skew-x-12 translate-x-8 pointer-events-none"></div>
            </div>

            {/* Quick Actions */}
            <div className="bg-surface-container-low p-8 rounded-2xl flex flex-col justify-center space-y-4">
              {dailyChallenge && dailyChallenge.link ? (
                <a href={dailyChallenge.link} target="_blank" rel="noreferrer" className="signature-gradient text-white w-full py-4 rounded-xl font-headline font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                  <span className="material-symbols-outlined">play_circle</span>
                  Start Today's Revision
                </a>
              ) : (
                <button className="signature-gradient text-white w-full py-4 rounded-xl font-headline font-bold text-lg shadow-lg shadow-primary/20 opacity-50 cursor-not-allowed flex items-center justify-center gap-3 border-none">
                  <span className="material-symbols-outlined">play_circle</span>
                  Start Today's Revision
                </button>
              )}
              <button className="bg-surface-container-lowest text-on-surface w-full py-4 rounded-xl font-headline font-bold text-lg border border-outline-variant/20 hover:bg-surface-bright transition-all flex items-center justify-center gap-3">
                <span className="material-symbols-outlined">shuffle</span>
                Random Practice
              </button>
            </div>
          </section>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Revision Queue (Left) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-headline font-bold text-on-surface">Revision Queue</h3>
                <div className="flex gap-2">
                  <button className="p-2 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant">
                    <span className="material-symbols-outlined">filter_list</span>
                  </button>
                  <button className="p-2 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant">
                    <span className="material-symbols-outlined">sort</span>
                  </button>
                </div>
              </div>

              {/* Bento Style List */}
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-10 text-on-surface-variant font-bold">Loading Queue...</div>
                ) : problems.length === 0 ? (
                  <div className="text-center py-10 text-on-surface-variant font-bold">No problems to revise yet.</div>
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
                        <div className="text-right">
                          <span className={`block text-xs font-bold uppercase tracking-tighter mb-1 ${prob.difficulty === 'Hard' ? 'text-error' : 'text-on-surface-variant'}`}>Due Now</span>
                          {prob.link ? (
                            <a href={prob.link} target="_blank" rel="noreferrer" className="text-primary text-sm font-bold flex items-center gap-1 group-hover:underline">
                              Solve <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </a>
                          ) : (
                            <span className="text-on-surface-variant/50 text-sm font-bold">No link</span>
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
              
              {/* Daily Challenge Mini Card */}
              <div className="signature-gradient p-6 rounded-2xl shadow-xl shadow-primary/20 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <span className="text-[10px] font-bold tracking-widest uppercase opacity-80 mb-2 block">Daily Challenge</span>
                  <h4 className="font-headline font-bold text-xl mb-3">{dailyChallenge ? dailyChallenge.name : "Add more problems"}</h4>
                  <p className="text-white/70 text-sm mb-4">Complete this challenge to boost your pattern recognition score.</p>
                  {dailyChallenge && dailyChallenge.link ? (
                    <a href={dailyChallenge.link} target="_blank" rel="noreferrer" className="inline-block bg-white text-primary px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform">Solve Now</a>
                  ) : (
                    <button className="bg-white/50 text-primary px-4 py-2 rounded-xl text-sm font-bold cursor-not-allowed">Solve Now</button>
                  )}
                </div>
                <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-white/10 text-9xl pointer-events-none">school</span>
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
        </div>
      </main>
    </div>
  );
};

export default RevisionModeDashboard;
