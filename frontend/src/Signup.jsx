import React, { useState } from 'react';
import api from './api';

const Signup = ({ navigate, onLoginSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const data = await api.signup({
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword
      });

      const userObj = data.user || { name: data.name || name.trim(), email: email.trim() };
      if (userObj.name) {
        localStorage.setItem('userName', userObj.name);
      }

      // Seamless direct login without any OTP friction
      if (onLoginSuccess) {
        onLoginSuccess(userObj);
      } else {
        navigate('login');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setErrorMsg(error.message || 'Could not connect to the server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background font-body text-on-surface min-h-screen flex flex-col relative overflow-hidden text-left">
      {/* Aesthetic Background Accents */}
      <div className="absolute -z-10 top-0 right-0 w-[40vw] h-[40vw] signature-gradient opacity-[0.04] rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
      <div className="absolute -z-10 bottom-0 left-0 w-[30vw] h-[30vw] bg-tertiary opacity-[0.04] rounded-full blur-[80px] -translate-x-1/4 translate-y-1/4 pointer-events-none"></div>

      <main className="flex-grow flex items-center justify-center px-6 py-12">
        <div className="w-full mx-auto max-w-[440px] z-10">
          {/* Header / Brand Anchor */}
          <header className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 mb-4 border border-indigo-500/20 shadow-sm">
              <span className="material-symbols-outlined text-primary text-3xl">history_edu</span>
            </div>
            <h1 className="font-headline font-extrabold text-3xl tracking-tight text-on-surface mb-1">AlgoRevis</h1>
            <p className="font-label text-on-surface-variant text-xs tracking-widest uppercase">The Disciplined Curator</p>
          </header>

          {/* Main Signup Card */}
          <div className="bg-surface-container-lowest rounded-[1.5rem] p-8 md:p-10 shadow-[0_32px_64px_-12px_rgba(25,28,29,0.06)] flex flex-col gap-6 border border-slate-100">
            <section className="space-y-1">
              <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight">Create your account</h2>
              <p className="text-on-surface-variant text-sm font-body">Master algorithms with precision.</p>
            </section>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-red-500">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <form className="flex flex-col gap-5" onSubmit={handleSignupSubmit}>
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant ml-1" htmlFor="name">
                  Full Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-lg">person</span>
                  </div>
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-high border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-200 outline-none text-on-surface placeholder:text-slate-400"
                    id="name"
                    placeholder="Ada Lovelace"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant ml-1" htmlFor="email">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-lg">mail</span>
                  </div>
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-high border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-200 outline-none text-on-surface placeholder:text-slate-400"
                    id="email"
                    placeholder="ada@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant ml-1" htmlFor="password">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-lg">lock</span>
                  </div>
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-high border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-200 outline-none text-on-surface placeholder:text-slate-400"
                    id="password"
                    placeholder="••••••••"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant ml-1" htmlFor="confirm-password">
                  Confirm Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-lg">lock_reset</span>
                  </div>
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-high border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-200 outline-none text-on-surface placeholder:text-slate-400"
                    id="confirm-password"
                    placeholder="••••••••"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <button
                className="w-full signature-gradient text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-indigo-500/20 hover:opacity-95 active:scale-[0.98] transition-all duration-200 mt-2 flex items-center justify-center gap-2 group disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center border-t border-slate-100">
              <p className="text-on-surface-variant text-sm">
                Already have an account?{' '}
                <button
                  type="button"
                  className="text-primary font-bold hover:underline decoration-primary/30 underline-offset-4 ml-1"
                  onClick={() => navigate('login')}
                >
                  Login
                </button>
              </p>
            </div>
          </div>

          {/* Aesthetic Badges */}
          <div className="mt-8 flex justify-center gap-6 px-4 opacity-50">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs text-indigo-500">verified_user</span>
              <span className="font-label text-[10px] uppercase tracking-wider text-slate-500">Academic Precision</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs text-indigo-500">encrypted</span>
              <span className="font-label text-[10px] uppercase tracking-wider text-slate-500">Zero Friction</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs text-indigo-500">auto_awesome</span>
              <span className="font-label text-[10px] uppercase tracking-wider text-slate-500">Editorial Focus</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Signup;
