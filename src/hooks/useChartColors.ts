import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const CSS_COLOR_TOKENS = {
  primary: '--primary',
  success: '--success',
  destructive: '--destructive',
  warning: '--warning',
  info: '--info',
  muted: '--muted-foreground',
  mutedSurface: '--muted',
  border: '--border',
  foreground: '--foreground',
  card: '--card',
  chart1: '--chart-1',
  chart2: '--chart-2',
  chart3: '--chart-3',
  chart4: '--chart-4',
  chart5: '--chart-5',
} as const;

type ChartColorName = keyof typeof CSS_COLOR_TOKENS;
type ChartColors = Record<ChartColorName, string>;

function toHslColor(value: string, alpha?: number): string {
  const [hue, saturation, lightness] = value.trim().split(/\s+/);
  if (!hue || !saturation || !lightness) return 'transparent';

  return alpha === undefined
    ? `hsl(${hue}, ${saturation}, ${lightness})`
    : `hsla(${hue}, ${saturation}, ${lightness}, ${alpha})`;
}

function readChartColors(): ChartColors {
  if (typeof document === 'undefined') {
    return Object.fromEntries(
      Object.keys(CSS_COLOR_TOKENS).map((name) => [name, 'transparent'])
    ) as ChartColors;
  }

  const styles = getComputedStyle(document.documentElement);
  return Object.fromEntries(
    Object.entries(CSS_COLOR_TOKENS).map(([name, variable]) => [
      name,
      toHslColor(styles.getPropertyValue(variable)),
    ])
  ) as ChartColors;
}

/**
 * Resolves chart colors from the same CSS variables used by Tailwind/shadcn.
 * Canvas charts need concrete colors, so values are recomputed after a theme
 * change instead of duplicating light/dark hex palettes in TypeScript.
 */
export function useChartColors(): ChartColors & {
  withAlpha: (name: ChartColorName, alpha: number) => string;
} {
  const { isDark } = useTheme();
  const [colors, setColors] = useState<ChartColors>(readChartColors);

  useEffect(() => {
    setColors(readChartColors());
  }, [isDark]);

  return {
    ...colors,
    withAlpha: (name, alpha) => {
      if (typeof document === 'undefined') return 'transparent';
      const styles = getComputedStyle(document.documentElement);
      return toHslColor(styles.getPropertyValue(CSS_COLOR_TOKENS[name]), alpha);
    },
  };
}
