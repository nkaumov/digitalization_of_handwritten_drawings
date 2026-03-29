"""Stage domain placeholder: detect-text."""

from typing import Any, Dict


def run(context: Dict[str, Any]) -> Dict[str, Any]:
    context.setdefault("stages", []).append("detect-text")
    return context