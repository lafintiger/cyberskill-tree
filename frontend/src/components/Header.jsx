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

  return (
    <header className="bg-cyber-card border-b-2 border-cyber-accent px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold cyber-glow">CYBERSKILL TREE</h1>
          <p className="text-sm text-gray-400">
            {user.role === 'admin' ? 'ADMIN CONSOLE' : 'NEURAL INTERFACE'}
          </p>
        </div>

        <div className="flex items-center gap-6">
          {user.role === 'student' && (
            <div className="text-right">
              <p className="text-sm text-gray-400">TOTAL XP</p>
              <p className="text-2xl font-bold text-cyber-success">{totalXP}</p>
            </div>
          )}
          
          <div className="text-right">
            <p className="text-sm text-gray-400">OPERATOR</p>
            <p className="text-lg font-bold text-cyber-accent">{user.name}</p>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold"
          >
            DISCONNECT
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
