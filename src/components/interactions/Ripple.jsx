/**
 * Ripple Effect Component
 * Material Design inspired ripple effect for interactive elements
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import './Ripple.css';

const Ripple = ({
  children,
  color = 'rgba(255, 255, 255, 0.6)',
  duration = 600,
  size = 'auto',
  centered = false,
  disabled = false,
  className = '',
  style = {},
  onRippleStart,
  onRippleEnd,
  ...props
}) => {
  const [ripples, setRipples] = useState([]);
  const containerRef = useRef(null);
  const rippleIdRef = useRef(0);

  const createRipple = useCallback((event) => {
    if (disabled) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const rippleId = ++rippleIdRef.current;

    let x, y, rippleSize;

    if (centered) {
      // Center ripple
      x = rect.width / 2;
      y = rect.height / 2;
    } else {
      // Position ripple at click/touch point
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    }

    // Calculate ripple size
    if (size === 'auto') {
      const width = rect.width;
      const height = rect.height;
      const diagonal = Math.sqrt(width * width + height * height);
      rippleSize = diagonal * 2;
    } else if (typeof size === 'number') {
      rippleSize = size;
    } else {
      rippleSize = Math.max(rect.width, rect.height) * 2;
    }

    const newRipple = {
      id: rippleId,
      x,
      y,
      size: rippleSize,
      color,
      duration,
      startTime: Date.now()
    };

    setRipples(prev => [...prev, newRipple]);

    if (onRippleStart) {
      onRippleStart(newRipple, event);
    }

    // Remove ripple after animation completes
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== rippleId));
      
      if (onRippleEnd) {
        onRippleEnd(newRipple);
      }
    }, duration);
  }, [disabled, centered, size, color, duration, onRippleStart, onRippleEnd]);

  const handleMouseDown = useCallback((event) => {
    createRipple(event);
  }, [createRipple]);

  const handleTouchStart = useCallback((event) => {
    // Use first touch point
    const touch = event.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    createRipple(mouseEvent);
  }, [createRipple]);

  const handleKeyDown = useCallback((event) => {
    // Create ripple on Enter or Space key press
    if (event.key === 'Enter' || event.key === ' ') {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2
      });
      createRipple(mouseEvent);
    }
  }, [createRipple]);

  return (
    <div
      ref={containerRef}
      className={`ripple-container ${disabled ? 'ripple-container--disabled' : ''} ${className}`}
      style={style}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
      
      {/* Ripple elements */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            background: ripple.color,
            animationDuration: `${ripple.duration}ms`,
            transform: 'translate(-50%, -50%) scale(0)',
          }}
        />
      ))}
    </div>
  );
};

// Ripple Button component
export const RippleButton = ({
  variant = 'primary',
  size = 'medium',
  children,
  rippleColor,
  rippleDuration = 600,
  rippleSize = 'auto',
  rippleCentered = false,
  disabled = false,
  loading = false,
  onClick,
  className = '',
  style = {},
  ...props
}) => {
  const getButtonClasses = () => {
    const classes = [
      'ripple-button',
      `ripple-button--${variant}`,
      `ripple-button--${size}`,
      loading && 'ripple-button--loading',
      disabled && 'ripple-button--disabled',
      className
    ].filter(Boolean).join(' ');

    return classes;
  };

  const getRippleColor = () => {
    if (rippleColor) return rippleColor;
    
    const variantColors = {
      primary: 'rgba(255, 255, 255, 0.6)',
      secondary: 'rgba(255, 255, 255, 0.6)',
      success: 'rgba(255, 255, 255, 0.6)',
      danger: 'rgba(255, 255, 255, 0.6)',
      warning: 'rgba(255, 255, 255, 0.6)',
      info: 'rgba(255, 255, 255, 0.6)',
      light: 'rgba(0, 0, 0, 0.1)',
      dark: 'rgba(255, 255, 255, 0.6)',
      link: 'rgba(0, 0, 0, 0.1)',
      ghost: 'rgba(255, 255, 255, 0.6)',
      outline: 'rgba(255, 255, 255, 0.6)'
    };
    
    return variantColors[variant] || variantColors.primary;
  };

  const handleClick = (event) => {
    if (disabled || loading) return;
    if (onClick) onClick(event);
  };

  return (
    <Ripple
      color={getRippleColor()}
      duration={rippleDuration}
      size={rippleSize}
      centered={rippleCentered}
      disabled={disabled || loading}
      className={getButtonClasses()}
      style={style}
      onClick={handleClick}
      {...props}
    >
      {loading && (
        <div className="ripple-button__spinner" />
      )}
      
      <span className="ripple-button__content">
        {children}
      </span>
    </Ripple>
  );
};

// Ripple Card component
export const RippleCard = ({
  variant = 'default',
  elevation = 'medium',
  children,
  rippleColor = 'rgba(255, 255, 255, 0.6)',
  rippleDuration = 600,
  rippleSize = 'auto',
  rippleCentered = false,
  disabled = false,
  onClick,
  className = '',
  style = {},
  ...props
}) => {
  const getCardClasses = () => {
    const classes = [
      'ripple-card',
      `ripple-card--${variant}`,
      `ripple-card--elevation-${elevation}`,
      disabled && 'ripple-card--disabled',
      className
    ].filter(Boolean).join(' ');

    return classes;
  };

  const handleClick = (event) => {
    if (disabled) return;
    if (onClick) onClick(event);
  };

  return (
    <Ripple
      color={rippleColor}
      duration={rippleDuration}
      size={rippleSize}
      centered={rippleCentered}
      disabled={disabled}
      className={getCardClasses()}
      style={style}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Ripple>
  );
};

// Ripple Icon component
export const RippleIcon = ({
  icon,
  size = 'medium',
  variant = 'primary',
  children,
  rippleColor,
  rippleDuration = 600,
  rippleSize = 'auto',
  rippleCentered = true,
  disabled = false,
  onClick,
  className = '',
  style = {},
  ...props
}) => {
  const getIconClasses = () => {
    const classes = [
      'ripple-icon',
      `ripple-icon--${size}`,
      `ripple-icon--${variant}`,
      disabled && 'ripple-icon--disabled',
      className
    ].filter(Boolean).join(' ');

    return classes;
  };

  const getRippleColor = () => {
    if (rippleColor) return rippleColor;
    
    const variantColors = {
      primary: 'rgba(255, 255, 255, 0.6)',
      secondary: 'rgba(255, 255, 255, 0.6)',
      success: 'rgba(255, 255, 255, 0.6)',
      danger: 'rgba(255, 255, 255, 0.6)',
      warning: 'rgba(255, 255, 255, 0.6)',
      info: 'rgba(255, 255, 255, 0.6)',
      light: 'rgba(0, 0, 0, 0.1)',
      dark: 'rgba(255, 255, 255, 0.6)',
      ghost: 'rgba(255, 255, 255, 0.6)'
    };
    
    return variantColors[variant] || variantColors.primary;
  };

  const handleClick = (event) => {
    if (disabled) return;
    if (onClick) onClick(event);
  };

  return (
    <Ripple
      color={getRippleColor()}
      duration={rippleDuration}
      size={rippleSize}
      centered={rippleCentered}
      disabled={disabled}
      className={getIconClasses()}
      style={style}
      onClick={handleClick}
      {...props}
    >
      {icon || children}
    </Ripple>
  );
};

// Ripple Input component
export const RippleInput = ({
  variant = 'outlined',
  size = 'medium',
  rippleColor = 'rgba(0, 0, 0, 0.1)',
  rippleDuration = 600,
  rippleSize = 'auto',
  rippleCentered = false,
  disabled = false,
  onFocus,
  onBlur,
  className = '',
  style = {},
  ...props
}) => {
  const [focused, setFocused] = useState(false);

  const getInputClasses = () => {
    const classes = [
      'ripple-input',
      `ripple-input--${variant}`,
      `ripple-input--${size}`,
      focused && 'ripple-input--focused',
      disabled && 'ripple-input--disabled',
      className
    ].filter(Boolean).join(' ');

    return classes;
  };

  const handleFocus = (event) => {
    setFocused(true);
    if (onFocus) onFocus(event);
  };

  const handleBlur = (event) => {
    setFocused(false);
    if (onBlur) onBlur(event);
  };

  return (
    <div className={`ripple-input-wrapper ${getInputClasses()}`} style={style}>
      <Ripple
        color={rippleColor}
        duration={rippleDuration}
        size={rippleSize}
        centered={rippleCentered}
        disabled={disabled}
        className="ripple-input__ripple"
      >
        <input
          {...props}
          disabled={disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="ripple-input__field"
        />
      </Ripple>
    </div>
  );
};

export default Ripple;
