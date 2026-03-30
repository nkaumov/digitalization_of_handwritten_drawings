import { useMemo, useState } from 'react';

import {
  INITIAL_SELECTION_STATE,
  clearSelection,
  isPointSelected,
  isSegmentSelected,
  selectPointExclusive,
  selectSegmentExclusive,
  togglePointInSelection,
  toggleSegmentInSelection,
  type PointSelectionTarget,
  type SegmentSelectionTarget,
  type SelectionState,
} from '@/domains/selection';

export interface GeometrySelectionApi {
  selection: SelectionState;
  selectedPoints: PointSelectionTarget[];
  selectedSegments: SegmentSelectionTarget[];
  selectedSegment: SegmentSelectionTarget | null;
  clear: () => void;
  selectPointExclusive: (contourId: string, pointId: string) => void;
  togglePoint: (contourId: string, pointId: string) => void;
  selectSegmentExclusive: (contourId: string, segmentId: string) => void;
  toggleSegment: (contourId: string, segmentId: string) => void;
  setSegmentsExclusive: (segments: SegmentSelectionTarget[]) => void;
  isPointSelected: (contourId: string, pointId: string) => boolean;
  isSegmentSelected: (contourId: string, segmentId: string) => boolean;
}

export function useGeometrySelection(): GeometrySelectionApi {
  const [selection, setSelection] = useState(INITIAL_SELECTION_STATE);

  return useMemo(
    () => ({
      selection,
      selectedPoints: selection.points,
      selectedSegments: selection.segments,
      selectedSegment: selection.segments[0] ?? null,
      clear: () => setSelection(clearSelection()),
      selectPointExclusive: (contourId: string, pointId: string) =>
        setSelection(selectPointExclusive(contourId, pointId)),
      togglePoint: (contourId: string, pointId: string) =>
        setSelection((current) => togglePointInSelection(current, contourId, pointId)),
      selectSegmentExclusive: (contourId: string, segmentId: string) =>
        setSelection(selectSegmentExclusive(contourId, segmentId)),
      toggleSegment: (contourId: string, segmentId: string) =>
        setSelection((current) => toggleSegmentInSelection(current, contourId, segmentId)),
      setSegmentsExclusive: (segments) =>
        setSelection({
          points: [],
          segments,
        }),
      isPointSelected: (contourId: string, pointId: string) =>
        isPointSelected(selection, contourId, pointId),
      isSegmentSelected: (contourId: string, segmentId: string) =>
        isSegmentSelected(selection, contourId, segmentId),
    }),
    [selection],
  );
}
