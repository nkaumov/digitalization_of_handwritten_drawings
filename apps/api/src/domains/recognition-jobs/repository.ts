import type { DrawingPayload, DrawingStatus, RecognitionJobStatus } from '@contracts';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import type { Pool } from 'mysql2/promise';

import { AppError } from '@/common/errors/app-error';
import type {
  RecognitionJobRecord,
  RecognitionStageLogItem,
} from '@/domains/recognition-jobs/contracts';

interface RecognitionJobRow extends RowDataPacket {
  id: number;
  drawing_id: number;
  source_file_id: number;
  status: RecognitionJobStatus;
  error_message: string | null;
  debug_payload: string | null;
}

interface RecognitionJobStatusRow extends RowDataPacket {
  id: number;
  drawing_id: number;
  status: RecognitionJobStatus;
  drawing_status: DrawingStatus;
}

interface StageLogRow extends RowDataPacket {
  stage_name: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  created_at: string;
}

function mapRecognitionJobRow(row: RecognitionJobRow): RecognitionJobRecord {
  return {
    id: row.id,
    drawingId: row.drawing_id,
    sourceFileId: row.source_file_id,
    status: row.status,
    errorMessage: row.error_message,
    debugPayload: row.debug_payload ? (JSON.parse(row.debug_payload) as Record<string, unknown>) : null,
  };
}

export class RecognitionJobsRepository {
  public constructor(private readonly pool: Pool) {}

  public async create(params: {
    drawingId: number;
    sourceFileId: number;
    status: RecognitionJobStatus;
  }): Promise<RecognitionJobRecord> {
    const [result] = await this.pool.execute<ResultSetHeader>(
      `INSERT INTO recognition_jobs (drawing_id, source_file_id, status)
       VALUES (?, ?, ?)`,
      [params.drawingId, params.sourceFileId, params.status],
    );
    const created = await this.getById(result.insertId);
    if (!created) {
      throw new AppError('RECOGNITION_JOB_CREATE_FAILED', 500, 'Failed to create recognition job');
    }
    return created;
  }

  public async getById(id: number): Promise<RecognitionJobRecord | null> {
    const [rows] = await this.pool.execute<RecognitionJobRow[]>(
      `SELECT
        id,
        drawing_id,
        source_file_id,
        status,
        error_message,
        CAST(debug_payload AS CHAR) AS debug_payload
       FROM recognition_jobs
       WHERE id = ?`,
      [id],
    );
    const row = rows[0];
    return row ? mapRecognitionJobRow(row) : null;
  }

  public async updateStatus(
    id: number,
    status: RecognitionJobStatus,
    options?: { errorMessage?: string | null; debugPayload?: Record<string, unknown> | null },
  ): Promise<void> {
    await this.pool.execute(
      `UPDATE recognition_jobs
       SET status = ?,
           error_message = ?,
           debug_payload = CAST(? AS JSON)
       WHERE id = ?`,
      [
        status,
        options?.errorMessage ?? null,
        JSON.stringify(options?.debugPayload ?? null),
        id,
      ],
    );
  }

  public async insertStageLog(params: {
    recognitionJobId: number;
    stage: string;
    level: 'info' | 'warning' | 'error';
    message: string;
    meta?: Record<string, unknown>;
  }): Promise<void> {
    await this.pool.execute(
      `INSERT INTO recognition_job_stage_logs
       (recognition_job_id, stage_name, level, message, meta_payload)
       VALUES (?, ?, ?, ?, CAST(? AS JSON))`,
      [
        params.recognitionJobId,
        params.stage,
        params.level,
        params.message,
        JSON.stringify(params.meta ?? null),
      ],
    );
  }

  public async listStageLogs(jobId: number): Promise<RecognitionStageLogItem[]> {
    const [rows] = await this.pool.execute<StageLogRow[]>(
      `SELECT
        stage_name,
        level,
        message,
        DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ') AS created_at
       FROM recognition_job_stage_logs
       WHERE recognition_job_id = ?
       ORDER BY id ASC`,
      [jobId],
    );
    return rows.map((row) => ({
      stage: row.stage_name,
      level: row.level,
      message: row.message,
      createdAt: row.created_at,
    }));
  }

  public async setDrawingRecognitionPending(drawingId: number, sourceFileId: number): Promise<void> {
    await this.pool.execute(
      `UPDATE drawings
       SET source_file_id = ?, status = 'recognition_pending'
       WHERE id = ?`,
      [sourceFileId, drawingId],
    );
  }

  public async setDrawingRecognitionProcessing(drawingId: number): Promise<void> {
    await this.pool.execute(`UPDATE drawings SET status = 'recognition_processing' WHERE id = ?`, [drawingId]);
  }

  public async setDrawingRecognized(drawingId: number, payload: DrawingPayload): Promise<void> {
    await this.pool.execute(
      `UPDATE drawings
       SET status = 'recognized', recognized_payload = CAST(? AS JSON)
       WHERE id = ?`,
      [JSON.stringify(payload), drawingId],
    );
  }

  public async getJobStatusWithDrawing(jobId: number): Promise<RecognitionJobStatusRow | null> {
    const [rows] = await this.pool.execute<RecognitionJobStatusRow[]>(
      `SELECT
        r.id,
        r.drawing_id,
        r.status,
        d.status AS drawing_status
       FROM recognition_jobs r
       JOIN drawings d ON d.id = r.drawing_id
       WHERE r.id = ?`,
      [jobId],
    );
    return rows[0] ?? null;
  }

  public async getDrawingRecognizedPayload(drawingId: number): Promise<DrawingPayload | null> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      `SELECT CAST(recognized_payload AS CHAR) AS recognized_payload FROM drawings WHERE id = ?`,
      [drawingId],
    );
    const raw = rows[0]?.recognized_payload as string | null | undefined;
    return raw ? (JSON.parse(raw) as DrawingPayload) : null;
  }
}

