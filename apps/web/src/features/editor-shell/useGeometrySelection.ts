import { useMemo, useState } from 'react';

import {
  INITIAL_SELECTION_STATE,
  clearSelection,
  isPointSelected,
  isSegmentSelected,
  selectPointExclusive,
  selectSegment,
  togglePointInSelection,
  type PointSelectionTarget,
  type SegmentSelectionTarget,
  type SelectionState,
} from '@/domains/selection';

export interface GeometrySelectionApi {
  selection: SelectionState;
  selectedPoints: PointSelectionTarget[];
  selectedSegment: SegmentSelectionTarget | null;
  clear: () => void;
  selectPointExclusive: (contourId: string, pointId: string) => void;
  togglePoint: (contourId: string, pointId: string) => void;
  selectSegment: (contourId: string, segmentId: string) => void;
  isPointSelected: (contourId: string, pointId: string) => boolean;
  isSegmentSelected: (contourId: string, segmentId: string) => boolean;
}

export function useGeometrySelection(): GeometrySelectionApi {
  const [selection, setSelection] = useState(INITIAL_SELECTION_STATE);

  return useMemo(
    () => ({
      selection,
      selectedPoints: selection.points,
      selectedSegment: selection.segment,
      clear: () => setSelection(clearSelection()),
      selectPointExclusive: (contourId: string, pointId: string) =>
        setSelection(selectPointExclusive(contourId, pointId)),
      togglePoint: (contourId: string, pointId: string) =>
        setSelection((current) => togglePointInSelection(current, contourId, pointId)),
      selectSegment: (contourId: string, segmentId: string) =>
        setSelection(selectSegment(contourId, segmentId)),
      isPointSelected: (contourId: string, pointId: string) =>
        isPointSelected(selection, contourId, pointId),
      isSegmentSelected: (contourId: string, segmentId: string) =>
        isSegmentSelected(selection, contourId, segmentId),
    }),
    [selection],
  );
}
