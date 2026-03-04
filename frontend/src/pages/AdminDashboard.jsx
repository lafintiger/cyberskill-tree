import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { treeService, skillService, tokenService, userService, classService, submissionService } from '../services/api';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('skills');
  const [trees, setTrees] = useState([]);
  const [selectedTree, setSelectedTree] = useState(null);
  const [skills, setSkills] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [expandedSubmission, setExpandedSubmission] = useState(null);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [filePreview, setFilePreview] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [newSkill, setNewSkill] = useState({ name: '', description: '', level: 1, xp: 100, position_x: 200, position_y: 200, tree_id: null, completion_type: 'token' });
  const [newToken, setNewToken] = useState({ skill_id: null, token_string: '' });
  const [newClass, setNewClass] = useState({ name: '', term: '' });

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (selectedTree) loadSkills(selectedTree.id); }, [selectedTree]);

  const loadData = async () => {
    try {
      const [treesData, usersData, classesData, tokensData, subsData] = await Promise.all([
        treeService.getTrees(), userService.getUsers(), classService.getClasses(), tokenService.getTokens(), submissionService.getPendingSubmissions()
      ]);
      setTrees(treesData); setUsers(usersData); setClasses(classesData); setTokens(tokensData); setPendingSubmissions(subsData);
      if (treesData.length > 0) { setSelectedTree(treesData[0]); setNewSkill(prev => ({ ...prev, tree_id: treesData[0].id })); }
    } catch (error) { setMessage({ type: 'error', text: 'Failed to load data' }); }
  };

  const loadSkills = async (treeId) => { try { setSkills(await skillService.getSkillsByTree(treeId)); } catch {} };

  const handleCreateSkill = async (e) => {
    e.preventDefault();
    try {
      await skillService.createSkill(newSkill);
      setMessage({ type: 'success', text: 'Skill created!' });
      loadSkills(selectedTree.id);
      setNewSkill({ name: '', description: '', level: 1, xp: 100, position_x: 200, position_y: 200, tree_id: selectedTree.id, completion_type: 'token' });
    } catch { setMessage({ type: 'error', text: 'Failed to create skill' }); }
  };

  const handleCreateToken = async (e) => {
    e.preventDefault();
    try {
      await tokenService.createToken(newToken);
      setMessage({ type: 'success', text: 'Token created!' });
      setTokens(await tokenService.getTokens());
      setNewToken({ skill_id: null, token_string: '' });
    } catch (error) { setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed' }); }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      await classService.createClass(newClass);
      setMessage({ type: 'success', text: 'Class created!' });
      setClasses(await classService.getClasses());
      setNewClass({ name: '', term: '' });
    } catch { setMessage({ type: 'error', text: 'Failed to create class' }); }
  };

  const generateRandomToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let t = ''; for (let i = 0; i < 12; i++) t += chars[Math.floor(Math.random() * chars.length)];
    setNewToken(prev => ({ ...prev, token_string: t }));
  };

  const handleExpandSubmission = async (sub) => {
    if (expandedSubmission?.id === sub.id) { setExpandedSubmission(null); setFilePreview(null); setReviewFeedback(''); return; }
    setExpandedSubmission(sub); setReviewFeedback(''); setFilePreview(null);
    if (sub.file_type.startsWith('image/')) { try { const r = await submissionService.getFile(sub.id); setFilePreview(URL.createObjectURL(r.data)); } catch {} }
  };

  const handleReview = async (id, status) => {
    try {
      await submissionService.reviewSubmission(id, status, reviewFeedback);
      setMessage({ type: 'success', text: `Submission ${status}!` });
      setExpandedSubmission(null); setFilePreview(null); setReviewFeedback('');
      setPendingSubmissions(await submissionService.getPendingSubmissions());
    } catch (error) { setMessage({ type: 'error', text: error.response?.data?.detail || 'Review failed' }); }
  };

  const handleDownloadFile = async (sub) => {
    try {
      const r = await submissionService.getFile(sub.id);
      const a = document.createElement('a'); a.href = URL.createObjectURL(r.data); a.download = sub.file_name; a.click();
    } catch {}
  };

  const tabs = ['skills', 'tokens', 'reviews', 'users', 'classes'];

  return (
    <div className="min-h-screen bg-cyber-bg cyber-grid-bg">
      <Header />
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`relative px-5 py-2.5 rounded-lg font-display text-xs font-bold tracking-wider transition-all duration-300 uppercase ${
                activeTab === tab ? 'cyber-button' : 'bg-white/3 text-white/50 border border-white/10 hover:border-cyber-accent/40 hover:text-cyber-accent'
              }`}>
              {tab}
              {tab === 'reviews' && pendingSubmissions.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-cyber-danger text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {pendingSubmissions.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {message.text && (
          <div className={`mb-5 p-4 rounded-lg text-sm font-body ${
            message.type === 'success' ? 'bg-cyber-success/10 border border-cyber-success/30 text-cyber-success' : 'bg-cyber-danger/10 border border-cyber-danger/30 text-cyber-danger'
          }`}>{message.text}</div>
        )}

        {/* SKILLS TAB */}
        {activeTab === 'skills' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="cyber-card rounded-xl p-6">
              <h2 className="text-sm font-display font-bold tracking-widest text-cyber-accent/80 mb-5">CREATE SKILL</h2>
              <div className="mb-4">
                <label className="cyber-label">Tree</label>
                <select value={selectedTree?.id || ''} onChange={(e) => { const t = trees.find(x => x.id === parseInt(e.target.value)); setSelectedTree(t); setNewSkill(p => ({...p, tree_id: t.id})); }} className="cyber-input text-sm">
                  {trees.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <form onSubmit={handleCreateSkill} className="space-y-3">
                <div><label className="cyber-label">Name</label><input type="text" value={newSkill.name} onChange={(e) => setNewSkill({...newSkill, name: e.target.value})} className="cyber-input text-sm" required /></div>
                <div><label className="cyber-label">Description</label><textarea value={newSkill.description} onChange={(e) => setNewSkill({...newSkill, description: e.target.value})} className="cyber-input text-sm" rows="2" /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="cyber-label">Level</label><select value={newSkill.level} onChange={(e) => setNewSkill({...newSkill, level: parseInt(e.target.value)})} className="cyber-input text-sm"><option value="1">1</option><option value="2">2</option><option value="3">3</option></select></div>
                  <div><label className="cyber-label">XP</label><input type="number" value={newSkill.xp} onChange={(e) => setNewSkill({...newSkill, xp: parseInt(e.target.value)})} className="cyber-input text-sm" /></div>
                  <div><label className="cyber-label">Type</label><select value={newSkill.completion_type} onChange={(e) => setNewSkill({...newSkill, completion_type: e.target.value})} className="cyber-input text-sm"><option value="token">Token</option><option value="upload">Upload</option><option value="both">Both</option></select></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="cyber-label">Pos X</label><input type="number" value={newSkill.position_x} onChange={(e) => setNewSkill({...newSkill, position_x: parseFloat(e.target.value)})} className="cyber-input text-sm" /></div>
                  <div><label className="cyber-label">Pos Y</label><input type="number" value={newSkill.position_y} onChange={(e) => setNewSkill({...newSkill, position_y: parseFloat(e.target.value)})} className="cyber-input text-sm" /></div>
                </div>
                <button type="submit" className="w-full py-3 cyber-button rounded-lg text-xs mt-2">CREATE SKILL</button>
              </form>
            </div>
            <div className="cyber-card rounded-xl p-6 overflow-auto max-h-[700px]">
              <h2 className="text-sm font-display font-bold tracking-widest text-cyber-accent/80 mb-5">SKILLS ({skills.length})</h2>
              <div className="space-y-2">
                {skills.map(skill => (
                  <div key={skill.id} className="p-3 rounded-lg bg-white/3 border border-white/5 hover:border-cyber-accent/20 transition-all">
                    <h3 className="text-sm font-body font-semibold text-white/80">{skill.name}</h3>
                    <p className="text-xs font-body text-white/30 mt-0.5 line-clamp-1">{skill.description}</p>
                    <div className="mt-2 flex gap-1.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-secondary/15 text-cyber-secondary border border-cyber-secondary/20">L{skill.level}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-warning/15 text-cyber-warning border border-cyber-warning/20">{skill.xp} XP</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded tag-${skill.completion_type}`}>{skill.completion_type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TOKENS TAB */}
        {activeTab === 'tokens' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="cyber-card rounded-xl p-6">
              <h2 className="text-sm font-display font-bold tracking-widest text-cyber-accent/80 mb-5">CREATE TOKEN</h2>
              <form onSubmit={handleCreateToken} className="space-y-3">
                <div><label className="cyber-label">Skill</label><select value={newToken.skill_id || ''} onChange={(e) => setNewToken({...newToken, skill_id: parseInt(e.target.value)})} className="cyber-input text-sm" required><option value="">Select...</option>{skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div>
                  <label className="cyber-label">Token String</label>
                  <div className="flex gap-2">
                    <input type="text" value={newToken.token_string} onChange={(e) => setNewToken({...newToken, token_string: e.target.value})} className="cyber-input text-sm flex-1" required />
                    <button type="button" onClick={generateRandomToken} className="px-4 rounded-lg text-xs font-display font-bold bg-cyber-accent/15 text-cyber-accent border border-cyber-accent/30 hover:bg-cyber-accent/25 transition-all">GEN</button>
                  </div>
                </div>
                <button type="submit" className="w-full py-3 cyber-button rounded-lg text-xs">CREATE TOKEN</button>
              </form>
            </div>
            <div className="cyber-card rounded-xl p-6 overflow-auto max-h-[700px]">
              <h2 className="text-sm font-display font-bold tracking-widest text-cyber-accent/80 mb-5">TOKENS ({tokens.length})</h2>
              <div className="space-y-2">
                {tokens.map(token => {
                  const skill = skills.find(s => s.id === token.skill_id);
                  return (
                    <div key={token.id} className="p-3 rounded-lg bg-white/3 border border-white/5">
                      <div className="font-mono text-sm text-cyber-success tracking-wider">{token.token_string}</div>
                      <div className="text-xs font-body text-white/30 mt-1">{skill?.name || `Skill #${token.skill_id}`}</div>
                      {token.redeemed_by && <span className="text-[10px] font-mono text-cyber-danger/60 mt-1 inline-block">REDEEMED</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div className="cyber-card rounded-xl p-6">
            <h2 className="text-sm font-display font-bold tracking-widest text-cyber-accent/80 mb-5">
              PENDING REVIEWS <span className="text-white/30">({pendingSubmissions.length})</span>
            </h2>
            {pendingSubmissions.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3 opacity-20">&#10003;</div>
                <p className="text-sm font-body text-white/30">No pending submissions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingSubmissions.map(sub => (
                  <div key={sub.id} className="rounded-lg bg-white/3 border border-white/5 overflow-hidden">
                    <div className="p-4 cursor-pointer hover:bg-white/2 transition-all flex justify-between items-center" onClick={() => handleExpandSubmission(sub)}>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm font-body font-semibold text-white/80">{sub.skill_name}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-warning/15 text-cyber-warning border border-cyber-warning/20">PENDING</span>
                        </div>
                        <p className="text-xs font-body text-white/40">by <span className="text-white/60">{sub.user_name}</span> &middot; {new Date(sub.submitted_at).toLocaleString()}</p>
                        <p className="text-[11px] font-mono text-white/20 mt-1">{sub.file_name}</p>
                      </div>
                      <span className="text-white/20 text-sm">{expandedSubmission?.id === sub.id ? '▲' : '▼'}</span>
                    </div>
                    {expandedSubmission?.id === sub.id && (
                      <div className="p-4 border-t border-white/5 bg-white/2">
                        {sub.note && (
                          <div className="mb-4"><p className="cyber-label">Student Note</p><p className="text-sm font-body text-white/60 bg-white/3 p-3 rounded-lg">{sub.note}</p></div>
                        )}
                        <div className="mb-4">
                          <p className="cyber-label">File</p>
                          {filePreview && sub.file_type.startsWith('image/') ? (
                            <img src={filePreview} alt="Submission" className="max-w-full max-h-64 rounded-lg border border-white/10 mb-2" />
                          ) : (
                            <p className="text-sm font-mono text-white/40">{sub.file_name} ({sub.file_type})</p>
                          )}
                          <button onClick={() => handleDownloadFile(sub)} className="mt-2 px-4 py-1.5 rounded-lg text-xs font-display font-bold bg-cyber-accent/15 text-cyber-accent border border-cyber-accent/30 hover:bg-cyber-accent/25 transition-all">
                            DOWNLOAD
                          </button>
                        </div>
                        <div className="mb-4">
                          <label className="cyber-label">Feedback</label>
                          <textarea value={reviewFeedback} onChange={(e) => setReviewFeedback(e.target.value)} placeholder="Optional feedback..." rows="2" className="cyber-input text-sm" />
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => handleReview(sub.id, 'approved')} className="flex-1 py-2.5 rounded-lg text-xs font-display font-bold bg-cyber-success/15 text-cyber-success border border-cyber-success/30 hover:bg-cyber-success/25 transition-all">APPROVE</button>
                          <button onClick={() => handleReview(sub.id, 'rejected')} className="flex-1 py-2.5 rounded-lg text-xs font-display font-bold bg-cyber-danger/15 text-cyber-danger border border-cyber-danger/30 hover:bg-cyber-danger/25 transition-all">REJECT</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="cyber-card rounded-xl p-6">
            <h2 className="text-sm font-display font-bold tracking-widest text-cyber-accent/80 mb-5">USERS ({users.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-white/10">
                  {['Name', 'Email', 'Role', 'Class'].map(h => <th key={h} className="text-left py-3 text-[10px] font-display tracking-widest text-white/30 uppercase">{h}</th>)}
                </tr></thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/2 transition-all">
                      <td className="py-3 text-sm font-body text-white/80">{user.name}</td>
                      <td className="py-3 text-sm font-mono text-white/40">{user.email}</td>
                      <td className="py-3"><span className={`text-[10px] font-mono px-2 py-0.5 rounded ${user.role === 'admin' ? 'bg-cyber-secondary/15 text-cyber-secondary border border-cyber-secondary/20' : 'bg-cyber-accent/15 text-cyber-accent border border-cyber-accent/20'}`}>{user.role}</span></td>
                      <td className="py-3 text-sm font-mono text-white/30">{user.class_id || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CLASSES TAB */}
        {activeTab === 'classes' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="cyber-card rounded-xl p-6">
              <h2 className="text-sm font-display font-bold tracking-widest text-cyber-accent/80 mb-5">CREATE CLASS</h2>
              <form onSubmit={handleCreateClass} className="space-y-3">
                <div><label className="cyber-label">Name</label><input type="text" value={newClass.name} onChange={(e) => setNewClass({...newClass, name: e.target.value})} className="cyber-input text-sm" required /></div>
                <div><label className="cyber-label">Term</label><input type="text" value={newClass.term} onChange={(e) => setNewClass({...newClass, term: e.target.value})} className="cyber-input text-sm" /></div>
                <button type="submit" className="w-full py-3 cyber-button rounded-lg text-xs">CREATE CLASS</button>
              </form>
            </div>
            <div className="cyber-card rounded-xl p-6">
              <h2 className="text-sm font-display font-bold tracking-widest text-cyber-accent/80 mb-5">CLASSES ({classes.length})</h2>
              <div className="space-y-2">
                {classes.map(c => (
                  <div key={c.id} className="p-3 rounded-lg bg-white/3 border border-white/5">
                    <h3 className="text-sm font-body font-semibold text-white/80">{c.name}</h3>
                    <p className="text-xs font-mono text-white/30">{c.term}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
