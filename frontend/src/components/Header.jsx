import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, userService } from '../services/api';

function Header() {
  const [user, setUser] = useState(null);
  const [totalXP, setTotalXP] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
      if (userData.role === 'student') {
        const progress = await userService.getProgress();
        setTotalXP(progress.total_xp);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  if (!user) return null;

  const xpLevel = Math.floor(totalXP / 500) + 1;
  const xpInLevel = totalXP % 500;
  const xpPercent = (xpInLevel / 500) * 100;

  return (
    <header className="relative border-b border-cyber-accent/20" style={{background: 'linear-gradient(180deg, #0d1230 0%, #080c24 100%)'}}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-cyber-accent/10 border border-cyber-accent/30 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
                <path d="M24 4L42 14V34L24 44L6 34V14L24 4Z" stroke="#00e5ff" strokeWidth="2.5" fill="#00e5ff11"/>
                <circle cx="24" cy="24" r="4" fill="#00e5ff"/>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-display font-bold tracking-wider" style={{color: '#00e5ff'}}>
                CYBERSKILL TREE
              </h1>
              <p className="text-[10px] font-mono tracking-[0.25em] text-white/30 uppercase">
                {user.role === 'admin' ? 'Admin Console' : 'Neural Interface'}
              </p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-6">
            {user.role === 'student' && (
              <div className="flex items-center gap-5">
                {/* XP Bar */}
                <div className="w-48">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Level {xpLevel}</span>
                    <span className="text-xs font-mono text-cyber-success font-bold">{totalXP} XP</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="xp-bar h-full rounded-full" style={{width: `${xpPercent}%`}} />
                  </div>
                  <div className="flex justify-end mt-0.5">
                    <span className="text-[9px] font-mono text-white/20">{xpInLevel}/500 to next</span>
                  </div>
                </div>
              </div>
            )}

            {/* User info */}
            <div className="flex items-center gap-3 pl-5 border-l border-white/10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyber-accent/30 to-cyber-secondary/30 flex items-center justify-center border border-white/10">
                <span className="text-xs font-display font-bold text-white/80">
                  {user.name?.charAt(0) || '?'}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-body font-semibold text-white/90">{user.name}</p>
                <p className="text-[10px] font-mono text-white/30">{user.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg text-xs font-display font-bold tracking-wider text-white/40 border border-white/10 hover:text-cyber-danger hover:border-cyber-danger/40 transition-all duration-300"
            >
              LOGOUT
            </button>
          </div>
        </div>
      </div>
      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyber-accent/30 to-transparent" />
    </header>
  );
}

export default Header;
