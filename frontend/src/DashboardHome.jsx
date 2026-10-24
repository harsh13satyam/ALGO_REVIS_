import React, { useState, useEffect } from 'react';
import api from './api';
import ChromeExtensionModal from './ChromeExtensionModal';

const DashboardHome = ({ navigate, user }) => {
  const [userName, setUserName] = useState(() => {
    return user?.name || localStorage.getItem('userName') || "User";
  });
  const [problems, setProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  
  useEffect(() => {
    if (user?.name) {
      setUserName(user.name);
      localStorage.setItem('userName', user.name);
    } else {
      api.getMe().then(data => {
        if (data?.user?.name) {
          setUserName(data.user.name);
          localStorage.setItem('userName', data.user.name);
        }
      }).catch(() => {});
    }

    const fetchDashboardData = async () => {
      try {
        const data = await api.getProblems();
        if (Array.isArray(data)) {
          data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setProblems(data);
        }
      } catch(e) {
        console.error("Failed to fetch dashboard problems", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const totalProblems = problems.length;
  const easyCount = problems.filter(p => p.difficulty === 'Easy').length;
  const mediumCount = problems.filter(p => p.difficulty === 'Medium').length;
  const hardCount = problems.filter(p => p.difficulty === 'Hard').length;

  const recentFolders = [...new Set(problems.map(p => p.pattern))].slice(0, 3);
  const recentProblemsList = problems.slice(0, 4);

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

  return (
    <div className="bg-surface text-on-background min-h-screen font-body">
      {/* SideNavBar */}
      <nav className="fixed left-0 top-0 h-screen w-64 border-r border-slate-100 dark:border-slate-900 bg-slate-50 dark:bg-slate-950 flex-col py-8 z-40 hidden md:flex text-left">
        <div className="px-6 mb-8">
          <h1 className="font-bold text-lg text-indigo-700 dark:text-indigo-300 font-headline">The Curator</h1>
          <p className="text-xs font-medium text-slate-400 tracking-wider">Algorithms & Data Structures</p>
        </div>
        <div className="flex-1 flex flex-col gap-1">
          {/* Dashboard (Active) */}
          <a className="text-indigo-700 dark:text-indigo-300 font-bold border-r-4 border-indigo-600 flex items-center gap-3 px-6 py-3 bg-indigo-50/30" href="#" onClick={(e) => { e.preventDefault(); navigate('dashboard_home'); }}>
            <span className="material-symbols-outlined" data-icon="grid_view">grid_view</span>
            <span className="font-body text-sm">Dashboard</span>
          </a>
          <a className="text-slate-500 dark:text-slate-400 flex items-center gap-3 px-6 py-3 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 transition-all duration-300" href="#" onClick={(e) => { e.preventDefault(); navigate('folders'); }}>
            <span className="material-symbols-outlined" data-icon="folder_open">folder_open</span>
            <span className="font-body text-sm">My Folders</span>
          </a>
          <a className="text-slate-500 dark:text-slate-400 flex items-center gap-3 px-6 py-3 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 transition-all duration-300" href="#">
            <span className="material-symbols-outlined" data-icon="create_new_folder">create_new_folder</span>
            <span className="font-body text-sm">Add New Folder</span>
          </a>
          <a className="text-slate-500 dark:text-slate-400 flex items-center gap-3 px-6 py-3 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 transition-all duration-300" href="#" onClick={(e) => { e.preventDefault(); navigate('daily_challenge', { mode: 'random' }); }}>
            <span className="material-symbols-outlined" data-icon="shuffle">shuffle</span>
            <span className="font-body text-sm font-semibold">Random Practice</span>
          </a>
          <a className="text-slate-500 dark:text-slate-400 flex items-center gap-3 px-6 py-3 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 transition-all duration-300" href="#" onClick={(e) => { e.preventDefault(); navigate('daily_challenge', { mode: 'daily' }); }}>
            <span className="material-symbols-outlined" data-icon="bolt">bolt</span>
            <span className="font-body text-sm font-semibold">Daily Challenge</span>
          </a>
          <a className="text-slate-500 dark:text-slate-400 flex items-center gap-3 px-6 py-3 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 transition-all duration-300" href="#" onClick={(e) => { e.preventDefault(); navigate('revision_dashboard'); }}>
            <span className="material-symbols-outlined" data-icon="History_edu">history_edu</span>
            <span className="font-body text-sm font-semibold">Revision Mode</span>
          </a>
          <a className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-3 px-6 py-3 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all duration-300" href="#" onClick={(e) => { e.preventDefault(); setShowExtensionModal(true); }}>
            <span className="text-amber-500 font-bold">⚡</span>
            <span className="font-body text-sm">Chrome Extension</span>
          </a>
          <a className="text-slate-500 dark:text-slate-400 flex items-center gap-3 px-6 py-3 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 transition-all duration-300 mt-auto" href="#">
            <span className="material-symbols-outlined" data-icon="settings">settings</span>
            <span className="font-body text-sm">Settings</span>
          </a>
        </div>
        <div className="px-6 mt-6">
          <button className="w-full signature-gradient text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all" onClick={() => navigate('add_problem')}>
            <span className="material-symbols-outlined text-sm" data-icon="add">add</span>
            New Problem
          </button>
        </div>
      </nav>

      {/* Content Area */}
      <main className="md:ml-64 min-h-screen flex flex-col text-left">
        {/* TopAppBar */}
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl flex justify-between items-center px-6 py-3 w-full border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" data-icon="search">search</span>
              <input className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all" placeholder="Search problems, folders, or concepts..." type="text" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowExtensionModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-bold transition shadow-sm cursor-pointer"
              title="Download & setup Chrome Extension for LeetCode & GFG"
            >
              <span className="text-amber-500">⚡</span>
              <span>Chrome Extension</span>
            </button>
            <button className="p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
              <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
            </button>
            <button className="p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
              <span className="material-symbols-outlined" data-icon="help_outline">help_outline</span>
            </button>
            <div className="h-8 w-[1px] bg-slate-100 dark:bg-slate-800 mx-2"></div>
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-50 leading-tight">{userName}</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Member</p>
              </div>
              <img alt="User profile avatar" className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-50" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBplqHqcerbujnVnZP6b7vfk3bmK_kq0JyqYYykpVAImoP8aWi2p0p-iSHJa9ssYKKVCZFrV7JiffqnoYp5yL_6K0lMx9Ilh-64VPvae9X1ZTtc0zhY5Tui0vNHsCbnqs2nVIt5SokPSfOdfLrGMRxdajxELaXXiE5qMqjRjnZ8NFYk4BVEWS2sUJzcrNVhZ0keMupDiD4gAw2DpOULOGimwLtjrlmvdmDtlXOavYtknPl8WeBNwqVJJcFsGgyroUy-gy0M8-SY2s6L" />
            </div>
          </div>
        </header>

        {/* Dashboard Canvas */}
        <div className="p-8 space-y-12 max-w-7xl mx-auto w-full">
          {/* Welcome Header */}
          <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2 font-headline">Welcome back, {(userName || "Curator").split(" ")[0]}!</h2>
              <p className="text-on-surface-variant font-medium">You're on a {currentStreak}-day revision streak. Ready to crack some trees today?</p>
            </div>
            <div className="bg-tertiary-fixed px-6 py-3 rounded-xl flex items-center gap-4">
              <div className="p-2 bg-on-tertiary-fixed-variant rounded-full text-white">
                <span className="material-symbols-outlined" data-icon="local_fire_department" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-on-tertiary-fixed-variant opacity-80">Daily Streak</p>
                <p className="text-xl font-extrabold text-on-tertiary-fixed-variant leading-none">{currentStreak} Days</p>
              </div>
            </div>
          </section>

          {/* Quick Stats Bento Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Large Stats Card */}
            <div className="md:col-span-2 bg-surface-container-lowest rounded-2xl p-8 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[240px]">
              <div className="relative z-10">
                <p className="text-sm font-bold text-indigo-600 uppercase tracking-[0.15em] mb-4">Performance Overview</p>
                <h3 className="text-6xl font-extrabold font-headline tracking-tighter text-on-surface">{isLoading ? "..." : totalProblems}</h3>
                <p className="text-lg text-on-surface-variant font-medium mt-2">Total Problems Solved</p>
              </div>
              <div className="relative z-10 mt-6 flex gap-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-on-surface">
                  <span className="w-3 h-3 rounded-full bg-secondary-container"></span> Easy: {easyCount}
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-on-surface">
                  <span className="w-3 h-3 rounded-full bg-tertiary-fixed"></span> Med: {mediumCount}
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-on-surface">
                  <span className="w-3 h-3 rounded-full bg-error-container"></span> Hard: {hardCount}
                </div>
              </div>
              {/* Decorative Element */}
              <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
            </div>

            {/* Recent Folders Column */}
            <div className="bg-surface-container-low rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-headline font-bold text-on-surface">Recent Folders</h3>
                <a className="text-xs font-bold text-primary hover:underline" href="#">View All</a>
              </div>
              <div className="space-y-3">
                {recentFolders.length === 0 && !isLoading ? (
                  <div className="bg-surface-container-lowest p-6 text-center rounded-xl flex items-center justify-center text-on-surface-variant text-sm border border-dashed border-surface-container-highest">
                    No folders created yet.
                  </div>
                ) : (
                  recentFolders.map((folder, i) => (
                    <div key={i} className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/10 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => navigate('folders')}>
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-indigo-500">folder</span>
                        <span className="font-bold text-sm text-slate-700">{folder}</span>
                      </div>
                      <span className="material-symbols-outlined text-slate-300 text-sm">chevron_right</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* Recent Problems Grid */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-surface-container-high pb-4">
              <h3 className="font-headline text-2xl font-bold text-on-surface">Recent Problems</h3>
              <div className="flex gap-2">
                <button className="p-2 bg-surface-container-low rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors">
                  <span className="material-symbols-outlined text-lg" data-icon="filter_list">filter_list</span>
                </button>
                <button className="p-2 bg-surface-container-low rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors">
                  <span className="material-symbols-outlined text-lg" data-icon="sort">sort</span>
                </button>
              </div>
            </div>
            {recentProblemsList.length === 0 && !isLoading ? (
              <div className="bg-surface-container-lowest rounded-2xl p-12 text-center border-2 border-dashed border-surface-container-highest">
                 <p className="text-on-surface-variant font-medium">No recent problems solved yet. Time to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {recentProblemsList.map(prob => (
                  <div key={prob._id} className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                        <span className="material-symbols-outlined text-[20px]">terminal</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        prob.difficulty === 'Easy' ? 'bg-secondary-container text-on-secondary-container' :
                        prob.difficulty === 'Medium' ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant' :
                        'bg-error-container text-on-error-container'
                      }`}>{prob.difficulty}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-1" title={prob.name}>{prob.name}</h4>
                      <p className="text-[10px] font-xbold text-slate-400 uppercase tracking-widest line-clamp-1">{prob.pattern}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sticky Floating Help */}
        <button className="fixed bottom-8 right-8 w-14 h-14 bg-surface-container-lowest text-primary shadow-2xl rounded-full flex items-center justify-center border border-primary/10 hover:scale-110 active:scale-95 transition-all z-50 backdrop-blur-md bg-opacity-80">
          <span className="material-symbols-outlined" data-icon="help_center">help_center</span>
        </button>

        {/* Chrome Extension Setup Modal */}
        <ChromeExtensionModal
          isOpen={showExtensionModal}
          onClose={() => setShowExtensionModal(false)}
        />
      </main>
    </div>
  );
};

export default DashboardHome;
