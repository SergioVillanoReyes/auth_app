import { Dimensions, PixelRatio } from 'react-native';

const { width, height } = Dimensions.get('window');

export const screenWidth = width;
export const screenHeight = height;

export const wp = (percentage: number): number =>
  (screenWidth * percentage) / 100;

export const hp = (percentage: number): number =>
  (screenHeight * percentage) / 100;

export const scale = (size: number): number =>
  PixelRatio.roundToNearestPixel(size * (screenWidth / 375));

export const verticalScale = (size: number): number =>
  PixelRatio.roundToNearestPixel(size * (screenHeight / 812));

export const isSmallDevice = screenWidth < 360;

export const isTablet = screenWidth >= 768;