/**
 * Table Theme Component
 * Advanced table theme system with custom themes and effects
 */

import React, { useState, useEffect } from 'react';
import './TableTheme.css';

const TableTheme = ({
  currentTheme = 'classic',
  onThemeChange,
  customThemes = [],
  showPreview = true,
  showControls = true,
  animated = true,
  className = '',
  style = {}
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [hoveredTheme, setHoveredTheme] = useState(null);

  const defaultThemes = [
    {
      id: 'classic',
      name: 'Classic',
      description: 'Traditional green felt table',
      background: 'radial-gradient(ellipse at center, #2a5434 0%, #1a3420 100%)',
      border: '#8b4513',
      shadow: 'inset 0 0 50px rgba(0, 0, 0, 0.3), 0 10px 30px rgba(0, 0, 0, 0.2)',
      playerSeat: '#4a5568',
      communityArea: 'rgba(0, 0, 0, 0.2)',
      pot: 'rgba(0, 0, 0, 0.8)',
      accent: '#ffd700'
    },
    {
      id: 'modern',
      name: 'Modern',
      description: 'Sleek blue contemporary design',
      background: 'radial-gradient(ellipse at center, #1a365d 0%, #0f172a 100%)',
      border: '#2563eb',
      shadow: 'inset 0 0 60px rgba(0, 0, 0, 0.4), 0 15px 40px rgba(0, 0, 0, 0.3)',
      playerSeat: '#374151',
      communityArea: 'rgba(37, 99, 235, 0.1)',
      pot: 'rgba(0, 0, 0, 0.8)',
      accent: '#60a5fa'
    },
    {
      id: 'luxury',
      name: 'Luxury',
      description: 'Premium gold and brown theme',
      background: 'radial-gradient(ellipse at center, #744210 0%, #451a03 100%)',
      border: '#d97706',
      shadow: 'inset 0 0 70px rgba(0, 0, 0, 0.5), 0 20px 50px rgba(0, 0, 0, 0.4)',
      playerSeat: '#92400e',
      communityArea: 'rgba(217, 119, 6, 0.1)',
      pot: 'rgba(0, 0, 0, 0.8)',
      accent: '#fbbf24'
    },
    {
      id: 'neon',
      name: 'Neon',
      description: 'Cyberpunk neon glow effects',
      background: 'radial-gradient(ellipse at center, #1e293b 0%, #0f172a 100%)',
      border: '#00ff88',
      shadow: 'inset 0 0 80px rgba(0, 255, 136, 0.3), 0 25px 60px rgba(0, 0, 0, 0.5)',
      playerSeat: '#334155',
      communityArea: 'rgba(0, 255, 136, 0.05)',
      pot: 'rgba(0, 0, 0, 0.8)',
      accent: '#00ff88'
    },
    {
      id: 'minimal',
      name: 'Minimal',
      description: 'Clean and simple design',
      background: 'radial-gradient(ellipse at center, #f8fafc 0%, #e2e8f0 100%)',
      border: '#cbd5e0',
      shadow: 'inset 0 0 30px rgba(0, 0, 0, 0.1), 0 5px 20px rgba(0, 0, 0, 0.1)',
      playerSeat: '#e2e8f0',
      communityArea: 'rgba(203, 213, 224, 0.3)',
      pot: 'rgba(0, 0, 0, 0.8)',
      accent: '#64748b'
    }
  ];

  const allThemes = [...defaultThemes, ...customThemes];
  const selectedTheme = allThemes.find(theme => theme.id === currentTheme) || defaultThemes[0];

  useEffect(() => {
    if (animated && !isAnimating) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [currentTheme, animated, isAnimating]);

  const handleThemeChange = (themeId) => {
    if (onThemeChange) {
      onThemeChange(themeId);
    }
  };

  const getThemeClasses = () => {
    const classes = [
      'table-theme',
      animated && 'table-theme--animated',
      isAnimating && 'table-theme--animating',
      className
    ].filter(Boolean).join(' ');

    return classes;
  };

  const renderThemePreview = (theme) => {
    return (
      <div
        className="table-theme__preview"
        style={{
          background: theme.background,
          border: `2px solid ${theme.border}`,
          boxShadow: theme.shadow,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Mini table surface */}
        <div className="table-theme__preview-surface">
          {/* Community cards area */}
          <div 
            className="table-theme__preview-community"
            style={{ background: theme.communityArea }}
          />
          
          {/* Player seats */}
          <div
            className="table-theme__preview-seat table-theme__preview-seat--1"
            style={{ background: theme.playerSeat }}
          />
          <div
            className="table-theme__preview-seat table-theme__preview-seat--2"
            style={{ background: theme.playerSeat }}
          />
          <div
            className="table-theme__preview-seat table-theme__preview-seat--3"
            style={{ background: theme.playerSeat }}
          />
          
          {/* Center logo */}
          <div 
            className="table-theme__preview-logo"
            style={{ color: theme.accent }}
          >
            ♠
          </div>
        </div>
        
        {/* Hover overlay */}
        {hoveredTheme === theme.id && (
          <div className="table-theme__preview-overlay" />
        )}
        
        {/* Active indicator */}
        {currentTheme === theme.id && (
          <div className="table-theme__preview-active" />
        )}
      </div>
    );
  };

  const renderThemeControls = () => {
    if (!showControls) return null;

    return (
      <div className="table-theme__controls">
        <div className="table-theme__control-group">
          <label className="table-theme__control-label">
            Animation Speed
          </label>
          <select 
            className="table-theme__control-select"
            value={animated ? 'enabled' : 'disabled'}
            onChange={(e) => {
              // This would typically be handled by parent component
              console.log('Animation speed changed:', e.target.value);
            }}
          >
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
        
        <div className="table-theme__control-group">
          <label className="table-theme__control-label">
            Preview Size
          </label>
          <select 
            className="table-theme__control-select"
            defaultValue="medium"
            onChange={(e) => {
              console.log('Preview size changed:', e.target.value);
            }}
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
      </div>
    );
  };

  return (
    <div className={getThemeClasses()} style={style}>
      {/* Current theme info */}
      <div className="table-theme__current">
        <div className="table-theme__current-info">
          <h3 className="table-theme__current-name">
            {selectedTheme.name}
          </h3>
          <p className="table-theme__current-description">
            {selectedTheme.description}
          </p>
        </div>
        
        {showPreview && (
          <div className="table-theme__current-preview">
            {renderThemePreview(selectedTheme)}
          </div>
        )}
      </div>
      
      {/* Theme grid */}
      <div className="table-theme__grid">
        {allThemes.map(theme => (
          <div
            key={theme.id}
            className={`table-theme__option ${currentTheme === theme.id ? 'table-theme__option--active' : ''} ${hoveredTheme === theme.id ? 'table-theme__option--hovered' : ''}`}
            onClick={() => handleThemeChange(theme.id)}
            onMouseEnter={() => setHoveredTheme(theme.id)}
            onMouseLeave={() => setHoveredTheme(null)}
          >
            {showPreview && renderThemePreview(theme)}
            
            <div className="table-theme__option-info">
              <h4 className="table-theme__option-name">
                {theme.name}
              </h4>
              <p className="table-theme__option-description">
                {theme.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Theme controls */}
      {renderThemeControls()}
      
      {/* Custom theme creator */}
      {customThemes.length > 0 && (
        <div className="table-theme__custom">
          <h3 className="table-theme__custom-title">
            Custom Themes
          </h3>
          <div className="table-theme__custom-grid">
            {customThemes.map(theme => (
              <div
                key={theme.id}
                className={`table-theme__option ${currentTheme === theme.id ? 'table-theme__option--active' : ''}`}
                onClick={() => handleThemeChange(theme.id)}
              >
                {showPreview && renderThemePreview(theme)}
                
                <div className="table-theme__option-info">
                  <h4 className="table-theme__option-name">
                    {theme.name}
                  </h4>
                  <p className="table-theme__option-description">
                    {theme.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Theme customizer component
export const ThemeCustomizer = ({
  onThemeCreate,
  onThemeUpdate,
  onThemeDelete,
  className = '',
  style = {}
}) => {
  const [customTheme, setCustomTheme] = useState({
    id: '',
    name: '',
    description: '',
    background: 'radial-gradient(ellipse at center, #2a5434 0%, #1a3420 100%)',
    border: '#8b4513',
    shadow: 'inset 0 0 50px rgba(0, 0, 0, 0.3), 0 10px 30px rgba(0, 0, 0, 0.2)',
    playerSeat: '#4a5568',
    communityArea: 'rgba(0, 0, 0, 0.2)',
    pot: 'rgba(0, 0, 0, 0.8)',
    accent: '#ffd700'
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleInputChange = (field, value) => {
    setCustomTheme(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    if (!customTheme.name.trim()) {
      alert('Please enter a theme name');
      return;
    }

    const themeToSave = {
      ...customTheme,
      id: customTheme.id || `custom-${Date.now()}`,
      name: customTheme.name.trim(),
      description: customTheme.description.trim()
    };

    if (isEditing && onThemeUpdate) {
      onThemeUpdate(themeToSave);
    } else if (onThemeCreate) {
      onThemeCreate(themeToSave);
    }

    // Reset form
    setCustomTheme({
      id: '',
      name: '',
      description: '',
      background: 'radial-gradient(ellipse at center, #2a5434 0%, #1a3420 100%)',
      border: '#8b4513',
      shadow: 'inset 0 0 50px rgba(0, 0, 0, 0.3), 0 10px 30px rgba(0, 0, 0, 0.2)',
      playerSeat: '#4a5568',
      communityArea: 'rgba(0, 0, 0, 0.2)',
      pot: 'rgba(0, 0, 0, 0.8)',
      accent: '#ffd700'
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setCustomTheme({
      id: '',
      name: '',
      description: '',
      background: 'radial-gradient(ellipse at center, #2a5434 0%, #1a3420 100%)',
      border: '#8b4513',
      shadow: 'inset 0 0 50px rgba(0, 0, 0, 0.3), 0 10px 30px rgba(0, 0, 0, 0.2)',
      playerSeat: '#4a5568',
      communityArea: 'rgba(0, 0, 0, 0.2)',
      pot: 'rgba(0, 0, 0, 0.8)',
      accent: '#ffd700'
    });
    setIsEditing(false);
  };

  return (
    <div className={`theme-customizer ${className}`} style={style}>
      <h3 className="theme-customizer__title">
        {isEditing ? 'Edit Theme' : 'Create Custom Theme'}
      </h3>
      
      <div className="theme-customizer__form">
        <div className="theme-customizer__field">
          <label className="theme-customizer__label">
            Theme Name
          </label>
          <input
            type="text"
            className="theme-customizer__input"
            value={customTheme.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter theme name"
          />
        </div>
        
        <div className="theme-customizer__field">
          <label className="theme-customizer__label">
            Description
          </label>
          <textarea
            className="theme-customizer__textarea"
            value={customTheme.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Enter theme description"
            rows={2}
          />
        </div>
        
        {/* Color inputs */}
        <div className="theme-customizer__colors">
          <div className="theme-customizer__field">
            <label className="theme-customizer__label">
              Border Color
            </label>
            <input
              type="color"
              className="theme-customizer__color-input"
              value={customTheme.border}
              onChange={(e) => handleInputChange('border', e.target.value)}
            />
          </div>
          
          <div className="theme-customizer__field">
            <label className="theme-customizer__label">
              Player Seat
            </label>
            <input
              type="color"
              className="theme-customizer__color-input"
              value={customTheme.playerSeat}
              onChange={(e) => handleInputChange('playerSeat', e.target.value)}
            />
          </div>
          
          <div className="theme-customizer__field">
            <label className="theme-customizer__label">
              Accent Color
            </label>
            <input
              type="color"
              className="theme-customizer__color-input"
              value={customTheme.accent}
              onChange={(e) => handleInputChange('accent', e.target.value)}
            />
          </div>
        </div>
        
        {/* Preview */}
        <div className="theme-customizer__preview">
          <h4 className="theme-customizer__preview-title">
            Preview
          </h4>
          <div
            className="theme-customizer__preview-table"
            style={{
              background: customTheme.background,
              border: `2px solid ${customTheme.border}`,
              boxShadow: customTheme.shadow
            }}
          >
            <div className="theme-customizer__preview-surface">
              <div 
                className="theme-customizer__preview-community"
                style={{ background: customTheme.communityArea }}
              />
              <div
                className="theme-customizer__preview-seat"
                style={{ background: customTheme.playerSeat }}
              />
              <div 
                className="theme-customizer__preview-logo"
                style={{ color: customTheme.accent }}
              >
                ♠
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="theme-customizer__actions">
          <button
            className="theme-customizer__button theme-customizer__button--primary"
            onClick={handleSave}
          >
            {isEditing ? 'Update Theme' : 'Create Theme'}
          </button>
          
          <button
            className="theme-customizer__button theme-customizer__button--secondary"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableTheme;
