import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import type { Pool } from 'mysql2/promise';

import type { ExportFormat, ExportStatus } from '@/db/schema/tables';

interface DrawingExistsRow extends RowDataPacket {
  id: number;
}

export class ExportsRepository {
  public constructor(private readonly pool: Pool) {}

  public async assertDrawingExists(drawingId: number): Promise<boolean> {
    const [rows] = await this.pool.execute<DrawingExistsRow[]>(
      `SELECT id FROM drawings WHERE id = ?`,
      [drawingId],
    );
    return rows.length > 0;
  }

  public async createExportArtifact(params: {
    drawingId: number;
    format: ExportFormat;
    storagePath: string;
    mimeType: string;
    originalName: string;
    sizeBytes: number;
    checksumSha256: string;
    status: ExportStatus;
  }): Promise<{ exportId: number; fileId: number }> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      const [fileResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO stored_files
         (kind, storage_path, mime_type, original_name, size_bytes, checksum_sha256)
         VALUES ('export-artifact', ?, ?, ?, ?, ?)`,
        [
          params.storagePath,
          params.mimeType,
          params.originalName,
          params.sizeBytes,
          params.checksumSha256,
        ],
      );

      const [exportResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO exports
         (drawing_id, file_id, format, status, error_message)
         VALUES (?, ?, ?, ?, NULL)`,
        [params.drawingId, fileResult.insertId, params.format, params.status],
      );

      await connection.commit();
      return {
        exportId: exportResult.insertId,
        fileId: fileResult.insertId,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

