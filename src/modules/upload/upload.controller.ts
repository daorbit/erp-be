import type { Request, Response } from 'express';
import { asyncHandler, AppError } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import cloudinary from '../../config/cloudinary.js';

export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  const folder = (req.query.folder as string) || 'erp';

  const result = await new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `erp/${folder}`,
        resource_type: 'image',
        transformation: [
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
    stream.end(req.file!.buffer);
  });

  res.status(200).json(
    buildResponse(true, {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes,
    }, 'Image uploaded successfully'),
  );
});

export const deleteImage = asyncHandler(async (req: Request, res: Response) => {
  const { publicId } = req.body;

  if (!publicId) {
    throw new AppError('Public ID is required', 400);
  }

  await cloudinary.uploader.destroy(publicId);

  res.status(200).json(
    buildResponse(true, null, 'Image deleted successfully'),
  );
});
