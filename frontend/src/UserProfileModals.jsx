import React, { useState } from 'react';

/**
 * UserProfileModals - Interactive modals triggered from UserDropdownMenu & MobileNavDrawer:
 * - ProfileModal: View & Edit user profile, handle, streak, solved counters
 * - JobProfileModal: Set dream target companies & role preferences (matching "Update Job Profile")
 * - BugReportModal: Submit bug report or feature suggestion
 * - CertificatesModal: View certificates & milestone badges
 * - SettingsModal: Adjust spaced repetition frequency, reminder goals, theme
 */

export const ProfileModal = ({ isOpen, onClose, user, userName, onSaveName, initialTab = 'view' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [displayName, setDisplayName] = useState(userName || user?.name || 'harshcode13');
  const [email, setEmail] = useState(user?.email || 'curator@algorevis.dev');
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (displayName.trim()) {
      onSaveName(displayName.trim());
      localStorage.setItem('userName', displayName.trim());
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        setActiveTab('view');
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 text-left animate-fade-in">
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 z-10 overflow-hidden font-body">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-400">badge</span>
            <h3 className="font-headline font-bold text-lg text-white">
              {activeTab === 'edit' ? 'Edit User Profile' : 'Curator Profile'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 my-4 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('view')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'view' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'edit' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Edit Info
          </button>
        </div>

        {activeTab === 'view' ? (
          <div className="space-y-4">
            {/* User Hero */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="relative">
                <img
                  alt="User Avatar"
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-indigo-500"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBplqHqcerbujnVnZP6b7vfk3bmK_kq0JyqYYykpVAImoP8aWi2p0p-iSHJa9ssYKKVCZFrV7JiffqnoYp5yL_6K0lMx9Ilh-64VPvae9X1ZTtc0zhY5Tui0vNHsCbnqs2nVIt5SokPSfOdfLrGMRxdajxELaXXiE5qMqjRjnZ8NFYk4BVEWS2sUJzcrNVhZ0keMupDiD4gAw2DpOULOGimwLtjrlmvdmDtlXOavYtknPl8WeBNwqVJJcFsGgyroUy-gy0M8-SY2s6L"
                />
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded bg-amber-500 text-[10px] font-mono font-bold text-slate-950 shadow">
                  1★
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-headline font-bold text-base text-white truncate">{displayName}</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                    Pro Member
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{email}</p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{phone}</p>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Streak</p>
                <p className="text-xl font-extrabold text-amber-400 font-headline mt-1">🔥 Active</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rank</p>
                <p className="text-xl font-extrabold text-indigo-400 font-headline mt-1">1★ Master</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Level</p>
                <p className="text-xl font-extrabold text-emerald-400 font-headline mt-1">Curator</p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('edit')}
              className="w-full signature-gradient text-white py-2.5 rounded-xl text-xs font-bold shadow hover:opacity-95 transition"
            >
              Edit Display Name & Info
            </button>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Display Name / Handle
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                placeholder="e.g. harshcode13"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                placeholder="you@domain.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                placeholder="+91..."
              />
            </div>

            {savedSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-bold text-center">
                ✓ Profile updated successfully!
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('view')}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 signature-gradient py-2 rounded-xl text-xs font-bold text-white shadow hover:opacity-95 transition"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export const JobProfileModal = ({ isOpen, onClose }) => {
  const [targetRole, setTargetRole] = useState('SDE-2 (Backend / Systems)');
  const [experience, setExperience] = useState('1-3 Years');
  const [selectedCompanies, setSelectedCompanies] = useState(['Google', 'Microsoft', 'Uber']);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const companiesList = ['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Uber', 'Netflix', 'Atlassian', 'Stripe'];

  const toggleCompany = (company) => {
    setSelectedCompanies((prev) =>
      prev.includes(company) ? prev.filter((c) => c !== company) : [...prev, company]
    );
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 text-left animate-fade-in font-body">
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 z-10">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-orange-400">work</span>
            <h3 className="font-headline font-bold text-lg text-white">Target Job Profile</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Target Role
            </label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option>SDE-1 (Software Engineer 1)</option>
              <option>SDE-2 (Backend / Systems)</option>
              <option>Full-Stack Engineer</option>
              <option>Machine Learning Engineer</option>
              <option>Engineering Lead / Architect</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Experience Level
            </label>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option>Fresher / 2024-2025 Grad</option>
              <option>1-3 Years</option>
              <option>3-5 Years</option>
              <option>5+ Years</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Dream Companies (Select all that apply)
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {companiesList.map((comp) => {
                const isSelected = selectedCompanies.includes(comp);
                return (
                  <button
                    type="button"
                    key={comp}
                    onClick={() => toggleCompany(comp)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      isSelected
                        ? 'bg-orange-600 text-white shadow-md shadow-orange-900/30'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {isSelected && '✓ '}
                    {comp}
                  </button>
                );
              })}
            </div>
          </div>

          {isSaved && (
            <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-bold text-center">
              ✓ Job preferences saved! Algorithm recommendations updated.
            </div>
          )}

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-orange-600 hover:bg-orange-500 py-2 rounded-xl text-xs font-bold text-white shadow transition"
            >
              Save Job Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const BugReportModal = ({ isOpen, onClose }) => {
  const [category, setCategory] = useState('Mobile Navigation & UI');
  const [description, setDescription] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setDescription('');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 text-left animate-fade-in font-body">
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 z-10">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-400">bug_report</span>
            <h3 className="font-headline font-bold text-lg text-white">Report a Bug / Feedback</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Issue Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option>Mobile Navigation & UI</option>
              <option>Chrome Extension Sync</option>
              <option>Spaced Repetition Scheduler</option>
              <option>Code Runner & Test Cases</option>
              <option>Feature Suggestion</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Description & Steps to Reproduce
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
              placeholder="Describe what happened or what you'd like improved..."
              required
            />
          </div>

          {isSubmitted && (
            <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-bold text-center">
              ✓ Thank you! Bug report submitted to the engineering team.
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-rose-600 hover:bg-rose-500 py-2 rounded-xl text-xs font-bold text-white shadow transition"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const CertificatesModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const milestones = [
    { title: '7-Day Spaced Repetition Streak', icon: 'local_fire_department', color: 'text-amber-400', date: 'Earned This Month', desc: 'Maintained continuous daily problem solving' },
    { title: 'Tree & Graph Algorithm Pioneer', icon: 'account_tree', color: 'text-indigo-400', date: 'Certified', desc: 'Completed 25+ recursive graph problems' },
    { title: 'Curator 1★ Problem Solver', icon: 'military_tech', color: 'text-purple-400', date: 'Certified', desc: 'Solved across Easy, Medium, and Hard tiers' },
  ];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 text-left animate-fade-in font-body">
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 z-10">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-400">workspace_premium</span>
            <h3 className="font-headline font-bold text-lg text-white">Certificates & Milestones</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <div className="space-y-3 mt-4">
          {milestones.map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
              <span className={`material-symbols-outlined text-2xl ${item.color}`}>
                {item.icon}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">{item.title}</h4>
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-400">{item.date}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full signature-gradient py-2 rounded-xl text-xs font-bold text-white shadow hover:opacity-95 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const SettingsModal = ({ isOpen, onClose }) => {
  const [dailyGoal, setDailyGoal] = useState('3');
  const [reminderMode, setReminderMode] = useState('both');
  const [soundEffects, setSoundEffects] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 text-left animate-fade-in font-body">
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 z-10">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-400">settings</span>
            <h3 className="font-headline font-bold text-lg text-white">Settings & Preferences</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <div className="space-y-4 mt-4 text-xs">
          <div>
            <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Daily Problem Solving Target
            </label>
            <select
              value={dailyGoal}
              onChange={(e) => setDailyGoal(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="1">1 Problem / day (Casual)</option>
              <option value="3">3 Problems / day (Recommended)</option>
              <option value="5">5 Problems / day (Intensive Prep)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Spaced Repetition Dispatch Channel
            </label>
            <select
              value={reminderMode}
              onChange={(e) => setReminderMode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="both">Both Email & WhatsApp</option>
              <option value="email">Email Notifications Only</option>
              <option value="whatsapp">WhatsApp Notifications Only</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <p className="font-bold text-white">Audio & Animation Cues</p>
              <p className="text-slate-400 text-[11px]">Play success sound upon passing all test cases</p>
            </div>
            <input
              type="checkbox"
              checked={soundEffects}
              onChange={(e) => setSoundEffects(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer"
            />
          </div>

          {isSaved && (
            <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-bold text-center">
              ✓ Preferences saved successfully!
            </div>
          )}

          <div className="flex gap-3 pt-3 border-t border-slate-800">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-xl font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              className="flex-1 signature-gradient py-2 rounded-xl font-bold text-white shadow hover:opacity-95 transition"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
