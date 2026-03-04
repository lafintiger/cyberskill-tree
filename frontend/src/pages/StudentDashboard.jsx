import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import SkillTree from '../components/SkillTree';
import { treeService, skillService, tokenService, submissionService } from '../services/api';

function StudentDashboard() {
  const [trees, setTrees] = useState([]);
  const [selectedTree, setSelectedTree] = useState(null);
  const [skills, setSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [tokenInput, setTokenInput] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadNote, setUploadNote] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { loadTrees(); }, []);
  useEffect(() => { if (selectedTree) loadSkills(selectedTree.id); }, [selectedTree]);

  const loadTrees = async () => {
    try {
      const data = await treeService.getTrees();
      setTrees(data);
      if (data.length > 0) setSelectedTree(data[0]);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load skill trees' });
    }
  };

  const loadSkills = async (treeId) => {
    try {
      setIsLoading(true);
      const data = await skillService.getSkillsByTree(treeId);
      setSkills(data);
      if (selectedSkill) {
        const updated = data.find(s => s.id === selectedSkill.id);
        if (updated) setSelectedSkill(updated);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load skills' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkillClick = (skill) => {
    setSelectedSkill(skill);
    setMessage({ type: '', text: '' });
    setUploadFile(null);
    setUploadNote('');
  };

  const handleTokenSubmit = async (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    try {
      setMessage({ type: '', text: '' });
      const response = await tokenService.submitToken(tokenInput);
      setMessage({ type: 'success', text: `Unlocked "${response.skill}" (+${response.xp_awarded} XP)` });
      setTokenInput('');
      loadSkills(selectedTree.id);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Token validation failed' });
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !selectedSkill) return;
    setIsUploading(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await submissionService.upload(selectedSkill.id, uploadFile, uploadNote);
      setMessage({ type: 'success', text: `Evidence submitted for "${response.skill_name}". Awaiting review.` });
      setUploadFile(null);
      setUploadNote('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadSkills(selectedTree.id);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Upload failed' });
    } finally {
      setIsUploading(false);
    }
  };

  const showTokenInput = selectedSkill && !selectedSkill.completed &&
    (selectedSkill.completion_type === 'token' || selectedSkill.completion_type === 'both');
  const showUploadForm = selectedSkill && !selectedSkill.completed &&
    (selectedSkill.completion_type === 'upload' || selectedSkill.completion_type === 'both') &&
    selectedSkill.submission_status !== 'pending';
  const isPending = selectedSkill && selectedSkill.submission_status === 'pending';
  const isRejected = selectedSkill && selectedSkill.submission_status === 'rejected' && !selectedSkill.completed;

  const completedCount = skills.filter(s => s.completed).length;
  const totalXP = skills.filter(s => s.completed).reduce((sum, s) => sum + s.xp, 0);

  return (
    <div className="min-h-screen bg-cyber-bg cyber-grid-bg">
      <Header />

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tree selector + stats bar */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-2">
            {trees.map(tree => (
              <button
                key={tree.id}
                onClick={() => setSelectedTree(tree)}
                className={`px-5 py-2.5 rounded-lg font-display text-xs font-bold tracking-wider transition-all duration-300 ${
                  selectedTree?.id === tree.id
                    ? 'cyber-button'
                    : 'bg-white/3 text-white/50 border border-white/10 hover:border-cyber-accent/40 hover:text-cyber-accent'
                }`}
              >
                {tree.name.toUpperCase()}
              </button>
            ))}
          </div>

          {selectedTree && (
            <div className="flex items-center gap-6 text-xs font-mono text-white/40">
              <span>Skills: <span className="text-cyber-accent">{completedCount}</span>/{skills.length}</span>
              <span>Tree XP: <span className="text-cyber-success">{totalXP}</span></span>
            </div>
          )}
        </div>

        <div className="flex gap-6">
          {/* Skill tree */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-[620px] rounded-xl cyber-border" style={{background: 'radial-gradient(ellipse, #0d1230, #080c24)'}}>
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-cyber-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm font-mono text-white/30">Loading constellation...</p>
                </div>
              </div>
            ) : (
              <div className="h-[620px]">
                <SkillTree skills={skills} onSkillClick={handleSkillClick} />
              </div>
            )}
          </div>

          {/* Side panel */}
          <div className="w-80 space-y-4">
            {/* Token submission */}
            <div className="cyber-card rounded-xl p-5">
              <h2 className="text-xs font-display font-bold tracking-widest text-cyber-accent/80 mb-4">
                TOKEN SUBMISSION
              </h2>

              {message.text && (
                <div className={`mb-4 p-3 rounded-lg text-sm font-body ${
                  message.type === 'success'
                    ? 'bg-cyber-success/10 border border-cyber-success/30 text-cyber-success'
                    : 'bg-cyber-danger/10 border border-cyber-danger/30 text-cyber-danger'
                }`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleTokenSubmit}>
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Enter token code..."
                  className="cyber-input mb-3 text-sm"
                />
                <button type="submit" className="w-full py-2.5 cyber-button rounded-lg text-xs">
                  VALIDATE
                </button>
              </form>
            </div>

            {/* Skill detail */}
            {selectedSkill && (
              <div className="cyber-card rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-sm font-display font-bold text-white/90 leading-tight pr-2">
                    {selectedSkill.name}
                  </h2>
                  <span className={`shrink-0 text-[10px] font-display font-bold px-2.5 py-1 rounded-full ${
                    selectedSkill.completed
                      ? 'bg-cyber-success/20 text-cyber-success border border-cyber-success/30'
                      : isPending
                        ? 'bg-cyber-warning/20 text-cyber-warning border border-cyber-warning/30'
                        : 'bg-white/5 text-white/40 border border-white/10'
                  }`}>
                    {selectedSkill.completed ? 'DONE' : isPending ? 'REVIEW' : 'LOCKED'}
                  </span>
                </div>

                <div className="flex gap-2 mb-3">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-secondary/15 text-cyber-secondary border border-cyber-secondary/20">
                    LVL {selectedSkill.level}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-warning/15 text-cyber-warning border border-cyber-warning/20">
                    {selectedSkill.xp} XP
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded tag-${selectedSkill.completion_type}`}>
                    {selectedSkill.completion_type}
                  </span>
                </div>

                <p className="text-sm font-body text-white/50 mb-4 leading-relaxed">{selectedSkill.description}</p>

                {selectedSkill.dependencies?.length > 0 && (
                  <div className="mb-4 p-3 rounded-lg bg-white/3 border border-white/5">
                    <p className="text-[10px] font-display tracking-widest text-white/30 mb-2 uppercase">Prerequisites</p>
                    {selectedSkill.dependencies.map(depId => {
                      const dep = skills.find(s => s.id === depId);
                      return dep ? (
                        <div key={depId} className="flex items-center gap-2 text-sm font-body">
                          <span className={`w-2 h-2 rounded-full ${dep.completed ? 'bg-cyber-success' : 'bg-white/20'}`} />
                          <span className={dep.completed ? 'text-white/60' : 'text-white/30'}>{dep.name}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}

                {isPending && (
                  <div className="p-3 rounded-lg bg-cyber-warning/8 border border-cyber-warning/20">
                    <p className="text-xs font-display font-bold text-cyber-warning tracking-wide">AWAITING REVIEW</p>
                    <p className="text-[11px] font-body text-white/40 mt-1">Your evidence has been submitted.</p>
                  </div>
                )}

                {isRejected && (
                  <div className="p-3 rounded-lg bg-cyber-danger/8 border border-cyber-danger/20 mb-3">
                    <p className="text-xs font-display font-bold text-cyber-danger tracking-wide">REJECTED</p>
                    {selectedSkill.submission_feedback && (
                      <p className="text-[11px] font-body text-white/50 mt-1 italic">"{selectedSkill.submission_feedback}"</p>
                    )}
                    <p className="text-[11px] font-body text-white/30 mt-1">Resubmit below.</p>
                  </div>
                )}

                {showUploadForm && (
                  <div className="pt-3 border-t border-white/5">
                    <p className="text-[10px] font-display tracking-widest text-cyber-secondary/60 mb-3 uppercase">Upload Evidence</p>
                    <form onSubmit={handleFileUpload}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,text/*,.pdf"
                        onChange={(e) => setUploadFile(e.target.files[0])}
                        className="w-full text-xs text-white/40 mb-2 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-display file:font-bold file:bg-cyber-secondary/20 file:text-cyber-secondary file:cursor-pointer hover:file:bg-cyber-secondary/30"
                      />
                      <textarea
                        value={uploadNote}
                        onChange={(e) => setUploadNote(e.target.value)}
                        placeholder="Optional note..."
                        rows="2"
                        className="cyber-input text-xs mb-2"
                      />
                      <button
                        type="submit"
                        disabled={!uploadFile || isUploading}
                        className="w-full py-2 rounded-lg text-xs font-display font-bold tracking-wider bg-cyber-secondary/20 text-cyber-secondary border border-cyber-secondary/30 hover:bg-cyber-secondary/30 transition-all disabled:opacity-30"
                      >
                        {isUploading ? 'UPLOADING...' : 'SUBMIT EVIDENCE'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* Legend */}
            <div className="cyber-card rounded-xl p-4">
              <p className="text-[10px] font-display tracking-widest text-white/20 mb-3 uppercase">Legend</p>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[11px] font-body text-white/40">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#2a2f52]" /> Locked</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-cyber-accent" /> Available</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-cyber-warning" /> Pending</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-cyber-success" /> Completed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
