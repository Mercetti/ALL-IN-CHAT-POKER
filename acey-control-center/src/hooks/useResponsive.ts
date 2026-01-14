import { useWindowDimensions } from 'react-native';

export interface ResponsiveValues {
  isTablet: boolean;
  isPhone: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
  width: number;
  height: number;
  screenWidth: number;
  screenHeight: number;
}

export const useResponsive = (): ResponsiveValues => {
  const { width, height } = useWindowDimensions();
  
  const isTablet = width >= 768;
  const isPhone = !isTablet;
  const isLandscape = width > height;
  const isPortrait = !isLandscape;
  
  return {
    isTablet,
    isPhone,
    isLandscape,
    isPortrait,
    width,
    height,
    screenWidth: width,
    screenHeight: height,
  };
};

export default useResponsive;
