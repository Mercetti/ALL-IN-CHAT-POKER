/**
 * Touch Gesture Component
 * React component for handling touch gestures with visual feedback
 */

import React, { useState, useRef, useEffect } from 'react';
import { useGestures, useSwipe, useTap, useLongPress, useTouchFeedback } from '../hooks/useGestures';

const TouchGesture = ({
  children,
  onSwipe,
  onTap,
  onLongPress,
  onDoubleTap,
  onPinch,
  onRotate,
  feedback = true,
  className = '',
  style = {},
  gestureOptions = {}
}) => {
  const [isActive, setIsActive] = useState(false);
  const [feedbackPosition, setFeedbackPosition] = useState({ x: 0, y: 0 });
  const elementRef = useRef(null);

  // Handle tap gestures
  const { tap } = useTap((data) => {
    setIsActive(true);
    setFeedbackPosition({ x: data.x, y: data.y });
    
    if (onTap) onTap(data);
    
    setTimeout(() => setIsActive(false), 100);
  }, gestureOptions);

  // Handle long press gestures
  const { longPress } = useLongPress((data) => {
    setIsActive(true);
    setFeedbackPosition({ x: data.x, y: data.y });
    
    if (onLongPress) onLongPress(data);
    
    setTimeout(() => setIsActive(false), 200);
  }, gestureOptions);

  // Handle swipe gestures
  const { swipe } = useSwipe((data) => {
    if (onSwipe) onSwipe(data);
  }, gestureOptions);

  // Handle touch feedback
  const { feedback: touchFeedback } = useTouchFeedback({
    duration: 200
  });

  // Combined gesture handler
  const { gestures } = useGestures({
    enableSwipe: !!onSwipe,
    enableTap: !!onTap,
    enableLongPress: !!onLongPress,
    enableDoubleTap: !!onDoubleTap,
    enablePinch: !!onPinch,
    enableRotate: !!onRotate,
    ...gestureOptions
  });

  // Handle all gesture types
  useEffect(() => {
    const lastGesture = gestures[gestures.length - 1];
    if (!lastGesture) return;

    switch (lastGesture.type) {
      case 'doubletap':
        if (onDoubleTap) onDoubleTap(lastGesture.data);
        break;
      case 'pinch':
        if (onPinch) onPinch(lastGesture.data);
        break;
      case 'rotate':
        if (onRotate) onRotate(lastGesture.data);
        break;
    }
  }, [gestures, onDoubleTap, onPinch, onRotate]);

  return (
    <div
      ref={elementRef}
      className={`touch-gesture ${className}`}
      style={{
        position: 'relative',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        cursor: 'pointer',
        ...style
      }}
    >
      {children}
      
      {/* Touch feedback ripple */}
      {feedback && (isActive || touchFeedback.active) && (
        <div
          className="touch-feedback"
          style={{
            position: 'absolute',
            top: touchFeedback.active ? touchFeedback.y : feedbackPosition.y,
            left: touchFeedback.active ? touchFeedback.x : feedbackPosition.x,
            transform: 'translate(-50%, -50%)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.3)',
            border: '2px solid rgba(255, 255, 255, 0.5)',
            pointerEvents: 'none',
            animation: 'ripple 0.6s ease-out',
            zIndex: 1000
          }}
        />
      )}
      
      <style jsx>{`
        @keyframes ripple {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
          }
        }
        
        .touch-gesture {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        
        .touch-gesture * {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
      `}</style>
    </div>
  );
};

// Swipeable component for card-like interactions
export const Swipeable = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onSwipe,
  threshold = 50,
  className = '',
  style = {}
}) => {
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [isSwiping, setIsSwiping] = useState(false);

  const handleSwipe = (data) => {
    setSwipeDirection(data.direction);
    setIsSwiping(true);
    
    // Call specific direction handlers
    switch (data.direction) {
      case 'left':
        if (onSwipeLeft) onSwipeLeft(data);
        break;
      case 'right':
        if (onSwipeRight) onSwipeRight(data);
        break;
      case 'up':
        if (onSwipeUp) onSwipeUp(data);
        break;
      case 'down':
        if (onSwipeDown) onSwipeDown(data);
        break;
    }
    
    // Call general swipe handler
    if (onSwipe) onSwipe(data);
    
    setTimeout(() => {
      setIsSwiping(false);
      setSwipeDirection(null);
    }, 300);
  };

  return (
    <TouchGesture
      onSwipe={handleSwipe}
      className={`swipeable ${isSwiping ? `swiping-${swipeDirection}` : ''} ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
    >
      {children}
      
      <style jsx>{`
        .swipeable {
          transition: transform 0.3s ease;
        }
        
        .swiping-left {
          transform: translateX(-20px);
        }
        
        .swiping-right {
          transform: translateX(20px);
        }
        
        .swiping-up {
          transform: translateY(-20px);
        }
        
        .swiping-down {
          transform: translateY(20px);
        }
      `}</style>
    </TouchGesture>
  );
};

// Tappable component for button-like interactions
export const Tappable = ({
  children,
  onTap,
  onDoubleTap,
  onLongPress,
  feedback = true,
  className = '',
  style = {},
  disabled = false
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleTap = (data) => {
    if (disabled) return;
    
    setIsPressed(true);
    if (onTap) onTap(data);
    
    setTimeout(() => setIsPressed(false), 100);
  };

  const handleLongPress = (data) => {
    if (disabled) return;
    
    setIsPressed(true);
    if (onLongPress) onLongPress(data);
    
    setTimeout(() => setIsPressed(false), 200);
  };

  return (
    <TouchGesture
      onTap={handleTap}
      onDoubleTap={onDoubleTap}
      onLongPress={handleLongPress}
      feedback={feedback}
      className={`tappable ${isPressed ? 'pressed' : ''} ${disabled ? 'disabled' : ''} ${className}`}
      style={{
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s ease',
        ...style
      }}
    >
      {children}
      
      <style jsx>{`
        .tappable {
          -webkit-tap-highlight-color: transparent;
        }
        
        .tappable.pressed {
          transform: scale(0.95);
          opacity: 0.8;
        }
        
        .tappable.disabled {
          pointer-events: none;
        }
      `}</style>
    </TouchGesture>
  );
};

// Draggable component for drag-and-drop interactions
export const Draggable = ({
  children,
  onDragStart,
  onDrag,
  onDragEnd,
  onDrop,
  dragAxis = 'both',
  className = '',
  style = {}
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleSwipe = (data) => {
    if (!isDragging) {
      setIsDragging(true);
      setDragOffset({ x: data.startX, y: data.startY });
      
      if (onDragStart) {
        onDragStart({
          x: data.startX,
          y: data.startY,
          offsetX: data.startX - position.x,
          offsetY: data.startY - position.y
        });
      }
    } else {
      let newX = position.x;
      let newY = position.y;
      
      if (dragAxis === 'x' || dragAxis === 'both') {
        newX = data.endX - dragOffset.x;
      }
      
      if (dragAxis === 'y' || dragAxis === 'both') {
        newY = data.endY - dragOffset.y;
      }
      
      setPosition({ x: newX, y: newY });
      
      if (onDrag) {
        onDrag({
          x: newX,
          y: newY,
          deltaX: data.endX - data.startX,
          deltaY: data.endY - data.startY
        });
      }
    }
  };

  const handleDragEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      
      if (onDragEnd) {
        onDragEnd({
          x: position.x,
          y: position.y
        });
      }
    }
  };

  // Handle mouse up for drag end
  useEffect(() => {
    const handleMouseUp = () => handleDragEnd();
    
    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchend', handleMouseUp);
      
      return () => {
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <TouchGesture
      onSwipe={handleSwipe}
      className={`draggable ${isDragging ? 'dragging' : ''} ${className}`}
      style={{
        position: 'relative',
        cursor: isDragging ? 'grabbing' : 'grab',
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: isDragging ? 'none' : 'transform 0.2s ease',
        zIndex: isDragging ? 1000 : 1,
        ...style
      }}
    >
      {children}
      
      <style jsx>{`
        .draggable {
          touch-action: none;
        }
        
        .draggable.dragging {
          cursor: grabbing;
          opacity: 0.8;
        }
      `}</style>
    </TouchGesture>
  );
};

// Pinchable component for zoom interactions
export const Pinchable = ({
  children,
  onPinch,
  minScale = 0.5,
  maxScale = 3,
  className = '',
  style = {}
}) => {
  const [scale, setScale] = useState(1);
  const [isPinching, setIsPinching] = useState(false);

  const handlePinch = (data) => {
    const newScale = Math.max(minScale, Math.min(maxScale, scale * data.scale));
    setScale(newScale);
    setIsPinching(true);
    
    if (onPinch) {
      onPinch({
        scale: newScale,
        originalScale: scale,
        centerX: data.centerX,
        centerY: data.centerY,
        distance: data.distance
      });
    }
    
    setTimeout(() => setIsPinching(false), 100);
  };

  return (
    <TouchGesture
      onPinch={handlePinch}
      className={`pinchable ${isPinching ? 'pinching' : ''} ${className}`}
      style={{
        position: 'relative',
        transform: `scale(${scale})`,
        transformOrigin: 'center',
        transition: isPinching ? 'none' : 'transform 0.2s ease',
        ...style
      }}
    >
      {children}
      
      <style jsx>{`
        .pinchable {
          touch-action: none;
        }
        
        .pinchable.pinching {
          transition: none;
        }
      `}</style>
    </TouchGesture>
  );
};

export default TouchGesture;
