import React, { useState, useEffect } from 'react';
import Signup from './Signup';
import MyFolders from './MyFolders';
import AddNewProblemForm from './AddNewProblemForm';
import RevisionModeDashboard from './RevisionModeDashboard';
import IndividualProblemReview from './IndividualProblemReview';
import DashboardHome from './DashboardHome';
import LoginPage from './LoginPage';
import DailyChallengeView from './DailyChallengeView';
import DsaSheetsView from './DsaSheetsView';
import MockTestsView from './MockTestsView';
import api from './api';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [redirectTarget, setRedirectTarget] = useState(null);

  const [viewParams, setViewParams] = useState({});

  const handleNavigate = (view, params = {}) => {
    setViewParams(params || {});
    setCurrentView(view);
  };

  // Check persistent session and handle notification deep links
  useEffect(() => {
    const checkSessionAndDeepLink = async () => {
      // Check query params for notification link (e.g. ?view=daily_challenge&challengeId=...)
      const urlParams = new URLSearchParams(window.location.search);
      const viewParam = urlParams.get('view');
      const target = viewParam || 'dashboard_home';
      setRedirectTarget(target);

      const paramsFromUrl = {};
      if (urlParams.get('mode')) paramsFromUrl.mode = urlParams.get('mode');
      if (urlParams.get('challengeId')) paramsFromUrl.challengeId = urlParams.get('challengeId');
      if (urlParams.get('folder')) paramsFromUrl.folder = urlParams.get('folder');
      setViewParams(paramsFromUrl);

      try {
        const data = await api.getMe();
        if (data?.user) {
          setIsLoggedIn(true);
          setCurrentUser(data.user);
          if (data.user.name) {
            localStorage.setItem('userName', data.user.name);
          }
          setCurrentView(target);
        } else {
          setIsLoggedIn(false);
          setCurrentUser(null);
          setCurrentView('login');
        }
      } catch {
        setIsLoggedIn(false);
        setCurrentUser(null);
        setCurrentView('login');
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkSessionAndDeepLink();
  }, []);

  const handleLoginSuccess = (userData) => {
    setIsLoggedIn(true);
    if (userData) {
      setCurrentUser(userData);
      if (userData.name) {
        localStorage.setItem('userName', userData.name);
      }
    }
    setCurrentView(redirectTarget || 'dashboard_home');
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.error('Logout error:', e);
    }
    localStorage.removeItem('userName');
    setCurrentUser(null);
    setIsLoggedIn(false);
    setCurrentView('login');
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-sm">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Verifying secure session...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {isLoggedIn && (
        <div className="fixed bottom-0 right-0 z-[100] m-4 flex gap-2 flex-wrap justify-end">
          <button onClick={() => handleNavigate('daily_challenge', { mode: 'random' })} className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded text-xs font-bold shadow hover:from-indigo-700 hover:to-purple-700 transition">🎲 Random Practice</button>
          <button onClick={() => handleNavigate('sheets')} className="px-3 py-1 bg-purple-700 text-white rounded text-xs font-bold shadow hover:bg-purple-800 transition">📚 Sheets</button>
          <button onClick={() => handleNavigate('mock_tests')} className="px-3 py-1 bg-pink-700 text-white rounded text-xs font-bold shadow hover:bg-pink-800 transition">⏱️ Mock Tests</button>
          <button onClick={() => handleNavigate('folders')} className="px-3 py-1 bg-slate-800 text-white rounded text-xs shadow hover:bg-slate-900 transition">Folders</button>
          <button onClick={() => handleNavigate('add_problem')} className="px-3 py-1 bg-rose-600 text-white rounded text-xs shadow hover:bg-rose-700 transition">Add Problem</button>
          <button onClick={() => handleNavigate('revision_dashboard')} className="px-3 py-1 bg-emerald-600 text-white rounded text-xs shadow hover:bg-emerald-700 transition">Revision Dash</button>
          <button onClick={() => handleNavigate('dashboard_home')} className="px-3 py-1 bg-cyan-600 text-white rounded text-xs shadow hover:bg-cyan-700 transition">Dash Home</button>
          <button onClick={handleLogout} className="px-3 py-1 bg-red-700 text-white rounded text-xs shadow hover:bg-red-800 transition">Logout</button>
        </div>
      )}

      {!isLoggedIn ? (
        currentView === 'signup' ? (
          <Signup navigate={handleNavigate} onLoginSuccess={handleLoginSuccess} />
        ) : (
          <LoginPage navigate={handleNavigate} onLoginSuccess={handleLoginSuccess} />
        )
      ) : (
        <>
          {currentView === 'daily_challenge' && <DailyChallengeView navigate={handleNavigate} user={currentUser} params={viewParams} />}
          {currentView === 'folders' && <MyFolders navigate={handleNavigate} user={currentUser} />}
          {currentView === 'add_problem' && <AddNewProblemForm navigate={handleNavigate} user={currentUser} />}
          {currentView === 'revision_dashboard' && <RevisionModeDashboard navigate={handleNavigate} user={currentUser} />}
          {currentView === 'problem_review' && <IndividualProblemReview navigate={handleNavigate} user={currentUser} />}
          {currentView === 'sheets' && <DsaSheetsView navigate={handleNavigate} user={currentUser} />}
          {currentView === 'mock_tests' && <MockTestsView navigate={handleNavigate} user={currentUser} />}
          {(currentView === 'dashboard_home' || !['daily_challenge', 'folders', 'add_problem', 'revision_dashboard', 'problem_review', 'sheets', 'mock_tests'].includes(currentView)) && (
            <DashboardHome navigate={handleNavigate} user={currentUser} />
          )}
        </>
      )}
    </>
  );
}

export default App;
