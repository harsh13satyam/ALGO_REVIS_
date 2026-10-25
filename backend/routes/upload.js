const express = require('express');
const router = express.Router();
const { uploadImage, isConfigured } = require('../services/cloudinaryService');
const { requireAuth } = require('../middleware/auth');

/**
 * POST /api/upload
 * Uploads an image (base64 string or data URI) to Cloudinary.
 * Accepts optional auth so both the web application and authenticated extension can upload.
 */
router.post('/', async (req, res) => {
  try {
    const { image, folder = 'algorevis_uploads' } = req.body;
    if (!image) {
      return res.status(400).json({ message: 'Image data is required' });
    }

    const result = await uploadImage(image, folder);
    return res.status(200).json({
      success: true,
      url: result.url,
      isCloudinary: result.isCloudinary
    });
  } catch (err) {
    console.error('Error in /api/upload:', err);
    return res.status(500).json({ message: 'Failed to process image upload', error: err.message });
  }
});

/**
 * GET /api/upload/status
 * Returns whether Cloudinary is configured and ready.
 */
router.get('/status', (req, res) => {
  res.status(200).json({
    configured: isConfigured()
  });
});

module.exports = router;
