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
  segment: SegmentSelectionTarget | null;
}

export const INITIAL_SELECTION_STATE: SelectionState = {
  points: [],
  segment: null,
};

export function clearSelection(): SelectionState {
  return INITIAL_SELECTION_STATE;
}

export function selectSegment(contourId: string, segmentId: string): SelectionState {
  return {
    points: [],
    segment: {
      kind: 'segment',
      contourId,
      segmentId,
    },
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
    segment: null,
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
      segment: null,
    };
  }

  const nextPoints = [...state.points, { kind: 'point' as const, contourId, pointId }];

  return {
    points: nextPoints.slice(-2),
    segment: null,
  };
}

export function isPointSelected(state: SelectionState, contourId: string, pointId: string): boolean {
  return state.points.some((point) => point.contourId === contourId && point.pointId === pointId);
}

export function isSegmentSelected(state: SelectionState, contourId: string, segmentId: string): boolean {
  return !!state.segment && state.segment.contourId === contourId && state.segment.segmentId === segmentId;
}
