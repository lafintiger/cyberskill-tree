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
    <div className="min-h-screen flex items-center justify-center bg-cyber-bg">
      <div className="bg-cyber-card p-8 rounded-lg cyber-border max-w-md w-full">
        <h1 className="text-4xl font-bold text-center mb-2 cyber-glow">
          CYBERSKILL TREE
        </h1>
        <p className="text-center text-cyber-accent mb-8">
          Initialize Neural Link
        </p>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-cyber-accent mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-cyber-bg border border-cyber-accent rounded focus:outline-none focus:border-cyber-secondary text-white"
              placeholder="operator@cyber.net"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-cyber-accent mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-cyber-bg border border-cyber-accent rounded focus:outline-none focus:border-cyber-secondary text-white"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 cyber-button rounded font-bold text-lg"
          >
            {isLoading ? 'CONNECTING...' : 'JACK IN'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-400">
          <p>Test Credentials:</p>
          <p>Admin: admin@cyber.edu / admin123</p>
          <p>Student: student@cyber.edu / student123</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
