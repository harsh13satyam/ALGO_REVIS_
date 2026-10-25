import React, { useState, useEffect } from 'react';
import api from './api';
import AppHeader from './AppHeader';

const AddNewProblemForm = ({ navigate, user, onLogout }) => {
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [pattern, setPattern] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [notes, setNotes] = useState('');
  const [solutionCode, setSolutionCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [imageBase64, setImageBase64] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingPatterns, setExistingPatterns] = useState(['Sliding Window', 'Two Pointers', 'Dynamic Programming']);

  useEffect(() => {
    const fetchPatterns = async () => {
      try {
        const probs = await api.getProblems();
        if (Array.isArray(probs)) {
          const uniquePatterns = [...new Set(probs.map(p => p.pattern))];
          if (uniquePatterns.length > 0) setExistingPatterns(uniquePatterns);
        }
      } catch (e) {
        console.error('Failed to fetch patterns:', e);
      }
    };
    fetchPatterns();
  }, []);

  // Listen for global Ctrl + V clipboard paste of images
  useEffect(() => {
    const handlePaste = (e) => {
      if (!e.clipboardData || !e.clipboardData.items) return;
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            e.preventDefault();
            const reader = new FileReader();
            reader.onload = (loadEvt) => {
              setImageBase64(loadEvt.target.result);
            };
            reader.readAsDataURL(blob);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAIGenerateIntuition = async () => {
    if (!name && !solutionCode) {
      alert("Please provide either a Problem Title or paste Solution Code for AI to analyze.");
      return;
    }
    setIsGeneratingAI(true);
    try {
      const data = await api.generateIntuition({
        title: name,
        code: solutionCode || name,
        pattern: pattern
      });
      if (data) {
        if (data.pattern && !pattern) setPattern(data.pattern);
        let noteAppend = [];
        if (data.intuition) noteAppend.push(`Intuition: ${data.intuition}`);
        if (data.keyObservation) noteAppend.push(`Key Observation: ${data.keyObservation}`);
        if (data.timeComplexity || data.spaceComplexity) {
          noteAppend.push(`Complexity: Time ${data.timeComplexity || 'N/A'}, Space ${data.spaceComplexity || 'N/A'}`);
        }
        if (noteAppend.length > 0) {
          setNotes(prev => prev ? `${prev}\n\n${noteAppend.join('\n')}` : noteAppend.join('\n'));
        }
      }
    } catch (err) {
      alert("AI intuition generation error: " + (err.message || 'Service unavailable'));
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSave = async () => {
    if (!name || !pattern) {
      alert("Please provide at least a problem name and a pattern (folder).");
      return;
    }
    
    setIsSubmitting(true);
    const userName = user?.name || localStorage.getItem('userName') || 'user';
    
    try {
      await api.createProblem({
        userName,
        name,
        link,
        pattern,
        difficulty,
        notes,
        code: solutionCode,
        imageBase64
      });
      navigate('folders');
    } catch (err) {
      alert("Error saving problem: " + (err.message || 'Server error'));
    }
    setIsSubmitting(false);
  };
  return (
    <div className="bg-surface font-body text-on-surface selection:bg-primary-fixed">
      {/* TopAppBar */}
      <AppHeader
        currentView="add_problem"
        navigate={navigate}
        user={user}
        onLogout={onLogout}
        customTitle="Add Problem"
        isSidebarPresent={true}
      />
      
      {/* Sidebar */}
      <aside className="h-screen w-64 fixed left-0 top-0 z-30 bg-slate-50 hidden md:flex flex-col py-8 pr-4 pt-20">
        <div className="px-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-white">
              <span className="material-symbols-outlined">terminal</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-indigo-700 font-headline leading-tight">The Curator</h2>
              <p className="font-label uppercase tracking-widest text-[10px] text-slate-500">DSA Mastery Portal</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <a className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:translate-x-1 transition-transform hover:bg-indigo-50 rounded-r-full" href="#" onClick={(e) => { e.preventDefault(); navigate('dashboard_home'); }}>
            <span className="material-symbols-outlined">home</span>
            <span className="font-headline font-medium">Home</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-indigo-700 font-bold bg-white rounded-r-full shadow-sm" href="#" onClick={(e) => { e.preventDefault(); navigate('folders'); }}>
            <span className="material-symbols-outlined">folder_open</span>
            <span className="font-headline font-medium">My Folders</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:translate-x-1 transition-transform hover:bg-indigo-50 rounded-r-full" href="#" onClick={(e) => { e.preventDefault(); navigate('sheets'); }}>
            <span className="material-symbols-outlined">dataset</span>
            <span className="font-headline font-medium">DSA Sheets</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:translate-x-1 transition-transform hover:bg-indigo-50 rounded-r-full" href="#" onClick={(e) => { e.preventDefault(); navigate('mock_tests'); }}>
            <span className="material-symbols-outlined">timer</span>
            <span className="font-headline font-medium">Mock Tests</span>
          </a>
        </nav>
      </aside>

      {/* Main Content (Folders Background) */}
      <main className="md:ml-64 p-4 sm:p-8 min-h-screen">
        <div className="max-w-6xl mx-auto opacity-40 select-none pointer-events-none">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-extrabold font-headline text-on-surface mb-2">My Folders</h1>
              <p className="text-on-surface-variant">Manage your curated DSA collections</p>
            </div>
            <button className="signature-gradient text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg">
              <span className="material-symbols-outlined">add</span>
              New Folder
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Mock Folder Card */}
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-container">
                  <span className="material-symbols-outlined">dynamic_feed</span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-lg">Dynamic Programming</h3>
                  <p className="text-sm text-outline">24 Problems</p>
                </div>
              </div>
              <div className="h-2 w-full bg-surface-container-low rounded-full mb-4">
                <div className="h-full bg-primary w-2/3 rounded-full"></div>
              </div>
            </div>
            {/* Mock Folder Card */}
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed-variant">
                  <span className="material-symbols-outlined">account_tree</span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-lg">Graph Algorithms</h3>
                  <p className="text-sm text-outline">18 Problems</p>
                </div>
              </div>
              <div className="h-2 w-full bg-surface-container-low rounded-full mb-4">
                <div className="h-full bg-tertiary w-1/3 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Backdrop */}
      <div className="fixed inset-0 z-[60] bg-on-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
        {/* Modal Container */}
        <div className="bg-surface-container-lowest w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[921px]">
          {/* Modal Header */}
          <div className="px-8 py-6 flex items-center justify-between border-b border-outline-variant/10">
            <div>
              <p className="font-label uppercase tracking-widest text-[10px] text-primary font-bold mb-1">Curation Engine</p>
              <h2 className="text-2xl font-extrabold font-headline text-on-surface">Add Problem</h2>
            </div>
            <button onClick={() => navigate('folders')} className="p-2 hover:bg-surface-container-low rounded-full transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant">close</span>
            </button>
          </div>
          
          {/* Modal Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {/* Name & Link Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-label text-xs font-bold uppercase tracking-wider text-outline">Problem Title</label>
                <input className="w-full bg-surface-container-high border-none rounded-lg px-4 py-3 text-on-surface placeholder:text-outline/60 focus:ring-2 focus:ring-primary/20 transition-all" placeholder="e.g. Longest Palindromic Substring" type="text" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="font-label text-xs font-bold uppercase tracking-wider text-outline">Problem Link</label>
                <div className="relative">
                  <input className="w-full bg-surface-container-high border-none rounded-lg pl-10 pr-4 py-3 text-on-surface placeholder:text-outline/60 focus:ring-2 focus:ring-primary/20 transition-all" placeholder="https://leetcode.com/problems/..." type="text" value={link} onChange={e => setLink(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Pattern & Difficulty Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-label text-xs font-bold uppercase tracking-wider text-outline">Pattern / Folder</label>
                <input list="patterns" className="w-full bg-surface-container-high border-none rounded-lg px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Type new or select existing pattern" value={pattern} onChange={e => setPattern(e.target.value)} />
                <datalist id="patterns">
                  {existingPatterns.map(ptn => <option key={ptn} value={ptn} />)}
                </datalist>
              </div>
              <div className="space-y-3">
                <label className="font-label text-xs font-bold uppercase tracking-wider text-outline">Difficulty</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setDifficulty('Easy')} className={`flex-1 py-2 px-4 rounded-full text-xs font-bold transition-all ${difficulty === 'Easy' ? 'bg-secondary-container text-on-secondary-container ring-2 ring-primary/40' : 'bg-surface-container-high text-on-surface-variant'}`}>Easy</button>
                  <button type="button" onClick={() => setDifficulty('Medium')} className={`flex-1 py-2 px-4 rounded-full text-xs font-bold transition-all ${difficulty === 'Medium' ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant ring-2 ring-primary/40' : 'bg-surface-container-high text-on-surface-variant'}`}>Medium</button>
                  <button type="button" onClick={() => setDifficulty('Hard')} className={`flex-1 py-2 px-4 rounded-full text-xs font-bold transition-all ${difficulty === 'Hard' ? 'bg-error-container text-on-error-container ring-2 ring-primary/40' : 'bg-surface-container-high text-on-surface-variant'}`}>Hard</button>
                </div>
              </div>
            </div>

            {/* Optional Solution Code for AI Intuition */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-label text-xs font-bold uppercase tracking-wider text-outline">
                  Solution Code <span className="text-[10px] lowercase text-outline/60">(optional for AI analysis)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowCodeInput(!showCodeInput)}
                  className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">{showCodeInput ? 'expand_less' : 'code'}</span>
                  {showCodeInput ? 'Hide Code Box' : 'Paste Solution Code'}
                </button>
              </div>
              {showCodeInput && (
                <textarea
                  className="w-full bg-slate-950 text-indigo-200 font-mono text-xs border border-slate-800 rounded-lg p-3 focus:ring-2 focus:ring-primary/20 transition-all resize-y"
                  placeholder="// Paste your solution code here to let AI auto-extract intuition, pattern & complexity..."
                  rows="5"
                  value={solutionCode}
                  onChange={e => setSolutionCode(e.target.value)}
                />
              )}
            </div>

            {/* Notes Section with AI Auto-Generate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-label text-xs font-bold uppercase tracking-wider text-outline">Notes & Intuition Breakdown</label>
                <button
                  type="button"
                  onClick={handleAIGenerateIntuition}
                  disabled={isGeneratingAI}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-900/60 hover:bg-indigo-800 text-indigo-300 border border-indigo-700/60 shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                  title="Analyze title and code to auto-populate intuition, pattern, and complexity"
                >
                  <span className="material-symbols-outlined text-sm animate-pulse">auto_awesome</span>
                  {isGeneratingAI ? 'Deducing Intuition...' : '✨ Auto-Generate Intuition'}
                </button>
              </div>
              <textarea
                className="w-full bg-surface-container-high border-none rounded-lg px-4 py-3 text-on-surface placeholder:text-outline/60 focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                placeholder="Break down the approach here, or click '✨ Auto-Generate Intuition' above! Mention time and space complexity..."
                rows="4"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            {/* Upload Section with Ctrl+V Clipboard Support */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-label text-xs font-bold uppercase tracking-wider text-outline">Conceptual Snapshot / Diagram</label>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                  📋 Ctrl + V to Paste Anywhere
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="border-2 border-dashed border-outline-variant/30 rounded-xl p-6 flex flex-col items-center justify-center bg-surface-container-low hover:bg-surface-container-high transition-colors cursor-pointer group relative">
                  <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleImageUpload} />
                  <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-3xl mb-2">add_a_photo</span>
                  <p className="text-[10px] font-label uppercase tracking-widest text-outline font-bold">Paste (Ctrl+V) or Click to Upload</p>
                  <p className="text-[9px] text-outline/60 mt-1">PNG, JPG directly to Cloudinary CDN</p>
                </label>
                {imageBase64 ? (
                  <div className="relative group rounded-xl overflow-hidden border border-[rgba(53,37,205,0.15)] bg-slate-950">
                    <img alt="Handwritten note or diagram preview" className="w-full h-32 object-contain transition-transform group-hover:scale-105" src={imageBase64} />
                    <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                      ✓ Snapshot Attached
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button type="button" onClick={() => setImageBase64('')} className="p-2 bg-white rounded-full text-error shadow-lg">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-[rgba(53,37,205,0.15)] flex flex-col items-center justify-center bg-surface-container-lowest h-32 p-3 text-center">
                    <span className="material-symbols-outlined text-slate-400 text-2xl mb-1">content_paste</span>
                    <span className="text-xs text-outline/60 font-bold uppercase tracking-widest">No Diagram</span>
                    <span className="text-[10px] text-outline/50 mt-0.5">Snipping Tool screenshots paste directly</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Modal Footer */}
          <div className="px-8 py-6 bg-surface-container-low flex items-center justify-between">
            <button onClick={() => navigate('folders')} className="px-6 py-3 font-headline font-bold text-outline hover:text-on-surface transition-colors">Discard Draft</button>
            <button onClick={handleSave} disabled={isSubmitting} className="signature-gradient text-white px-10 py-3 rounded-xl font-headline font-extrabold tracking-tight shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
              {isSubmitting ? 'Saving...' : 'Save Problem'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddNewProblemForm;
