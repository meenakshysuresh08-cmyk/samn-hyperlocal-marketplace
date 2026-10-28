const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'sample',
  api_key: process.env.CLOUDINARY_API_KEY || 'sample',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'sample',
  secure: true,
});

module.exports = cloudinary;
