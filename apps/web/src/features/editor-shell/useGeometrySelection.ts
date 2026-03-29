import { useMemo, useState } from 'react';

import {
  INITIAL_SELECTION_STATE,
  clearSelection,
  isPointSelected,
  isSegmentSelected,
  selectPoint,
  selectSegment,
  type SelectionState,
} from '@/domains/selection';

export interface GeometrySelectionApi {
  selection: SelectionState;
  clear: () => void;
  selectPoint: (contourId: string, pointId: string) => void;
  selectSegment: (contourId: string, segmentId: string) => void;
  isPointSelected: (contourId: string, pointId: string) => boolean;
  isSegmentSelected: (contourId: string, segmentId: string) => boolean;
}

export function useGeometrySelection(): GeometrySelectionApi {
  const [selection, setSelection] = useState(INITIAL_SELECTION_STATE);

  return useMemo(
    () => ({
      selection,
      clear: () => setSelection(clearSelection()),
      selectPoint: (contourId: string, pointId: string) => setSelection(selectPoint(contourId, pointId)),
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
