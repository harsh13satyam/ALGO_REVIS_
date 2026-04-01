import React, { useState, useEffect } from 'react';

const MyFolders = ({ navigate }) => {
  const [problems, setProblems] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null);
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

  // Folder Actions
  const [openFolderMenu, setOpenFolderMenu] = useState(null);
  const [folderToEdit, setFolderToEdit] = useState(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderToDelete, setFolderToDelete] = useState(null);

  // Daily Challenge
  const [dailyChallenge, setDailyChallenge] = useState(null);

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

  const handleModifyFolder = async () => {
    if (!newFolderName.trim() || newFolderName === folderToEdit) return;
    try {
      const uName = localStorage.getItem('userName') || 'testUser';
      const res = await fetch(`http://localhost:5000/api/problems/folder/${uName}/${encodeURIComponent(folderToEdit)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPattern: newFolderName })
      });
      if (res.ok) {
        setFolderToEdit(null);
        fetchProblems();
      }
    } catch (err) {
      console.error("Failed to rename:", err);
    }
  };

  const handleDeleteFolder = async () => {
    try {
      const uName = localStorage.getItem('userName') || 'testUser';
      const res = await fetch(`http://localhost:5000/api/problems/folder/${uName}/${encodeURIComponent(folderToDelete)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setFolderToDelete(null);
        fetchProblems();
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const folders = problems.reduce((acc, prob) => {
    if (!acc[prob.pattern]) acc[prob.pattern] = [];
    acc[prob.pattern].push(prob);
    return acc;
  }, {});

  return (
    <div className="bg-surface font-body text-on-surface">
      {/* SideNavBar (Fixed Left) */}
      <aside className="fixed left-0 top-0 h-screen w-64 border-r border-slate-100 dark:border-slate-900 bg-slate-50 dark:bg-slate-950 flex flex-col py-8 z-40 hidden md:flex">
        <div className="px-6 mb-10">
          <h1 className="font-bold text-lg text-indigo-700 dark:text-indigo-300 font-headline">The Curator</h1>
          <p className="text-[10px] uppercase tracking-[0.1em] text-slate-500 font-label mt-1">Algorithms &amp; Data Structures</p>
        </div>
        <nav className="flex-1 space-y-1">
          <a className="text-slate-500 dark:text-slate-400 flex items-center gap-3 px-6 py-3 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 transition-all duration-300 ease-in-out" href="#" onClick={(e) => { e.preventDefault(); navigate('dashboard_home'); }}>
            <span className="material-symbols-outlined" data-icon="grid_view">grid_view</span>
            <span className="font-medium">Dashboard</span>
          </a>
          <a className="text-indigo-700 dark:text-indigo-300 font-bold border-r-4 border-indigo-600 flex items-center gap-3 px-6 py-3 bg-indigo-50/30 dark:bg-indigo-900/10 transition-all duration-300 ease-in-out" href="#" onClick={(e) => { e.preventDefault(); navigate('folders'); }}>
            <span className="material-symbols-outlined" data-icon="folder_open">folder_open</span>
            <span className="font-medium">My Folders</span>
          </a>
          <a className="text-slate-500 dark:text-slate-400 flex items-center gap-3 px-6 py-3 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 transition-all duration-300 ease-in-out" href="#">
            <span className="material-symbols-outlined" data-icon="create_new_folder">create_new_folder</span>
            <span className="font-medium">Add New Folder</span>
          </a>
          <a className="text-slate-500 dark:text-slate-400 flex items-center gap-3 px-6 py-3 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 transition-all duration-300 ease-in-out" href="#" onClick={(e) => { e.preventDefault(); navigate('revision_dashboard'); }}>
            <span className="material-symbols-outlined" data-icon="History_edu">history_edu</span>
            <span className="font-medium">Revision Mode</span>
          </a>
          <a className="text-slate-500 dark:text-slate-400 flex items-center gap-3 px-6 py-3 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 transition-all duration-300 ease-in-out" href="#">
            <span className="material-symbols-outlined" data-icon="settings">settings</span>
            <span className="font-medium">Settings</span>
          </a>
        </nav>
        <div className="px-6 mt-auto">
          <button className="w-full signature-gradient text-white py-3 rounded-xl font-semibold shadow-lg shadow-indigo-200 dark:shadow-none transition-transform active:scale-[0.98]" onClick={() => navigate('add_problem')}>
            New Problem
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="md:ml-64 min-h-screen flex flex-col">
        {/* TopAppBar */}
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none flex justify-between items-center px-6 py-3 w-full">
          <div className="flex items-center gap-4 flex-1">
            <div className="md:hidden">
              <span className="material-symbols-outlined text-slate-900" data-icon="menu">menu</span>
            </div>
            <div className="relative w-full max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" data-icon="search">search</span>
              <input className="w-full bg-surface-container-high border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all" placeholder="Search folders..." type="text" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-1">
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 font-headline">AlgoRevis</span>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-slate-500 hover:text-indigo-600 transition-colors">
                <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
              </button>
              <button className="text-slate-500 hover:text-indigo-600 transition-colors">
                <span className="material-symbols-outlined" data-icon="help_outline">help_outline</span>
              </button>
              <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-100">
                <img alt="User profile avatar" className="w-full h-full object-cover" data-alt="User avatar with a professional tech illustration" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA96PC9CCiedcCZOqsHyLS59GqcLKNgkLOiD1mxPMSCjKKTPJC1jltV2r10RGD9XeyjEtD2P0Vn2vOaYLfQfLfPAaH0Q0mOCGgrBk1SMmL1uUwweAOu2vUwW2EYGBovkRtVA1GmByQnhGSem-RF_9929l_JZMB0O-TMCqwr9TPQyObmQ9VJkxIpgB-HeLSkWXZHYDHLoxv5kxgsv09jiuU4FQgSsdg-exiLyE47gBzyXaAVqXH88UPgRzFjMcPB-bgw11He-Tdw8rI6" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Canvas */}
        <div className="p-8 max-w-7xl w-full mx-auto">
          {selectedFolder ? (
            <div className="animate-fade-in-up">
              <div className="mb-10 flex items-center gap-4">
                <button onClick={() => setSelectedFolder(null)} className="w-10 h-10 rounded-full bg-surface-container-low hover:bg-surface-container-high transition-colors flex items-center justify-center text-slate-600">
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div>
                  <span className="text-[10px] font-bold tracking-[0.15em] text-indigo-600 font-label uppercase">Folder contents</span>
                  <h2 className="text-4xl font-extrabold text-slate-900 dark:text-slate-50 font-headline mt-1 tracking-tight">{selectedFolder}</h2>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {folders[selectedFolder]?.map(prob => (
                  <div key={prob._id} className="group bg-surface-container-lowest rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_24px_48px_rgb(0,0,0,0.06)] transition-all duration-500 flex flex-col overflow-hidden border border-slate-100">
                     {prob.imageBase64 ? (
                        <div className="w-full h-48 overflow-hidden cursor-pointer" onClick={() => setZoomedImage(prob.imageBase64)}>
                          <img src={prob.imageBase64} alt={prob.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                     ) : (
                        <div className="w-full h-48 bg-indigo-50/50 dark:bg-slate-800 flex items-center justify-center">
                          <span className="text-xs text-indigo-300 font-bold uppercase tracking-widest">No Image Provided</span>
                        </div>
                     )}
                     <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-slate-900 font-headline tracking-tight mb-2 group-hover:text-indigo-600 transition-colors">{prob.name}</h3>
                        <div className="flex items-center gap-3 mb-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${prob.difficulty === 'Easy' ? 'bg-secondary-container text-indigo-700' : prob.difficulty === 'Hard' ? 'bg-error-container text-red-700' : 'bg-tertiary-fixed text-amber-700'}`}>{prob.difficulty}</span>
                          {prob.link && (
                            <a href={prob.link} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-1 transition-colors">
                              <span className="material-symbols-outlined text-[14px]">link</span> Solve
                            </a>
                          )}
                        </div>
                        {prob.notes && (
                           <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 flex-1">
                             <p className="text-xs text-slate-600 font-body leading-relaxed">{prob.notes}</p>
                           </div>
                        )}
                     </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Header Section */}
              <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold tracking-[0.15em] text-indigo-600 font-label uppercase">Workspace</span>
                  <h2 className="text-4xl font-extrabold text-slate-900 dark:text-slate-50 font-headline mt-1 tracking-tight">My Folders</h2>
                </div>
                <div className="flex gap-3">
                  <button className="px-5 py-2.5 rounded-xl border border-outline-variant/30 text-slate-600 font-semibold hover:bg-white transition-colors flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg" data-icon="sort">sort</span>
                    Sort
                  </button>
                </div>
              </div>

              {/* Folders Bento Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Add New Folder Card */}
                <button onClick={() => navigate('add_problem')} className="group relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-300 min-h-[220px]">
                  <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform duration-300">
                    <span className="material-symbols-outlined text-3xl" data-icon="add">add</span>
                  </div>
                  <span className="mt-4 font-bold text-indigo-700 font-headline">Add New Folder</span>
                  <p className="text-xs text-indigo-400 mt-1 font-label">Create a new DSA topic</p>
                </button>

                {isLoading ? (
                   <div className="col-span-full py-12 text-center text-slate-400 font-bold">Loading your folders...</div>
                ) : Object.keys(folders).length === 0 ? (
                   <div className="col-span-full py-12 text-center text-slate-400 font-label text-sm uppercase tracking-widest">No saved formulas yet. Time to add your first algorithm!</div>
                ) : (
                   Object.keys(folders).map(folderName => (
                    <div key={folderName} onClick={() => setSelectedFolder(folderName)} className="group bg-surface-container-lowest rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_24px_48px_rgb(0,0,0,0.06)] transition-all duration-500 cursor-pointer flex flex-col justify-between min-h-[220px]">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <span className="material-symbols-outlined" data-icon="folder">folder</span>
                          </div>
                          <div className="relative">
                            <button onClick={(e) => { e.stopPropagation(); setOpenFolderMenu(openFolderMenu === folderName ? null : folderName); }} className="p-1 hover:bg-slate-100 rounded flex transition-colors">
                              <span className="material-symbols-outlined text-slate-300 hover:text-slate-600" data-icon="more_vert">more_vert</span>
                            </button>
                            {openFolderMenu === folderName && (
                              <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-xl border border-slate-100 z-10 py-1" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => { setFolderToEdit(folderName); setNewFolderName(folderName); setOpenFolderMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                  <span className="material-symbols-outlined text-[16px]">edit</span> Rename
                                </button>
                                <button onClick={() => { setFolderToDelete(folderName); setOpenFolderMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                  <span className="material-symbols-outlined text-[16px]">delete</span> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 font-headline tracking-tight group-hover:text-indigo-600 transition-colors line-clamp-1">{folderName}</h3>
                        <p className="text-sm text-slate-500 font-body mt-1">{folders[folderName].length} Problems</p>
                      </div>
                      <div className="pt-4 flex items-center justify-between border-t border-slate-50 mt-4">
                        <div className="flex -space-x-2">
                          {folders[folderName].some(p => p.difficulty === 'Easy') && <div className="w-6 h-6 rounded-full border-2 border-white bg-[#C2E7FF] flex items-center justify-center text-[10px] font-bold text-[#001D35]">E</div>}
                          {folders[folderName].some(p => p.difficulty === 'Medium') && <div className="w-6 h-6 rounded-full border-2 border-white bg-[#FFDAA6] flex items-center justify-center text-[10px] font-bold text-[#2A1800]">M</div>}
                          {folders[folderName].some(p => p.difficulty === 'Hard') && <div className="w-6 h-6 rounded-full border-2 border-white bg-[#FFB4AB] flex items-center justify-center text-[10px] font-bold text-[#410002]">H</div>}
                        </div>
                        <span className="material-symbols-outlined text-slate-300 group-hover:text-indigo-400 transition-colors" data-icon="arrow_forward">arrow_forward</span>
                      </div>
                    </div>
                   ))
                )}
              </div>

              {/* Empty State / Stats Section */}
              <div className="mt-20 flex flex-col md:flex-row gap-12 items-center">
                <div className="flex-1">
                  <h4 className="text-2xl font-bold text-slate-900 font-headline">Revision Insights</h4>
                  <p className="text-slate-500 mt-2 max-w-lg">You have mastered 65% of your problems. Keep adding more formulas to maintain your streak.</p>
                  <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="bg-surface-container-low p-6 rounded-xl">
                      <span className="text-3xl font-extrabold text-indigo-600 font-headline">{problems.length}</span>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1 font-label">Total Problems</p>
                    </div>
                    <div className="bg-surface-container-low p-6 rounded-xl">
                      <span className="text-3xl font-extrabold text-[#745B00] font-headline">{currentStreak}</span>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1 font-label">Day Streak</p>
                    </div>
                  </div>
                </div>
                <div className="relative w-full md:w-80 h-64 rounded-2xl overflow-hidden signature-gradient shadow-2xl shadow-indigo-200">
                  <img className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30" alt="Abstract cyber circuit pattern blue gradient" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnv0iGn_Jtoh_AnmJhqAix5L_Sufxabm5JExuOONXfs1RwlkY8tcduvIT5Pcr1eKNDg69Ijmz80Hnu3M0Lfd5bcyOO3HJVC8EfKTgsM90dJMl1Va0-ChvGHT9G1CH02dz0_C1SqV18PWi-tV5xdxoLIq9XdpRjVnnjdnrvx4PvnOlj4TrbOq6KCTZr0NeBnXq5MqIXMFcsNEw7c9YieBfpJs9xwRdZQ0sIjtmXKxPNZF1_J0Pr_qAhqnHAYZdXkn3_LCFNqVag1ga2" />
                  <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                    <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Daily Challenge</p>
                    <h5 className="text-xl font-bold font-headline leading-tight">{dailyChallenge ? dailyChallenge.name : "Add more problems"}</h5>
                    <div className="mt-4">
                      {dailyChallenge && dailyChallenge.link ? (
                        <a href={dailyChallenge.link} target="_blank" rel="noreferrer" className="inline-block bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/30 transition-colors">Solve Now</a>
                      ) : (
                        <button className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg text-sm font-semibold opacity-50 cursor-not-allowed">Solve Now</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Space */}
        <footer className="mt-auto py-10 px-8 text-center text-slate-400 text-xs font-medium border-t border-slate-100">
          AlgoRevis © 2024. Designed for the disciplined engineer.
        </footer>
      </main>

      {/* Mobile Bottom Navigation Shell */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-center z-50">
        <a className="flex flex-col items-center gap-1 text-slate-400" href="#">
          <span className="material-symbols-outlined" data-icon="grid_view">grid_view</span>
          <span className="text-[10px] font-bold font-label">Home</span>
        </a>
        <a className="flex flex-col items-center gap-1 text-indigo-600" href="#">
          <span className="material-symbols-outlined" data-icon="folder_open">folder_open</span>
          <span className="text-[10px] font-bold font-label">Folders</span>
        </a>
        <div className="relative -top-6">
          <button className="w-14 h-14 rounded-full signature-gradient text-white shadow-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl" data-icon="add">add</span>
          </button>
        </div>
        <a className="flex flex-col items-center gap-1 text-slate-400" href="#">
          <span className="material-symbols-outlined" data-icon="history_edu">history_edu</span>
          <span className="text-[10px] font-bold font-label">Review</span>
        </a>
        <a className="flex flex-col items-center gap-1 text-slate-400" href="#">
          <span className="material-symbols-outlined" data-icon="settings">settings</span>
          <span className="text-[10px] font-bold font-label">Settings</span>
        </a>
      </nav>

      {/* Modals for Folder Actions */}
      {folderToEdit && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold font-headline text-slate-900 mb-2">Rename Folder</h3>
            <p className="text-sm text-slate-500 mb-6 font-body">Updating this folder will rename the category for all problems inside it.</p>
            <input type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none mb-8" placeholder="Folder Name" />
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setFolderToEdit(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors tracking-wide">Cancel</button>
              <button onClick={handleModifyFolder} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95 tracking-wide">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {folderToDelete && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-4">
              <span className="material-symbols-outlined text-2xl">delete_forever</span>
            </div>
            <h3 className="text-2xl font-bold font-headline text-slate-900 mb-2">Delete <span className="text-red-600">"{folderToDelete}"</span></h3>
            <p className="text-sm text-slate-500 mb-8 font-body leading-relaxed">Are you absolutely sure? This will permanently delete all problems associated with this folder from the database. This action cannot be undone.</p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setFolderToDelete(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors tracking-wide">Cancel</button>
              <button onClick={handleDeleteFolder} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-all shadow-lg shadow-red-200 active:scale-95 tracking-wide">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {zoomedImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer" onClick={() => setZoomedImage(null)}>
          <button className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined">close</span>
          </button>
          <img src={zoomedImage} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl scale-100 animate-fade-in-up" alt="Zoomed view" />
        </div>
      )}
    </div>
  );
};

export default MyFolders;
