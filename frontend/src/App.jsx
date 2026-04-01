import React, { useState } from 'react';
import Signup from './Signup';
import MyFolders from './MyFolders';
import AddNewProblemForm from './AddNewProblemForm';
import RevisionModeDashboard from './RevisionModeDashboard';
import IndividualProblemReview from './IndividualProblemReview';
import DashboardHome from './DashboardHome';
import LoginPage from './LoginPage';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setCurrentView('dashboard_home');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentView('login');
  };

  return (
    <>
      {isLoggedIn && (
        <div className="fixed bottom-0 right-0 z-[100] m-4 flex gap-2 flex-wrap justify-end">
          <button onClick={() => setCurrentView('folders')} className="px-3 py-1 bg-slate-800 text-white rounded text-xs shadow hover:bg-slate-900 transition">Show Folders</button>
          <button onClick={() => setCurrentView('add_problem')} className="px-3 py-1 bg-rose-600 text-white rounded text-xs shadow hover:bg-rose-700 transition">Add Problem</button>
          <button onClick={() => setCurrentView('revision_dashboard')} className="px-3 py-1 bg-emerald-600 text-white rounded text-xs shadow hover:bg-emerald-700 transition">Revision Dash</button>
          <button onClick={() => setCurrentView('problem_review')} className="px-3 py-1 bg-amber-600 text-white rounded text-xs shadow hover:bg-amber-700 transition">Review</button>
          <button onClick={() => setCurrentView('dashboard_home')} className="px-3 py-1 bg-cyan-600 text-white rounded text-xs shadow hover:bg-cyan-700 transition">Dash Home</button>
          <button onClick={handleLogout} className="px-3 py-1 bg-red-700 text-white rounded text-xs shadow hover:bg-red-800 transition">Logout</button>
        </div>
      )}

      {currentView === 'signup' && <Signup navigate={setCurrentView} />}
      {currentView === 'login' && <LoginPage navigate={setCurrentView} onLoginSuccess={handleLoginSuccess} />}

      {isLoggedIn && currentView === 'folders' && <MyFolders navigate={setCurrentView} />}
      {isLoggedIn && currentView === 'add_problem' && <AddNewProblemForm navigate={setCurrentView} />}
      {isLoggedIn && currentView === 'revision_dashboard' && <RevisionModeDashboard navigate={setCurrentView} />}
      {isLoggedIn && currentView === 'problem_review' && <IndividualProblemReview navigate={setCurrentView} />}
      {isLoggedIn && currentView === 'dashboard_home' && <DashboardHome navigate={setCurrentView} />}
    </>
  );
}

export default App;

