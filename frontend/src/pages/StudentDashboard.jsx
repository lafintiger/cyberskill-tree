import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import SkillTree from '../components/SkillTree';
import { treeService, skillService, tokenService } from '../services/api';

function StudentDashboard() {
  const [trees, setTrees] = useState([]);
  const [selectedTree, setSelectedTree] = useState(null);
  const [skills, setSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [tokenInput, setTokenInput] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTrees();
  }, []);

  useEffect(() => {
    if (selectedTree) {
      loadSkills(selectedTree.id);
    }
  }, [selectedTree]);

  const loadTrees = async () => {
    try {
      const data = await treeService.getTrees();
      setTrees(data);
      if (data.length > 0) {
        setSelectedTree(data[0]);
      }
    } catch (error) {
      console.error('Error loading trees:', error);
      setMessage({ type: 'error', text: 'Failed to load skill trees' });
    }
  };

  const loadSkills = async (treeId) => {
    try {
      setIsLoading(true);
      const data = await skillService.getSkillsByTree(treeId);
      setSkills(data);
    } catch (error) {
      console.error('Error loading skills:', error);
      setMessage({ type: 'error', text: 'Failed to load skills' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkillClick = (skill) => {
    setSelectedSkill(skill);
  };

  const handleTokenSubmit = async (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    try {
      setMessage({ type: '', text: '' });
      const response = await tokenService.submitToken(tokenInput);
      setMessage({ 
        type: 'success', 
        text: `Success! Unlocked "${response.skill}" (+${response.xp_awarded} XP)` 
      });
      setTokenInput('');
      loadSkills(selectedTree.id);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Token validation failed' 
      });
    }
  };

  return (
    <div className="min-h-screen bg-cyber-bg">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          <div className="flex-1">
            <div className="mb-4 flex gap-2">
              {trees.map(tree => (
                <button
                  key={tree.id}
                  onClick={() => setSelectedTree(tree)}
                  className={`px-6 py-3 rounded font-bold transition ${
                    selectedTree?.id === tree.id
                      ? 'cyber-button'
                      : 'bg-cyber-card text-cyber-accent border-2 border-cyber-accent'
                  }`}
                >
                  {tree.name}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-96">
                <p className="text-2xl text-cyber-accent">Loading constellation...</p>
              </div>
            ) : (
              <div className="h-[600px]">
                <SkillTree skills={skills} onSkillClick={handleSkillClick} />
              </div>
            )}
          </div>

          <div className="w-80">
            <div className="bg-cyber-card p-6 rounded-lg border-2 border-cyber-accent mb-4">
              <h2 className="text-xl font-bold text-cyber-accent mb-4">
                TOKEN SUBMISSION
              </h2>
              
              {message.text && (
                <div className={`mb-4 p-3 rounded border ${
                  message.type === 'success' 
                    ? 'bg-green-900/50 border-green-500 text-green-200' 
                    : 'bg-red-900/50 border-red-500 text-red-200'
                }`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleTokenSubmit}>
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Enter token..."
                  className="w-full px-4 py-2 bg-cyber-bg border border-cyber-accent rounded mb-3 focus:outline-none focus:border-cyber-secondary text-white"
                />
                <button
                  type="submit"
                  className="w-full py-2 cyber-button rounded font-bold"
                >
                  VALIDATE TOKEN
                </button>
              </form>
            </div>

            {selectedSkill && (
              <div className="bg-cyber-card p-6 rounded-lg border-2 border-cyber-accent">
                <h2 className="text-xl font-bold text-cyber-accent mb-2">
                  {selectedSkill.name}
                </h2>
                
                <div className="mb-3">
                  <span className={`inline-block px-3 py-1 rounded text-sm font-bold ${
                    selectedSkill.completed 
                      ? 'bg-cyber-success text-cyber-bg' 
                      : 'bg-cyber-card border border-cyber-accent text-cyber-accent'
                  }`}>
                    {selectedSkill.completed ? 'COMPLETED' : 'LOCKED'}
                  </span>
                  <span className="ml-2 inline-block px-3 py-1 rounded text-sm font-bold bg-cyber-secondary text-white">
                    LEVEL {selectedSkill.level}
                  </span>
                </div>

                <p className="text-gray-300 mb-3">{selectedSkill.description}</p>
                
                <div className="border-t border-cyber-accent pt-3">
                  <p className="text-cyber-warning font-bold">XP REWARD: {selectedSkill.xp}</p>
                  
                  {selectedSkill.dependencies && selectedSkill.dependencies.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-400 mb-1">Prerequisites:</p>
                      {selectedSkill.dependencies.map(depId => {
                        const depSkill = skills.find(s => s.id === depId);
                        return depSkill ? (
                          <div key={depId} className="text-sm text-cyber-accent">
                            • {depSkill.name} {depSkill.completed ? '✓' : '✗'}
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
