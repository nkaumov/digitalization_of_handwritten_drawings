"""Stage domain placeholder: assemble-result."""

from typing import Any, Dict


def run(context: Dict[str, Any]) -> Dict[str, Any]:
    context.setdefault("stages", []).append("assemble-result")
    return context