import multipart from '@fastify/multipart';
import type { FastifyPluginAsync } from 'fastify';

import { AppError } from '@/common/errors/app-error';
import { FilesService } from '@/domains/files/service';

export const filesRoutes: FastifyPluginAsync = async (app) => {
  await app.register(multipart, {
    limits: {
      fileSize: 15 * 1024 * 1024,
      files: 1,
    },
  });

  const filesService = new FilesService(app);

  app.post('/api/v1/files/source-image', async (request, reply) => {
    const file = await request.file();
    if (!file) {
      throw new AppError('FILE_UPLOAD_MISSING', 400, 'File field is required');
    }

    const result = await filesService.uploadSourceImage(file);
    reply.status(201).send(result);
  });
};

