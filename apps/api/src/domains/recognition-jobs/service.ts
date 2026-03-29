import type {
  DrawingPayload,
  DrawingStatus,
  RecognitionJobStatus,
  StartRecognitionResponse,
} from '@contracts';
import type { FastifyInstance } from 'fastify';
import type { RowDataPacket } from 'mysql2';

import { AppError } from '@/common/errors/app-error';
import { formatDrawingId, parseDrawingId } from '@/domains/drawings/id';
import { createEmptyDrawingPayload } from '@/domains/drawings/payload';
import { parseFileId } from '@/domains/files/id';
import type {
  RecognitionJobResultResponse,
  StartRecognitionRequest,
} from '@/domains/recognition-jobs/contracts';
import { formatRecognitionJobId, parseRecognitionJobId } from '@/domains/recognition-jobs/id';
import { RecognitionJobsRepository } from '@/domains/recognition-jobs/repository';

const PLACEHOLDER_RECOGNITION_STAGES = [
  'normalize-image',
  'detect-lines',
  'detect-text',
  'parse-dimensions',
  'build-graph',
  'find-contours',
  'normalize-units',
  'assemble-result',
] as const;

interface DrawingExistsRow extends RowDataPacket {
  id: number;
}

interface FileExistsRow extends RowDataPacket {
  id: number;
  kind: 'source-image' | 'debug-artifact' | 'export-artifact' | 'other';
}

export class RecognitionJobsService {
  private readonly repository: RecognitionJobsRepository;

  public constructor(private readonly app: FastifyInstance) {
    this.repository = new RecognitionJobsRepository(app.db);
  }

  public async startRecognition(request: StartRecognitionRequest): Promise<StartRecognitionResponse> {
    const drawingId = parseDrawingId(request.drawingId);
    const fileId = parseFileId(request.fileId);

    await this.assertDrawingExists(drawingId);
    await this.assertSourceFileExists(fileId);

    await this.repository.setDrawingRecognitionPending(drawingId, fileId);

    const job = await this.repository.create({
      drawingId,
      sourceFileId: fileId,
      status: 'queued',
    });

    await this.repository.insertStageLog({
      recognitionJobId: job.id,
      stage: 'job-queued',
      level: 'info',
      message: 'Recognition job queued',
    });

    await this.runPlaceholderRecognition(job.id, drawingId);

    return {
      drawingId: request.drawingId,
      jobId: formatRecognitionJobId(job.id),
      status: 'recognition_pending',
    };
  }

  public async getStatus(externalJobId: string): Promise<{
    jobId: string;
    status: RecognitionJobStatus;
    drawingStatus?: DrawingStatus;
  }> {
    const jobId = parseRecognitionJobId(externalJobId);
    const status = await this.repository.getJobStatusWithDrawing(jobId);
    if (!status) {
      throw new AppError('RECOGNITION_JOB_NOT_FOUND', 404, 'Recognition job not found');
    }

    return {
      jobId: externalJobId,
      status: status.status,
      drawingStatus: status.drawing_status,
    };
  }

  public async getResult(externalJobId: string): Promise<RecognitionJobResultResponse> {
    const jobId = parseRecognitionJobId(externalJobId);
    const status = await this.repository.getJobStatusWithDrawing(jobId);
    if (!status) {
      throw new AppError('RECOGNITION_JOB_NOT_FOUND', 404, 'Recognition job not found');
    }

    if (status.status !== 'completed') {
      throw new AppError(
        'RECOGNITION_RESULT_NOT_READY',
        409,
        'Recognition result is not ready yet',
        {
          status: status.status,
        },
      );
    }

    const payload =
      (await this.repository.getDrawingRecognizedPayload(status.drawing_id)) ??
      createEmptyDrawingPayload(formatDrawingId(status.drawing_id));

    const stageLogs = await this.repository.listStageLogs(jobId);

    return {
      jobId: externalJobId,
      status: status.status,
      drawingId: formatDrawingId(status.drawing_id),
      drawingStatus: status.drawing_status,
      resultPayload: payload,
      stageLogs,
    };
  }

  private async runPlaceholderRecognition(jobId: number, drawingId: number): Promise<void> {
    try {
      await this.repository.updateStatus(jobId, 'processing');
      await this.repository.setDrawingRecognitionProcessing(drawingId);

      await this.repository.insertStageLog({
        recognitionJobId: jobId,
        stage: 'job-started',
        level: 'info',
        message: 'Recognition job moved to processing state',
      });
      this.app.log.info({ jobId: formatRecognitionJobId(jobId) }, 'Recognition job started');

      for (const stage of PLACEHOLDER_RECOGNITION_STAGES) {
        await this.repository.insertStageLog({
          recognitionJobId: jobId,
          stage,
          level: 'info',
          message: 'Placeholder stage executed (no AI recognition yet)',
        });
        this.app.log.info({ jobId: formatRecognitionJobId(jobId), stage }, 'Recognition stage executed');
      }

      const payload: DrawingPayload = createEmptyDrawingPayload(formatDrawingId(drawingId));
      await this.repository.setDrawingRecognized(drawingId, payload);
      await this.repository.updateStatus(jobId, 'completed', {
        debugPayload: {
          mode: 'placeholder',
          stages: [...PLACEHOLDER_RECOGNITION_STAGES],
        },
      });

      await this.repository.insertStageLog({
        recognitionJobId: jobId,
        stage: 'job-completed',
        level: 'info',
        message: 'Recognition job completed with placeholder result',
      });
      this.app.log.info({ jobId: formatRecognitionJobId(jobId) }, 'Recognition job completed');
    } catch (error) {
      await this.repository.updateStatus(jobId, 'failed', {
        errorMessage: error instanceof Error ? error.message : 'unknown-error',
      });
      await this.repository.insertStageLog({
        recognitionJobId: jobId,
        stage: 'job-failed',
        level: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Recognition job failed with non-error exception',
      });
      this.app.log.error({ jobId: formatRecognitionJobId(jobId), err: error }, 'Recognition job failed');
      throw error;
    }
  }

  private async assertDrawingExists(drawingId: number): Promise<void> {
    const [rows] = await this.app.db.execute<DrawingExistsRow[]>(
      `SELECT id FROM drawings WHERE id = ?`,
      [drawingId],
    );
    if (rows.length === 0) {
      throw new AppError('DRAWING_NOT_FOUND', 404, 'Drawing not found');
    }
  }

  private async assertSourceFileExists(fileId: number): Promise<void> {
    const [rows] = await this.app.db.execute<FileExistsRow[]>(
      `SELECT id, kind FROM stored_files WHERE id = ?`,
      [fileId],
    );
    const row = rows[0];
    if (!row) {
      throw new AppError('FILE_NOT_FOUND', 404, 'File not found');
    }
    if (row.kind !== 'source-image') {
      throw new AppError('FILE_KIND_INVALID', 400, 'Only source-image file can start recognition');
    }
  }
}
