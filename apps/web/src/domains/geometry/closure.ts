import type { ContourPayload, PointPayload, SegmentPayload } from '@contracts';

function hasPoint(pointById: Map<string, PointPayload>, pointId: string): boolean {
  return pointById.has(pointId);
}

export function isContourClosed(contour: ContourPayload): boolean {
  if (contour.points.length < 3 || contour.segments.length < 3) {
    return false;
  }

  const pointById = new Map(contour.points.map((point) => [point.id, point]));
  const degree = new Map<string, number>();
  const adjacency = new Map<string, Set<string>>();

  for (const point of contour.points) {
    degree.set(point.id, 0);
    adjacency.set(point.id, new Set());
  }

  for (const segment of contour.segments) {
    if (!hasPoint(pointById, segment.from) || !hasPoint(pointById, segment.to)) {
      return false;
    }

    if (segment.from === segment.to) {
      return false;
    }

    degree.set(segment.from, (degree.get(segment.from) ?? 0) + 1);
    degree.set(segment.to, (degree.get(segment.to) ?? 0) + 1);

    adjacency.get(segment.from)?.add(segment.to);
    adjacency.get(segment.to)?.add(segment.from);
  }

  if ([...degree.values()].some((value) => value !== 2)) {
    return false;
  }

  const [startPoint] = contour.points;
  if (!startPoint) {
    return false;
  }

  const visited = new Set<string>();
  const stack = [startPoint.id];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || visited.has(current)) {
      continue;
    }

    visited.add(current);

    for (const neighbor of adjacency.get(current) ?? []) {
      if (!visited.has(neighbor)) {
        stack.push(neighbor);
      }
    }
  }

  return visited.size === contour.points.length;
}

export function withClosedFlag(contour: ContourPayload): ContourPayload {
  return {
    ...contour,
    closed: isContourClosed(contour),
  };
}

export function normalizeSegmentOrder(segments: SegmentPayload[]): SegmentPayload[] {
  return segments.map((segment, index) => ({
    ...segment,
    order: index + 1,
  }));
}
