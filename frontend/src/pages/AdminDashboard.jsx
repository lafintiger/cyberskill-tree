import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { 
  treeService, 
  skillService, 
  tokenService, 
  userService,
  classService 
} from '../services/api';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('skills');
  const [trees, setTrees] = useState([]);
  const [selectedTree, setSelectedTree] = useState(null);
  const [skills, setSkills] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [newSkill, setNewSkill] = useState({
    name: '',
    description: '',
    level: 1,
    xp: 100,
    position_x: 200,
    position_y: 200,
    tree_id: null
  });

  const [newToken, setNewToken] = useState({
    skill_id: null,
    token_string: ''
  });

  const [newClass, setNewClass] = useState({
    name: '',
    term: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedTree) {
      loadSkills(selectedTree.id);
    }
  }, [selectedTree]);

  const loadData = async () => {
    try {
      const [treesData, usersData, classesData, tokensData] = await Promise.all([
        treeService.getTrees(),
        userService.getUsers(),
        classService.getClasses(),
        tokenService.getTokens()
      ]);
      
      setTrees(treesData);
      setUsers(usersData);
      setClasses(classesData);
      setTokens(tokensData);
      
      if (treesData.length > 0) {
        setSelectedTree(treesData[0]);
        setNewSkill(prev => ({ ...prev, tree_id: treesData[0].id }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
    }
  };

  const loadSkills = async (treeId) => {
    try {
      const data = await skillService.getSkillsByTree(treeId);
      setSkills(data);
    } catch (error) {
      console.error('Error loading skills:', error);
    }
  };

  const handleCreateSkill = async (e) => {
    e.preventDefault();
    try {
      await skillService.createSkill(newSkill);
      setMessage({ type: 'success', text: 'Skill created successfully!' });
      loadSkills(selectedTree.id);
      setNewSkill({
        name: '',
        description: '',
        level: 1,
        xp: 100,
        position_x: 200,
        position_y: 200,
        tree_id: selectedTree.id
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create skill' });
    }
  };

  const handleCreateToken = async (e) => {
    e.preventDefault();
    try {
      await tokenService.createToken(newToken);
      setMessage({ type: 'success', text: 'Token created successfully!' });
      const tokensData = await tokenService.getTokens();
      setTokens(tokensData);
      setNewToken({ skill_id: null, token_string: '' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to create token' });
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      await classService.createClass(newClass);
      setMessage({ type: 'success', text: 'Class created successfully!' });
      const classesData = await classService.getClasses();
      setClasses(classesData);
      setNewClass({ name: '', term: '' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create class' });
    }
  };

  const generateRandomToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < 12; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewToken(prev => ({ ...prev, token_string: token }));
  };

  return (
    <div className="min-h-screen bg-cyber-bg">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex gap-2">
          {['skills', 'tokens', 'users', 'classes'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded font-bold transition uppercase ${
                activeTab === tab
                  ? 'cyber-button'
                  : 'bg-cyber-card text-cyber-accent border-2 border-cyber-accent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {message.text && (
          <div className={`mb-4 p-4 rounded border ${
            message.type === 'success' 
              ? 'bg-green-900/50 border-green-500 text-green-200' 
              : 'bg-red-900/50 border-red-500 text-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-cyber-card p-6 rounded-lg border-2 border-cyber-accent">
              <h2 className="text-2xl font-bold text-cyber-accent mb-4">CREATE SKILL</h2>
              
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Tree</label>
                <select
                  value={selectedTree?.id || ''}
                  onChange={(e) => {
                    const tree = trees.find(t => t.id === parseInt(e.target.value));
                    setSelectedTree(tree);
                    setNewSkill(prev => ({ ...prev, tree_id: tree.id }));
                  }}
                  className="w-full px-3 py-2 bg-cyber-bg border border-cyber-accent rounded text-white"
                >
                  {trees.map(tree => (
                    <option key={tree.id} value={tree.id}>{tree.name}</option>
                  ))}
                </select>
              </div>

              <form onSubmit={handleCreateSkill}>
                <div className="mb-3">
                  <label className="block text-sm text-gray-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={newSkill.name}
                    onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                    className="w-full px-3 py-2 bg-cyber-bg border border-cyber-accent rounded text-white"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="block text-sm text-gray-400 mb-1">Description</label>
                  <textarea
                    value={newSkill.description}
                    onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                    className="w-full px-3 py-2 bg-cyber-bg border border-cyber-accent rounded text-white"
                    rows="3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Level</label>
                    <select
                      value={newSkill.level}
                      onChange={(e) => setNewSkill({ ...newSkill, level: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-cyber-bg border border-cyber-accent rounded text-white"
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">XP</label>
                    <input
                      type="number"
                      value={newSkill.xp}
                      onChange={(e) => setNewSkill({ ...newSkill, xp: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-cyber-bg border border-cyber-accent rounded text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Position X</label>
                    <input
                      type="number"
                      value={newSkill.position_x}
                      onChange={(e) => setNewSkill({ ...newSkill, position_x: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-cyber-bg border border-cyber-accent rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Position Y</label>
                    <input
                      type="number"
                      value={newSkill.position_y}
                      onChange={(e) => setNewSkill({ ...newSkill, position_y: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-cyber-bg border border-cyber-accent rounded text-white"
                    />
                  </div>
                </div>

                <button type="submit" className="w-full py-2 cyber-button rounded font-bold">
                  CREATE SKILL
                </button>
              </form>
            </div>

            <div className="bg-cyber-card p-6 rounded-lg border-2 border-cyber-accent overflow-auto max-h-[700px]">
              <h2 className="text-2xl font-bold text-cyber-accent mb-4">SKILLS LIST</h2>
              {skills.map(skill => (
                <div key={skill.id} className="mb-3 p-3 bg-cyber-bg rounded border border-cyber-accent">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-cyber-accent">{skill.name}</h3>
                      <p className="text-sm text-gray-400">{skill.description}</p>
                      <div className="mt-2 flex gap-2">
                        <span className="text-xs px-2 py-1 bg-cyber-secondary rounded">L{skill.level}</span>
                        <span className="text-xs px-2 py-1 bg-cyber-warning text-cyber-bg rounded">{skill.xp} XP</span>
                        {skill.completed && (
                          <span className="text-xs px-2 py-1 bg-cyber-success text-cyber-bg rounded">UNLOCKED</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tokens' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-cyber-card p-6 rounded-lg border-2 border-cyber-accent">
              <h2 className="text-2xl font-bold text-cyber-accent mb-4">CREATE TOKEN</h2>
              
              <form onSubmit={handleCreateToken}>
                <div className="mb-3">
                  <label className="block text-sm text-gray-400 mb-1">Skill</label>
                  <select
                    value={newToken.skill_id || ''}
                    onChange={(e) => setNewToken({ ...newToken, skill_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-cyber-bg border border-cyber-accent rounded text-white"
                    required
                  >
                    <option value="">Select a skill...</option>
                    {skills.map(skill => (
                      <option key={skill.id} value={skill.id}>{skill.name}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="block text-sm text-gray-400 mb-1">Token String</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newToken.token_string}
                      onChange={(e) => setNewToken({ ...newToken, token_string: e.target.value })}
                      className="flex-1 px-3 py-2 bg-cyber-bg border border-cyber-accent rounded text-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={generateRandomToken}
                      className="px-4 py-2 bg-cyber-accent text-cyber-bg rounded font-bold"
                    >
                      GEN
                    </button>
                  </div>
                </div>

                <button type="submit" className="w-full py-2 cyber-button rounded font-bold">
                  CREATE TOKEN
                </button>
              </form>
            </div>

            <div className="bg-cyber-card p-6 rounded-lg border-2 border-cyber-accent overflow-auto max-h-[700px]">
              <h2 className="text-2xl font-bold text-cyber-accent mb-4">TOKENS LIST</h2>
              {tokens.map(token => {
                const skill = skills.find(s => s.id === token.skill_id);
                return (
                  <div key={token.id} className="mb-3 p-3 bg-cyber-bg rounded border border-cyber-accent">
                    <div className="font-bold text-cyber-success font-mono">{token.token_string}</div>
                    <div className="text-sm text-gray-400">
                      Skill: {skill?.name || `ID ${token.skill_id}`}
                    </div>
                    {token.redeemed_by && (
                      <div className="text-xs text-red-400 mt-1">REDEEMED</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-cyber-card p-6 rounded-lg border-2 border-cyber-accent">
            <h2 className="text-2xl font-bold text-cyber-accent mb-4">USERS</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cyber-accent">
                    <th className="text-left py-2 text-cyber-accent">Name</th>
                    <th className="text-left py-2 text-cyber-accent">Email</th>
                    <th className="text-left py-2 text-cyber-accent">Role</th>
                    <th className="text-left py-2 text-cyber-accent">Class ID</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b border-cyber-bg">
                      <td className="py-3 text-white">{user.name}</td>
                      <td className="py-3 text-gray-400">{user.email}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          user.role === 'admin' ? 'bg-cyber-secondary' : 'bg-cyber-accent text-cyber-bg'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 text-gray-400">{user.class_id || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'classes' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-cyber-card p-6 rounded-lg border-2 border-cyber-accent">
              <h2 className="text-2xl font-bold text-cyber-accent mb-4">CREATE CLASS</h2>
              
              <form onSubmit={handleCreateClass}>
                <div className="mb-3">
                  <label className="block text-sm text-gray-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={newClass.name}
                    onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                    className="w-full px-3 py-2 bg-cyber-bg border border-cyber-accent rounded text-white"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-1">Term</label>
                  <input
                    type="text"
                    value={newClass.term}
                    onChange={(e) => setNewClass({ ...newClass, term: e.target.value })}
                    className="w-full px-3 py-2 bg-cyber-bg border border-cyber-accent rounded text-white"
                  />
                </div>

                <button type="submit" className="w-full py-2 cyber-button rounded font-bold">
                  CREATE CLASS
                </button>
              </form>
            </div>

            <div className="bg-cyber-card p-6 rounded-lg border-2 border-cyber-accent">
              <h2 className="text-2xl font-bold text-cyber-accent mb-4">CLASSES LIST</h2>
              {classes.map(classItem => (
                <div key={classItem.id} className="mb-3 p-3 bg-cyber-bg rounded border border-cyber-accent">
                  <h3 className="font-bold text-cyber-accent">{classItem.name}</h3>
                  <p className="text-sm text-gray-400">{classItem.term}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
