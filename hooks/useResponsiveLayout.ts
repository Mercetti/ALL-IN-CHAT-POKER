import React, { useState } from 'react';
import { Dimensions } from 'react-native';

interface ResponsiveLayout {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
}

export const useResponsiveLayout = (): ResponsiveLayout => {
  const [layout, setLayout] = useState<ResponsiveLayout>(() => {
    const { width, height } = Dimensions.get('window');
    return {
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
      screenWidth: width,
      screenHeight: height,
    };
  });

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setLayout({
        isMobile: window.width < 768,
        isTablet: window.width >= 768 && window.width < 1024,
        isDesktop: window.width >= 1024,
        screenWidth: window.width,
        screenHeight: window.height,
      });
    });

    return () => subscription?.remove();
  }, []);

  return layout;
};
