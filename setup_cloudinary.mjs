import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'rx1klbob',
  api_key: '667372476814387',
  api_secret: 'C8fCWWcXIFm2bvJ3aWYFBuIxBZ8'
});

async function createPreset() {
  try {
    const result = await cloudinary.api.create_upload_preset({
      name: 'abkharido_uploads',
      unsigned: true,
      folder: 'abkharido/products',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'mp4', 'webm', 'mov'],
      transformation: [
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });
    console.log('Successfully created unsigned preset:', result);
  } catch (error) {
    if (error.error && error.error.message.includes('already exists')) {
      console.log('Preset already exists! You are good to go.');
    } else {
      console.error('Failed to create preset:', error);
    }
  }
}

createPreset();
