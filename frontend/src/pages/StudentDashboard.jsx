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
      if (selectedSkill) {
        const updated = data.find(s => s.id === selectedSkill.id);
        if (updated) setSelectedSkill(updated);
      }
    } catch (error) {
      console.error('Error loading skills:', error);
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

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !selectedSkill) return;

    setIsUploading(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await submissionService.upload(selectedSkill.id, uploadFile, uploadNote);
      setMessage({
        type: 'success',
        text: `Evidence submitted for "${response.skill_name}". Awaiting instructor review.`
      });
      setUploadFile(null);
      setUploadNote('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadSkills(selectedTree.id);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Upload failed'
      });
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
            {/* Token submission box - always visible for quick token entry */}
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

                <div className="mb-3 flex flex-wrap gap-2">
                  <span className={`inline-block px-3 py-1 rounded text-sm font-bold ${
                    selectedSkill.completed
                      ? 'bg-cyber-success text-cyber-bg'
                      : isPending
                        ? 'bg-cyber-warning text-cyber-bg'
                        : 'bg-cyber-card border border-cyber-accent text-cyber-accent'
                  }`}>
                    {selectedSkill.completed ? 'COMPLETED' : isPending ? 'PENDING REVIEW' : 'LOCKED'}
                  </span>
                  <span className="inline-block px-3 py-1 rounded text-sm font-bold bg-cyber-secondary text-white">
                    LEVEL {selectedSkill.level}
                  </span>
                  <span className="inline-block px-3 py-1 rounded text-xs font-bold bg-cyber-bg border border-gray-600 text-gray-400 uppercase">
                    {selectedSkill.completion_type}
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
                            {depSkill.name} {depSkill.completed ? '✓' : '✗'}
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>

                {/* Pending submission notice */}
                {isPending && (
                  <div className="mt-4 p-3 bg-yellow-900/30 border border-cyber-warning rounded">
                    <p className="text-cyber-warning font-bold text-sm">AWAITING INSTRUCTOR REVIEW</p>
                    <p className="text-gray-400 text-xs mt-1">Your evidence has been submitted. XP will be awarded once approved.</p>
                  </div>
                )}

                {/* Rejected submission notice */}
                {isRejected && (
                  <div className="mt-4 p-3 bg-red-900/30 border border-red-500 rounded">
                    <p className="text-red-400 font-bold text-sm">SUBMISSION REJECTED</p>
                    {selectedSkill.submission_feedback && (
                      <p className="text-gray-300 text-xs mt-1">
                        Feedback: {selectedSkill.submission_feedback}
                      </p>
                    )}
                    <p className="text-gray-400 text-xs mt-1">You may resubmit evidence below.</p>
                  </div>
                )}

                {/* File upload form for upload/both type skills */}
                {showUploadForm && (
                  <div className="mt-4 border-t border-cyber-accent pt-4">
                    <p className="text-sm text-cyber-accent font-bold mb-3">UPLOAD EVIDENCE</p>
                    <form onSubmit={handleFileUpload}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,text/*,.pdf"
                        onChange={(e) => setUploadFile(e.target.files[0])}
                        className="w-full text-sm text-gray-400 mb-2 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-bold file:bg-cyber-accent file:text-cyber-bg hover:file:bg-cyan-400"
                      />
                      <textarea
                        value={uploadNote}
                        onChange={(e) => setUploadNote(e.target.value)}
                        placeholder="Optional note..."
                        rows="2"
                        className="w-full px-3 py-2 bg-cyber-bg border border-cyber-accent rounded text-white text-sm mb-2"
                      />
                      <button
                        type="submit"
                        disabled={!uploadFile || isUploading}
                        className="w-full py-2 cyber-button rounded font-bold text-sm disabled:opacity-50"
                      >
                        {isUploading ? 'UPLOADING...' : 'SUBMIT EVIDENCE'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
