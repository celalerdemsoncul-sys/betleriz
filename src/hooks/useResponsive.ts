import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';
export const useResponsive = () => {
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    return () => subscription?.remove();
  }, []);
  const isTablet = screenData.width >= 768 || screenData.height >= 1024;
  const isLargeTablet = screenData.width >= 1024 || screenData.height >= 1366;
  const getResponsiveValue = (phone: number, tablet: number, largeTablet?: number) => {
    if (isLargeTablet && largeTablet !== undefined) return largeTablet;
    return isTablet ? tablet : phone;
  };
  return { 
    isTablet, 
    isLargeTablet, 
    screenData,
    getResponsiveValue
  };
};
