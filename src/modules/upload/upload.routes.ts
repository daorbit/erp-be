import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { upload } from '../../middleware/upload.js';
import * as uploadController from './upload.controller.js';

const router = Router();

// Upload a single image to Cloudinary
router.post(
  '/image',
  authenticate,
  upload.single('file'),
  uploadController.uploadImage,
);

// Delete an image from Cloudinary
router.post(
  '/image/delete',
  authenticate,
  uploadController.deleteImage,
);

export default router;
