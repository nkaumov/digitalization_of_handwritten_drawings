export interface PointSelectionTarget {
  kind: 'point';
  contourId: string;
  pointId: string;
}

export interface SegmentSelectionTarget {
  kind: 'segment';
  contourId: string;
  segmentId: string;
}

export interface SelectionState {
  points: PointSelectionTarget[];
  segments: SegmentSelectionTarget[];
}

export const INITIAL_SELECTION_STATE: SelectionState = {
  points: [],
  segments: [],
};

export function clearSelection(): SelectionState {
  return INITIAL_SELECTION_STATE;
}

export function selectSegmentExclusive(contourId: string, segmentId: string): SelectionState {
  return {
    points: [],
    segments: [
      {
        kind: 'segment',
        contourId,
        segmentId,
      },
    ],
  };
}

export function toggleSegmentInSelection(
  state: SelectionState,
  contourId: string,
  segmentId: string,
): SelectionState {
  const existing = state.segments.findIndex(
    (segment) => segment.contourId === contourId && segment.segmentId === segmentId,
  );

  if (existing >= 0) {
    return {
      points: [],
      segments: state.segments.filter((_, index) => index !== existing),
    };
  }

  const nextSegments = [...state.segments, { kind: 'segment' as const, contourId, segmentId }];

  return {
    points: [],
    segments: nextSegments,
  };
}

export function selectPointExclusive(contourId: string, pointId: string): SelectionState {
  return {
    points: [
      {
        kind: 'point',
        contourId,
        pointId,
      },
    ],
    segments: [],
  };
}

export function togglePointInSelection(
  state: SelectionState,
  contourId: string,
  pointId: string,
): SelectionState {
  const existing = state.points.findIndex(
    (point) => point.contourId === contourId && point.pointId === pointId,
  );

  if (existing >= 0) {
    return {
      points: state.points.filter((_, index) => index !== existing),
      segments: [],
    };
  }

  const nextPoints = [...state.points, { kind: 'point' as const, contourId, pointId }];

  return {
    points: nextPoints.slice(-2),
    segments: [],
  };
}

export function isPointSelected(state: SelectionState, contourId: string, pointId: string): boolean {
  return state.points.some((point) => point.contourId === contourId && point.pointId === pointId);
}

export function isSegmentSelected(state: SelectionState, contourId: string, segmentId: string): boolean {
  return state.segments.some(
    (segment) => segment.contourId === contourId && segment.segmentId === segmentId,
  );
}
