import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authService.login(email, password);
      const user = await authService.getCurrentUser();
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/student');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center cyber-grid-bg relative">
      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyber-accent/5 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyber-secondary/5 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '2s'}} />

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo area */}
        <div className="text-center mb-8 animate-float">
          <div className="inline-block p-4 rounded-2xl bg-cyber-accent/5 border border-cyber-accent/20 mb-6">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto">
              <path d="M24 4L42 14V34L24 44L6 34V14L24 4Z" stroke="#00e5ff" strokeWidth="2" fill="#00e5ff11"/>
              <path d="M24 12L34 18V30L24 36L14 30V18L24 12Z" stroke="#d946ef" strokeWidth="1.5" fill="#d946ef11"/>
              <circle cx="24" cy="24" r="4" fill="#00e5ff"/>
            </svg>
          </div>
          <h1 className="text-4xl font-display font-black tracking-wider cyber-glow mb-2" style={{color: '#00e5ff'}}>
            CYBERSKILL
          </h1>
          <p className="text-lg font-display tracking-[0.3em] text-cyber-secondary font-light">
            TREE
          </p>
        </div>

        {/* Login card */}
        <div className="cyber-card rounded-2xl p-8 cyber-scanline">
          <p className="text-center text-sm font-mono text-cyber-accent/60 mb-6 tracking-widest uppercase">
            Initialize Neural Link
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-cyber-danger/10 border border-cyber-danger/30 text-cyber-danger text-sm font-body">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="cyber-label">Operator ID</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="cyber-input"
                placeholder="operator@cyber.net"
                required
              />
            </div>

            <div className="mb-8">
              <label className="cyber-label">Access Key</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="cyber-input"
                placeholder="••••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 cyber-button rounded-lg text-sm disabled:opacity-50"
            >
              {isLoading ? 'ESTABLISHING CONNECTION...' : 'JACK IN'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5">
            <p className="text-center text-xs font-mono text-white/20 mb-2">TEST CREDENTIALS</p>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono text-white/30">
              <div className="p-2 rounded bg-white/3 text-center">
                <span className="text-cyber-accent/50">admin</span>@cyber.edu<br/>admin123
              </div>
              <div className="p-2 rounded bg-white/3 text-center">
                <span className="text-cyber-secondary/50">student</span>@cyber.edu<br/>student123
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs font-mono text-white/10 mt-8 tracking-widest">
          v1.0 // SECURED CHANNEL
        </p>
      </div>
    </div>
  );
}

export default Login;
