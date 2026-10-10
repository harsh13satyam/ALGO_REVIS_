import React, { useState } from 'react';

import api from './api';

const LoginPage = ({ navigate, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.login({ email, password });
      const userObj = data.user || { name: data.name };
      if (userObj.name) {
        localStorage.setItem('userName', userObj.name);
      }
      if (onLoginSuccess) {
        onLoginSuccess(userObj);
      }
    } catch (error) {
      console.error("Login failed:", error);
      alert(error.message || "Network Error: Could not reach the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background font-body text-on-surface min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute -z-10 top-0 right-0 w-[40vw] h-[40vw] signature-gradient opacity-[0.03] rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute -z-10 bottom-0 left-0 w-[30vw] h-[30vw] bg-tertiary opacity-[0.03] rounded-full blur-[80px] -translate-x-1/4 translate-y-1/4"></div>

      <main className="flex-grow flex items-center justify-center px-6 py-12">
        <div className="w-full mx-auto max-w-[440px]">
          {/* Logo Section */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary-fixed mb-6">
              <span className="material-symbols-outlined text-primary text-3xl">history_edu</span>
            </div>
            <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface mb-2">AlgoRevis</h1>
            <p className="font-body text-on-surface-variant">Mastering algorithms through discipline.</p>
          </div>

          {/* Login Card */}
          <div className="bg-surface-container-lowest rounded-[1.5rem] p-8 md:p-10 shadow-[0_32px_64px_-12px_rgba(25,28,29,0.06)] relative z-10">
            <form className="space-y-6 text-left" onSubmit={handleLoginSubmit}>
              {/* Email Field */}
              <div className="space-y-2">
                <label className="font-label text-xs font-semibold tracking-wider text-on-surface-variant uppercase ml-1" htmlFor="login-email">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-[20px]">mail</span>
                  </div>
                  <input
                    className="w-full pl-11 pr-4 py-3.5 bg-surface-container-high border-none rounded-xl text-on-surface placeholder-outline focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-200 outline-none"
                    id="login-email"
                    placeholder="name@company.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="font-label text-xs font-semibold tracking-wider text-on-surface-variant uppercase" htmlFor="login-password">
                    Password
                  </label>
                  <a className="text-xs font-medium text-primary hover:text-primary-container transition-colors" href="#">
                    Forgot Password?
                  </a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-[20px]">lock</span>
                  </div>
                  <input
                    className="w-full pl-11 pr-4 py-3.5 bg-surface-container-high border-none rounded-xl text-on-surface placeholder-outline focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-200 outline-none"
                    id="login-password"
                    placeholder="••••••••"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Login Button */}
              <button className="w-full signature-gradient text-white font-semibold py-4 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group" type="submit">
                <span>Sign In</span>
                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-[1px] bg-surface-container-high"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest font-label font-medium">
                <span className="bg-surface-container-lowest px-4 text-outline">or</span>
              </div>
            </div>

            {/* Create Account Option */}
            <div className="text-center">
              <p className="text-sm text-on-surface-variant">
                New to the curriculum?
                <button className="font-bold text-primary hover:text-primary-container ml-1 transition-colors" type="button" onClick={() => navigate('signup')}>
                  Create Account
                </button>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center opacity-40 hover:opacity-100 transition-opacity">
            <p className="text-[10px] uppercase tracking-[0.2em] font-label font-bold text-on-surface-variant">
              Precision in Practice • AlgoRevis © 2024
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
