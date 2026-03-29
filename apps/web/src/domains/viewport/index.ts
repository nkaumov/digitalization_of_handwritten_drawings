export interface ViewportState {
  offsetX: number;
  offsetY: number;
  zoom: number;
}

export interface ViewportConfig {
  minZoom: number;
  maxZoom: number;
  zoomStep: number;
}

export interface ZoomAtPointInput {
  deltaY: number;
  anchorX: number;
  anchorY: number;
}

export const DEFAULT_VIEWPORT_CONFIG: ViewportConfig = {
  minZoom: 0.25,
  maxZoom: 4,
  zoomStep: 0.1,
};

export const INITIAL_VIEWPORT_STATE: ViewportState = {
  offsetX: 0,
  offsetY: 0,
  zoom: 1,
};

export function clampZoom(zoom: number, config: ViewportConfig = DEFAULT_VIEWPORT_CONFIG): number {
  return Math.min(config.maxZoom, Math.max(config.minZoom, zoom));
}

export function panViewport(state: ViewportState, deltaX: number, deltaY: number): ViewportState {
  return {
    ...state,
    offsetX: state.offsetX + deltaX,
    offsetY: state.offsetY + deltaY,
  };
}

export function zoomViewportAt(
  state: ViewportState,
  input: ZoomAtPointInput,
  config: ViewportConfig = DEFAULT_VIEWPORT_CONFIG,
): ViewportState {
  const direction = input.deltaY > 0 ? -1 : 1;
  const nextZoom = clampZoom(state.zoom * (1 + direction * config.zoomStep), config);

  if (nextZoom === state.zoom) {
    return state;
  }

  const worldX = (input.anchorX - state.offsetX) / state.zoom;
  const worldY = (input.anchorY - state.offsetY) / state.zoom;

  return {
    zoom: nextZoom,
    offsetX: input.anchorX - worldX * nextZoom,
    offsetY: input.anchorY - worldY * nextZoom,
  };
}

export function resetViewport(): ViewportState {
  return INITIAL_VIEWPORT_STATE;
}
