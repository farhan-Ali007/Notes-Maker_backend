// utils/upload.js
const cloudinary = require('cloudinary').v2;


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    api_timeout: 60000
});

const uploadImage = async (files) => {
    try {
        // console.log("Files to upload:", files);
        const uploadPromises = files.map(file => {
            // console.log("Uploading file:", file.originalname)
            return cloudinary.uploader.upload(file.path, {
                folder: 'product-images',
                allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
                transformation: [{ width: 500, height: 500, crop: 'limit' }],
            })
        });


        const results = await Promise.all(uploadPromises);
        // console.log("Upload Results:", results);
        return results.map(result => ({
            url: result.secure_url,
            public_id: result.public_id 
        }));
    } catch (error) {
        console.error(error);
        throw new Error('Failed to upload image to Cloudinary');
    }
};

module.exports = uploadImage;
