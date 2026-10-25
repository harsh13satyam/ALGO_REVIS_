import React, { useEffect, useRef } from 'react';

/**
 * UserDropdownMenu - Displays the user dropdown matching the design in Image 2:
 * - Header: [ 1★ ] harshcode13 (Badge + Username)
 * - Navigation / Actions:
 *   - My Profile
 *   - Edit Profile
 *   - Update Job Profile (with orange notification badge)
 *   - Report a bug
 *   - My Certificates
 *   - My Bookmarks (links to Folders)
 *   - My Explanations (links to Revision Dashboard)
 *   - Settings & Preferences
 * - Divider
 * - Clean styled "LOGOUT" button
 */
const UserDropdownMenu = ({
  isOpen,
  onClose,
  user,
  userName,
  navigate,
  onLogout,
  onOpenProfile,
  onOpenEditProfile,
  onOpenJobProfile,
  onOpenBugReport,
  onOpenCertificates,
  onOpenSettings,
}) => {
  const menuRef = useRef(null);

  // Close on click outside or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayName = userName || user?.name || localStorage.getItem('userName') || 'harshcode13';
  const displayEmail = user?.email || localStorage.getItem('userEmail') || 'curator@algorevis.dev';

  const handleAction = (callback) => {
    onClose();
    if (callback) callback();
  };

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-2 w-72 bg-[#161822] text-slate-200 rounded-xl shadow-2xl border border-slate-800/90 py-2.5 px-2 z-[9999] animate-fade-in font-body text-left select-none"
      style={{
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)',
      }}
    >
      {/* User Header Section matching Image 2: [ 1★ ] harshcode13 */}
      <div className="px-3 py-2.5 flex items-center gap-3 border-b border-slate-800/70 mb-1">
        {/* Star Rating Badge */}
        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-slate-800/90 border border-slate-700/60 text-amber-300 font-mono text-xs font-bold shadow-inner">
          1★
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white tracking-wide truncate">
            {displayName}
          </p>
          <p className="text-[11px] text-slate-400 font-medium truncate">
            {displayEmail}
          </p>
        </div>
      </div>

      {/* Menu Navigation Items */}
      <div className="flex flex-col py-1 text-[13px] font-medium text-slate-300">
        <button
          onClick={() => handleAction(onOpenProfile)}
          className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800/60 hover:text-white transition-colors cursor-pointer text-left w-full"
        >
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[17px] text-slate-400">person</span>
            <span>My Profile</span>
          </div>
        </button>

        <button
          onClick={() => handleAction(onOpenEditProfile)}
          className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800/60 hover:text-white transition-colors cursor-pointer text-left w-full"
        >
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[17px] text-slate-400">edit</span>
            <span>Edit Profile</span>
          </div>
        </button>

        <button
          onClick={() => handleAction(onOpenJobProfile)}
          className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800/60 hover:text-white transition-colors cursor-pointer text-left w-full group"
        >
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[17px] text-slate-400">work</span>
            <span>Update Job Profile</span>
          </div>
          {/* Orange notification dot matching Image 2 */}
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50 group-hover:scale-110 transition-transform"></span>
        </button>

        <button
          onClick={() => handleAction(onOpenBugReport)}
          className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800/60 hover:text-white transition-colors cursor-pointer text-left w-full"
        >
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[17px] text-slate-400">bug_report</span>
            <span>Report a bug</span>
          </div>
        </button>

        <button
          onClick={() => handleAction(onOpenCertificates)}
          className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800/60 hover:text-white transition-colors cursor-pointer text-left w-full"
        >
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[17px] text-slate-400">workspace_premium</span>
            <span>My Certificates</span>
          </div>
        </button>

        <button
          onClick={() => handleAction(() => navigate('folders'))}
          className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800/60 hover:text-white transition-colors cursor-pointer text-left w-full"
        >
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[17px] text-slate-400">bookmark</span>
            <span>My Bookmarks</span>
          </div>
        </button>

        <button
          onClick={() => handleAction(() => navigate('revision_dashboard'))}
          className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800/60 hover:text-white transition-colors cursor-pointer text-left w-full"
        >
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[17px] text-slate-400">description</span>
            <span>My Explanations</span>
          </div>
        </button>

        <button
          onClick={() => handleAction(onOpenSettings)}
          className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800/60 hover:text-white transition-colors cursor-pointer text-left w-full"
        >
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[17px] text-slate-400">settings</span>
            <span>Settings</span>
          </div>
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-800/70 my-2"></div>

      {/* Styled Logout Button matching Image 2 */}
      <div className="px-2 pt-1 pb-1">
        <button
          onClick={() => handleAction(onLogout)}
          className="w-full bg-[#d8dadf] hover:bg-white text-slate-900 font-bold tracking-widest text-xs uppercase py-2.5 px-4 rounded transition-all duration-200 active:scale-[0.98] shadow-sm cursor-pointer flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          <span>LOGOUT</span>
        </button>
      </div>
    </div>
  );
};

export default UserDropdownMenu;
