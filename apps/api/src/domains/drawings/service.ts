import type {
  CreateDrawingResponse,
  GetDrawingResponse,
  SaveDrawingResponse,
  DrawingStatus,
} from '@contracts';
import type { FastifyInstance } from 'fastify';

import { AppError } from '@/common/errors/app-error';
import type {
  DrawingsListResponse,
  SaveDrawingDto,
  UpdateDrawingRequest,
  UpdateDrawingResponse,
} from '@/domains/drawings/contracts';
import { formatDrawingId, parseDrawingId } from '@/domains/drawings/id';
import { createEmptyDrawingPayload } from '@/domains/drawings/payload';
import { DrawingsRepository } from '@/domains/drawings/repository';

function resolveInitialStatus(sourceType: 'blank' | 'photo'): DrawingStatus {
  return sourceType === 'blank' ? 'blank_ready' : 'recognition_pending';
}

export class DrawingsService {
  private readonly repository: DrawingsRepository;

  public constructor(app: FastifyInstance) {
    this.repository = new DrawingsRepository(app.db);
  }

  public async listDrawings(): Promise<DrawingsListResponse> {
    const items = await this.repository.list();
    return {
      items: items.map((item) => ({
        id: formatDrawingId(item.id),
        title: item.title,
        sourceType: item.sourceType,
        locale: item.locale,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
    };
  }

  public async createDrawing(input: {
    title: string;
    sourceType: 'blank' | 'photo';
    locale: string;
  }): Promise<CreateDrawingResponse> {
    const created = await this.repository.create({
      title: input.title,
      sourceType: input.sourceType,
      locale: input.locale,
      status: resolveInitialStatus(input.sourceType),
    });

    return {
      id: formatDrawingId(created.id),
      status: created.status,
    };
  }

  public async getDrawingByExternalId(externalId: string): Promise<GetDrawingResponse> {
    const id = parseDrawingId(externalId);
    const drawing = await this.repository.getByIdOrThrow(id);
    const payload =
      drawing.editedPayload ??
      drawing.recognizedPayload ??
      createEmptyDrawingPayload(formatDrawingId(drawing.id));

    return {
      id: formatDrawingId(drawing.id),
      title: drawing.title,
      status: drawing.status,
      payload: {
        ...payload,
        drawingId: formatDrawingId(drawing.id),
      },
    };
  }

  public async updateDrawingByExternalId(
    externalId: string,
    patch: UpdateDrawingRequest,
  ): Promise<UpdateDrawingResponse> {
    const id = parseDrawingId(externalId);
    const updated = await this.repository.update(id, patch);

    return {
      id: formatDrawingId(updated.id),
      status: updated.status,
    };
  }

  public async saveDrawingByExternalId(
    externalId: string,
    input: SaveDrawingDto,
  ): Promise<SaveDrawingResponse> {
    const id = parseDrawingId(externalId);
    if (input.payload.drawingId !== externalId) {
      throw new AppError(
        'DRAWING_SAVE_INVALID',
        400,
        'payload.drawingId must match path drawing id',
      );
    }

    await this.repository.getByIdOrThrow(id);
    await this.repository.savePayloadAndGeometry(id, input.payload);

    return {
      id: externalId,
      status: 'saved',
    };
  }

  public async deleteDrawingByExternalId(externalId: string): Promise<void> {
    const id = parseDrawingId(externalId);
    const removed = await this.repository.remove(id);
    if (!removed) {
      throw new AppError('DRAWING_NOT_FOUND', 404, 'Drawing not found', { id: externalId });
    }
  }
}

