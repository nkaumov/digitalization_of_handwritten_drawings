from __future__ import annotations

from collections import OrderedDict
from dataclasses import dataclass
from typing import Iterable, List

from app.pipeline.types import PipelineStageName, StageHandler


@dataclass(frozen=True)
class PipelineStageRegistration:
    stage_name: PipelineStageName
    module_id: str
    handler_id: str


@dataclass(frozen=True)
class PipelineStageDescriptor:
    stage_name: PipelineStageName
    module_id: str
    handler_id: str
    handler: StageHandler


class PipelineStageRegistry:
    """Registration container for ordered pipeline stage handlers."""

    def __init__(self) -> None:
        self._stages: "OrderedDict[PipelineStageName, PipelineStageDescriptor]" = OrderedDict()
        self._sequence = 0

    def register(
        self,
        stage_name: PipelineStageName,
        handler: StageHandler,
        *,
        module_id: str = "pipeline-stage-module",
    ) -> PipelineStageRegistration:
        self._sequence += 1
        descriptor = PipelineStageDescriptor(
            stage_name=stage_name,
            module_id=module_id,
            handler_id=f"{stage_name}:{self._sequence}",
            handler=handler,
        )
        self._stages[stage_name] = descriptor
        return PipelineStageRegistration(
            stage_name=descriptor.stage_name,
            module_id=descriptor.module_id,
            handler_id=descriptor.handler_id,
        )

    def unregister(self, stage_name: PipelineStageName) -> bool:
        return self._stages.pop(stage_name, None) is not None

    def clear(self) -> None:
        self._stages.clear()

    def names(self) -> List[PipelineStageName]:
        return list(self._stages.keys())

    def items(self) -> Iterable[tuple[PipelineStageName, StageHandler]]:
        return ((stage_name, descriptor.handler) for stage_name, descriptor in self._stages.items())

    def descriptors(self) -> Iterable[PipelineStageDescriptor]:
        return self._stages.values()
