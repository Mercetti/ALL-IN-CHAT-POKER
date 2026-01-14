import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const isTablet = () => {
  const aspectRatio = width / height;
  return width >= 768 || aspectRatio < 1.6;
};

export const isMobile = () => !isTablet();

export const getResponsiveValue = (tablet: any, mobile: any) => {
  return isTablet() ? tablet : mobile;
};
