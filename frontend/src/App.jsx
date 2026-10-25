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
import LandingPage from './LandingPage';
import api from './api';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState('landing');
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
          setCurrentView(viewParam || 'landing');
        }
      } catch {
        setIsLoggedIn(false);
        setCurrentUser(null);
        setCurrentView(viewParam || 'landing');
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
    setCurrentView('landing');
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
      {!isLoggedIn ? (
        currentView === 'signup' ? (
          <Signup navigate={handleNavigate} onLoginSuccess={handleLoginSuccess} />
        ) : currentView === 'login' ? (
          <LoginPage navigate={handleNavigate} onLoginSuccess={handleLoginSuccess} />
        ) : (
          <LandingPage navigate={handleNavigate} onLoginSuccess={handleLoginSuccess} />
        )
      ) : (
        <>
          {currentView === 'daily_challenge' && <DailyChallengeView navigate={handleNavigate} user={currentUser} params={viewParams} onLogout={handleLogout} />}
          {currentView === 'folders' && <MyFolders navigate={handleNavigate} user={currentUser} onLogout={handleLogout} />}
          {currentView === 'add_problem' && <AddNewProblemForm navigate={handleNavigate} user={currentUser} onLogout={handleLogout} />}
          {currentView === 'revision_dashboard' && <RevisionModeDashboard navigate={handleNavigate} user={currentUser} onLogout={handleLogout} />}
          {currentView === 'problem_review' && <IndividualProblemReview navigate={handleNavigate} user={currentUser} onLogout={handleLogout} />}
          {currentView === 'sheets' && <DsaSheetsView navigate={handleNavigate} user={currentUser} onLogout={handleLogout} />}
          {currentView === 'mock_tests' && <MockTestsView navigate={handleNavigate} user={currentUser} onLogout={handleLogout} />}
          {(currentView === 'dashboard_home' || !['daily_challenge', 'folders', 'add_problem', 'revision_dashboard', 'problem_review', 'sheets', 'mock_tests'].includes(currentView)) && (
            <DashboardHome navigate={handleNavigate} user={currentUser} onLogout={handleLogout} />
          )}
        </>
      )}
    </>
  );
}

export default App;
