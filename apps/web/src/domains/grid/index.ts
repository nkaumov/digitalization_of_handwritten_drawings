import type { ViewportState } from '@/domains/viewport';

export interface GridConfig {
  baseSize: number;
  majorStep: number;
  enabled: boolean;
}

export interface GridVisualState {
  backgroundSize: string;
  backgroundPosition: string;
}

export const DEFAULT_GRID_CONFIG: GridConfig = {
  baseSize: 24,
  majorStep: 5,
  enabled: true,
};

export function computeGridVisualState(
  viewport: ViewportState,
  config: GridConfig = DEFAULT_GRID_CONFIG,
): GridVisualState {
  const scaledSize = Math.max(config.baseSize * viewport.zoom, 8);

  return {
    backgroundSize: `${scaledSize}px ${scaledSize}px`,
    backgroundPosition: `${viewport.offsetX}px ${viewport.offsetY}px`,
  };
}
