from app.core.logger import get_logger
from app.pipeline.stages.assemble_result import run as run_assemble_result
from app.pipeline.stages.build_graph import run as run_build_graph
from app.pipeline.stages.detect_lines import run as run_detect_lines
from app.pipeline.stages.detect_text import run as run_detect_text
from app.pipeline.stages.find_contours import run as run_find_contours
from app.pipeline.stages.normalize_image import run as run_normalize_image
from app.pipeline.stages.normalize_units import run as run_normalize_units
from app.pipeline.stages.parse_dimensions import run as run_parse_dimensions

logger = get_logger(__name__)


class PipelineRunner:
    """Placeholder pipeline orchestrator for future recognition flow."""

    def run(self, image_path: str) -> dict:
        context: dict = {
            "image_path": image_path,
            "warnings": [],
            "stages": [],
        }

        for stage in (
            run_normalize_image,
            run_detect_lines,
            run_detect_text,
            run_parse_dimensions,
            run_build_graph,
            run_find_contours,
            run_normalize_units,
            run_assemble_result,
        ):
            context = stage(context)

        logger.info("Pipeline placeholder completed", extra={"stage_count": len(context["stages"])})
        return context