// src/services/cloudinaryService.js
// Cloudinary configuration and helper utilities.
// Used by upload middleware to stream files directly to Cloudinary.

import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary with env vars
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Check if Cloudinary is configured.
 * If env vars are missing, uploads fall back to local disk storage.
 */
export const isCloudinaryConfigured = () =>
    !!(process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET);

/**
 * Upload a file buffer to Cloudinary.
 * @param {Buffer} buffer - File buffer
 * @param {Object} options - Cloudinary upload options (folder, resource_type, etc.)
 * @returns {Promise<Object>} Cloudinary upload result
 */
export const uploadToCloudinary = (buffer, options = {}) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: options.folder || "medstore",
                resource_type: options.resource_type || "auto",
                ...options,
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        uploadStream.end(buffer);
    });
};

/**
 * Delete a file from Cloudinary by public_id.
 * @param {string} publicId - Cloudinary public_id
 */
export const deleteFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
        console.log(`Cloudinary: deleted ${publicId}`);
    } catch (err) {
        console.error("Cloudinary delete failed:", err.message);
    }
};

export default cloudinary;
