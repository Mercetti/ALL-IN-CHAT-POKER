import React, { useState, useEffect } from 'react';
import './ThemeToggle.css';

type Theme = 'light' | 'dark' | 'system';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  showLabel = false,
  size = 'medium',
}) => {
  const [theme, setTheme] = useState<Theme>('system');
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setTheme(savedTheme);
    }

    // Detect system theme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Apply theme
    const effectiveTheme = theme === 'system' ? systemTheme : theme;
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    document.body.dataset.theme = effectiveTheme;
  }, [theme, systemTheme]);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    handleThemeChange(nextTheme);
  };

  const getEffectiveTheme = () => theme === 'system' ? systemTheme : theme;

  return (
    <div className={`theme-toggle ${className}`}>
      {showLabel && (
        <span className="theme-toggle__label">
          Theme: {theme === 'system' ? `System (${systemTheme})` : theme}
        </span>
      )}
      
      <button
        className={`theme-toggle__button theme-toggle__button--${size}`}
        onClick={toggleTheme}
        title={`Current theme: ${theme}. Click to switch.`}
        aria-label={`Toggle theme. Current: ${theme}`}
      >
        <span className="theme-toggle__icon">
          {getEffectiveTheme() === 'dark' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          )}
        </span>
        
        <span className="theme-toggle__indicator">
          {theme === 'system' ? 'S' : theme === 'dark' ? 'D' : 'L'}
        </span>
      </button>

      <div className="theme-toggle__dropdown">
        <button
          className={`theme-toggle__option ${theme === 'light' ? 'active' : ''}`}
          onClick={() => handleThemeChange('light')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
          </svg>
          Light
        </button>
        
        <button
          className={`theme-toggle__option ${theme === 'dark' ? 'active' : ''}`}
          onClick={() => handleThemeChange('dark')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
          Dark
        </button>
        
        <button
          className={`theme-toggle__option ${theme === 'system' ? 'active' : ''}`}
          onClick={() => handleThemeChange('system')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="9" y1="9" x2="15" y2="9"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          System
        </button>
      </div>
    </div>
  );
};

export default ThemeToggle;
