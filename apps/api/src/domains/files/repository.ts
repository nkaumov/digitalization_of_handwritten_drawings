import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import type { Pool } from 'mysql2/promise';

import type { StoredFileRecord } from '@/domains/files/contracts';

interface StoredFileRow extends RowDataPacket {
  id: number;
  kind: StoredFileRecord['kind'];
  storage_path: string;
  mime_type: string | null;
  original_name: string | null;
  size_bytes: number | null;
  created_at: string;
}

function mapStoredFileRow(row: StoredFileRow): StoredFileRecord {
  return {
    id: row.id,
    kind: row.kind,
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    originalName: row.original_name,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
  };
}

export class FilesRepository {
  public constructor(private readonly pool: Pool) {}

  public async createSourceImage(params: {
    storagePath: string;
    mimeType: string | null;
    originalName: string | null;
    sizeBytes: number | null;
    checksumSha256: string | null;
  }): Promise<StoredFileRecord> {
    const [result] = await this.pool.execute<ResultSetHeader>(
      `INSERT INTO stored_files
       (kind, storage_path, mime_type, original_name, size_bytes, checksum_sha256)
       VALUES ('source-image', ?, ?, ?, ?, ?)`,
      [
        params.storagePath,
        params.mimeType,
        params.originalName,
        params.sizeBytes,
        params.checksumSha256,
      ],
    );

    const [rows] = await this.pool.execute<StoredFileRow[]>(
      `SELECT
        id,
        kind,
        storage_path,
        mime_type,
        original_name,
        size_bytes,
        DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ') AS created_at
      FROM stored_files
      WHERE id = ?`,
      [result.insertId],
    );
    const row = rows[0];
    if (!row) {
      throw new Error('FAILED_TO_LOAD_STORED_FILE_AFTER_INSERT');
    }
    return mapStoredFileRow(row);
  }

  public async getById(id: number): Promise<StoredFileRecord | null> {
    const [rows] = await this.pool.execute<StoredFileRow[]>(
      `SELECT
        id,
        kind,
        storage_path,
        mime_type,
        original_name,
        size_bytes,
        DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ') AS created_at
      FROM stored_files
      WHERE id = ?`,
      [id],
    );
    const row = rows[0];
    if (!row) {
      return null;
    }

    return mapStoredFileRow(row);
  }
}
