/**
 * Responsive Layout Component
 * Provides responsive layout utilities and breakpoints
 */

import React, { useState, useEffect } from 'react';

const ResponsiveLayout = ({ children, className = '' }) => {
  const [breakpoint, setBreakpoint] = useState('xs');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      
      // Update breakpoint
      if (width < 576) {
        setBreakpoint('xs');
        setIsMobile(true);
        setIsTablet(false);
        setIsDesktop(false);
      } else if (width < 768) {
        setBreakpoint('sm');
        setIsMobile(true);
        setIsTablet(false);
        setIsDesktop(false);
      } else if (width < 992) {
        setBreakpoint('md');
        setIsMobile(false);
        setIsTablet(true);
        setIsDesktop(false);
      } else if (width < 1200) {
        setBreakpoint('lg');
        setIsMobile(false);
        setIsTablet(false);
        setIsDesktop(true);
      } else if (width < 1400) {
        setBreakpoint('xl');
        setIsMobile(false);
        setIsTablet(false);
        setIsDesktop(true);
      } else {
        setBreakpoint('2xl');
        setIsMobile(false);
        setIsTablet(false);
        setIsDesktop(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const contextValue = {
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    width: window.innerWidth,
    height: window.innerHeight
  };

  return (
    <ResponsiveContext.Provider value={contextValue}>
      <div className={`responsive-layout ${className}`}>
        {children}
      </div>
    </ResponsiveContext.Provider>
  );
};

// Context for responsive values
const ResponsiveContext = React.createContext({
  breakpoint: 'xs',
  isMobile: true,
  isTablet: false,
  isDesktop: false,
  width: 0,
  height: 0
});

// Hook for using responsive context
export const useResponsive = () => {
  const context = React.useContext(ResponsiveContext);
  if (!context) {
    throw new Error('useResponsive must be used within a ResponsiveLayout');
  }
  return context;
};

// Responsive component that renders different content based on breakpoint
export const Responsive = ({ 
  xs, sm, md, lg, xl, xxl, 
  children, 
  className = '' 
}) => {
  const { breakpoint } = useResponsive();

  const getContent = () => {
    switch (breakpoint) {
      case 'xs': return xs || sm || md || lg || xl || xxl || children;
      case 'sm': return sm || md || lg || xl || xxl || children;
      case 'md': return md || lg || xl || xxl || children;
      case 'lg': return lg || xl || xxl || children;
      case 'xl': return xl || xxl || children;
      case '2xl': return xxl || children;
      default: return children;
    }
  };

  return (
    <div className={`responsive-component responsive-${breakpoint} ${className}`}>
      {getContent()}
    </div>
  );
};

// Mobile-only component
export const MobileOnly = ({ children, className = '' }) => {
  const { isMobile } = useResponsive();
  
  if (!isMobile) return null;
  
  return (
    <div className={`mobile-only ${className}`}>
      {children}
    </div>
  );
};

// Tablet-only component
export const TabletOnly = ({ children, className = '' }) => {
  const { isTablet } = useResponsive();
  
  if (!isTablet) return null;
  
  return (
    <div className={`tablet-only ${className}`}>
      {children}
    </div>
  );
};

// Desktop-only component
export const DesktopOnly = ({ children, className = '' }) => {
  const { isDesktop } = useResponsive();
  
  if (!isDesktop) return null;
  
  return (
    <div className={`desktop-only ${className}`}>
      {children}
    </div>
  );
};

// Hide on mobile component
export const HideOnMobile = ({ children, className = '' }) => {
  const { isMobile } = useResponsive();
  
  if (isMobile) return null;
  
  return (
    <div className={`hide-on-mobile ${className}`}>
      {children}
    </div>
  );
};

// Hide on desktop component
export const HideOnDesktop = ({ children, className = '' }) => {
  const { isDesktop } = useResponsive();
  
  if (isDesktop) return null;
  
  return (
    <div className={`hide-on-desktop ${className}`}>
      {children}
    </div>
  );
};

// Responsive grid component
export const ResponsiveGrid = ({ 
  children, 
  cols = { xs: 1, sm: 2, md: 3, lg: 4, xl: 5, xxl: 6 },
  gap = 'md',
  className = '' 
}) => {
  const { breakpoint } = useResponsive();
  
  const getCols = () => {
    return cols[breakpoint] || cols.xs || 1;
  };
  
  const getGapClass = () => {
    const gapMap = {
      xs: 'gap-xs',
      sm: 'gap-sm',
      md: 'gap-md',
      lg: 'gap-lg',
      xl: 'gap-xl',
      xxl: 'gap-2xl'
    };
    return gapMap[gap] || gapMap.md;
  };

  return (
    <div 
      className={`responsive-grid grid-cols-${getCols()} ${getGapClass()} ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${getCols()}, 1fr)`,
        gap: `var(--spacing-${gap})`
      }}
    >
      {children}
    </div>
  );
};

// Responsive container component
export const ResponsiveContainer = ({ 
  children, 
  fluid = false, 
  className = '' 
}) => {
  return (
    <div className={`${fluid ? 'container-fluid' : 'container'} ${className}`}>
      {children}
    </div>
  );
};

// Responsive row component
export const ResponsiveRow = ({ children, className = '' }) => {
  return (
    <div className={`row ${className}`}>
      {children}
    </div>
  );
};

// Responsive column component
export const ResponsiveCol = ({ 
  children, 
  xs, sm, md, lg, xl, xxl,
  className = '' 
}) => {
  const classes = ['col'];
  
  if (xs) classes.push(`col-xs-${xs}`);
  if (sm) classes.push(`col-sm-${sm}`);
  if (md) classes.push(`col-md-${md}`);
  if (lg) classes.push(`col-lg-${lg}`);
  if (xl) classes.push(`col-xl-${xl}`);
  if (xxl) classes.push(`col-2xl-${xxl}`);
  
  return (
    <div className={`${classes.join(' ')} ${className}`}>
      {children}
    </div>
  );
};

// Responsive text component
export const ResponsiveText = ({ 
  children, 
  xs, sm, md, lg, xl, xxl,
  className = '' 
}) => {
  const { breakpoint } = useResponsive();
  
  const getSize = () => {
    switch (breakpoint) {
      case 'xs': return xs || sm || md || lg || xl || xxl || 'base';
      case 'sm': return sm || md || lg || xl || xxl || 'base';
      case 'md': return md || lg || xl || xxl || 'base';
      case 'lg': return lg || xl || xxl || 'base';
      case 'xl': return xl || xxl || 'base';
      case '2xl': return xxl || 'base';
      default: return 'base';
    }
  };

  return (
    <div className={`text-${getSize()} ${className}`}>
      {children}
    </div>
  );
};

// Responsive spacing component
export const ResponsiveSpacing = ({ 
  children, 
  size = 'md',
  direction = 'y',
  className = '' 
}) => {
  return (
    <div className={`p-${direction}-${size} ${className}`}>
      {children}
    </div>
  );
};

// Responsive flex component
export const ResponsiveFlex = ({ 
  children, 
  direction = { xs: 'column', sm: 'row' },
  justify = 'center',
  align = 'center',
  wrap = false,
  className = '' 
}) => {
  const { breakpoint } = useResponsive();
  
  const getDirection = () => {
    if (typeof direction === 'string') return direction;
    return direction[breakpoint] || direction.xs || 'column';
  };
  
  const getClasses = () => {
    const classes = ['flex', `flex-${getDirection()}`];
    
    if (justify) classes.push(`justify-${justify}`);
    if (align) classes.push(`items-${align}`);
    if (wrap) classes.push('flex-wrap');
    
    return classes;
  };

  return (
    <div className={`${getClasses().join(' ')} ${className}`}>
      {children}
    </div>
  );
};

// Responsive card component
export const ResponsiveCard = ({ 
  children, 
  padding = { xs: 'sm', sm: 'md', lg: 'lg' },
  className = '' 
}) => {
  const { breakpoint } = useResponsive();
  
  const getPadding = () => {
    if (typeof padding === 'string') return padding;
    return padding[breakpoint] || padding.xs || 'md';
  };

  return (
    <div className={`card card-padding-${getPadding()} ${className}`}>
      {children}
    </div>
  );
};

// Responsive button component
export const ResponsiveButton = ({ 
  children, 
  size = { xs: 'sm', sm: 'md', lg: 'lg' },
  fullWidth = { xs: true, sm: false },
  className = '' 
}) => {
  const { breakpoint } = useResponsive();
  
  const getSize = () => {
    if (typeof size === 'string') return size;
    return size[breakpoint] || size.xs || 'md';
  };
  
  const getFullWidth = () => {
    if (typeof fullWidth === 'boolean') return fullWidth;
    return fullWidth[breakpoint] !== false;
  };

  return (
    <button 
      className={`btn btn-${getSize()} ${getFullWidth() ? 'w-100' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

// Custom hook for breakpoint-specific effects
export const useBreakpointEffect = (effect, deps = []) => {
  const { breakpoint } = useResponsive();
  
  useEffect(() => {
    effect(breakpoint);
  }, [breakpoint, ...deps]);
};

// Custom hook for media queries
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
};

// Hook for orientation
export const useOrientation = () => {
  const [orientation, setOrientation] = useState('portrait');

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    handleOrientationChange();
    window.addEventListener('resize', handleOrientationChange);
    
    return () => window.removeEventListener('resize', handleOrientationChange);
  }, []);

  return orientation;
};

// Hook for device detection
export const useDevice = () => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const orientation = useOrientation();
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
    isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    isRetina: window.devicePixelRatio > 1
  };
};

export default ResponsiveLayout;
