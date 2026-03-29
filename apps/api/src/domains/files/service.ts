import { createHash, randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { MultipartFile } from '@fastify/multipart';
import type { FastifyInstance } from 'fastify';

import { AppError } from '@/common/errors/app-error';
import { env } from '@/config/env';
import type { UploadSourceImageResponse } from '@/domains/files/contracts';
import { formatFileId } from '@/domains/files/id';
import { FilesRepository } from '@/domains/files/repository';

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/bmp',
]);

export class FilesService {
  private readonly repository: FilesRepository;

  public constructor(app: FastifyInstance) {
    this.repository = new FilesRepository(app.db);
  }

  public async uploadSourceImage(file: MultipartFile): Promise<UploadSourceImageResponse> {
    const mimeType = file.mimetype || null;
    if (!mimeType || !ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
      throw new AppError('FILE_UPLOAD_INVALID_MIME', 400, 'Only image files are supported');
    }

    const uploadsRoot = path.resolve(process.cwd(), env.STORAGE_UPLOADS_DIR);
    await mkdir(uploadsRoot, { recursive: true });

    const extension = this.resolveExtension(mimeType, file.filename);
    const generatedName = `${Date.now()}-${randomUUID()}${extension}`;
    const absolutePath = path.join(uploadsRoot, generatedName);
    const storagePath = path.posix.join(env.STORAGE_UPLOADS_DIR.replace(/\\/g, '/'), generatedName);

    const fileBuffer = await file.toBuffer();
    if (fileBuffer.byteLength === 0) {
      throw new AppError('FILE_UPLOAD_EMPTY', 400, 'Uploaded file is empty');
    }

    await writeFile(absolutePath, fileBuffer);
    const checksumSha256 = createHash('sha256').update(fileBuffer).digest('hex');

    const stored = await this.repository.createSourceImage({
      storagePath,
      mimeType,
      originalName: file.filename ?? null,
      sizeBytes: fileBuffer.byteLength,
      checksumSha256,
    });

    return {
      id: formatFileId(stored.id),
      kind: 'source-image',
      storagePath: stored.storagePath,
      mimeType: stored.mimeType,
      originalName: stored.originalName,
      sizeBytes: stored.sizeBytes,
      createdAt: stored.createdAt,
    };
  }

  private resolveExtension(mimeType: string, originalName?: string): string {
    const fromName = originalName ? path.extname(originalName).toLowerCase() : '';
    if (fromName) {
      return fromName;
    }

    if (mimeType === 'image/jpeg') return '.jpg';
    if (mimeType === 'image/png') return '.png';
    if (mimeType === 'image/webp') return '.webp';
    if (mimeType === 'image/bmp') return '.bmp';
    return '.img';
  }
}

