import React, { useEffect } from 'react';

/**
 * MobileNavDrawer - Three-line hamburger navigation drawer for mobile and tablet users.
 * Provides easy access to all app features, user profile, settings, and logout.
 */
const MobileNavDrawer = ({
  isOpen,
  onClose,
  currentView,
  navigate,
  userName,
  user,
  onLogout,
  onOpenExtensionModal,
  onOpenProfile,
  onOpenSettings,
  onOpenBugReport,
}) => {
  // Prevent body scrolling when drawer is open & handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayName = userName || user?.name || localStorage.getItem('userName') || 'harshcode13';
  const displayEmail = user?.email || localStorage.getItem('userEmail') || 'curator@algorevis.dev';

  const handleNavClick = (view, params) => {
    onClose();
    navigate(view, params);
  };

  const navItems = [
    { id: 'dashboard_home', label: 'Dashboard Home', icon: 'grid_view', action: () => handleNavClick('dashboard_home') },
    { id: 'folders', label: 'My Folders', icon: 'folder_open', action: () => handleNavClick('folders') },
    { id: 'add_problem', label: 'Add New Problem', icon: 'add_circle', badge: 'New', action: () => handleNavClick('add_problem') },
    { id: 'random_practice', label: 'Random Practice', icon: 'shuffle', badge: '🎲', action: () => handleNavClick('daily_challenge', { mode: 'random' }) },
    { id: 'daily_challenge', label: 'Daily Challenge', icon: 'bolt', badge: 'Daily', action: () => handleNavClick('daily_challenge', { mode: 'daily' }) },
    { id: 'sheets', label: 'DSA Curated Sheets', icon: 'dataset', badge: 'Sheets', action: () => handleNavClick('sheets') },
    { id: 'mock_tests', label: 'DSA Mock Tests', icon: 'timer', badge: 'Timed', action: () => handleNavClick('mock_tests') },
    { id: 'revision_dashboard', label: 'Revision Mode', icon: 'history_edu', action: () => handleNavClick('revision_dashboard') },
  ];

  return (
    <div className="fixed inset-0 z-[1000] flex animate-fade-in text-left">
      {/* Dark backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer content sliding from left */}
      <div className="relative w-80 max-w-[85vw] bg-slate-900 border-r border-slate-800 h-full flex flex-col shadow-2xl z-10 overflow-y-auto">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg signature-gradient flex items-center justify-center text-white shadow-md">
              <span className="material-symbols-outlined text-base">code</span>
            </div>
            <div>
              <h2 className="font-headline font-extrabold text-base text-white tracking-tight leading-none">
                AlgoRevis
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
                Spaced Revision
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Close menu"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* User Card inside Drawer */}
        <div
          onClick={() => {
            onClose();
            if (onOpenProfile) onOpenProfile();
          }}
          className="m-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 flex items-center gap-3 cursor-pointer transition"
        >
          <img
            alt="User profile avatar"
            className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/50"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBplqHqcerbujnVnZP6b7vfk3bmK_kq0JyqYYykpVAImoP8aWi2p0p-iSHJa9ssYKKVCZFrV7JiffqnoYp5yL_6K0lMx9Ilh-64VPvae9X1ZTtc0zhY5Tui0vNHsCbnqs2nVIt5SokPSfOdfLrGMRxdajxELaXXiE5qMqjRjnZ8NFYk4BVEWS2sUJzcrNVhZ0keMupDiD4gAw2DpOULOGimwLtjrlmvdmDtlXOavYtknPl8WeBNwqVJJcFsGgyroUy-gy0M8-SY2s6L"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="px-1.5 py-0.2 rounded bg-slate-700 text-[10px] font-mono font-bold text-amber-300">
                1★
              </span>
              <p className="text-sm font-bold text-white truncate">{displayName}</p>
            </div>
            <p className="text-[11px] text-slate-400 truncate">{displayEmail}</p>
          </div>
          <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
        </div>

        {/* Navigation list */}
        <div className="flex-1 px-3 py-2 space-y-1">
          <p className="px-3 text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2">
            Main Navigation
          </p>

          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={item.action}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-bold'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined text-lg ${isActive ? 'text-indigo-400' : 'text-slate-400'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-3 border-t border-slate-800/80 my-2"></div>
          <p className="px-3 text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2">
            Preferences & Tools
          </p>

          <button
            onClick={() => {
              onClose();
              if (onOpenExtensionModal) onOpenExtensionModal();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-indigo-400 hover:bg-indigo-950/40 transition cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <span className="text-amber-400">⚡</span>
              <span>Chrome Extension Setup</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-900/40 text-indigo-300 border border-indigo-700/50">
              Sync
            </span>
          </button>

          <button
            onClick={() => {
              onClose();
              if (onOpenSettings) onOpenSettings();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800/60 hover:text-white transition cursor-pointer text-left"
          >
            <span className="material-symbols-outlined text-lg text-slate-400">settings</span>
            <span>Settings & Goals</span>
          </button>

          <button
            onClick={() => {
              onClose();
              if (onOpenBugReport) onOpenBugReport();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800/60 hover:text-white transition cursor-pointer text-left"
          >
            <span className="material-symbols-outlined text-lg text-slate-400">bug_report</span>
            <span>Report a bug</span>
          </button>
        </div>

        {/* Drawer Footer with Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 mt-auto">
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full bg-[#d8dadf] hover:bg-white text-slate-900 font-bold tracking-widest text-xs uppercase py-2.5 px-4 rounded transition-all duration-200 active:scale-[0.98] shadow-sm cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            <span>LOGOUT</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileNavDrawer;
