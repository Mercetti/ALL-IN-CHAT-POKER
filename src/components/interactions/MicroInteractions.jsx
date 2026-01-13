/**
 * Micro Interactions Component
 * Collection of subtle animations and interactive effects
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import './MicroInteractions.css';

const MicroInteractions = ({
  children,
  className = '',
  style = {}
}) => {
  return (
    <div className={`micro-interactions ${className}`} style={style}>
      {children}
    </div>
  );
};

// Hover Scale component
export const HoverScale = ({
  children,
  scale = 1.05,
  duration = 200,
  disabled = false,
  className = '',
  style = {},
  onHoverStart,
  onHoverEnd,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = useCallback((e) => {
    if (disabled) return;
    setIsHovered(true);
    if (onHoverStart) onHoverStart(e);
  }, [disabled, onHoverStart]);

  const handleMouseLeave = useCallback((e) => {
    if (disabled) return;
    setIsHovered(false);
    if (onHoverEnd) onHoverEnd(e);
  }, [disabled, onHoverEnd]);

  const getStyle = () => {
    return {
      transform: isHovered ? `scale(${scale})` : 'scale(1)',
      transition: `transform ${duration}ms ease`,
      cursor: disabled ? 'default' : 'pointer',
      ...style
    };
  };

  return (
    <div
      className={`hover-scale ${disabled ? 'hover-scale--disabled' : ''} ${className}`}
      style={getStyle()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  );
};

// Hover Glow component
export const HoverGlow = ({
  children,
  color = '#3182ce',
  intensity = 0.5,
  duration = 300,
  disabled = false,
  className = '',
  style = {},
  onHoverStart,
  onHoverEnd,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = useCallback((e) => {
    if (disabled) return;
    setIsHovered(true);
    if (onHoverStart) onHoverStart(e);
  }, [disabled, onHoverStart]);

  const handleMouseLeave = useCallback((e) => {
    if (disabled) return;
    setIsHovered(false);
    if (onHoverEnd) onHoverEnd(e);
  }, [disabled, onHoverEnd]);

  const getStyle = () => {
    return {
      boxShadow: isHovered 
        ? `0 0 ${20 * intensity}px ${color}, 0 0 ${40 * intensity}px ${color}` 
        : 'none',
      transition: `box-shadow ${duration}ms ease`,
      cursor: disabled ? 'default' : 'pointer',
      ...style
    };
  };

  return (
    <div
      className={`hover-glow ${disabled ? 'hover-glow--disabled' : ''} ${className}`}
      style={getStyle()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  );
};

// Hover Lift component
export const HoverLift = ({
  children,
  lift = 8,
  duration = 200,
  disabled = false,
  className = '',
  style = {},
  onHoverStart,
  onHoverEnd,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = useCallback((e) => {
    if (disabled) return;
    setIsHovered(true);
    if (onHoverStart) onHoverStart(e);
  }, [disabled, onHoverStart]);

  const handleMouseLeave = useCallback((e) => {
    if (disabled) return;
    setIsHovered(false);
    if (onHoverEnd) onHoverEnd(e);
  }, [disabled, onHoverEnd]);

  const getStyle = () => {
    return {
      transform: isHovered ? `translateY(-${lift}px)` : 'translateY(0)',
      transition: `transform ${duration}ms ease`,
      cursor: disabled ? 'default' : 'pointer',
      ...style
    };
  };

  return (
    <div
      className={`hover-lift ${disabled ? 'hover-lift--disabled' : ''} ${className}`}
      style={getStyle()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  );
};

// Click Bounce component
export const ClickBounce = ({
  children,
  intensity = 0.9,
  duration = 150,
  disabled = false,
  className = '',
  style = {},
  onClick,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseDown = useCallback((e) => {
    if (disabled) return;
    setIsPressed(true);
  }, [disabled]);

  const handleMouseUp = useCallback((e) => {
    if (disabled) return;
    setIsPressed(false);
    if (onClick) onClick(e);
  }, [disabled, onClick]);

  const handleMouseLeave = useCallback(() => {
    if (disabled) return;
    setIsPressed(false);
  }, [disabled]);

  const getStyle = () => {
    return {
      transform: isPressed ? `scale(${intensity})` : 'scale(1)',
      transition: `transform ${duration}ms ease`,
      cursor: disabled ? 'not-allowed' : 'pointer',
      ...style
    };
  };

  return (
    <div
      className={`click-bounce ${disabled ? 'click-bounce--disabled' : ''} ${className}`}
      style={getStyle()}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  );
};

// Shake Animation component
export const ShakeAnimation = ({
  children,
  trigger = false,
  intensity = 'medium',
  duration = 500,
  disabled = false,
  className = '',
  style = {},
  onAnimationEnd,
  ...props
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (trigger && !disabled && !isAnimating) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        if (onAnimationEnd) onAnimationEnd();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [trigger, disabled, duration, isAnimating, onAnimationEnd]);

  const getShakeIntensity = () => {
    const intensities = {
      light: '2px',
      medium: '4px',
      heavy: '8px',
      extreme: '12px'
    };
    return intensities[intensity] || intensities.medium;
  };

  const getStyle = () => {
    if (isAnimating) {
      const shakeAmount = getShakeIntensity();
      return {
        animation: `shake ${duration}ms ease-in-out`,
        cursor: disabled ? 'default' : 'pointer',
        ...style
      };
    }
    return {
      cursor: disabled ? 'default' : 'pointer',
      ...style
    };
  };

  return (
    <div
      className={`shake-animation ${disabled ? 'shake-animation--disabled' : ''} ${className}`}
      style={getStyle()}
      {...props}
    >
      {children}
    </div>
  );
};

// Pulse Animation component
export const PulseAnimation = ({
  children,
  active = false,
  color = '#3182ce',
  intensity = 0.5,
  duration = 1000,
  disabled = false,
  className = '',
  style = {},
  ...props
}) => {
  const getStyle = () => {
    if (active && !disabled) {
      return {
        animation: `pulse ${duration}ms ease-in-out infinite`,
        cursor: disabled ? 'default' : 'pointer',
        ...style
      };
    }
    return {
      cursor: disabled ? 'default' : 'pointer',
      ...style
    };
  };

  return (
    <div
      className={`pulse-animation ${disabled ? 'pulse-animation--disabled' : ''} ${className}`}
      style={getStyle()}
      {...props}
    >
      {children}
    </div>
  );
};

// Fade In component
export const FadeIn = ({
  children,
  delay = 0,
  duration = 300,
  direction = 'up',
  distance = 20,
  trigger = true,
  className = '',
  style = {},
  onAnimationEnd,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (trigger) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        if (onAnimationEnd) {
          setTimeout(onAnimationEnd, duration);
        }
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [trigger, delay, duration, onAnimationEnd]);

  const getTransform = () => {
    if (!isVisible) {
      switch (direction) {
        case 'up':
          return `translateY(${distance}px)`;
        case 'down':
          return `translateY(-${distance}px)`;
        case 'left':
          return `translateX(${distance}px)`;
        case 'right':
          return `translateX(-${distance}px)`;
        default:
          return 'translateY(0)';
      }
    }
    return 'translate(0)';
  };

  const getStyle = () => {
    return {
      opacity: isVisible ? 1 : 0,
      transform: getTransform(),
      transition: `opacity ${duration}ms ease, transform ${duration}ms ease`,
      ...style
    };
  };

  return (
    <div
      className={`fade-in ${className}`}
      style={getStyle()}
      {...props}
    >
      {children}
    </div>
  );
};

// Slide In component
export const SlideIn = ({
  children,
  delay = 0,
  duration = 400,
  direction = 'left',
  distance = 100,
  trigger = true,
  className = '',
  style = {},
  onAnimationEnd,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (trigger) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        if (onAnimationEnd) {
          setTimeout(onAnimationEnd, duration);
        }
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [trigger, delay, duration, onAnimationEnd]);

  const getTransform = () => {
    if (!isVisible) {
      switch (direction) {
        case 'left':
          return `translateX(-${distance}px)`;
        case 'right':
          return `translateX(${distance}px)`;
        case 'up':
          return `translateY(-${distance}px)`;
        case 'down':
          return `translateY(${distance}px)`;
        default:
          return 'translateX(0)';
      }
    }
    return 'translate(0)';
  };

  const getStyle = () => {
    return {
      transform: getTransform(),
      transition: `transform ${duration}ms ease`,
      ...style
    };
  };

  return (
    <div
      className={`slide-in ${className}`}
      style={getStyle()}
      {...props}
    >
      {children}
    </div>
  );
};

// Rotate Animation component
export const RotateAnimation = ({
  children,
  active = false,
  degrees = 360,
  duration = 1000,
  direction = 'clockwise',
  disabled = false,
  className = '',
  style = {},
  ...props
}) => {
  const getStyle = () => {
    if (active && !disabled) {
      const rotation = direction === 'clockwise' ? degrees : -degrees;
      return {
        animation: `rotate ${duration}ms linear infinite`,
        cursor: disabled ? 'default' : 'pointer',
        ...style
      };
    }
    return {
      cursor: disabled ? 'default' : 'pointer',
      ...style
    };
  };

  return (
    <div
      className={`rotate-animation ${disabled ? 'rotate-animation--disabled' : ''} ${className}`}
      style={getStyle()}
      {...props}
    >
      {children}
    </div>
  );
};

// Typewriter Effect component
export const TypewriterEffect = ({
  text,
  speed = 50,
  delay = 0,
  cursor = true,
  className = '',
  style = {},
  onComplete,
  ...props
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    
    const startTimer = setTimeout(() => {
      let currentIndex = 0;
      const textArray = text.split('');
      
      const typeInterval = setInterval(() => {
        if (currentIndex < textArray.length) {
          setDisplayedText(prev => prev + textArray[currentIndex]);
          currentIndex++;
        } else {
          clearInterval(typeInterval);
          setIsComplete(true);
          if (onComplete) onComplete();
        }
      }, speed);
      
      return () => clearInterval(typeInterval);
    }, delay);
    
    return () => clearTimeout(startTimer);
  }, [text, speed, delay, onComplete]);

  return (
    <div
      className={`typewriter-effect ${className}`}
      style={style}
      {...props}
    >
      {displayedText}
      {cursor && !isComplete && (
        <span className="typewriter-cursor">|</span>
      )}
    </div>
  );
};

// Loading Dots component
export const LoadingDots = ({
  count = 3,
  size = 'medium',
  color = '#3182ce',
  duration = 1000,
  className = '',
  style = {},
  ...props
}) => {
  const dots = Array.from({ length: count }, (_, i) => i);

  const getDotSize = () => {
    const sizes = {
      small: '4px',
      medium: '8px',
      large: '12px',
      xlarge: '16px'
    };
    return sizes[size] || sizes.medium;
  };

  const getDotStyle = (index) => {
    return {
      width: getDotSize(),
      height: getDotSize(),
      backgroundColor: color,
      animationDelay: `${(index * duration) / count}ms`
    };
  };

  return (
    <div
      className={`loading-dots ${className}`}
      style={{ display: 'flex', gap: '4px', ...style }}
      {...props}
    >
      {dots.map(index => (
        <div
          key={index}
          className="loading-dot"
          style={getDotStyle(index)}
        />
      ))}
    </div>
  );
};

// Floating Animation component
export const FloatingAnimation = ({
  children,
  amplitude = 10,
  duration = 2000,
  delay = 0,
  disabled = false,
  className = '',
  style = {},
  ...props
}) => {
  const getStyle = () => {
    if (!disabled) {
      return {
        animation: `float ${duration}ms ease-in-out ${delay}ms infinite`,
        ...style
      };
    }
    return style;
  };

  return (
    <div
      className={`floating-animation ${disabled ? 'floating-animation--disabled' : ''} ${className}`}
      style={getStyle()}
      {...props}
    >
      {children}
    </div>
  );
};

export default MicroInteractions;
