import React, { useState } from 'react';

const Signup = ({ navigate }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, email: email, password: password })
      });

      const data = await response.json();

      if (response.ok) {
        alert("Account created! Please log in.");
        navigate('login');
      } else {
        alert("Error: " + data.message);
      }

    } catch (error) {
      console.error("Failed", error);
      alert("Network Error: Could not reach the server.");
    }
  };

  return (
    <div className="bg-surface font-body text-on-background min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden text-left">
      {/* Header / Brand Anchor */}
      <header className="mb-12 text-center z-10">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary text-3xl" aria-hidden="true">history_edu</span>
          <h1 className="font-headline font-extrabold text-2xl tracking-tight text-on-background">AlgoRevis</h1>
        </div>
        <p className="font-label text-on-surface-variant text-sm tracking-widest uppercase">The Disciplined Curator</p>
      </header>

      {/* Main Signup Card */}
      <main className="w-full max-w-md z-10">
        <div className="bg-surface-container-lowest rounded-xl p-8 md:p-12 shadow-[0_32px_64px_-12px_rgba(25,28,29,0.06)] flex flex-col gap-8 transition-all duration-300">
          <section className="space-y-2">
            <h2 className="font-headline text-3xl font-bold text-on-background tracking-tight">Create your account</h2>
            <p className="text-on-surface-variant font-body">Master algorithms with precision.</p>
          </section>

          <form className="flex flex-col gap-6" onSubmit={handleSignupSubmit}>
            {/* Name Field */}
            <div className="space-y-2">
              <label className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-2" htmlFor="name">
                Full Name
              </label>
              <div className="relative group">
                <input 
                  className="w-full bg-surface-container-high border-none rounded-lg px-4 py-3.5 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-200 outline-none placeholder:text-outline/50" 
                  id="name" 
                  placeholder="John Doe" 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-2" htmlFor="email">
                Email Address
              </label>
              <div className="relative group">
                <input
                  className="w-full bg-surface-container-high border-none rounded-lg px-4 py-3.5 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-200 outline-none placeholder:text-outline/50"
                  id="email"
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
              <label className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-2" htmlFor="password">
                Password
              </label>
              <div className="relative group">
                <input
                  className="w-full bg-surface-container-high border-none rounded-lg px-4 py-3.5 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-200 outline-none placeholder:text-outline/50"
                  id="password"
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* CTA Button */}
            <button className="signature-gradient text-on-primary font-headline font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 mt-2" type="submit">
              Create Account
            </button>
          </form>

          <div className="flex flex-col items-center gap-4 pt-4">
            <p className="text-on-surface-variant font-body text-sm">
              Already have an account?{' '}
              <button type="button" className="text-primary font-semibold hover:underline decoration-primary/30 underline-offset-4" onClick={() => navigate('login')}>Login</button>
            </p>
          </div>
        </div>

        {/* Progress Ribbon / Tonal Detail */}
        <div className="mt-8 flex justify-center gap-8 px-4 opacity-50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-xs text-tertiary" aria-hidden="true">verified_user</span>
            <span className="font-label text-[10px] uppercase tracking-tighter">Academic Precision</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-xs text-tertiary" aria-hidden="true">encrypted</span>
            <span className="font-label text-[10px] uppercase tracking-tighter">Zero Friction UI</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-xs text-tertiary" aria-hidden="true">auto_awesome</span>
            <span className="font-label text-[10px] uppercase tracking-tighter">Editorial Focus</span>
          </div>
        </div>
      </main>

      {/* Visual Anchor / Background Detail */}
      <div className="fixed bottom-0 left-0 w-full h-1 signature-gradient opacity-40 z-0"></div>

      {/* Aesthetic Texture Blobs */}
      <div className="fixed -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none z-0"></div>
      <div className="fixed -bottom-24 -right-24 w-96 h-96 bg-tertiary/5 rounded-full blur-3xl pointer-events-none z-0"></div>
    </div>
  );
};

export default Signup;
