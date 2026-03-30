from __future__ import annotations

from fastapi import APIRouter

from app.core.logger import get_logger
from app.pipeline.runner import PipelineRunner
from app.schemas.recognition import AiRecognitionRequest, AiRecognitionResponse

router = APIRouter(tags=["recognition"])
logger = get_logger(__name__)
runner = PipelineRunner()


@router.post("/api/v1/recognition/requests", response_model=AiRecognitionResponse)
async def recognize(request: AiRecognitionRequest) -> AiRecognitionResponse:
    logger.info(
        "Recognition request accepted",
        extra={
            "job_id": request.jobId,
            "drawing_id": request.drawingId,
            "image_path": request.imagePath,
        },
    )

    try:
        result = runner.run(
            request.imagePath,
            drawing_id=request.drawingId,
            target_unit=request.options.targetUnit,
            meta={
                "job_id": request.jobId,
                "detect_multiple_contours": str(request.options.detectMultipleContours).lower(),
            },
            triggered_by="api.recognition.request",
        )

        errors_payload = [
            {
                "stage": error.stage,
                "message": error.message,
                "safeFailure": error.safe_failure,
                "details": error.details,
            }
            for error in result.errors
        ]

        debug_payload = {
            "chainId": result.chain_id,
            "startedAtIso": result.started_at_iso,
            "finishedAtIso": result.finished_at_iso,
            "durationMs": result.duration_ms,
            "abortedByPolicy": result.aborted_by_policy,
            "completedStages": result.completed_stages,
            "stageTrace": result.context.get("stage_trace", []),
            "warnings": result.context.get("warnings", []),
            "stageNotes": result.context.get("stage_notes", []),
            "debugArtifacts": result.context.get("debug_artifacts", []),
            "errors": errors_payload,
        }

        if result.errors:
            logger.warning(
                "Recognition request finished with errors",
                extra={
                    "job_id": request.jobId,
                    "drawing_id": request.drawingId,
                    "errors_count": len(result.errors),
                },
            )
            return AiRecognitionResponse(
                jobId=request.jobId,
                status="failed",
                debugPayload=debug_payload,
            )

        logger.info(
            "Recognition request completed",
            extra={
                "job_id": request.jobId,
                "drawing_id": request.drawingId,
                "completed_stages": len(result.completed_stages),
            },
        )
        return AiRecognitionResponse(
            jobId=request.jobId,
            status="completed",
            resultPayload=result.context.get("payload", {}),
            debugPayload=debug_payload,
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception(
            "Recognition request failed unexpectedly",
            extra={"job_id": request.jobId, "drawing_id": request.drawingId},
        )
        return AiRecognitionResponse(
            jobId=request.jobId,
            status="failed",
            debugPayload={
                "errors": [
                    {
                        "stage": "pipeline-entry",
                        "message": "UNEXPECTED_RECOGNITION_FAILURE",
                        "safeFailure": False,
                        "details": str(exc),
                    }
                ]
            },
        )
