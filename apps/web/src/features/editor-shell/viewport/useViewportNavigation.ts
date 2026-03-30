import { useCallback, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from 'react';

import { computeGridVisualState } from '@/domains/grid';
import { GEOMETRY_CANVAS_HEIGHT, GEOMETRY_CANVAS_WIDTH } from '@/domains/geometry';
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
    const target = event.target as HTMLElement | null;
    if (target?.closest('[data-interactive="true"]')) {
      return;
    }

    if (event.button !== 1) {
      return;
    }

    event.preventDefault();
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

    const rect = event.currentTarget.getBoundingClientRect();
    const unitScaleX = GEOMETRY_CANVAS_WIDTH / Math.max(rect.width, 1);
    const unitScaleY = GEOMETRY_CANVAS_HEIGHT / Math.max(rect.height, 1);
    const deltaX = (event.clientX - panState.lastClientX) * unitScaleX;
    const deltaY = (event.clientY - panState.lastClientY) * unitScaleY;

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
    const anchorX = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * GEOMETRY_CANVAS_WIDTH;
    const anchorY = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * GEOMETRY_CANVAS_HEIGHT;

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
        anchorX: GEOMETRY_CANVAS_WIDTH / 2,
        anchorY: GEOMETRY_CANVAS_HEIGHT / 2,
      }),
    );
  }, []);

  const zoomOut = useCallback(() => {
    setViewport((current) =>
      zoomViewportAt(current, {
        deltaY: 1,
        anchorX: GEOMETRY_CANVAS_WIDTH / 2,
        anchorY: GEOMETRY_CANVAS_HEIGHT / 2,
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
