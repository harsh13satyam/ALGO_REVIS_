import React, { useState, useEffect, useRef } from 'react';
import api from './api';

const Signup = ({ navigate, onLoginSuccess }) => {
  // Step state: 'form' | 'otp'
  const [step, setStep] = useState('form');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // OTP Verification Fields
  const [otpCode, setOtpCode] = useState('');
  const [registrationToken, setRegistrationToken] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const otpInputRef = useRef(null);

  // Resend Countdown Timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Focus OTP input when transitioning to OTP step
  useEffect(() => {
    if (step === 'otp' && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  // Handle Step 1: Form Submit -> Initiate Email OTP
  const handleInitiateSignup = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (name.trim().length < 2) {
      setErrorMsg('Full name must be at least 2 characters.');
      return;
    }

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

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
      const response = await api.registerInitiate({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword
      });

      if (response?.registrationToken) {
        setRegistrationToken(response.registrationToken);
        setResendCooldown(response.cooldownSeconds || 60);
        setStep('otp');
        setSuccessMsg(`Verification code sent to ${email.trim()}`);
      } else {
        throw new Error(response?.message || 'Could not initiate registration.');
      }
    } catch (error) {
      console.error('Registration initiate error:', error);
      setErrorMsg(error.message || 'Could not initiate registration. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2: Verify 6-digit Email OTP
  const handleVerifyOTP = async (e) => {
    e?.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanCode = otpCode.trim();
    if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      setErrorMsg('Please enter the complete 6-digit numeric verification code.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.verifyEmailCode({
        registrationToken,
        code: cleanCode
      });

      if (response?.accountActivated && response?.user) {
        setSuccessMsg('Email verified successfully! Setting up your workspace...');
        if (response.user.name) {
          localStorage.setItem('userName', response.user.name);
        }

        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(response.user);
          } else {
            navigate('dashboard_home');
          }
        }, 600);
      } else {
        throw new Error(response?.message || 'Verification could not be completed.');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      setErrorMsg(error.message || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend Email OTP
  const handleResendOTP = async () => {
    if (resendCooldown > 0 || loading) return;
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await api.resendEmailCode({ registrationToken });
      setResendCooldown(res.cooldownSeconds || 60);
      setSuccessMsg(`A fresh verification code has been sent to ${email}`);
    } catch (error) {
      setErrorMsg(error.message || 'Could not resend verification code. Please try again.');
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
        <div className="w-full mx-auto max-w-[460px] z-10">
          {/* Header / Brand Anchor */}
          <header className="mb-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 mb-4 border border-indigo-500/20 shadow-sm">
              <span className="material-symbols-outlined text-primary text-3xl">history_edu</span>
            </div>
            <h1 className="font-headline font-extrabold text-3xl tracking-tight text-on-surface mb-1">AlgoRevis</h1>
            <p className="font-label text-on-surface-variant text-xs tracking-widest uppercase">The Disciplined Curator</p>
          </header>

          {/* Main Card */}
          <div className="bg-surface-container-lowest rounded-[1.5rem] p-8 md:p-10 shadow-[0_32px_64px_-12px_rgba(25,28,29,0.06)] flex flex-col gap-6 border border-slate-100">
            {step === 'form' ? (
              // ==========================================
              // STEP 1: REGISTRATION FORM
              // ==========================================
              <>
                <section className="space-y-1">
                  <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight">Create your account</h2>
                  <p className="text-on-surface-variant text-sm font-body">Master algorithms with spaced repetition.</p>
                </section>

                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-red-500">error</span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form className="flex flex-col gap-4" onSubmit={handleInitiateSignup}>
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
                        placeholder="Min 6 characters"
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
                        placeholder="Repeat password"
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
                        <span>Sending Verification Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue to Verification</span>
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
              </>
            ) : (
              // ==========================================
              // STEP 2: EMAIL OTP VERIFICATION
              // ==========================================
              <>
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 bg-indigo-50 rounded-2xl mx-auto flex items-center justify-center text-indigo-600 border border-indigo-100 mb-3">
                    <span className="material-symbols-outlined text-2xl">mark_email_read</span>
                  </div>
                  <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight">Check your email</h2>
                  <p className="text-on-surface-variant text-sm font-body">
                    We sent a 6-digit verification code to:
                  </p>
                  <p className="text-primary font-semibold text-sm font-mono break-all bg-indigo-50/60 py-1 px-3 rounded-lg inline-block border border-indigo-100/50">
                    {email}
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-red-500">error</span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
                    <span>{successMsg}</span>
                  </div>
                )}

                <form className="flex flex-col gap-5" onSubmit={handleVerifyOTP}>
                  <div className="space-y-2 text-center">
                    <label className="font-label text-xs font-semibold uppercase tracking-wider text-slate-500" htmlFor="otp">
                      Enter 6-Digit Code
                    </label>
                    <input
                      ref={otpInputRef}
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoComplete="one-time-code"
                      value={otpCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtpCode(val);
                      }}
                      placeholder="••••••"
                      className="w-full text-center text-3xl font-mono font-bold tracking-[0.4em] py-3.5 px-4 bg-slate-50 border-2 border-indigo-200/60 rounded-xl focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-300 text-slate-900"
                      required
                    />
                    <p className="text-[11px] text-slate-400">Code expires in 10 minutes</p>
                  </div>

                  <button
                    className="w-full signature-gradient text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-indigo-500/20 hover:opacity-95 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50"
                    type="submit"
                    disabled={loading || otpCode.length !== 6}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Verifying Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Create Account</span>
                        <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">check</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || loading}
                      onClick={handleResendOTP}
                      className="text-primary font-semibold hover:underline disabled:text-slate-400 disabled:no-underline transition flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">refresh</span>
                      {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStep('form');
                        setOtpCode('');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className="text-slate-500 hover:text-slate-800 font-medium hover:underline transition"
                    >
                      Wrong email? Edit
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* Aesthetic Badges */}
          <div className="mt-8 flex justify-center gap-6 px-4 opacity-50">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs text-indigo-500">verified_user</span>
              <span className="font-label text-[10px] uppercase tracking-wider text-slate-500">Email Verified</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs text-indigo-500">encrypted</span>
              <span className="font-label text-[10px] uppercase tracking-wider text-slate-500">Secure Hash</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs text-indigo-500">auto_awesome</span>
              <span className="font-label text-[10px] uppercase tracking-wider text-slate-500">Zero Friction</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Signup;
