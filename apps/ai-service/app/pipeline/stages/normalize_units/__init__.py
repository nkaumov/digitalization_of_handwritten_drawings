"""Stage domain placeholder: normalize-units."""

from typing import Any, Dict


def run(context: Dict[str, Any]) -> Dict[str, Any]:
    context.setdefault("stages", []).append("normalize-units")
    return context