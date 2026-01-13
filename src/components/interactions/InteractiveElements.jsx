/**
 * Interactive Elements Component
 * Collection of enhanced interactive UI elements with micro-interactions
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Ripple, RippleButton, RippleCard, RippleIcon, RippleInput } from './Ripple';
import { 
  HoverScale, 
  HoverGlow, 
  HoverLift, 
  ClickBounce, 
  ShakeAnimation, 
  PulseAnimation,
  FadeIn,
  SlideIn,
  RotateAnimation,
  TypewriterEffect,
  LoadingDots,
  FloatingAnimation
} from './MicroInteractions';
import './InteractiveElements.css';

// Interactive Button component
export const InteractiveButton = ({
  variant = 'primary',
  size = 'medium',
  ripple = true,
  hoverScale = true,
  hoverGlow = false,
  hoverLift = false,
  clickBounce = true,
  loading = false,
  loadingText = 'Loading...',
  children,
  disabled = false,
  className = '',
  style = {},
  onClick,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(loading);

  useEffect(() => {
    setIsLoading(loading);
  }, [loading]);

  const handleClick = (event) => {
    if (disabled || isLoading) return;
    if (onClick) onClick(event);
  };

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <LoadingDots size="small" color="currentColor" />
          <span>{loadingText}</span>
        </>
      );
    }
    return children;
  };

  const ButtonComponent = ripple ? RippleButton : 'button';
  const buttonProps = ripple ? {
    variant,
    size,
    disabled: disabled || isLoading,
    onClick: handleClick,
    className: `interactive-button ${className}`,
    style,
    ...props
  } : {
    className: `interactive-button interactive-button--${variant} interactive-button--${size} ${disabled ? 'interactive-button--disabled' : ''} ${className}`,
    style,
    disabled: disabled || isLoading,
    onClick: handleClick,
    ...props
  };

  const button = (
    <ButtonComponent {...buttonProps}>
      {getButtonContent()}
    </ButtonComponent>
  );

  // Wrap with additional effects
  if (hoverScale && !ripple) {
    return (
      <HoverScale disabled={disabled || isLoading}>
        {button}
      </HoverScale>
    );
  }

  if (hoverGlow && !ripple) {
    return (
      <HoverGlow disabled={disabled || isLoading}>
        {button}
      </HoverGlow>
    );
  }

  if (hoverLift && !ripple) {
    return (
      <HoverLift disabled={disabled || isLoading}>
        {button}
      </HoverLift>
    );
  }

  if (clickBounce && !ripple) {
    return (
      <ClickBounce disabled={disabled || isLoading}>
        {button}
      </ClickBounce>
    );
  }

  return button;
};

// Interactive Card component
export const InteractiveCard = ({
  variant = 'default',
  elevation = 'medium',
  ripple = true,
  hoverScale = true,
  hoverGlow = false,
  hoverLift = true,
  clickBounce = false,
  shakeTrigger = false,
  shakeIntensity = 'medium',
  children,
  disabled = false,
  className = '',
  style = {},
  onClick,
  onShakeEnd,
  ...props
}) => {
  const handleClick = (event) => {
    if (disabled) return;
    if (onClick) onClick(event);
  };

  const CardComponent = ripple ? RippleCard : 'div';
  const cardProps = ripple ? {
    variant,
    elevation,
    disabled,
    onClick: handleClick,
    className: `interactive-card ${className}`,
    style,
    ...props
  } : {
    className: `interactive-card interactive-card--${variant} interactive-card--elevation-${elevation} ${disabled ? 'interactive-card--disabled' : ''} ${className}`,
    style,
    onClick: handleClick,
    ...props
  };

  const card = (
    <CardComponent {...cardProps}>
      {children}
    </CardComponent>
  );

  // Wrap with shake animation
  if (shakeTrigger) {
    return (
      <ShakeAnimation
        trigger={shakeTrigger}
        intensity={shakeIntensity}
        onAnimationEnd={onShakeEnd}
      >
        {card}
      </ShakeAnimation>
    );
  }

  // Wrap with additional effects
  if (hoverScale && !ripple) {
    return (
      <HoverScale disabled={disabled}>
        {card}
      </HoverScale>
    );
  }

  if (hoverGlow && !ripple) {
    return (
      <HoverGlow disabled={disabled}>
        {card}
      </HoverGlow>
    );
  }

  if (hoverLift && !ripple) {
    return (
      <HoverLift disabled={disabled}>
        {card}
      </HoverLift>
    );
  }

  if (clickBounce && !ripple) {
    return (
      <ClickBounce disabled={disabled}>
        {card}
      </ClickBounce>
    );
  }

  return card;
};

// Interactive Icon component
export const InteractiveIcon = ({
  icon,
  variant = 'primary',
  size = 'medium',
  ripple = true,
  hoverScale = true,
  hoverGlow = false,
  hoverLift = false,
  clickBounce = true,
  pulseActive = false,
  rotateActive = false,
  floatingActive = false,
  children,
  disabled = false,
  className = '',
  style = {},
  onClick,
  ...props
}) => {
  const handleClick = (event) => {
    if (disabled) return;
    if (onClick) onClick(event);
  };

  const IconComponent = ripple ? RippleIcon : 'div';
  const iconProps = ripple ? {
    icon: icon || children,
    variant,
    size,
    disabled,
    onClick: handleClick,
    className: `interactive-icon ${className}`,
    style,
    ...props
  } : {
    className: `interactive-icon interactive-icon--${variant} interactive-icon--${size} ${disabled ? 'interactive-icon--disabled' : ''} ${className}`,
    style,
    onClick: handleClick,
    ...props
  };

  const iconElement = (
    <IconComponent {...iconProps}>
      {icon || children}
    </IconComponent>
  );

  // Wrap with pulse animation
  if (pulseActive) {
    return (
      <PulseAnimation active={pulseActive} disabled={disabled}>
        {iconElement}
      </PulseAnimation>
    );
  }

  // Wrap with rotate animation
  if (rotateActive) {
    return (
      <RotateAnimation active={rotateActive} disabled={disabled}>
        {iconElement}
      </RotateAnimation>
    );
  }

  // Wrap with floating animation
  if (floatingActive) {
    return (
      <FloatingAnimation disabled={disabled}>
        {iconElement}
      </FloatingAnimation>
    );
  }

  // Wrap with additional effects
  if (hoverScale && !ripple) {
    return (
      <HoverScale disabled={disabled}>
        {iconElement}
      </HoverScale>
    );
  }

  if (hoverGlow && !ripple) {
    return (
      <HoverGlow disabled={disabled}>
        {iconElement}
      </HoverGlow>
    );
  }

  if (hoverLift && !ripple) {
    return (
      <HoverLift disabled={disabled}>
        {iconElement}
      </HoverLift>
    );
  }

  if (clickBounce && !ripple) {
    return (
      <ClickBounce disabled={disabled}>
        {iconElement}
      </ClickBounce>
    );
  }

  return iconElement;
};

// Interactive Input component
export const InteractiveInput = ({
  variant = 'outlined',
  size = 'medium',
  ripple = true,
  label,
  placeholder,
  error,
  helperText,
  value,
  onChange,
  onFocus,
  onBlur,
  disabled = false,
  className = '',
  style = {},
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  useEffect(() => {
    setHasValue(!!value);
  }, [value]);

  const handleFocus = (event) => {
    setFocused(true);
    if (onFocus) onFocus(event);
  };

  const handleBlur = (event) => {
    setFocused(false);
    if (onBlur) onBlur(event);
  };

  const handleChange = (event) => {
    setHasValue(!!event.target.value);
    if (onChange) onChange(event);
  };

  const InputComponent = ripple ? RippleInput : 'div';
  const inputProps = ripple ? {
    variant,
    size,
    value,
    onChange: handleChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
    placeholder,
    disabled,
    className: `interactive-input ${className}`,
    style,
    ...props
  } : {
    className: `interactive-input interactive-input--${variant} interactive-input--${size} ${focused ? 'interactive-input--focused' : ''} ${disabled ? 'interactive-input--disabled' : ''} ${className}`,
    style,
    ...props
  };

  const inputElement = (
    <div className="interactive-input-wrapper">
      {label && (
        <label className={`interactive-input__label ${focused || hasValue ? 'interactive-input__label--active' : ''} ${error ? 'interactive-input__label--error' : ''}`}>
          {label}
        </label>
      )}
      
      <InputComponent {...inputProps}>
        {!ripple && (
          <input
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className="interactive-input__field"
          />
        )}
      </InputComponent>
      
      {helperText && (
        <div className={`interactive-input__helper ${error ? 'interactive-input__helper--error' : ''}`}>
          {helperText}
        </div>
      )}
    </div>
  );

  return inputElement;
};

// Interactive List component
export const InteractiveList = ({
  items,
  variant = 'default',
  ripple = true,
  hoverScale = true,
  hoverGlow = false,
  hoverLift = true,
  clickBounce = false,
  animated = true,
  disabled = false,
  className = '',
  style = {},
  onItemClick,
  ...props
}) => {
  const handleItemClick = (item, index, event) => {
    if (disabled) return;
    if (onItemClick) onItemClick(item, index, event);
  };

  const getItemClasses = (item, index) => {
    return [
      'interactive-list-item',
      `interactive-list-item--${variant}`,
      item.disabled && 'interactive-list-item--disabled',
      item.selected && 'interactive-list-item--selected',
      item.active && 'interactive-list-item--active'
    ].filter(Boolean).join(' ');
  };

  const renderItem = (item, index) => {
    const ItemComponent = ripple ? RippleCard : 'div';
    const itemProps = ripple ? {
      disabled: disabled || item.disabled,
      onClick: (event) => handleItemClick(item, index, event),
      className: getItemClasses(item, index),
      style: item.style
    } : {
      className: getItemClasses(item, index),
      style: item.style,
      onClick: (event) => handleItemClick(item, index, event)
    };

    const itemElement = (
      <ItemComponent {...itemProps}>
        {item.icon && (
          <span className="interactive-list-item__icon">
            {item.icon}
          </span>
        )}
        
        <div className="interactive-list-item__content">
          <div className="interactive-list-item__title">
            {item.title}
          </div>
          
          {item.description && (
            <div className="interactive-list-item__description">
              {item.description}
            </div>
          )}
        </div>
        
        {item.badge && (
          <span className="interactive-list-item__badge">
            {item.badge}
          </span>
        )}
      </ItemComponent>
    );

    // Wrap with animations
    let wrappedItem = itemElement;

    if (animated) {
      wrappedItem = (
        <FadeIn delay={index * 50} duration={300}>
          {wrappedItem}
        </FadeIn>
      );
    }

    if (hoverScale && !ripple) {
      wrappedItem = (
        <HoverScale disabled={disabled || item.disabled}>
          {wrappedItem}
        </HoverScale>
      );
    }

    if (hoverGlow && !ripple) {
      wrappedItem = (
        <HoverGlow disabled={disabled || item.disabled}>
          {wrappedItem}
        </HoverGlow>
      );
    }

    if (hoverLift && !ripple) {
      wrappedItem = (
        <HoverLift disabled={disabled || item.disabled}>
          {wrappedItem}
        </HoverLift>
      );
    }

    if (clickBounce && !ripple) {
      wrappedItem = (
        <ClickBounce disabled={disabled || item.disabled}>
          {wrappedItem}
        </ClickBounce>
      );
    }

    return wrappedItem;
  };

  return (
    <div
      className={`interactive-list ${className}`}
      style={style}
      {...props}
    >
      {items.map((item, index) => (
        <div key={item.id || index}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
};

// Interactive Badge component
export const InteractiveBadge = ({
  variant = 'primary',
  size = 'medium',
  ripple = true,
  hoverScale = true,
  clickBounce = false,
  pulseActive = false,
  removable = false,
  onRemove,
  children,
  disabled = false,
  className = '',
  style = {},
  ...props
}) => {
  const handleRemove = (event) => {
    event.stopPropagation();
    if (onRemove) onRemove(event);
  };

  const BadgeComponent = ripple ? RippleCard : 'span';
  const badgeProps = ripple ? {
    variant: 'filled',
    elevation: 'none',
    disabled,
    className: `interactive-badge interactive-badge--${variant} interactive-badge--${size} ${className}`,
    style,
    ...props
  } : {
    className: `interactive-badge interactive-badge--${variant} interactive-badge--${size} ${disabled ? 'interactive-badge--disabled' : ''} ${className}`,
    style,
    ...props
  };

  const badge = (
    <BadgeComponent {...badgeProps}>
      <span className="interactive-badge__content">
        {children}
      </span>
      
      {removable && (
        <button
          className="interactive-badge__remove"
          onClick={handleRemove}
          disabled={disabled}
        >
          ×
        </button>
      )}
    </BadgeComponent>
  );

  // Wrap with animations
  let wrappedBadge = badge;

  if (pulseActive) {
    wrappedBadge = (
      <PulseAnimation active={pulseActive} disabled={disabled}>
        {wrappedBadge}
      </PulseAnimation>
    );
  }

  if (hoverScale && !ripple) {
    wrappedBadge = (
      <HoverScale disabled={disabled}>
        {wrappedBadge}
      </HoverScale>
    );
  }

  if (clickBounce && !ripple) {
    wrappedBadge = (
      <ClickBounce disabled={disabled}>
        {wrappedBadge}
      </ClickBounce>
    );
  }

  return wrappedBadge;
};

// Interactive Chip component (for poker chips)
export const InteractiveChip = ({
  value,
  color = 'blue',
  size = 'medium',
  ripple = true,
  hoverScale = true,
  hoverLift = true,
  clickBounce = true,
  selected = false,
  animated = true,
  disabled = false,
  onClick,
  className = '',
  style = {},
  ...props
}) => {
  const handleClick = (event) => {
    if (disabled) return;
    if (onClick) onClick(event);
  };

  const ChipComponent = ripple ? RippleCard : 'div';
  const chipProps = ripple ? {
    variant: 'filled',
    elevation: 'low',
    disabled,
    onClick: handleClick,
    className: `interactive-chip interactive-chip--${color} interactive-chip--${size} ${selected ? 'interactive-chip--selected' : ''} ${className}`,
    style,
    ...props
  } : {
    className: `interactive-chip interactive-chip--${color} interactive-chip--${size} ${selected ? 'interactive-chip--selected' : ''} ${disabled ? 'interactive-chip--disabled' : ''} ${className}`,
    style,
    onClick: handleClick,
    ...props
  };

  const chip = (
    <ChipComponent {...chipProps}>
      <div className="interactive-chip__value">
        ${value}
      </div>
      
      <div className="interactive-chip__decoration">
        <div className="interactive-chip__dot" />
        <div className="interactive-chip__dot" />
      </div>
    </ChipComponent>
  );

  // Wrap with animations
  let wrappedChip = chip;

  if (animated) {
    wrappedChip = (
      <FadeIn duration={300}>
        {wrappedChip}
      </FadeIn>
    );
  }

  if (hoverScale && !ripple) {
    wrappedChip = (
      <HoverScale disabled={disabled}>
        {wrappedChip}
      </HoverScale>
    );
  }

  if (hoverLift && !ripple) {
    wrappedChip = (
      <HoverLift disabled={disabled}>
        {wrappedChip}
      </HoverLift>
    );
  }

  if (clickBounce && !ripple) {
    wrappedChip = (
      <ClickBounce disabled={disabled}>
        {wrappedChip}
      </ClickBounce>
    );
  }

  return wrappedChip;
};

export default InteractiveElements;
