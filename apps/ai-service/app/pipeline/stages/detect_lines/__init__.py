"""Stage domain placeholder: detect-lines."""

from typing import Any, Dict


def run(context: Dict[str, Any]) -> Dict[str, Any]:
    context.setdefault("stages", []).append("detect-lines")
    return context