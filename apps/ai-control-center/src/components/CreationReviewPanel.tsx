import React, { useState, useEffect } from 'react';
import { 
  fetchAudioFiles, 
  fetchCosmeticSets, 
  generateAudio, 
  generateCosmetic,
  approveAudio,
  rejectAudio,
  approveCosmetic,
  rejectCosmetic,
  fetchPricingSchema
} from '../services/api';
import './CreationReviewPanel.css';

// Get the backend URL for image loading
const API_BASE = import.meta.env.VITE_BACKEND_BASE || 'https://all-in-chat-poker.fly.dev';

interface AudioFile {
  id: string;
  name: string;
  type: string;
  mood?: string;
  effectType?: string;
  duration: string;
  size: string;
  createdAt: string;
  url: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  price: {
    basePrice: number;
    licenseType: string;
    usageFee: number;
    totalValue: number;
  };
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  qualityScore?: number;
}

interface CosmeticSet {
  id: string;
  name: string;
  theme: string;
  type: string;
  description: string;
  createdAt: string;
  preview: string;
  assets: any;
  style: string;
  palette: string[];
  approvalStatus: 'pending' | 'approved' | 'rejected';
  price: {
    basePrice: number;
    licenseType: string;
    usageFee: number;
    totalValue: number;
  };
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  qualityScore?: number;
  rarity?: string;
  demand?: string;
}

export default function CreationReviewPanel() {
  const [activeTab, setActiveTab] = useState<'audio' | 'cosmetics'>('audio');
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [cosmeticSets, setCosmeticSets] = useState<CosmeticSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pricingSchema, setPricingSchema] = useState<any>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalItem, setApprovalItem] = useState<any>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [priceAdjustment, setPriceAdjustment] = useState(0);
  
  // Audio generation form
  const [audioForm, setAudioForm] = useState({
    type: 'background_music',
    mood: 'energetic',
    duration: '2:00',
    effectType: 'chip_stack',
    description: ''
  });
  
  // Cosmetic generation form
  const [cosmeticForm, setCosmeticForm] = useState({
    prompt: '',
    preset: 'neon',
    cosmeticTypes: ['cardBack'],
    style: 'detailed',
    palette: ['#FF00FF', '#00FFFF', '#FFFF00']
  });

  useEffect(() => {
    loadData();
    loadPricingSchema();
  }, [activeTab]);

  const loadPricingSchema = async () => {
    try {
      const schema = await fetchPricingSchema();
      if (schema.success) {
        setPricingSchema(schema.data);
      }
    } catch (err) {
      console.error('Failed to load pricing schema:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (activeTab === 'audio') {
        const audioData = await fetchAudioFiles();
        if (audioData.success) {
          setAudioFiles(audioData.data.files);
        }
      } else {
        const cosmeticData = await fetchCosmeticSets();
        if (cosmeticData.success) {
          setCosmeticSets(cosmeticData.data.sets);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAudio = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const result = await generateAudio(audioForm);
      if (result.success) {
        // Refresh the audio list
        await loadData();
        // Reset form
        setAudioForm({
          type: 'background_music',
          mood: 'energetic',
          duration: '2:00',
          effectType: 'chip_stack',
          description: ''
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate audio');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCosmetic = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const result = await generateCosmetic(cosmeticForm);
      if (result.success) {
        // Refresh the cosmetics list
        await loadData();
        // Reset form
        setCosmeticForm({
          prompt: '',
          preset: 'neon',
          cosmeticTypes: ['cardBack'],
          style: 'detailed',
          palette: ['#FF00FF', '#00FFFF', '#FFFF00']
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate cosmetic');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAudio = async (audioId: string) => {
    try {
      const result = await approveAudio(audioId, 'admin', approvalNotes);
      if (result.success) {
        await loadData();
        setShowApprovalModal(false);
        setApprovalNotes('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve audio');
    }
  };

  const handleRejectAudio = async (audioId: string) => {
    try {
      const result = await rejectAudio(audioId, 'admin', approvalNotes);
      if (result.success) {
        await loadData();
        setShowApprovalModal(false);
        setApprovalNotes('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject audio');
    }
  };

  const handleApproveCosmetic = async (cosmeticId: string) => {
    try {
      const result = await approveCosmetic(cosmeticId, 'admin', approvalNotes, priceAdjustment);
      if (result.success) {
        await loadData();
        setShowApprovalModal(false);
        setApprovalNotes('');
        setPriceAdjustment(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve cosmetic');
    }
  };

  const handleRejectCosmetic = async (cosmeticId: string) => {
    try {
      const result = await rejectCosmetic(cosmeticId, 'admin', approvalNotes);
      if (result.success) {
        await loadData();
        setShowApprovalModal(false);
        setApprovalNotes('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject cosmetic');
    }
  };

  const openApprovalModal = (item: any, action: 'approve' | 'reject') => {
    setApprovalItem(item);
    setApprovalAction(action);
    setShowApprovalModal(true);
  };

  const handleApprovalSubmit = () => {
    if (!approvalItem) return;
    
    if (activeTab === 'audio') {
      if (approvalAction === 'approve') {
        handleApproveAudio(approvalItem.id);
      } else {
        handleRejectAudio(approvalItem.id);
      }
    } else {
      if (approvalAction === 'approve') {
        handleApproveCosmetic(approvalItem.id);
      } else {
        handleRejectCosmetic(approvalItem.id);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#00ff88';
      case 'pending': return '#ffaa00';
      case 'rejected': return '#ff4444';
      default: return '#888';
    }
  };

  const getApprovalBadge = (status: string) => {
    switch (status) {
      case 'approved': return '✅ Approved';
      case 'pending': return '⏳ Pending';
      case 'rejected': return '❌ Rejected';
      default: return status;
    }
  };

  return (
    <div className="creation-review-panel">
      <header className="panel-header">
        <h1>AI Creation Studio</h1>
        <div className="tab-nav">
          <button 
            className={`tab-btn ${activeTab === 'audio' ? 'active' : ''}`}
            onClick={() => setActiveTab('audio')}
          >
            🎵 Audio Files
          </button>
          <button 
            className={`tab-btn ${activeTab === 'cosmetics' ? 'active' : ''}`}
            onClick={() => setActiveTab('cosmetics')}
          >
            🎨 Cosmetics
          </button>
        </div>
      </header>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="panel-content">
        {activeTab === 'audio' ? (
          <div className="audio-section">
            {/* Audio Generation Form */}
            <section className="generation-form">
              <h2>Generate New Audio</h2>
              <form onSubmit={handleGenerateAudio} className="form-grid">
                <div className="form-group">
                  <label>Type:</label>
                  <select 
                    value={audioForm.type} 
                    onChange={(e) => setAudioForm({...audioForm, type: e.target.value})}
                  >
                    <option value="background_music">Background Music</option>
                    <option value="game_sound">Game Sound</option>
                    <option value="voice_line">Voice Line</option>
                    <option value="ambient_soundscape">Ambient Soundscape</option>
                  </select>
                </div>
                
                {audioForm.type === 'background_music' && (
                  <div className="form-group">
                    <label>Mood:</label>
                    <select 
                      value={audioForm.mood} 
                      onChange={(e) => setAudioForm({...audioForm, mood: e.target.value})}
                    >
                      <option value="energetic">Energetic</option>
                      <option value="relaxed">Relaxed</option>
                      <option value="tense">Tense</option>
                      <option value="celebratory">Celebratory</option>
                    </select>
                  </div>
                )}
                
                {audioForm.type === 'game_sound' && (
                  <div className="form-group">
                    <label>Effect Type:</label>
                    <select 
                      value={audioForm.effectType} 
                      onChange={(e) => setAudioForm({...audioForm, effectType: e.target.value})}
                    >
                      <option value="chip_stack">Chip Stack</option>
                      <option value="card_flip">Card Flip</option>
                      <option value="victory">Victory</option>
                      <option value="bet">Bet</option>
                    </select>
                  </div>
                )}
                
                <div className="form-group">
                  <label>Duration:</label>
                  <input 
                    type="text" 
                    value={audioForm.duration}
                    onChange={(e) => setAudioForm({...audioForm, duration: e.target.value})}
                    placeholder="2:00"
                  />
                </div>
                
                <button type="submit" className="primary-btn" disabled={loading}>
                  {loading ? 'Generating...' : '🎵 Generate Audio'}
                </button>
              </form>
            </section>

            {/* Audio Files List */}
            <section className="files-list">
              <h2>Generated Audio Files ({audioFiles.length})</h2>
              {loading ? (
                <div className="loading">Loading...</div>
              ) : (
                <div className="audio-grid">
                  {audioFiles.map((file) => (
                    <div key={file.id} className="audio-item">
                      <div className="audio-info">
                        <div className="item-header">
                          <h3>{file.name}</h3>
                          <span 
                            className="approval-badge" 
                            style={{ color: getStatusColor(file.approvalStatus) }}
                          >
                            {getApprovalBadge(file.approvalStatus)}
                          </span>
                        </div>
                        <p>Type: {file.type}</p>
                        <p>Mood: {file.mood || file.effectType}</p>
                        <p>Duration: {file.duration}</p>
                        <p>Size: {file.size}</p>
                        <p>Created: {new Date(file.createdAt).toLocaleDateString()}</p>
                        
                        {/* Pricing Information */}
                        <div className="pricing-info">
                          <h4>💰 Pricing</h4>
                          <p>Base: ${file.price.basePrice.toFixed(2)}</p>
                          <p>License: {file.price.licenseType}</p>
                          <p>Usage Fee: ${file.price.usageFee.toFixed(2)}</p>
                          <p><strong>Total Value: ${file.price.totalValue.toFixed(2)}</strong></p>
                        </div>
                        
                        {/* Quality Score */}
                        {file.qualityScore && (
                          <div className="quality-score">
                            <p>⭐ Quality: {file.qualityScore.toFixed(1)}/10</p>
                          </div>
                        )}
                        
                        {/* Approval Info */}
                        {file.approvedBy && (
                          <p className="approval-info">
                            ✅ Approved by {file.approvedBy} on {new Date(file.approvedAt!).toLocaleDateString()}
                          </p>
                        )}
                        
                        {file.rejectedBy && (
                          <div className="rejection-info">
                            <p>❌ Rejected by {file.rejectedBy}</p>
                            <p>Reason: {file.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                      <div className="audio-controls">
                        <audio 
                          controls
                          onError={(e) => {
                            const target = e.target as HTMLAudioElement;
                            console.log('Audio loading error for:', file.url);
                            // Hide the audio element and show a placeholder
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              // Create a placeholder div
                              const placeholder = document.createElement('div');
                              placeholder.className = 'audio-placeholder';
                              placeholder.innerHTML = `
                                <div style="padding: 1rem; background: #2a2a2a; border-radius: 6px; text-align: center; color: #888;">
                                  <div style="font-size: 2rem; margin-bottom: 0.5rem;">🎵</div>
                                  <div style="font-size: 0.9rem;">Audio Preview Unavailable</div>
                                  <div style="font-size: 0.8rem; margin-top: 0.5rem;">${file.name}</div>
                                </div>
                              `;
                              parent.insertBefore(placeholder, target);
                            }
                          }}
                        >
                          <source src={`${API_BASE}${file.url}`} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                        <div className="action-buttons">
                          {file.approvalStatus === 'pending' && (
                            <>
                              <button 
                                className="approve-btn" 
                                onClick={() => openApprovalModal(file, 'approve')}
                              >
                                ✅ Approve
                              </button>
                              <button 
                                className="reject-btn" 
                                onClick={() => openApprovalModal(file, 'reject')}
                              >
                                ❌ Reject
                              </button>
                            </>
                          )}
                          <button className="ghost-btn">🗑️ Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="cosmetics-section">
            {/* Cosmetic Generation Form */}
            <section className="generation-form">
              <h2>Generate New Cosmetic</h2>
              <form onSubmit={handleGenerateCosmetic} className="form-grid">
                <div className="form-group">
                  <label>Prompt:</label>
                  <input 
                    type="text" 
                    value={cosmeticForm.prompt}
                    onChange={(e) => setCosmeticForm({...cosmeticForm, prompt: e.target.value})}
                    placeholder="Describe your cosmetic theme..."
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Preset:</label>
                  <select 
                    value={cosmeticForm.preset} 
                    onChange={(e) => setCosmeticForm({...cosmeticForm, preset: e.target.value})}
                  >
                    <option value="neon">Neon</option>
                    <option value="luxury">Luxury</option>
                    <option value="cyberpunk">Cyberpunk</option>
                    <option value="nature">Nature</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Type:</label>
                  <select 
                    value={cosmeticForm.cosmeticTypes[0]} 
                    onChange={(e) => setCosmeticForm({...cosmeticForm, cosmeticTypes: [e.target.value]})}
                  >
                    <option value="cardBack">Card Back</option>
                    <option value="table">Table</option>
                    <option value="chips">Chips</option>
                    <option value="fullSet">Full Set</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Style:</label>
                  <select 
                    value={cosmeticForm.style} 
                    onChange={(e) => setCosmeticForm({...cosmeticForm, style: e.target.value})}
                  >
                    <option value="detailed">Detailed</option>
                    <option value="minimalist">Minimalist</option>
                    <option value="realistic">Realistic</option>
                    <option value="cartoon">Cartoon</option>
                  </select>
                </div>
                
                <button type="submit" className="primary-btn" disabled={loading}>
                  {loading ? 'Generating...' : '🎨 Generate Cosmetic'}
                </button>
              </form>
            </section>

            {/* Cosmetics List */}
            <section className="files-list">
              <h2>Generated Cosmetics ({cosmeticSets.length})</h2>
              {loading ? (
                <div className="loading">Loading...</div>
              ) : (
                <div className="cosmetics-grid">
                  {cosmeticSets.map((set) => (
                    <div key={set.id} className="cosmetic-item">
                      <div className="cosmetic-preview">
                        <img 
                          src={`${API_BASE}${set.preview}`}
                          alt={set.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `${API_BASE}/assets/placeholder.png`;
                          }}
                        />
                      </div>
                      <div className="cosmetic-info">
                        <h3>{set.name}</h3>
                        <p>Theme: {set.theme}</p>
                        <p>Type: {set.type}</p>
                        <p>Style: {set.style}</p>
                        <p>{set.description}</p>
                        <div className="palette">
                          {set.palette.map((color, i) => (
                            <div key={i} className="color-swatch" style={{backgroundColor: color}} />
                          ))}
                        </div>
                        <p>Created: {new Date(set.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="cosmetic-actions">
                        <button className="primary-btn">👁️ Preview</button>
                        <button className="ghost-btn">🗑️ Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && approvalItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>
              {approvalAction === 'approve' ? '✅ Approve' : '❌ Reject'} {activeTab === 'audio' ? 'Audio' : 'Cosmetic'}
            </h2>
            <div className="modal-item-info">
              <h3>{approvalItem.name}</h3>
              <p>{approvalItem.description || approvalItem.type}</p>
              {approvalItem.price && (
                <div className="modal-pricing">
                  <p><strong>Base Price:</strong> ${approvalItem.price.basePrice.toFixed(2)}</p>
                  <p><strong>Total Value:</strong> ${approvalItem.price.totalValue.toFixed(2)}</p>
                </div>
              )}
            </div>
            
            <div className="modal-form">
              <div className="form-group">
                <label>
                  {approvalAction === 'approve' ? 'Approval Notes:' : 'Rejection Reason:'}
                </label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder={approvalAction === 'approve' ? 'Add any approval notes...' : 'Provide a reason for rejection...'}
                  rows={3}
                />
              </div>
              
              {approvalAction === 'approve' && activeTab === 'cosmetics' && (
                <div className="form-group">
                  <label>Price Adjustment ($):</label>
                  <input
                    type="number"
                    value={priceAdjustment}
                    onChange={(e) => setPriceAdjustment(Number(e.target.value))}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              )}
            </div>
            
            <div className="modal-actions">
              <button 
                className="ghost-btn" 
                onClick={() => {
                  setShowApprovalModal(false);
                  setApprovalNotes('');
                  setPriceAdjustment(0);
                }}
              >
                Cancel
              </button>
              <button 
                className={`${approvalAction === 'approve' ? 'primary-btn' : 'reject-btn'}`}
                onClick={handleApprovalSubmit}
                disabled={loading || !approvalNotes.trim()}
              >
                {loading ? 'Processing...' : `${approvalAction === 'approve' ? '✅ Approve' : '❌ Reject'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
