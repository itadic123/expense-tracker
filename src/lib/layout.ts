import { useWindowDimensions } from 'react-native';

// At this width (desktop browser, landscape tablet) the app shows a side menu and wider pages.
export const WIDE_MIN_WIDTH = 1024;

export function useIsWide(): boolean {
  return useWindowDimensions().width >= WIDE_MIN_WIDTH;
}
