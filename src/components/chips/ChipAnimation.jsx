/**
 * Chip Animation Component
 * Advanced chip animations and effects
 */

import React, { useState, useRef, useEffect } from 'react';
import Chip from './Chip';
import './ChipAnimation.css';

const ChipAnimation = ({
  chips = [],
  animationType = 'stack',
  onAnimationComplete,
  loop = false,
  duration = 2000,
  className = '',
  style = {}
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const animationRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (chips.length === 0) return;

    setIsAnimating(true);
    startAnimation();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [chips, animationType, duration]);

  const startAnimation = () => {
    const frameCount = chips.length;
    let frame = 0;

    const animate = () => {
      if (frame < frameCount) {
        setCurrentFrame(frame);
        frame++;
        
        timeoutRef.current = setTimeout(() => {
          animate();
        }, duration / frameCount);
      } else {
        setIsAnimating(false);
        setCurrentFrame(frameCount);
        
        if (onAnimationComplete) {
          onAnimationComplete();
        }
        
        if (loop) {
          setTimeout(() => {
            setCurrentFrame(0);
            startAnimation();
          }, 500);
        }
      }
    };

    animate();
  };

  const getAnimationClasses = () => {
    const classes = [
      'chip-animation',
      `chip-animation--${animationType}`,
      isAnimating && 'chip-animation--animating',
      className
    ].filter(Boolean).join(' ');

    return classes;
  };

  const renderAnimatedChips = () => {
    switch (animationType) {
      case 'stack':
        return renderStackAnimation();
      case 'cascade':
        return renderCascadeAnimation();
      case 'spiral':
        return renderSpiralAnimation();
      case 'explode':
        return renderExplodeAnimation();
      case 'shuffle':
        return renderShuffleAnimation();
      case 'deal':
        return renderDealAnimation();
      default:
        return renderStackAnimation();
    }
  };

  const renderStackAnimation = () => {
    return chips.slice(0, currentFrame).map((chip, index) => (
      <div
        key={chip.id || index}
        className="chip-animation__chip-wrapper"
        style={{
          transform: `translateY(${-index * 2}px)`,
          zIndex: chips.length - index,
          animationDelay: `${index * 50}ms`
        }}
      >
        <Chip
          value={chip.value}
          color={chip.color}
          size={chip.size || 'medium'}
          count={chip.count || 1}
          stacked={false}
          animated={false}
        />
      </div>
    ));
  };

  const renderCascadeAnimation = () => {
    return chips.slice(0, currentFrame).map((chip, index) => (
      <div
        key={chip.id || index}
        className="chip-animation__chip-wrapper"
        style={{
          transform: `translateY(${-index * 30}px) translateX(${(index % 2 === 0 ? -20 : 20}px))`,
          zIndex: chips.length - index,
          animationDelay: `${index * 100}ms`
        }}
      >
        <Chip
          value={chip.value}
          color={chip.color}
          size={chip.size || 'medium'}
          count={chip.count || 1}
          stacked={false}
          animated={false}
        />
      </div>
    ));
  };

  const renderSpiralAnimation = () => {
    return chips.slice(0, currentFrame).map((chip, index) => {
      const angle = (index / chips.length) * 360;
      const radius = 80;
      const x = Math.cos(angle * Math.PI / 180) * radius;
      const y = Math.sin(angle * Math.PI / 180) * radius;
      
      return (
        <div
          key={chip.id || index}
          className="chip-animation__chip-wrapper"
          style={{
            transform: `translate(${x}px, ${y}px)`,
            zIndex: chips.length - index,
            animationDelay: `${index * 100}ms`
          }}
        >
          <Chip
            value={chip.value}
            color={chip.color}
            size={chip.size || 'medium'}
            count={chip.count || 1}
            stacked={false}
            animated={false}
          />
        </div>
      );
    });
  };

  const renderExplodeAnimation = () => {
    return chips.slice(0, currentFrame).map((chip, index) => {
      const angle = (index / chips.length) * 360;
      const distance = 100 + (index * 20);
      const x = Math.cos(angle * Math.PI / 180) * distance;
      const y = Math.sin(angle * Math.PI / 180) * distance;
      
      return (
        <div
          key={chip.id || index}
          className="chip-animation__chip-wrapper"
          style={{
            transform: `translate(${x}px, ${y}px) scale(${0.8 + (index * 0.1)})`,
            zIndex: chips.length - index,
            animationDelay: `${index * 50}ms`
          }}
        >
          <Chip
            value={chip.value}
            color={chip.color}
            size={chip.size || 'medium'}
            count={chip.count || 1}
            stacked={false}
            animated={false}
          />
        </div>
      );
    });
  };

  const renderShuffleAnimation = () => {
    return chips.slice(0, currentFrame).map((chip, index) => {
      const randomX = (Math.random() - 0.5) * 100;
      const randomY = (Math.random() - 0.5) * 100;
      const randomRotation = (Math.random() - 0.5) * 360;
      
      return (
        <div
          key={chip.id || index}
          className="chip-animation__chip-wrapper"
          style={{
            transform: `translate(${randomX}px, ${randomY}px) rotate(${randomRotation}deg)`,
            zIndex: chips.length - index,
            animationDelay: `${index * 50}ms`
          }}
        >
          <Chip
            value={chip.value}
            color={chip.color}
            size={chip.size || 'medium'}
            count={chip.count || 1}
            stacked={false}
            animated={false}
          />
        </div>
      );
    });
  };

  const renderDealAnimation = () => {
    return chips.slice(0, currentFrame).map((chip, index) => {
      const positions = [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: -50, y: 0 },
        { x: 25, y: 30 },
        { x: -25, y: 30 }
      ];
      
      const position = positions[index % positions.length];
      
      return (
        <div
          key={chip.id || index}
          className="chip-animation__chip-wrapper"
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
            zIndex: chips.length - index,
            animationDelay: `${index * 200}ms`
          }}
        >
          <Chip
            value={chip.value}
            color={chip.color}
            size={chip.size || 'medium'}
            count={chip.count || 1}
            stacked={false}
            animated={false}
          />
        </div>
      );
    });
  };

  return (
    <div
      ref={animationRef}
      className={getAnimationClasses()}
      style={style}
    >
      {renderAnimatedChips()}
    </div>
  );
};

// Chip trail effect component
export const ChipTrail = ({
  chips = [],
  trailType = 'path',
  trailLength = 5,
  animated = true,
  className = '',
  style = {}
}) => {
  const [trail, setTrail] = useState([]);

  useEffect(() => {
    if (chips.length === 0) return;

    const interval = setInterval(() => {
      setTrail(prev => {
        const newTrail = [...chips.slice(-trailLength)];
        return newTrail;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [chips, trailLength]);

  const getTrailClasses = () => {
    const classes = [
      'chip-trail',
      `chip-trail--${trailType}`,
      animated && 'chip-trail--animated',
      className
    ].filter(Boolean).join(' ');

    return classes;
  };

  const renderTrail = () => {
    switch (trailType) {
      case 'path':
        return renderPathTrail();
      case 'wave':
        return renderWaveTrail();
      case 'circle':
        return renderCircleTrail();
      default:
        return renderPathTrail();
    }
  };

  const renderPathTrail = () => {
    return trail.map((chip, index) => (
      <div
        key={`${chip.id || index}-${Date.now()}`}
        className="chip-trail__chip-wrapper"
        style={{
          transform: `translateX(${index * 30}px)`,
          opacity: 1 - (index / trail.length),
          zIndex: trail.length - index
        }}
      >
        <Chip
          value={chip.value}
          color={chip.color}
          size="small"
          count={1}
          stacked={false}
          animated={false}
        />
      </div>
    ));
  };

  const renderWaveTrail = () => {
    return trail.map((chip, index) => {
      const wave = Math.sin((index / trail.length) * Math.PI) * 20;
      
      return (
        <div
          key={`${chip.id || index}-${Date.now()}`}
          className="chip-trail__chip-wrapper"
          style={{
            transform: `translateX(${index * 25}px) translateY(${wave}px)`,
            opacity: 1 - (index / trail.length),
            zIndex: trail.length - index
          }}
        >
          <Chip
            value={chip.value}
            color={chip.color}
            size="small"
            count={1}
            stacked={false}
            animated={false}
          />
        </div>
      );
    });
  };

  const renderCircleTrail = () => {
    return trail.map((chip, index) => {
      const angle = (index / trail.length) * 360;
      const radius = 50;
      const x = Math.cos(angle * Math.PI / 180) * radius;
      const y = Math.sin(angle * Math.PI / 180) * radius;
      
      return (
        <div
          key={`${chip.id || index}-${Date.now()}`}
          className="chip-trail__chip-wrapper"
          style={{
            transform: `translate(${x}px, ${y}px)`,
            opacity: 1 - (index / trail.length),
            zIndex: trail.length - index
          }}
        >
          <Chip
            value={chip.value}
            color={chip.color}
            size="small"
            count={1}
            stacked={false}
            animated={false}
          />
        </div>
      );
    });
  };

  return (
    <div className={getTrailClasses()} style={style}>
      {renderTrail()}
    </div>
  );
};

// Chip fountain effect component
export const ChipFountain = ({
  chips = [],
  fountainHeight = 200,
  particleCount = 20,
  animated = true,
  className = '',
  style = {}
}) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (chips.length === 0) return;

    const interval = setInterval(() => {
      const randomChip = chips[Math.floor(Math.random() * chips.length)];
      const newParticle = {
        id: Date.now() + Math.random(),
        chip: randomChip,
        x: (Math.random() - 0.5) * 100,
        y: 0,
        velocityY: -5 - Math.random() * 5,
        velocityX: (Math.random() - 0.5) * 2,
        life: 100
      };
      
      setParticles(prev => [...prev.slice(-particleCount), newParticle]);
    }, 100);

    return () => clearInterval(interval);
  }, [chips, particleCount]);

  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => 
        prev.map(particle => ({
          ...particle,
          y: particle.y + particle.velocityY,
          x: particle.x + particle.velocityX,
          velocityY: particle.velocityY + 0.2,
          life: particle.life - 1
        })).filter(particle => particle.life > 0 && particle.y < fountainHeight)
      );
    }, 50);

    return () => clearInterval(interval);
  }, [fountainHeight]);

  const getFountainClasses = () => {
    const classes = [
      'chip-fountain',
      animated && 'chip-fountain--animated',
      className
    ].filter(Boolean).join(' ');

    return classes;
  };

  return (
    <div className={getFountainClasses()} style={style}>
      <div className="chip-fountain__source" />
      {particles.map(particle => (
        <div
          key={particle.id}
          className="chip-fountain__particle"
          style={{
            transform: `translate(${particle.x}px, ${-particle.y}px)`,
            opacity: particle.life / 100
          }}
        >
          <Chip
            value={particle.chip.value}
            color={particle.chip.color}
            size="small"
            count={1}
            stacked={false}
            animated={false}
          />
        </div>
      ))}
    </div>
  );
};

export default ChipAnimation;
