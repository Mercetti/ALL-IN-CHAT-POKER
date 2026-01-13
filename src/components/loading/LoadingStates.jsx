/**
 * Loading States Component
 * Advanced loading states with various animations and patterns
 */

import React, { useState, useEffect, useRef } from 'react';
import { Skeleton, SkeletonCard, SkeletonList, SkeletonTable, SkeletonForm, SkeletonPokerTable, SkeletonChipStack, LoadingScreen } from './Skeleton';
import './LoadingStates.css';

const LoadingStates = ({
  children,
  className = '',
  style = {}
}) => {
  return (
    <div className={`loading-states ${className}`} style={style}>
      {children}
    </div>
  );
};

// Progress Bar component
export const ProgressBar = ({
  value = 0,
  max = 100,
  variant = 'default',
  animated = true,
  showLabel = true,
  label = '',
  className = '',
  style = {},
  ...props
}) => {
  const [currentValue, setCurrentValue] = useState(0);
  const progressRef = useRef(null);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setCurrentValue(value);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setCurrentValue(value);
    }
  }, [value, animated]);

  const percentage = Math.min(Math.max((currentValue / max) * 100, 0), 100);

  const getProgressBarClasses = () => {
    const classes = [
      'progress-bar',
      `progress-bar--${variant}`,
      animated && 'progress-bar--animated',
      className
    ].filter(Boolean).join(' ');

    return classes;
  };

  const getProgressFillClasses = () => {
    const classes = [
      'progress-bar__fill',
      `progress-bar__fill--${variant}`,
      animated && 'progress-bar__fill--animated'
    ].filter(Boolean).join(' ');

    return classes;
  };

  return (
    <div
      ref={progressRef}
      className={getProgressBarClasses()}
      style={style}
      {...props}
    >
      {showLabel && (
        <div className="progress-bar__label">
          {label || `${Math.round(percentage)}%`}
        </div>
      )}
      <div className="progress-bar__track">
        <div
          className={getProgressFillClasses()}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Spinner component
export const Spinner = ({
  variant = 'default',
  size = 'medium',
  color = 'primary',
  speed = 'normal',
  label = 'Loading...',
  showLabel = false,
  className = '',
  style = {},
  ...props
}) => {
  const getSpinnerClasses = () => {
    const classes = [
      'spinner',
      `spinner--${variant}`,
      `spinner--${size}`,
      `spinner--${color}`,
      `spinner--${speed}`,
      className
    ].filter(Boolean).join(' ');

    return classes;
  };

  const renderDefaultSpinner = () => (
    <div className={getSpinnerClasses()} style={style} {...props}>
      <div className="spinner__circle" />
      {showLabel && (
        <div className="spinner__label">{label}</div>
      )}
    </div>
  );

  const renderDotsSpinner = () => (
    <div className={getSpinnerClasses()} style={style} {...props}>
      <div className="spinner__dots">
        <div className="spinner__dot" />
        <div className="spinner__dot" />
        <div className="spinner__dot" />
      </div>
      {showLabel && (
        <div className="spinner__label">{label}</div>
      )}
    </div>
  );

  const renderPulseSpinner = () => (
    <div className={getSpinnerClasses()} style={style} {...props}>
      <div className="spinner__pulse">
        <div className="spinner__pulse-circle" />
      </div>
      {showLabel && (
        <div className="spinner__label">{label}</div>
      )}
    </div>
  );

  const renderPokerSpinner = () => (
    <div className={getSpinnerClasses()} style={style} {...props}>
      <div className="spinner__poker">
        <div className="spinner__poker-card">
          <div className="spinner__poker-card-back" />
        </div>
        <div className="spinner__poker-card">
          <div className="spinner__poker-card-back" />
        </div>
        <div className="spinner__poker-card">
          <div className="spinner__poker-card-back" />
        </div>
      </div>
      {showLabel && (
        <div className="spinner__label">{label}</div>
      )}
    </div>
  );

  const renderChipsSpinner = () => (
    <div className={getSpinnerClasses()} style={style} {...props}>
      <div className="spinner__chips">
        <div className="spinner__chip spinner__chip--1" />
        <div className="spinner__chip spinner__chip--2" />
        <div className="spinner__chip spinner__chip--3" />
      </div>
      {showLabel && (
        <div className="spinner__label">{label}</div>
      )}
    </div>
  );

  switch (variant) {
    case 'dots':
      return renderDotsSpinner();
    case 'pulse':
      return renderPulseSpinner();
    case 'poker':
      return renderPokerSpinner();
    case 'chips':
      return renderChipsSpinner();
    default:
      return renderDefaultSpinner();
  }
};

// Loading Overlay component
export const LoadingOverlay = ({
  visible = true,
  variant = 'default',
  message = 'Loading...',
  progress = null,
  spinner = true,
  backdrop = true,
  className = '',
  style = {},
  ...props
}) => {
  const getOverlayClasses = () => {
    const classes = [
      'loading-overlay',
      `loading-overlay--${variant}`,
      visible && 'loading-overlay--visible',
      backdrop && 'loading-overlay--backdrop',
      className
    ].filter(Boolean).join(' ');

    return classes;
  };

  if (!visible) return null;

  return (
    <div className={getOverlayClasses()} style={style} {...props}>
      <div className="loading-overlay__content">
        {spinner && (
          <Spinner
            variant={variant === 'poker' ? 'poker' : variant === 'chips' ? 'chips' : 'default'}
            showLabel={!!message}
            label={message}
          />
        )}
        {progress !== null && (
          <ProgressBar
            value={progress}
            variant={variant}
            showLabel={true}
            className="loading-overlay__progress"
          />
        )}
      </div>
    </div>
  );
};

// Content Loader component
export const ContentLoader = ({
  loading = false,
  children,
  skeleton = 'default',
  skeletonProps = {},
  className = '',
  style = {},
  ...props
}) => {
  const [showContent, setShowContent] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (loading) {
      setShowContent(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    } else {
      // Small delay to prevent flickering
      timeoutRef.current = setTimeout(() => {
        setShowContent(true);
      }, 100);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [loading]);

  const renderSkeleton = () => {
    switch (skeleton) {
      case 'card':
        return <SkeletonCard {...skeletonProps} />;
      case 'list':
        return <SkeletonList {...skeletonProps} />;
      case 'table':
        return <SkeletonTable {...skeletonProps} />;
      case 'form':
        return <SkeletonForm {...skeletonProps} />;
      case 'poker-table':
        return <SkeletonPokerTable {...skeletonProps} />;
      case 'chip-stack':
        return <SkeletonChipStack {...skeletonProps} />;
      default:
        return <Skeleton {...skeletonProps} />;
    }
  };

  return (
    <div className={`content-loader ${className}`} style={style} {...props}>
      {loading ? renderSkeleton() : showContent ? children : null}
    </div>
  );
};

// Lazy Loader component
export const LazyLoader = ({
  children,
  fallback = null,
  delay = 0,
  rootMargin = '100px',
  className = '',
  style = {},
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
            setIsLoaded(true);
          }, delay);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold: 0.1
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [delay, rootMargin]);

  return (
    <div
      ref={elementRef}
      className={`lazy-loader ${className}`}
      style={style}
      {...props}
    >
      {isVisible ? children : (fallback || <Skeleton />)}
    </div>
  );
};

// Step Loader component
export const StepLoader = ({
  steps = [],
  currentStep = 0,
  variant = 'default',
  showProgress = true,
  animated = true,
  className = '',
  style = {},
  ...props
}) => {
  const getStepLoaderClasses = () => {
    const classes = [
      'step-loader',
      `step-loader--${variant}`,
      animated && 'step-loader--animated',
      className
    ].filter(Boolean).join(' ');

    return classes;
  };

  const getStepClasses = (index) => {
    const classes = [
      'step-loader__step',
      index < currentStep && 'step-loader__step--completed',
      index === currentStep && 'step-loader__step--active',
      index > currentStep && 'step-loader__step--pending'
    ].filter(Boolean).join(' ');

    return classes;
  };

  const progressPercentage = (currentStep / (steps.length - 1)) * 100;

  return (
    <div className={getStepLoaderClasses()} style={style} {...props}>
      {showProgress && (
        <div className="step-loader__progress">
          <div className="step-loader__progress-bar">
            <div
              className="step-loader__progress-fill"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}
      
      <div className="step-loader__steps">
        {steps.map((step, index) => (
          <div key={index} className={getStepClasses(index)}>
            <div className="step-loader__step-indicator">
              {index < currentStep ? (
                <div className="step-loader__step-check">✓</div>
              ) : (
                <div className="step-loader__step-number">{index + 1}</div>
              )}
            </div>
            <div className="step-loader__step-content">
              <div className="step-loader__step-title">{step.title}</div>
              {step.description && (
                <div className="step-loader__step-description">{step.description}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Infinite Loader component
export const InfiniteLoader = ({
  hasMore = true,
  isLoading = false,
  onLoadMore,
  loader = null,
  endMessage = 'No more items',
  className = '',
  style = {},
  ...props
}) => {
  const observerRef = useRef(null);
  const loadingRef = useRef(null);

  useEffect(() => {
    const element = loadingRef.current;
    if (!element || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoading) {
          if (onLoadMore) onLoadMore();
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.1
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoading, onLoadMore]);

  if (!hasMore) {
    return (
      <div className={`infinite-loader__end ${className}`} style={style} {...props}>
        {endMessage}
      </div>
    );
  }

  return (
    <div
      ref={loadingRef}
      className={`infinite-loader ${className}`}
      style={style}
      {...props}
    >
      {isLoading ? (
        loader || <Spinner variant="dots" showLabel={false} />
      ) : (
        <div className="infinite-loader__trigger" />
      )}
    </div>
  );
};

// Poker Loading States component
export const PokerLoadingStates = ({
  variant = 'default',
  message = 'Loading game...',
  progress = null,
  className = '',
  style = {},
  ...props
}) => {
  const getPokerLoadingClasses = () => {
    const classes = [
      'poker-loading-states',
      `poker-loading-states--${variant}`,
      className
    ].filter(Boolean).join(' ');

    return classes;
  };

  const renderTableLoading = () => (
    <div className={getPokerLoadingClasses()} style={style} {...props}>
      <SkeletonPokerTable
        players={6}
        communityCards={5}
        pot={true}
        animated={true}
      />
      <div className="poker-loading-states__message">{message}</div>
      {progress !== null && (
        <ProgressBar
          value={progress}
          variant="poker"
          showLabel={true}
          className="poker-loading-states__progress"
        />
      )}
    </div>
  );

  const renderChipsLoading = () => (
    <div className={getPokerLoadingClasses()} style={style} {...props}>
      <div className="poker-loading-states__chips">
        <SkeletonChipStack chips={5} animated={true} />
        <SkeletonChipStack chips={8} animated={true} />
        <SkeletonChipStack chips={3} animated={true} />
      </div>
      <div className="poker-loading-states__message">{message}</div>
      {progress !== null && (
        <ProgressBar
          value={progress}
          variant="poker"
          showLabel={true}
          className="poker-loading-states__progress"
        />
      )}
    </div>
  );

  const renderCardsLoading = () => (
    <div className={getPokerLoadingClasses()} style={style} {...props}>
      <div className="poker-loading-states__cards">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton
            key={index}
            variant="rectangular"
            width={60}
            height={84}
            animated={true}
            className="poker-loading-states__card"
          />
        ))}
      </div>
      <div className="poker-loading-states__message">{message}</div>
      {progress !== null && (
        <ProgressBar
          value={progress}
          variant="poker"
          showLabel={true}
          className="poker-loading-states__progress"
        />
      )}
    </div>
  );

  switch (variant) {
    case 'table':
      return renderTableLoading();
    case 'chips':
      return renderChipsLoading();
    case 'cards':
      return renderCardsLoading();
    default:
      return renderTableLoading();
  }
};

export default LoadingStates;
