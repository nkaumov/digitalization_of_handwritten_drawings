from __future__ import annotations

from collections import OrderedDict
from typing import Iterable, List

from app.pipeline.types import PipelineStageName, StageHandler


class PipelineStageRegistry:
    """Registration container for ordered pipeline stage handlers."""

    def __init__(self) -> None:
        self._stages: "OrderedDict[PipelineStageName, StageHandler]" = OrderedDict()

    def register(self, stage_name: PipelineStageName, handler: StageHandler) -> None:
        self._stages[stage_name] = handler

    def unregister(self, stage_name: PipelineStageName) -> bool:
        return self._stages.pop(stage_name, None) is not None

    def clear(self) -> None:
        self._stages.clear()

    def names(self) -> List[PipelineStageName]:
        return list(self._stages.keys())

    def items(self) -> Iterable[tuple[PipelineStageName, StageHandler]]:
        return self._stages.items()