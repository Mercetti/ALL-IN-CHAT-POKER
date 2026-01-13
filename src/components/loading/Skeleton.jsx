/**
 * Skeleton Component
 * Advanced loading skeleton screens and placeholders
 */

import React, { useState, useEffect, useRef } from 'react';
import './Skeleton.css';

const Skeleton = ({
  variant = 'text',
  width,
  height,
  lines = 1,
  animated = true,
  className = '',
  style = {},
  ...props
}) => {
  const getSkeletonClasses = () => {
    const classes = [
      'skeleton',
      `skeleton--${variant}`,
      animated && 'skeleton--animated',
      className
    ].filter(Boolean).join(' ');

    return classes;
  };

  const getSkeletonStyle = () => {
    const baseStyle = {
      width: width || '100%',
      height: height || '1em',
      ...style
    };

    // Variant-specific styles
    switch (variant) {
      case 'text':
        return {
          ...baseStyle,
          height: height || '1em',
          borderRadius: '4px'
        };
      case 'circular':
        return {
          ...baseStyle,
          borderRadius: '50%',
          width: width || '40px',
          height: height || '40px'
        };
      case 'rectangular':
        return {
          ...baseStyle,
          borderRadius: '8px'
        };
      case 'rounded':
        return {
          ...baseStyle,
          borderRadius: '16px'
        };
      default:
        return baseStyle;
    }
  };

  const renderTextSkeleton = () => {
    if (lines === 1) {
      return (
        <div
          className={getSkeletonClasses()}
          style={getSkeletonStyle()}
          {...props}
        />
      );
    }

    return (
      <div className="skeleton-text-lines" style={style}>
        {Array.from({ length: lines }, (_, index) => (
          <div
            key={index}
            className={getSkeletonClasses()}
            style={{
              ...getSkeletonStyle(),
              width: index === lines - 1 ? '70%' : '100%',
              marginBottom: index < lines - 1 ? '8px' : '0'
            }}
          />
        ))}
      </div>
    );
  };

  if (variant === 'text' && lines > 1) {
    return renderTextSkeleton();
  }

  return (
    <div
      className={getSkeletonClasses()}
      style={getSkeletonStyle()}
      {...props}
    />
  );
};

// Skeleton Card component
export const SkeletonCard = ({
  variant = 'default',
  avatar = false,
  lines = 3,
  animated = true,
  className = '',
  style = {},
  ...props
}) => {
  const getCardClasses = () => {
    const classes = [
      'skeleton-card',
      `skeleton-card--${variant}`,
      animated && 'skeleton-card--animated',
      className
    ].filter(Boolean).join(' ');

    return classes;
  };

  const renderDefaultCard = () => (
    <div className={getCardClasses()} style={style} {...props}>
      {avatar && (
        <Skeleton
          variant="circular"
          width={40}
          height={40}
          animated={animated}
          className="skeleton-card__avatar"
        />
      )}
      <div className="skeleton-card__content">
        <Skeleton
          variant="text"
          width="60%"
          height="1.2em"
          animated={animated}
          className="skeleton-card__title"
        />
        <Skeleton
          variant="text"
          lines={lines}
          animated={animated}
          className="skeleton-card__description"
        />
      </div>
    </div>
  );

  const renderProductCard = () => (
    <div className={getCardClasses()} style={style} {...props}>
      <Skeleton
        variant="rectangular"
        width="100%"
        height={200}
        animated={animated}
        className="skeleton-card__image"
      />
      <div className="skeleton-card__content">
        <Skeleton
          variant="text"
          width="80%"
          height="1.2em"
          animated={animated}
          className="skeleton-card__title"
        />
        <Skeleton
          variant="text"
          width="40%"
          height="1em"
          animated={animated}
          className="skeleton-card__price"
        />
        <Skeleton
          variant="text"
          lines={2}
          animated={animated}
          className="skeleton-card__description"
        />
      </div>
    </div>
  );

  const renderUserCard = () => (
    <div className={getCardClasses()} style={style} {...props}>
      <Skeleton
        variant="circular"
        width={60}
        height={60}
        animated={animated}
        className="skeleton-card__avatar"
      />
      <div className="skeleton-card__content">
        <Skeleton
          variant="text"
          width="70%"
          height="1.2em"
          animated={animated}
          className="skeleton-card__name"
        />
        <Skeleton
          variant="text"
          width="50%"
          height="1em"
          animated={animated}
          className="skeleton-card__email"
        />
        <Skeleton
          variant="text"
          lines={2}
          animated={animated}
          className="skeleton-card__bio"
        />
      </div>
    </div>
  );

  switch (variant) {
    case 'product':
      return renderProductCard();
    case 'user':
      return renderUserCard();
    default:
      return renderDefaultCard();
  }
};

// Skeleton List component
export const SkeletonList = ({
  count = 5,
  avatar = false,
  lines = 2,
  animated = true,
  className = '',
  style = {},
  ...props
}) => {
  const getListClasses = () => {
    const classes = [
      'skeleton-list',
      animated && 'skeleton-list--animated',
      className
    ].filter(Boolean).join(' ');

    return classes;
  };

  return (
    <div className={getListClasses()} style={style} {...props}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="skeleton-list-item">
          {avatar && (
            <Skeleton
              variant="circular"
              width={32}
              height={32}
              animated={animated}
              className="skeleton-list-item__avatar"
            />
          )}
          <div className="skeleton-list-item__content">
            <Skeleton
              variant="text"
              width="70%"
              height="1em"
              animated={animated}
              className="skeleton-list-item__title"
            />
            <Skeleton
              variant="text"
              lines={lines}
              animated={animated}
              className="skeleton-list-item__description"
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// Skeleton Table component
export const SkeletonTable = ({
  rows = 5,
  columns = 4,
  header = true,
  animated = true,
  className = '',
  style = {},
  ...props
}) => {
  const getTableClasses = () => {
    const classes = [
      'skeleton-table',
      animated && 'skeleton-table--animated',
      className
    ].filter(Boolean).join(' ');

    return classes;
  };

  return (
    <div className={getTableClasses()} style={style} {...props}>
      {header && (
        <div className="skeleton-table__header">
          {Array.from({ length: columns }, (_, index) => (
            <Skeleton
              key={`header-${index}`}
              variant="text"
              width="80%"
              height="1.2em"
              animated={animated}
              className="skeleton-table__header-cell"
            />
          ))}
        </div>
      )}
      <div className="skeleton-table__body">
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="skeleton-table__row">
            {Array.from({ length: columns }, (_, colIndex) => (
              <Skeleton
                key={`cell-${rowIndex}-${colIndex}`}
                variant="text"
                width={colIndex === 0 ? '90%' : '70%'}
                height="1em"
                animated={animated}
                className="skeleton-table__cell"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// Skeleton Form component
export const SkeletonForm = ({
  fields = 5,
  animated = true,
  className = '',
  style = {},
  ...props
}) => {
  const getFormClasses = () => {
    const classes = [
      'skeleton-form',
      animated && 'skeleton-form--animated',
      className
    ].filter(Boolean).join(' ');

    return classes;
  };

  const renderField = (index) => {
    const fieldTypes = ['text', 'select', 'textarea', 'checkbox'];
    const fieldType = fieldTypes[index % fieldTypes.length];

    switch (fieldType) {
      case 'text':
        return (
          <div key={index} className="skeleton-form__field">
            <Skeleton
              variant="text"
              width="30%"
              height="0.8em"
              animated={animated}
              className="skeleton-form__label"
            />
            <Skeleton
              variant="rectangular"
              width="100%"
              height="40px"
              animated={animated}
              className="skeleton-form__input"
            />
          </div>
        );
      case 'select':
        return (
          <div key={index} className="skeleton-form__field">
            <Skeleton
              variant="text"
              width="30%"
              height="0.8em"
              animated={animated}
              className="skeleton-form__label"
            />
            <Skeleton
              variant="rectangular"
              width="100%"
              height="40px"
              animated={animated}
              className="skeleton-form__select"
            />
          </div>
        );
      case 'textarea':
        return (
          <div key={index} className="skeleton-form__field">
            <Skeleton
              variant="text"
              width="30%"
              height="0.8em"
              animated={animated}
              className="skeleton-form__label"
            />
            <Skeleton
              variant="rectangular"
              width="100%"
              height="80px"
              animated={animated}
              className="skeleton-form__textarea"
            />
          </div>
        );
      case 'checkbox':
        return (
          <div key={index} className="skeleton-form__field">
            <Skeleton
              variant="rectangular"
              width="16px"
              height="16px"
              animated={animated}
              className="skeleton-form__checkbox"
            />
            <Skeleton
              variant="text"
              width="60%"
              height="1em"
              animated={animated}
              className="skeleton-form__checkbox-label"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={getFormClasses()} style={style} {...props}>
      {Array.from({ length: fields }, (_, index) => renderField(index))}
      <Skeleton
        variant="rectangular"
        width="120px"
        height="40px"
        animated={animated}
        className="skeleton-form__button"
      />
    </div>
  );
};

// Skeleton Poker Table component
export const SkeletonPokerTable = ({
  players = 6,
  communityCards = 5,
  pot = true,
  animated = true,
  className = '',
  style = {},
  ...props
}) => {
  const getTableClasses = () => {
    const classes = [
      'skeleton-poker-table',
      animated && 'skeleton-poker-table--animated',
      className
    ].filter(Boolean).join(' ');

    return classes;
  };

  return (
    <div className={getTableClasses()} style={style} {...props}>
      {/* Table surface */}
      <Skeleton
        variant="circular"
        width="100%"
        height="400px"
        animated={animated}
        className="skeleton-poker-table__surface"
      />
      
      {/* Player seats */}
      {Array.from({ length: players }, (_, index) => (
        <div
          key={`player-${index}`}
          className="skeleton-poker-table__player-seat"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) rotate(${(360 / players) * index}deg) translateY(-150px)`
          }}
        >
          <Skeleton
            variant="circular"
            width={60}
            height={60}
            animated={animated}
            className="skeleton-poker-table__player-avatar"
          />
          <Skeleton
            variant="text"
            width="40px"
            height="0.8em"
            animated={animated}
            className="skeleton-poker-table__player-name"
          />
        </div>
      ))}
      
      {/* Community cards */}
      {communityCards > 0 && (
        <div className="skeleton-poker-table__community-cards">
          {Array.from({ length: communityCards }, (_, index) => (
            <Skeleton
              key={`card-${index}`}
              variant="rectangular"
              width={50}
              height={70}
              animated={animated}
              className="skeleton-poker-table__community-card"
            />
          ))}
        </div>
      )}
      
      {/* Pot */}
      {pot && (
        <div className="skeleton-poker-table__pot">
          <Skeleton
            variant="text"
            width="60px"
            height="1em"
            animated={animated}
            className="skeleton-poker-table__pot-label"
          />
          <Skeleton
            variant="text"
            width="40px"
            height="1.2em"
            animated={animated}
            className="skeleton-poker-table__pot-amount"
          />
        </div>
      )}
    </div>
  );
};

// Skeleton Chip Stack component
export const SkeletonChipStack = ({
  chips = 5,
  animated = true,
  className = '',
  style = {},
  ...props
}) => {
  const getStackClasses = () => {
    const classes = [
      'skeleton-chip-stack',
      animated && 'skeleton-chip-stack--animated',
      className
    ].filter(Boolean).join(' ');

    return classes;
  };

  return (
    <div className={getStackClasses()} style={style} {...props}>
      {Array.from({ length: chips }, (_, index) => (
        <div
          key={`chip-${index}`}
          className="skeleton-chip-stack__chip"
          style={{
            position: 'absolute',
            bottom: `${index * 2}px`,
            zIndex: chips - index
          }}
        >
          <Skeleton
            variant="circular"
            width={40}
            height={40}
            animated={animated}
            className="skeleton-chip-stack__chip-skeleton"
          />
        </div>
      ))}
    </div>
  );
};

// Loading Screen component
export const LoadingScreen = ({
  variant = 'default',
  message = 'Loading...',
  progress = null,
  animated = true,
  className = '',
  style = {},
  ...props
}) => {
  const getLoadingClasses = () => {
    const classes = [
      'loading-screen',
      `loading-screen--${variant}`,
      animated && 'loading-screen--animated',
      className
    ].filter(Boolean).join(' ');

    return classes;
  };

  const renderDefaultLoading = () => (
    <div className={getLoadingClasses()} style={style} {...props}>
      <div className="loading-screen__spinner" />
      <div className="loading-screen__message">{message}</div>
      {progress !== null && (
        <div className="loading-screen__progress">
          <div
            className="loading-screen__progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );

  const renderPokerLoading = () => (
    <div className={getLoadingClasses()} style={style} {...props}>
      <div className="loading-screen__poker-spinner">
        <div className="loading-screen__poker-card">
          <Skeleton
            variant="rectangular"
            width={60}
            height={84}
            animated={animated}
          />
        </div>
        <div className="loading-screen__poker-card">
          <Skeleton
            variant="rectangular"
            width={60}
            height={84}
            animated={animated}
          />
        </div>
        <div className="loading-screen__poker-card">
          <Skeleton
            variant="rectangular"
            width={60}
            height={84}
            animated={animated}
          />
        </div>
      </div>
      <div className="loading-screen__message">{message}</div>
      {progress !== null && (
        <div className="loading-screen__progress">
          <div
            className="loading-screen__progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );

  switch (variant) {
    case 'poker':
      return renderPokerLoading();
    default:
      return renderDefaultLoading();
  }
};

export default Skeleton;
