import type { DrawingPayload, DrawingStatus } from '@contracts';
import type { QueryResult, ResultSetHeader, RowDataPacket } from 'mysql2';
import type { Pool } from 'mysql2/promise';

import { AppError } from '@/common/errors/app-error';
import type { DrawingRecord, UpdateDrawingRequest } from '@/domains/drawings/contracts';

interface DrawingRow extends RowDataPacket {
  id: number;
  title: string;
  source_type: 'blank' | 'photo';
  locale: string;
  status: DrawingStatus;
  recognized_payload: string | null;
  edited_payload: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateDrawingParams {
  title: string;
  sourceType: 'blank' | 'photo';
  locale: string;
  status: DrawingStatus;
}

function parsePayload(raw: string | null): DrawingPayload | null {
  if (!raw) {
    return null;
  }

  return JSON.parse(raw) as DrawingPayload;
}

function mapDrawingRow(row: DrawingRow): DrawingRecord {
  return {
    id: row.id,
    title: row.title,
    sourceType: row.source_type,
    locale: row.locale,
    status: row.status,
    recognizedPayload: parsePayload(row.recognized_payload),
    editedPayload: parsePayload(row.edited_payload),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class DrawingsRepository {
  public constructor(private readonly pool: Pool) {}

  public async list(): Promise<DrawingRecord[]> {
    const [rows] = await this.pool.query<DrawingRow[]>(
      `SELECT
        id,
        title,
        source_type,
        locale,
        status,
        CAST(recognized_payload AS CHAR) AS recognized_payload,
        CAST(edited_payload AS CHAR) AS edited_payload,
        DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ') AS created_at,
        DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%sZ') AS updated_at
      FROM drawings
      ORDER BY id DESC`,
    );
    return rows.map(mapDrawingRow);
  }

  public async create(params: CreateDrawingParams): Promise<DrawingRecord> {
    const [result] = await this.pool.execute<ResultSetHeader>(
      `INSERT INTO drawings (title, source_type, locale, status)
       VALUES (?, ?, ?, ?)`,
      [params.title, params.sourceType, params.locale, params.status],
    );
    return this.getByIdOrThrow(result.insertId);
  }

  public async getById(id: number): Promise<DrawingRecord | null> {
    const [rows] = await this.pool.execute<DrawingRow[]>(
      `SELECT
        id,
        title,
        source_type,
        locale,
        status,
        CAST(recognized_payload AS CHAR) AS recognized_payload,
        CAST(edited_payload AS CHAR) AS edited_payload,
        DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ') AS created_at,
        DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%sZ') AS updated_at
      FROM drawings
      WHERE id = ?`,
      [id],
    );
    if (rows.length === 0) {
      return null;
    }
    const row = rows[0];
    if (!row) {
      return null;
    }
    return mapDrawingRow(row);
  }

  public async getByIdOrThrow(id: number): Promise<DrawingRecord> {
    const drawing = await this.getById(id);
    if (!drawing) {
      throw new AppError('DRAWING_NOT_FOUND', 404, 'Drawing not found', { id });
    }
    return drawing;
  }

  public async update(id: number, patch: UpdateDrawingRequest): Promise<DrawingRecord> {
    const fields: string[] = [];
    const values: Array<string | DrawingStatus> = [];

    if (patch.title !== undefined) {
      fields.push('title = ?');
      values.push(patch.title);
    }
    if (patch.locale !== undefined) {
      fields.push('locale = ?');
      values.push(patch.locale);
    }
    if (patch.status !== undefined) {
      fields.push('status = ?');
      values.push(patch.status);
    }

    if (fields.length === 0) {
      return this.getByIdOrThrow(id);
    }

    await this.pool.query<QueryResult>(`UPDATE drawings SET ${fields.join(', ')} WHERE id = ?`, [
      ...values,
      id,
    ]);
    return this.getByIdOrThrow(id);
  }

  public async remove(id: number): Promise<boolean> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute(`DELETE FROM dimensions WHERE drawing_id = ?`, [id]);
      await connection.execute(`DELETE FROM segments WHERE drawing_id = ?`, [id]);
      await connection.execute(`DELETE FROM points WHERE drawing_id = ?`, [id]);
      await connection.execute(`DELETE FROM contours WHERE drawing_id = ?`, [id]);
      const [result] = await connection.execute<ResultSetHeader>(
        `DELETE FROM drawings WHERE id = ?`,
        [id],
      );
      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  public async savePayloadAndGeometry(id: number, payload: DrawingPayload): Promise<void> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute(
        `UPDATE drawings
         SET edited_payload = CAST(? AS JSON), status = 'saved'
         WHERE id = ?`,
        [JSON.stringify(payload), id],
      );

      await connection.execute(`DELETE FROM dimensions WHERE drawing_id = ?`, [id]);
      await connection.execute(`DELETE FROM segments WHERE drawing_id = ?`, [id]);
      await connection.execute(`DELETE FROM points WHERE drawing_id = ?`, [id]);
      await connection.execute(`DELETE FROM contours WHERE drawing_id = ?`, [id]);

      const contourIdMap = new Map<string, number>();
      const pointIdMap = new Map<string, number>();
      const segmentIdMap = new Map<string, number>();

      for (const [contourIndex, contour] of payload.contours.entries()) {
        const [contourResult] = await connection.execute<ResultSetHeader>(
          `INSERT INTO contours (drawing_id, contour_index, is_closed) VALUES (?, ?, ?)`,
          [id, contourIndex, contour.closed ? 1 : 0],
        );
        contourIdMap.set(contour.id, contourResult.insertId);

        for (const [pointIndex, point] of contour.points.entries()) {
          const [pointResult] = await connection.execute<ResultSetHeader>(
            `INSERT INTO points (drawing_id, contour_id, point_index, x, y)
             VALUES (?, ?, ?, ?, ?)`,
            [id, contourResult.insertId, pointIndex, point.x, point.y],
          );
          pointIdMap.set(point.id, pointResult.insertId);
        }

        for (const segment of contour.segments) {
          const startPointId = pointIdMap.get(segment.from);
          const endPointId = pointIdMap.get(segment.to);
          if (!startPointId || !endPointId) {
            throw new AppError('DRAWING_PAYLOAD_INVALID', 400, 'Segment points not found in payload', {
              segmentId: segment.id,
            });
          }
          const [segmentResult] = await connection.execute<ResultSetHeader>(
            `INSERT INTO segments (drawing_id, contour_id, segment_index, start_point_id, end_point_id)
             VALUES (?, ?, ?, ?, ?)`,
            [id, contourResult.insertId, segment.order, startPointId, endPointId],
          );
          segmentIdMap.set(segment.id, segmentResult.insertId);
        }

        for (const dimension of contour.dimensions) {
          const segmentId = segmentIdMap.get(dimension.segmentId);
          if (!segmentId) {
            throw new AppError(
              'DRAWING_PAYLOAD_INVALID',
              400,
              'Dimension segment reference not found in payload',
              {
                dimensionId: dimension.id,
              },
            );
          }
          await connection.execute(
            `INSERT INTO dimensions (
              drawing_id,
              segment_id,
              label,
              raw_value,
              normalized_value,
              unit,
              confidence
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              segmentId,
              null,
              dimension.rawText,
              dimension.normalizedValueMm,
              'mm',
              dimension.confidence,
            ],
          );
        }
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
