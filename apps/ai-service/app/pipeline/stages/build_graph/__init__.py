"""Stage domain placeholder: build-graph."""

from typing import Any, Dict


def run(context: Dict[str, Any]) -> Dict[str, Any]:
    context.setdefault("stages", []).append("build-graph")
    return context