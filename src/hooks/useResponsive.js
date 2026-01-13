/**
 * Responsive Hook
 * Custom hooks for responsive design and breakpoint detection
 */

import { useState, useEffect } from 'react';

// Breakpoint definitions
export const BREAKPOINTS = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400
};

// Hook for getting current breakpoint
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState('xs');
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const updateBreakpoint = () => {
      const currentWidth = window.innerWidth;
      setWidth(currentWidth);
      
      if (currentWidth < BREAKPOINTS.sm) {
        setBreakpoint('xs');
      } else if (currentWidth < BREAKPOINTS.md) {
        setBreakpoint('sm');
      } else if (currentWidth < BREAKPOINTS.lg) {
        setBreakpoint('md');
      } else if (currentWidth < BREAKPOINTS.xl) {
        setBreakpoint('lg');
      } else if (currentWidth < BREAKPOINTS.xxl) {
        setBreakpoint('xl');
      } else {
        setBreakpoint('xxl');
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return { breakpoint, width };
};

// Hook for checking if current breakpoint matches
export const useBreakpointMatch = (targetBreakpoint) => {
  const { breakpoint } = useBreakpoint();
  return breakpoint === targetBreakpoint;
};

// Hook for checking if current breakpoint is above minimum
export const useBreakpointMin = (minBreakpoint) => {
  const { breakpoint } = useBreakpoint();
  const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
  const currentIndex = breakpointOrder.indexOf(breakpoint);
  const minIndex = breakpointOrder.indexOf(minBreakpoint);
  return currentIndex >= minIndex;
};

// Hook for checking if current breakpoint is below maximum
export const useBreakpointMax = (maxBreakpoint) => {
  const { breakpoint } = useBreakpoint();
  const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
  const currentIndex = breakpointOrder.indexOf(breakpoint);
  const maxIndex = breakpointOrder.indexOf(maxBreakpoint);
  return currentIndex <= maxIndex;
};

// Hook for checking if current breakpoint is in range
export const useBreakpointRange = (minBreakpoint, maxBreakpoint) => {
  const { breakpoint } = useBreakpoint();
  const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
  const currentIndex = breakpointOrder.indexOf(breakpoint);
  const minIndex = breakpointOrder.indexOf(minBreakpoint);
  const maxIndex = breakpointOrder.indexOf(maxBreakpoint);
  return currentIndex >= minIndex && currentIndex <= maxIndex;
};

// Hook for mobile detection
export const useMobile = () => {
  const isMobile = useBreakpointMax('sm');
  return isMobile;
};

// Hook for tablet detection
export const useTablet = () => {
  const isTablet = useBreakpointRange('md', 'lg');
  return isTablet;
};

// Hook for desktop detection
export const useDesktop = () => {
  const isDesktop = useBreakpointMin('lg');
  return isDesktop;
};

// Hook for window dimensions
export const useWindowDimensions = () => {
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0
  });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return dimensions;
};

// Hook for device orientation
export const useOrientation = () => {
  const [orientation, setOrientation] = useState('portrait');

  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    
    return () => window.removeEventListener('resize', updateOrientation);
  }, []);

  return orientation;
};

// Hook for device pixel ratio
export const useDevicePixelRatio = () => {
  const [pixelRatio, setPixelRatio] = useState(1);

  useEffect(() => {
    setPixelRatio(window.devicePixelRatio || 1);
  }, []);

  return pixelRatio;
};

// Hook for retina display detection
export const useRetina = () => {
  const pixelRatio = useDevicePixelRatio();
  return pixelRatio > 1;
};

// Hook for touch device detection
export const useTouch = () => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0 || 
      navigator.msMaxTouchPoints > 0
    );
  }, []);

  return isTouch;
};

// Hook for media query matching
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (event) => setMatches(event.matches);
    
    if (media.addEventListener) {
      media.addEventListener('change', listener);
    } else {
      media.addListener(listener);
    }

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', listener);
      } else {
        media.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
};

// Hook for responsive value that changes based on breakpoint
export const useResponsiveValue = (values) => {
  const { breakpoint } = useBreakpoint();
  
  const getValue = () => {
    if (typeof values === 'string' || typeof values === 'number') {
      return values;
    }
    
    const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
    const currentIndex = breakpointOrder.indexOf(breakpoint);
    
    // Find the largest breakpoint that has a value
    for (let i = currentIndex; i >= 0; i--) {
      const bp = breakpointOrder[i];
      if (values[bp] !== undefined) {
        return values[bp];
      }
    }
    
    // Return default or first available value
    return values.xs || values.sm || values.md || values.lg || values.xl || values.xxl || '';
  };

  return getValue();
};

// Hook for responsive styles
export const useResponsiveStyles = (styles) => {
  const { breakpoint } = useBreakpoint();
  
  const getStyles = () => {
    if (typeof styles === 'string') {
      return styles;
    }
    
    const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
    const currentIndex = breakpointOrder.indexOf(breakpoint);
    
    // Find the largest breakpoint that has styles
    for (let i = currentIndex; i >= 0; i--) {
      const bp = breakpointOrder[i];
      if (styles[bp] !== undefined) {
        return styles[bp];
      }
    }
    
    // Return default or first available styles
    return styles.xs || styles.sm || styles.md || styles.lg || styles.xl || styles.xxl || {};
  };

  return getStyles();
};

// Hook for responsive grid columns
export const useResponsiveColumns = (columns) => {
  const { breakpoint } = useBreakpoint();
  
  const getColumns = () => {
    if (typeof columns === 'number') {
      return columns;
    }
    
    const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
    const currentIndex = breakpointOrder.indexOf(breakpoint);
    
    // Find the largest breakpoint that has columns
    for (let i = currentIndex; i >= 0; i--) {
      const bp = breakpointOrder[i];
      if (columns[bp] !== undefined) {
        return columns[bp];
      }
    }
    
    // Return default or first available columns
    return columns.xs || columns.sm || columns.md || columns.lg || columns.xl || columns.xxl || 1;
  };

  return getColumns();
};

// Hook for responsive spacing
export const useResponsiveSpacing = (spacing) => {
  const { breakpoint } = useBreakpoint();
  
  const getSpacing = () => {
    if (typeof spacing === 'string') {
      return spacing;
    }
    
    const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
    const currentIndex = breakpointOrder.indexOf(breakpoint);
    
    // Find the largest breakpoint that has spacing
    for (let i = currentIndex; i >= 0; i--) {
      const bp = breakpointOrder[i];
      if (spacing[bp] !== undefined) {
        return spacing[bp];
      }
    }
    
    // Return default or first available spacing
    return spacing.xs || spacing.sm || spacing.md || spacing.lg || spacing.xl || spacing.xxl || 'md';
  };

  return getSpacing();
};

// Hook for device detection
export const useDevice = () => {
  const isMobile = useMobile();
  const isTablet = useTablet();
  const isDesktop = useDesktop();
  const orientation = useOrientation();
  const isTouch = useTouch();
  const isRetina = useRetina();
  const { width, height } = useWindowDimensions();

  return {
    isMobile,
    isTablet,
    isDesktop,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
    isTouch,
    isRetina,
    width,
    height,
    aspectRatio: width / height
  };
};

// Hook for responsive container width
export const useContainerWidth = () => {
  const { width } = useWindowDimensions();
  const { breakpoint } = useBreakpoint();
  
  const containerWidths = {
    xs: '100%',
    sm: '540px',
    md: '720px',
    lg: '960px',
    xl: '1140px',
    xxl: '1320px'
  };

  return containerWidths[breakpoint] || containerWidths.xs;
};

// Hook for responsive font size
export const useResponsiveFontSize = (fontSizes) => {
  const { breakpoint } = useBreakpoint();
  
  const getFontSize = () => {
    if (typeof fontSizes === 'string' || typeof fontSizes === 'number') {
      return fontSizes;
    }
    
    const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
    const currentIndex = breakpointOrder.indexOf(breakpoint);
    
    // Find the largest breakpoint that has font size
    for (let i = currentIndex; i >= 0; i--) {
      const bp = breakpointOrder[i];
      if (fontSizes[bp] !== undefined) {
        return fontSizes[bp];
      }
    }
    
    // Return default or first available font size
    return fontSizes.xs || fontSizes.sm || fontSizes.md || fontSizes.lg || fontSizes.xl || fontSizes.xxl || '16px';
  };

  return getFontSize();
};

// Hook for viewport units
export const useViewportUnits = () => {
  const { width, height } = useWindowDimensions();
  
  return {
    vw: (percent) => (width * percent) / 100,
    vh: (percent) => (height * percent) / 100,
    vmin: (percent) => (Math.min(width, height) * percent) / 100,
    vmax: (percent) => (Math.max(width, height) * percent) / 100
  };
};

// Hook for safe area insets
export const useSafeAreaInsets = () => {
  const [insets, setInsets] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  });

  useEffect(() => {
    const updateInsets = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      setInsets({
        top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || 0),
        right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || 0),
        bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || 0),
        left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || 0)
      });
    };

    updateInsets();
    window.addEventListener('resize', updateInsets);
    
    return () => window.removeEventListener('resize', updateInsets);
  }, []);

  return insets;
};

// Hook for reduced motion preference
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (event) => setPrefersReducedMotion(event.matches);
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
    } else {
      mediaQuery.addListener(listener);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', listener);
      } else {
        mediaQuery.removeListener(listener);
      }
    };
  }, []);

  return prefersReducedMotion;
};

// Hook for color scheme preference
export const useColorScheme = () => {
  const [colorScheme, setColorScheme] = useState('light');

  useEffect(() => {
    const updateColorScheme = () => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setColorScheme(prefersDark ? 'dark' : 'light');
    };

    updateColorScheme();
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (event) => setColorScheme(event.matches ? 'dark' : 'light');
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
    } else {
      mediaQuery.addListener(listener);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', listener);
      } else {
        mediaQuery.removeListener(listener);
      }
    };
  }, []);

  return colorScheme;
};

// Hook for responsive debounce
export const useResponsiveDebounce = (callback, delay = 300) => {
  const { width } = useWindowDimensions();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      callback(width);
    }, delay);

    return () => clearTimeout(timer);
  }, [width, callback, delay]);
};

// Hook for responsive throttle
export const useResponsiveThrottle = (callback, delay = 100) => {
  const { width } = useWindowDimensions();
  const [lastCall, setLastCall] = useState(0);
  
  useEffect(() => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      callback(width);
      setLastCall(now);
    }
  }, [width, callback, delay, lastCall]);
};

export default {
  useBreakpoint,
  useBreakpointMatch,
  useBreakpointMin,
  useBreakpointMax,
  useBreakpointRange,
  useMobile,
  useTablet,
  useDesktop,
  useWindowDimensions,
  useOrientation,
  useDevicePixelRatio,
  useRetina,
  useTouch,
  useMediaQuery,
  useResponsiveValue,
  useResponsiveStyles,
  useResponsiveColumns,
  useResponsiveSpacing,
  useDevice,
  useContainerWidth,
  useResponsiveFontSize,
  useViewportUnits,
  useSafeAreaInsets,
  useReducedMotion,
  useColorScheme,
  useResponsiveDebounce,
  useResponsiveThrottle
};
