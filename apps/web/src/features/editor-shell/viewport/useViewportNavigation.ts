import { useCallback, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from 'react';

import { computeGridVisualState } from '@/domains/grid';
import {
  INITIAL_VIEWPORT_STATE,
  panViewport,
  resetViewport,
  zoomViewportAt,
  type ViewportState,
} from '@/domains/viewport';

interface PanState {
  active: boolean;
  lastClientX: number;
  lastClientY: number;
}

export interface ViewportNavigationResult {
  viewport: ViewportState;
  grid: ReturnType<typeof computeGridVisualState>;
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onWheel: (event: WheelEvent<HTMLElement>) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
}

export function useViewportNavigation(): ViewportNavigationResult {
  const [viewport, setViewport] = useState(INITIAL_VIEWPORT_STATE);
  const panStateRef = useRef<PanState>({
    active: false,
    lastClientX: 0,
    lastClientY: 0,
  });

  const grid = useMemo(() => computeGridVisualState(viewport), [viewport]);

  const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) {
      return;
    }

    panStateRef.current = {
      active: true,
      lastClientX: event.clientX,
      lastClientY: event.clientY,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const onPointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    const panState = panStateRef.current;
    if (!panState.active) {
      return;
    }

    const deltaX = event.clientX - panState.lastClientX;
    const deltaY = event.clientY - panState.lastClientY;

    panStateRef.current = {
      ...panState,
      lastClientX: event.clientX,
      lastClientY: event.clientY,
    };

    setViewport((current) => panViewport(current, deltaX, deltaY));
  }, []);

  const stopPan = useCallback(() => {
    panStateRef.current = {
      ...panStateRef.current,
      active: false,
    };
  }, []);

  const onWheel = useCallback((event: WheelEvent<HTMLElement>) => {
    event.preventDefault();

    const rect = event.currentTarget.getBoundingClientRect();
    const anchorX = event.clientX - rect.left;
    const anchorY = event.clientY - rect.top;

    setViewport((current) =>
      zoomViewportAt(current, {
        deltaY: event.deltaY,
        anchorX,
        anchorY,
      }),
    );
  }, []);

  const zoomIn = useCallback(() => {
    setViewport((current) =>
      zoomViewportAt(current, {
        deltaY: -1,
        anchorX: 0,
        anchorY: 0,
      }),
    );
  }, []);

  const zoomOut = useCallback(() => {
    setViewport((current) =>
      zoomViewportAt(current, {
        deltaY: 1,
        anchorX: 0,
        anchorY: 0,
      }),
    );
  }, []);

  const reset = useCallback(() => {
    setViewport(resetViewport());
  }, []);

  return {
    viewport,
    grid,
    onPointerDown,
    onPointerMove,
    onPointerUp: stopPan,
    onPointerLeave: stopPan,
    onWheel,
    zoomIn,
    zoomOut,
    reset,
  };
}
