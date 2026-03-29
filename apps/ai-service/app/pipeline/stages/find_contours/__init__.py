"""Stage domain placeholder: find-contours."""

from typing import Any, Dict


def run(context: Dict[str, Any]) -> Dict[str, Any]:
    context.setdefault("stages", []).append("find-contours")
    return context