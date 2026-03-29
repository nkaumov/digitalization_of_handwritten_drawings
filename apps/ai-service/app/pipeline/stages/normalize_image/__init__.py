"""Stage domain placeholder: normalize-image."""

from typing import Any, Dict


def run(context: Dict[str, Any]) -> Dict[str, Any]:
    context.setdefault("stages", []).append("normalize-image")
    return context