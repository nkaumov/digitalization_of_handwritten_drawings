"""Stage domain placeholder: parse-dimensions."""

from typing import Any, Dict


def run(context: Dict[str, Any]) -> Dict[str, Any]:
    context.setdefault("stages", []).append("parse-dimensions")
    return context