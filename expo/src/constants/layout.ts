/**
 * Responsive layout helpers matching expo.zip architecture.
 */

import { useWindowDimensions } from 'react-native';
import { TABLET_BREAKPOINT } from './theme';

/** Returns `true` when the viewport width is ≥ TABLET_BREAKPOINT. */
export function useIsTablet(): boolean {
  const { width } = useWindowDimensions();
  return width >= TABLET_BREAKPOINT;
}

/** Calculate responsive column count for grids. */
export function useResponsiveColumns(phoneColumns = 2, tabletColumns = 3): number {
  const isTablet = useIsTablet();
  return isTablet ? tabletColumns : phoneColumns;
}

/** Returns the current window width. */
export function useScreenWidth(): number {
  const { width } = useWindowDimensions();
  return width;
}
