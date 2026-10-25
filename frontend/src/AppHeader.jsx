import React, { useState, useEffect } from 'react';
import UserDropdownMenu from './UserDropdownMenu';
import MobileNavDrawer from './MobileNavDrawer';
import {
  ProfileModal,
  JobProfileModal,
  BugReportModal,
  CertificatesModal,
  SettingsModal
} from './UserProfileModals';
import ChromeExtensionModal from './ChromeExtensionModal';

/**
 * AppHeader - Unified top navigation bar for both PC and Mobile.
 * 
 * Features:
 * - Three-line hamburger menu button (☰) for mobile navigation
 * - Prominent username display for both mobile and desktop (solves user name not showing on mobile)
 * - Three-dot menu (⋮) / Avatar trigger that opens the UserDropdownMenu matching Image 2
 * - Integrated Chrome Extension modal, Notifications, Settings, and Profile management
 * - Perfectly responsive layout without clutter or overlap
 */
const AppHeader = ({
  currentView = 'dashboard_home',
  navigate,
  user,
  onLogout,
  showSearch = true,
  isSidebarPresent = false,
  customTitle = null,
}) => {
  const [userName, setUserName] = useState(() => {
    return user?.name || localStorage.getItem('userName') || 'harshcode13';
  });

  // Modals & Menu States
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isJobProfileOpen, setIsJobProfileOpen] = useState(false);
  const [isBugReportOpen, setIsBugReportOpen] = useState(false);
  const [isCertificatesOpen, setIsCertificatesOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(2);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [userAvatar, setUserAvatar] = useState(
    localStorage.getItem('userAvatar') ||
    user?.avatar ||
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBplqHqcerbujnVnZP6b7vfk3bmK_kq0JyqYYykpVAImoP8aWi2p0p-iSHJa9ssYKKVCZFrV7JiffqnoYp5yL_6K0lMx9Ilh-64VPvae9X1ZTtc0zhY5Tui0vNHsCbnqs2nVIt5SokPSfOdfLrGMRxdajxELaXXiE5qMqjRjnZ8NFYk4BVEWS2sUJzcrNVhZ0keMupDiD4gAw2DpOULOGimwLtjrlmvdmDtlXOavYtknPl8WeBNwqVJJcFsGgyroUy-gy0M8-SY2s6L'
  );

  useEffect(() => {
    if (user?.name) {
      setUserName(user.name);
      localStorage.setItem('userName', user.name);
    }
  }, [user]);

  useEffect(() => {
    const handleAvatarUpdate = () => {
      setUserAvatar(
        localStorage.getItem('userAvatar') ||
        user?.avatar ||
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBplqHqcerbujnVnZP6b7vfk3bmK_kq0JyqYYykpVAImoP8aWi2p0p-iSHJa9ssYKKVCZFrV7JiffqnoYp5yL_6K0lMx9Ilh-64VPvae9X1ZTtc0zhY5Tui0vNHsCbnqs2nVIt5SokPSfOdfLrGMRxdajxELaXXiE5qMqjRjnZ8NFYk4BVEWS2sUJzcrNVhZ0keMupDiD4gAw2DpOULOGimwLtjrlmvdmDtlXOavYtknPl8WeBNwqVJJcFsGgyroUy-gy0M8-SY2s6L'
      );
    };
    window.addEventListener('userAvatarUpdated', handleAvatarUpdate);
    return () => window.removeEventListener('userAvatarUpdated', handleAvatarUpdate);
  }, [user]);

  const handleSaveUserName = (newName) => {
    setUserName(newName);
    localStorage.setItem('userName', newName);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors w-full text-left font-body">
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 w-full gap-2 sm:gap-4">
          
          {/* Left Section: Mobile Hamburger (☰) + Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Three-line hamburger button (☰) on Mobile / Tablet */}
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="p-1.5 sm:p-2 -ml-1 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
              aria-label="Open mobile menu"
              title="Open Navigation Menu"
            >
              <span className="material-symbols-outlined text-2xl" data-icon="menu">menu</span>
            </button>

            {/* Logo / Brand Name */}
            <div 
              onClick={() => navigate('dashboard_home')}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg signature-gradient flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-base">terminal</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-headline font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight leading-none group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    AlgoRevis
                  </span>
                  <span className="hidden lg:inline-flex px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold border border-indigo-200 dark:border-indigo-800">
                    Pro
                  </span>
                </div>
                <span className="hidden sm:block text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                  Spaced Repetition
                </span>
              </div>
            </div>

            {/* Custom page title if provided */}
            {customTitle && (
              <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {customTitle}
                </span>
              </div>
            )}
          </div>

          {/* Center Section: Search Bar (Desktop) or Quick Shortcuts */}
          {showSearch && (
            <div className="hidden md:flex flex-1 max-w-md mx-2 lg:mx-4">
              <div className="relative w-full">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" data-icon="search">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search problems, folders, topics... (Ctrl+K)"
                  className="w-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/60 dark:hover:bg-slate-800 border-none rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/40 focus:bg-white dark:focus:bg-slate-900 transition-all"
                />
              </div>
            </div>
          )}

          {/* Right Section: Actions + User Profile + Three-Dots Dropdown Trigger */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 ml-auto">
            
            {/* Chrome Extension Button */}
            <button
              onClick={() => setIsExtensionModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-bold transition shadow-sm cursor-pointer"
              title="Download & setup Chrome Extension for LeetCode & GFG"
            >
              <span className="text-amber-500">⚡</span>
              <span className="hidden sm:inline">Chrome Extension</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotificationPopup(prev => !prev);
                  if (notificationCount > 0) setNotificationCount(0);
                }}
                className="p-1.5 sm:p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer relative"
                title="Notifications"
              >
                <span className="material-symbols-outlined text-xl" data-icon="notifications">notifications</span>
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                )}
              </button>

              {/* Notification Popover */}
              {showNotificationPopup && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 z-50 text-xs animate-fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-white">Notifications</span>
                    <span className="text-[10px] text-indigo-400">Mark all read</span>
                  </div>
                  <div className="py-2 space-y-2">
                    <div className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition">
                      <p className="font-bold text-slate-200">Daily Challenge Ready</p>
                      <p className="text-slate-400 text-[11px] mt-0.5">Today's spaced repetition challenge is scheduled for review.</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition">
                      <p className="font-bold text-slate-200">Chrome Extension Active</p>
                      <p className="text-slate-400 text-[11px] mt-0.5">LeetCode & GFG submissions automatically synced.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Help / FAQ Icon (Desktop) */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="hidden sm:flex p-1.5 sm:p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Settings & Guide"
            >
              <span className="material-symbols-outlined text-xl" data-icon="help_outline">help_outline</span>
            </button>

            {/* Divider */}
            <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1"></div>

            {/* User Profile & Three-Dots (⋮) Menu Trigger */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(prev => !prev)}
                className="flex items-center gap-1.5 sm:gap-2.5 p-1 sm:p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all cursor-pointer group text-left border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60"
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
                title="Account menu (Profile, Settings, Logout)"
              >
                {/* User Avatar with Ring */}
                <div className="relative shrink-0">
                  <img
                    alt="User profile avatar"
                    className="w-8 h-8 sm:w-8 sm:h-8 rounded-full object-cover ring-2 ring-indigo-500/40 group-hover:ring-indigo-500 transition-all"
                    src={userAvatar}
                  />
                  {/* Rating Badge on avatar for mobile */}
                  <span className="sm:hidden absolute -bottom-1 -right-1 px-1 py-0.2 rounded bg-slate-900 border border-slate-700 text-amber-400 font-mono text-[9px] font-bold">
                    1★
                  </span>
                </div>

                {/* User Name & Details: Visible on BOTH Mobile & Desktop! */}
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1">
                    {/* Star Rating Badge (Desktop) */}
                    <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 font-mono text-[10px] font-bold">
                      1★
                    </span>
                    {/* User Name: Displayed cleanly for both mobile and desktop! */}
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight max-w-[90px] sm:max-w-[130px] truncate">
                      {userName}
                    </span>
                  </div>
                  <span className="hidden sm:block text-[10px] uppercase tracking-wider text-slate-400 font-bold leading-none mt-0.5">
                    Member
                  </span>
                </div>

                {/* Three Dots (⋮) Icon matching user request: "three line oe three dot when we press thentherer are diffrent option get avilable" */}
                <div className="flex items-center justify-center w-6 h-6 rounded-md text-slate-400 group-hover:text-indigo-400 transition-colors">
                  <span className="material-symbols-outlined text-lg sm:text-xl" data-icon="more_vert">
                    more_vert
                  </span>
                </div>
              </button>

              {/* Dropdown Menu matching Image 2 */}
              <UserDropdownMenu
                isOpen={isUserMenuOpen}
                onClose={() => setIsUserMenuOpen(false)}
                user={user}
                userName={userName}
                navigate={navigate}
                onLogout={onLogout}
                onOpenProfile={() => setIsProfileOpen(true)}
                onOpenEditProfile={() => setIsEditProfileOpen(true)}
                onOpenJobProfile={() => setIsJobProfileOpen(true)}
                onOpenBugReport={() => setIsBugReportOpen(true)}
                onOpenCertificates={() => setIsCertificatesOpen(true)}
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer (opened by the 3-line hamburger menu ☰) */}
      <MobileNavDrawer
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        currentView={currentView}
        navigate={navigate}
        userName={userName}
        user={user}
        onLogout={onLogout}
        onOpenExtensionModal={() => setIsExtensionModalOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenBugReport={() => setIsBugReportOpen(true)}
      />

      {/* Interactive Modals */}
      <ProfileModal
        isOpen={isProfileOpen || isEditProfileOpen}
        onClose={() => {
          setIsProfileOpen(false);
          setIsEditProfileOpen(false);
        }}
        user={user}
        userName={userName}
        onSaveName={handleSaveUserName}
        initialTab={isEditProfileOpen ? 'edit' : 'view'}
      />

      <JobProfileModal
        isOpen={isJobProfileOpen}
        onClose={() => setIsJobProfileOpen(false)}
      />

      <BugReportModal
        isOpen={isBugReportOpen}
        onClose={() => setIsBugReportOpen(false)}
      />

      <CertificatesModal
        isOpen={isCertificatesOpen}
        onClose={() => setIsCertificatesOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Chrome Extension Setup Modal */}
      {isExtensionModalOpen && (
        <ChromeExtensionModal onClose={() => setIsExtensionModalOpen(false)} />
      )}
    </>
  );
};

export default AppHeader;
