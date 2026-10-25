const cloudinary = require('cloudinary').v2;

/**
 * Cloudinary Service for AlgoRevis
 * 
 * Handles uploading problem diagrams, handwritten note snippets, and user avatars to Cloudinary CDN.
 * Gracefully falls back to raw data if credentials are not configured in .env.
 */

const isConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    !process.env.CLOUDINARY_CLOUD_NAME.includes('your_')
  );
};

if (isConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
  console.log('✅ [Cloudinary] Initialized successfully with cloud_name:', process.env.CLOUDINARY_CLOUD_NAME);
} else {
  console.log('ℹ️ [Cloudinary] Credentials not yet configured in .env; fallback mode active.');
}

/**
 * Upload an image (base64 data URI, image URL, or buffer) to Cloudinary.
 * @param {string} imageInput - Base64 string or remote URL
 * @param {string} folder - Destination folder on Cloudinary
 * @returns {Promise<{ url: string, isCloudinary: boolean }>}
 */
const uploadImage = async (imageInput, folder = 'algorevis_problems') => {
  if (!imageInput || typeof imageInput !== 'string') {
    return { url: '', isCloudinary: false };
  }

  // Already a remote CDN link (e.g. from previous upload)
  if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
    return { url: imageInput, isCloudinary: imageInput.includes('cloudinary.com') };
  }

  // If Cloudinary not configured, return base64 safely
  if (!isConfigured()) {
    return { url: imageInput, isCloudinary: false };
  }

  try {
    const res = await cloudinary.uploader.upload(imageInput, {
      folder: folder,
      resource_type: 'image',
      transformation: [
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });
    return { url: res.secure_url, isCloudinary: true };
  } catch (err) {
    console.error('⚠️ [Cloudinary] Upload failed, falling back to original data:', err.message);
    return { url: imageInput, isCloudinary: false };
  }
};

module.exports = {
  uploadImage,
  isConfigured,
  cloudinary
};
