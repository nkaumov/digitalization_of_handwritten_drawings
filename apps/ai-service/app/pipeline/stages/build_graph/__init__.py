"""Stage domain: build-graph."""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

from app.core.config import settings
from app.core.logger import get_logger
from app.pipeline.types import PipelineStageInput, PipelineStageOutput

logger = get_logger(__name__)


@dataclass(frozen=True)
class GraphNode:
    id: str
    x: int
    y: int


@dataclass(frozen=True)
class GraphEdge:
    id: str
    node_a: str
    node_b: str
    orientation: str
    length_px: int


@dataclass(frozen=True)
class GraphContour:
    id: str
    node_ids: List[str]
    edge_ids: List[str]
    closed: bool


def _node_key(x: int, y: int) -> Tuple[int, int]:
    return (int(x), int(y))


def _segment_points(segment: Dict[str, int], intersections: List[Dict[str, int]]) -> List[Tuple[int, int]]:
    x1, y1, x2, y2 = segment["x1"], segment["y1"], segment["x2"], segment["y2"]
    points = {_node_key(x1, y1), _node_key(x2, y2)}
    if segment["orientation"] == "horizontal":
        y = y1
        x_min, x_max = sorted((x1, x2))
        for inter in intersections:
            if inter["y"] == y and x_min <= inter["x"] <= x_max:
                points.add(_node_key(inter["x"], inter["y"]))
        return sorted(points, key=lambda p: p[0])
    x = x1
    y_min, y_max = sorted((y1, y2))
    for inter in intersections:
        if inter["x"] == x and y_min <= inter["y"] <= y_max:
            points.add(_node_key(inter["x"], inter["y"]))
    return sorted(points, key=lambda p: p[1])


def _build_nodes(points: Iterable[Tuple[int, int]]) -> Dict[Tuple[int, int], GraphNode]:
    nodes: Dict[Tuple[int, int], GraphNode] = {}
    index = 1
    for point in sorted(set(points)):
        nodes[point] = GraphNode(id=f"node-{index}", x=point[0], y=point[1])
        index += 1
    return nodes


def _build_edges(
    segments: List[Dict[str, int]],
    intersections: List[Dict[str, int]],
    nodes: Dict[Tuple[int, int], GraphNode],
) -> List[GraphEdge]:
    edges: List[GraphEdge] = []
    edge_index = 1
    for segment in segments:
        points = _segment_points(segment, intersections)
        for a, b in zip(points, points[1:]):
            node_a = nodes[a].id
            node_b = nodes[b].id
            length = abs(b[0] - a[0]) + abs(b[1] - a[1])
            edges.append(
                GraphEdge(
                    id=f"edge-{edge_index}",
                    node_a=node_a,
                    node_b=node_b,
                    orientation=segment["orientation"],
                    length_px=length,
                )
            )
            edge_index += 1
    return edges


def _build_adjacency(edges: List[GraphEdge]) -> Dict[str, List[str]]:
    adjacency: Dict[str, List[str]] = {}
    for edge in edges:
        adjacency.setdefault(edge.node_a, []).append(edge.node_b)
        adjacency.setdefault(edge.node_b, []).append(edge.node_a)
    return adjacency


def _connected_components(
    nodes: List[GraphNode],
    adjacency: Dict[str, List[str]],
) -> List[List[str]]:
    remaining = {node.id for node in nodes}
    components: List[List[str]] = []
    while remaining:
        start = next(iter(remaining))
        stack = [start]
        component: List[str] = []
        while stack:
            current = stack.pop()
            if current not in remaining:
                continue
            remaining.remove(current)
            component.append(current)
            for neighbor in adjacency.get(current, []):
                if neighbor in remaining:
                    stack.append(neighbor)
        components.append(component)
    return components


def _edges_for_component(edges: List[GraphEdge], node_ids: set[str]) -> List[GraphEdge]:
    return [edge for edge in edges if edge.node_a in node_ids and edge.node_b in node_ids]


def _is_closed_component(adjacency: Dict[str, List[str]], node_ids: Iterable[str]) -> bool:
    for node_id in node_ids:
        if len(adjacency.get(node_id, [])) != 2:
            return False
    return True


def run(stage_input: PipelineStageInput) -> PipelineStageOutput:
    context = stage_input["context"]
    meta = context.get("meta", {})
    segments = meta.get("line_segments_merged", [])
    intersections = meta.get("line_intersections", [])

    if not segments:
        return {
            "context": context,
            "stage_notes": [
                {
                    "stage": "build-graph",
                    "level": "warning",
                    "message": "no line segments available",
                }
            ],
            "debug_artifacts": [
                {
                    "stage": "build-graph",
                    "kind": "graph",
                    "meta": {"placeholder": False, "nodes": 0, "edges": 0},
                }
            ],
        }

    points = []
    for segment in segments:
        points.append(_node_key(segment["x1"], segment["y1"]))
        points.append(_node_key(segment["x2"], segment["y2"]))
    for inter in intersections:
        points.append(_node_key(inter["x"], inter["y"]))

    node_map = _build_nodes(points)
    nodes = list(node_map.values())
    edges = _build_edges(segments, intersections, node_map)
    adjacency = _build_adjacency(edges)
    components = _connected_components(nodes, adjacency)

    contours: List[GraphContour] = []
    contour_index = 1
    for component in components:
        node_set = set(component)
        component_edges = _edges_for_component(edges, node_set)
        contours.append(
            GraphContour(
                id=f"contour-{contour_index}",
                node_ids=component,
                edge_ids=[edge.id for edge in component_edges],
                closed=_is_closed_component(adjacency, component),
            )
        )
        contour_index += 1

    context.setdefault("meta", {})
    context["meta"]["graph_nodes"] = [asdict(node) for node in nodes]
    context["meta"]["graph_edges"] = [asdict(edge) for edge in edges]
    context["meta"]["graph_contours"] = [asdict(contour) for contour in contours]

    debug_path = None
    if settings.debug_artifacts_enabled:
        debug_dir = Path(settings.debug_artifacts_dir)
        debug_dir.mkdir(parents=True, exist_ok=True)
        payload = {
            "nodes": context["meta"]["graph_nodes"],
            "edges": context["meta"]["graph_edges"],
            "contours": context["meta"]["graph_contours"],
        }
        path = debug_dir / "graph.json"
        try:
            path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
            debug_path = str(path)
        except OSError as exc:
            logger.warning("Failed to write graph debug payload", extra={"error": str(exc)})

    return {
        "context": context,
        "stage_notes": [
            {
                "stage": "build-graph",
                "level": "info",
                "message": (
                    f"graph built: {len(nodes)} nodes, {len(edges)} edges, "
                    f"{len(contours)} contours"
                ),
            }
        ],
        "debug_artifacts": [
            {
                "stage": "build-graph",
                "kind": "graph",
                "meta": {
                    "nodes": len(nodes),
                    "edges": len(edges),
                    "contours": len(contours),
                    "closed": sum(1 for contour in contours if contour.closed),
                },
                **({"path": debug_path} if debug_path else {}),
            }
        ],
    }
