if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) throw new Error('Cloudinary server environment configuration is required');
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function createPreset() {
  try {
    const result = await cloudinary.api.create_upload_preset({
      name: 'abkharido_uploads',
      unsigned: false,
      folder: 'abkharido/products',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'mp4', 'webm', 'mov'],
      transformation: [
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });
    console.log('Successfully created signed upload preset');
  } catch (error) {
    if (error.error && error.error.message.includes('already exists')) {
      console.log('Preset already exists! You are good to go.');
    } else {
      console.error('Failed to create upload preset');
    }
  }
}

createPreset();
