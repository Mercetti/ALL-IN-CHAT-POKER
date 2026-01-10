import React, { useState, useEffect } from 'react';
import { fetchAudioFiles, fetchCosmeticSets, generateAudio, generateCosmetic } from '../services/api';
import './CreationReviewPanel.css';

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
}

export default function CreationReviewPanel() {
  const [activeTab, setActiveTab] = useState<'audio' | 'cosmetics'>('audio');
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [cosmeticSets, setCosmeticSets] = useState<CosmeticSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
  }, [activeTab]);

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
                        <h3>{file.name}</h3>
                        <p>Type: {file.type}</p>
                        <p>Mood: {file.mood || file.effectType}</p>
                        <p>Duration: {file.duration}</p>
                        <p>Size: {file.size}</p>
                        <p>Created: {new Date(file.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="audio-controls">
                        <audio controls>
                          <source src={file.url} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                        <button className="ghost-btn">🗑️ Delete</button>
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
                        <img src={set.preview} alt={set.name} />
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
    </div>
  );
}
