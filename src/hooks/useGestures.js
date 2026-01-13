/**
 * Use Gestures Hook
 * React hook for handling touch gestures
 */

/* global setTimeout, clearTimeout */

import { useState, useEffect, useRef, useCallback } from 'react';
import GestureRecognizer from '../utils/gesture-recognizer';

export const useGestures = (options = {}) => {
  const [gestures, setGestures] = useState([]);
  const [isTracking, setIsTracking] = useState(false);
  const recognizerRef = useRef(null);
  const elementRef = useRef(null);

  // Initialize gesture recognizer
  useEffect(() => {
    recognizerRef.current = new GestureRecognizer({
      enableLogging: false,
      ...options
    });

    recognizerRef.current.onGesture = (gesture) => {
      setGestures(prev => [...prev.slice(-9), gesture]); // Keep last 10 gestures
    };

    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.destroy();
      }
    };
  }, [options]);

  // Handle gesture events
  const handleGesture = useCallback((callback) => {
    if (recognizerRef.current) {
      recognizerRef.current.onGesture = (gesture) => {
        setGestures(prev => [...prev.slice(-9), gesture]);
        callback(gesture);
      };
    }
  }, []);

  // Clear gestures
  const clearGestures = useCallback(() => {
    setGestures([]);
    if (recognizerRef.current) {
      recognizerRef.current.clearHistory();
    }
  }, []);

  // Get gesture history
  const getGestureHistory = useCallback((type = null, limit = 50) => {
    if (recognizerRef.current) {
      return recognizerRef.current.getGestureHistory(type, limit);
    }
    return [];
  }, []);

  // Check if currently tracking
  const checkIsTracking = useCallback(() => {
    if (recognizerRef.current) {
      setIsTracking(recognizerRef.current.isCurrentlyTracking());
    }
    return false;
  }, []);

  return {
    gestures,
    isTracking,
    elementRef,
    handleGesture,
    clearGestures,
    getGestureHistory,
    checkIsTracking
  };
};

// Hook for specific gesture types
export const useSwipe = (callback, options = {}) => {
  const [swipe, setSwipe] = useState(null);
  
  const handleGesture = useCallback((gesture) => {
    if (gesture.type === 'swipe') {
      setSwipe(gesture.data);
      if (callback) callback(gesture.data);
    }
  }, [callback]);

  const { elementRef } = useGestures({
    enableSwipe: true,
    ...options,
    onGesture: handleGesture
  });

  return { swipe, elementRef };
};

// Hook for tap gestures
export const useTap = (callback, options = {}) => {
  const [tap, setTap] = useState(null);
  
  const handleGesture = useCallback((gesture) => {
    if (gesture.type === 'tap') {
      setTap(gesture.data);
      if (callback) callback(gesture.data);
    }
  }, [callback]);

  const { elementRef } = useGestures({
    enableTap: true,
    ...options,
    onGesture: handleGesture
  });

  return { tap, elementRef };
};

// Hook for double tap gestures
export const useDoubleTap = (callback, options = {}) => {
  const [doubleTap, setDoubleTap] = useState(null);
  
  const handleGesture = useCallback((gesture) => {
    if (gesture.type === 'doubletap') {
      setDoubleTap(gesture.data);
      if (callback) callback(gesture.data);
    }
  }, [callback]);

  const { elementRef } = useGestures({
    enableDoubleTap: true,
    ...options,
    onGesture: handleGesture
  });

  return { doubleTap, elementRef };
};

// Hook for long press gestures
export const useLongPress = (callback, options = {}) => {
  const [longPress, setLongPress] = useState(null);
  
  const handleGesture = useCallback((gesture) => {
    if (gesture.type === 'longpress') {
      setLongPress(gesture.data);
      if (callback) callback(gesture.data);
    }
  }, [callback]);

  const { elementRef } = useGestures({
    enableLongPress: true,
    ...options,
    onGesture: handleGesture
  });

  return { longPress, elementRef };
};

// Hook for pinch gestures
export const usePinch = (callback, options = {}) => {
  const [pinch, setPinch] = useState(null);
  
  const handleGesture = useCallback((gesture) => {
    if (gesture.type === 'pinch') {
      setPinch(gesture.data);
      if (callback) callback(gesture.data);
    }
  }, [callback]);

  const { elementRef } = useGestures({
    enablePinch: true,
    ...options,
    onGesture: handleGesture
  });

  return { pinch, elementRef };
};

// Hook for rotate gestures
export const useRotate = (callback, options = {}) => {
  const [rotate, setRotate] = useState(null);
  
  const handleGesture = useCallback((gesture) => {
    if (gesture.type === 'rotate') {
      setRotate(gesture.data);
      if (callback) callback(gesture.data);
    }
  }, [callback]);

  const { elementRef } = useGestures({
    enableRotate: true,
    ...options,
    onGesture: handleGesture
  });

  return { rotate, elementRef };
};

// Hook for swipe directions
export const useSwipeDirections = (callbacks = {}, options = {}) => {
  const [swipeDirection, setSwipeDirection] = useState(null);
  
  const handleGesture = useCallback((gesture) => {
    if (gesture.type === 'swipe') {
      const { direction } = gesture.data;
      setSwipeDirection(direction);
      
      if (callbacks[direction]) {
        callbacks[direction](gesture.data);
      }
      
      if (callbacks.onSwipe) {
        callbacks.onSwipe(gesture.data);
      }
    }
  }, [callbacks]);

  const { elementRef } = useGestures({
    enableSwipe: true,
    ...options,
    onGesture: handleGesture
  });

  return { swipeDirection, elementRef };
};

// Hook for pan gestures (continuous swipe)
export const usePan = (callback, options = {}) => {
  const [pan, setPan] = useState({ x: 0, y: 0, isPanning: false });
  const panStartRef = useRef(null);
  
  const handleGesture = useCallback((gesture) => {
    if (gesture.type === 'swipe') {
      if (!panStartRef.current) {
        panStartRef.current = {
          x: gesture.data.startX,
          y: gesture.data.startY
        };
      }
      
      setPan({
        x: gesture.data.endX - (panStartRef.current?.x || 0),
        y: gesture.data.endY - (panStartRef.current?.y || 0),
        isPanning: true
      });
      
      if (callback) {
        callback({
          x: gesture.data.endX - (panStartRef.current?.x || 0),
          y: gesture.data.endY - (panStartRef.current?.y || 0),
          ...gesture.data
        });
      }
    }
  }, [callback]);

  const resetPan = useCallback(() => {
    setPan({ x: 0, y: 0, isPanning: false });
    panStartRef.current = null;
  }, []);

  const { elementRef, gestures } = useGestures({
    enableSwipe: true,
    ...options,
    onGesture: handleGesture
  });

  // Reset pan when gesture ends
  useEffect(() => {
    const lastGesture = gestures[gestures.length - 1];
    if (lastGesture && lastGesture.type === 'swipe') {
      const timer = setTimeout(() => {
        resetPan();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [gestures, resetPan]);

  return { pan, elementRef, resetPan };
};

// Hook for drag gestures
export const useDrag = (callback, options = {}) => {
  const [drag, setDrag] = useState({ x: 0, y: 0, isDragging: false });
  const dragStartRef = useRef(null);
  
  const handleGesture = useCallback((gesture) => {
    if (gesture.type === 'swipe') {
      if (!dragStartRef.current) {
        dragStartRef.current = {
          x: gesture.data.startX,
          y: gesture.data.startY
        };
        setDrag(prev => ({ ...prev, isDragging: true }));
      }
      
      const deltaX = gesture.data.endX - dragStartRef.current.x;
      const deltaY = gesture.data.endY - dragStartRef.current.y;
      
      setDrag({
        x: deltaX,
        y: deltaY,
        isDragging: true
      });
      
      if (callback) {
        callback({
          x: deltaX,
          y: deltaY,
          startX: dragStartRef.current.x,
          startY: dragStartRef.current.y,
          ...gesture.data
        });
      }
    }
  }, [callback]);

  const resetDrag = useCallback(() => {
    setDrag({ x: 0, y: 0, isDragging: false });
    dragStartRef.current = null;
  }, []);

  const { elementRef, gestures } = useGestures({
    enableSwipe: true,
    ...options,
    onGesture: handleGesture
  });

  // Reset drag when gesture ends
  useEffect(() => {
    const lastGesture = gestures[gestures.length - 1];
    if (lastGesture && lastGesture.type === 'swipe') {
      const timer = setTimeout(() => {
        resetDrag();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [gestures, resetDrag]);

  return { drag, elementRef, resetDrag };
};

// Hook for touch feedback
export const useTouchFeedback = (options = {}) => {
  const [feedback, setFeedback] = useState({ active: false, x: 0, y: 0 });
  
  const handleGesture = useCallback((gesture) => {
    if (gesture.type === 'tap') {
      setFeedback({
        active: true,
        x: gesture.data.x,
        y: gesture.data.y
      });
      
      setTimeout(() => {
        setFeedback({ active: false, x: 0, y: 0 });
      }, options.duration || 200);
    }
  }, [options.duration]);

  const { elementRef } = useGestures({
    enableTap: true,
    ...options,
    onGesture: handleGesture
  });

  return { feedback, elementRef };
};

// Hook for gesture combinations
export const useGestureCombo = (gestures, callback, options = {}) => {
  const [combo, setCombo] = useState(null);
  const gestureSequenceRef = useRef([]);
  
  const handleGesture = useCallback((gesture) => {
    gestureSequenceRef.current.push(gesture);
    
    // Keep only last 5 gestures
    if (gestureSequenceRef.current.length > 5) {
      gestureSequenceRef.current = gestureSequenceRef.current.slice(-5);
    }
    
    // Check if gesture sequence matches the combo
    const sequence = gestureSequenceRef.current.map(g => g.type);
    const comboString = gestures.join(',');
    const sequenceString = sequence.join(',');
    
    if (sequenceString.endsWith(comboString)) {
      const comboData = {
        gestures: gestureSequenceRef.current.slice(-gestures.length),
        timestamp: Date.now()
      };
      
      setCombo(comboData);
      
      if (callback) {
        callback(comboData);
      }
      
      // Clear sequence after combo
      setTimeout(() => {
        gestureSequenceRef.current = [];
      }, options.resetDelay || 500);
    }
  }, [gestures, callback, options.resetDelay]);

  const { elementRef } = useGestures({
    ...options,
    onGesture: handleGesture
  });

  return { combo, elementRef };
};

// Hook for gesture statistics
export const useGestureStats = (options = {}) => {
  const [stats, setStats] = useState({
    total: 0,
    tap: 0,
    doubleTap: 0,
    swipe: 0,
    longPress: 0,
    pinch: 0,
    rotate: 0
  });
  
  const handleGesture = useCallback((gesture) => {
    setStats(prev => ({
      ...prev,
      total: prev.total + 1,
      [gesture.type]: prev[gesture.type] + 1
    }));
  }, []);

  const { gestures, clearGestures } = useGestures({
    ...options,
    onGesture: handleGesture
  });

  const resetStats = useCallback(() => {
    setStats({
      total: 0,
      tap: 0,
      doubleTap: 0,
      swipe: 0,
      longPress: 0,
      pinch: 0,
      rotate: 0
    });
    clearGestures();
  }, [clearGestures]);

  return { stats, gestures, resetStats };
};

export default useGestures;
