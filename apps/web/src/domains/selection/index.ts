export type SelectionKind = 'point' | 'segment';

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

export type SelectionTarget = PointSelectionTarget | SegmentSelectionTarget;

export interface SelectionState {
  target: SelectionTarget | null;
}

export const INITIAL_SELECTION_STATE: SelectionState = {
  target: null,
};

export function clearSelection(): SelectionState {
  return INITIAL_SELECTION_STATE;
}

export function selectPoint(contourId: string, pointId: string): SelectionState {
  return {
    target: {
      kind: 'point',
      contourId,
      pointId,
    },
  };
}

export function selectSegment(contourId: string, segmentId: string): SelectionState {
  return {
    target: {
      kind: 'segment',
      contourId,
      segmentId,
    },
  };
}

export function isPointSelected(state: SelectionState, contourId: string, pointId: string): boolean {
  return state.target?.kind === 'point' && state.target.contourId === contourId && state.target.pointId === pointId;
}

export function isSegmentSelected(state: SelectionState, contourId: string, segmentId: string): boolean {
  return (
    state.target?.kind === 'segment' &&
    state.target.contourId === contourId &&
    state.target.segmentId === segmentId
  );
}
