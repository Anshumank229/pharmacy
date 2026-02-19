// src/controllers/uploadController.js
// Handles file uploads (medicine images and prescriptions).
// When Cloudinary is configured, streams the buffer to Cloudinary.
// When not configured, returns the local disk URL (only for public files).

import { isCloudinaryConfigured, uploadToCloudinary } from "../services/cloudinaryService.js";
import Prescription from "../models/Prescription.js";
import fs from "fs";
import path from "path";

/**
 * Generic file upload handler for medicine images.
 * Expects Multer middleware to have already processed req.file.
 * Returns the public URL of the uploaded file.
 */
export const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        let url;
        let cloudinaryPublicId = null;

        if (isCloudinaryConfigured() && req.file.buffer) {
            // ── Cloudinary path ──────────────────────────────────────────────────────
            console.log("☁️ Uploading to Cloudinary...");
            const result = await uploadToCloudinary(req.file.buffer, {
                folder: "medstore/medicines",
                resource_type: "image",
                use_filename: false,
                unique_filename: true,
            });
            url = result.secure_url;
            cloudinaryPublicId = result.public_id;
            console.log("✅ Cloudinary upload successful:", url);
        } else {
            // ── Local disk path (development fallback) ───────────────────────────────
            // FIX: Use correct path for medicine images
            url = `/uploads/medicines/${req.file.filename}`;
            console.log("📁 Local medicine image upload:", url);
        }

        res.status(201).json({
            success: true,
            message: "File uploaded successfully",
            url,
            cloudinaryPublicId,
            filename: req.file.filename || req.file.originalname,
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
        });
    } catch (error) {
        console.error("❌ Upload error:", error.message);
        res.status(500).json({ message: "Upload failed", error: error.message });
    }
};

/**
 * Prescription file upload handler.
 * Creates a database record and stores file privately.
 */
export const uploadPrescriptionFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        let cloudinaryPublicId = null;
        let fileUrl = null;

        if (isCloudinaryConfigured() && req.file.buffer) {
            // ── Cloudinary path (private upload) ───────────────────────────────────
            console.log("☁️ Uploading prescription to Cloudinary...");
            const result = await uploadToCloudinary(req.file.buffer, {
                folder: "medstore/prescriptions",
                resource_type: "auto", // Allow PDFs and images
                use_filename: false,
                unique_filename: true,
                // FIX: For prescriptions, we might want to set access control
                // This depends on your Cloudinary setup - you may need signed URLs
            });
            cloudinaryPublicId = result.public_id;
            // Don't store public URL for prescriptions if they should be private
            fileUrl = result.secure_url; // Still store but access will be controlled
            console.log("✅ Prescription uploaded to Cloudinary");
        } else {
            // ── Local disk path (development) ─────────────────────────────────────
            // FIX: Store path but don't make it publicly accessible
            fileUrl = `/api/prescriptions/${req.file.filename}/file`; // Protected route
            console.log("📁 Local prescription upload");
        }

        // FIX: Create prescription record in database
        const prescription = await Prescription.create({
            user: req.user._id,
            fileName: req.file.filename,
            originalName: req.file.originalname,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            cloudinaryPublicId: cloudinaryPublicId,
            // FIX: Store the path but mark as private
            fileUrl: fileUrl,
            status: 'pending',
            uploadedAt: new Date()
        });

        // FIX: Don't return the file URL in response for prescriptions
        // Return only necessary info
        res.status(201).json({
            success: true,
            message: "Prescription uploaded successfully",
            prescription: {
                _id: prescription._id,
                fileName: prescription.originalName,
                status: prescription.status,
                uploadedAt: prescription.uploadedAt,
                // Note: No file URL returned - will be accessed via protected route
            }
        });

    } catch (error) {
        console.error("❌ Prescription upload error:", error.message);
        
        // FIX: Clean up file if database creation failed
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
                console.log("🧹 Cleaned up orphaned file:", req.file.path);
            } catch (unlinkError) {
                console.error("Failed to clean up file:", unlinkError.message);
            }
        }
        
        res.status(500).json({ 
            success: false,
            message: "Failed to upload prescription", 
            error: error.message 
        });
    }
};

/**
 * Delete prescription file (both from storage and database)
 */
export const deletePrescriptionFile = async (req, res) => {
    try {
        const prescription = await Prescription.findById(req.params.id);

        if (!prescription) {
            return res.status(404).json({ message: "Prescription not found" });
        }

        // Check ownership
        if (prescription.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: "Not authorized to delete this prescription" });
        }

        // Delete from Cloudinary if exists
        if (prescription.cloudinaryPublicId && isCloudinaryConfigured()) {
            try {
                const cloudinary = (await import('cloudinary')).v2;
                await cloudinary.uploader.destroy(prescription.cloudinaryPublicId);
                console.log("✅ Deleted from Cloudinary");
            } catch (cloudinaryError) {
                console.error("Failed to delete from Cloudinary:", cloudinaryError);
            }
        }

        // Delete local file if exists
        if (prescription.fileName) {
            const filePath = path.join(process.cwd(), "uploads", "prescriptions", prescription.fileName);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log("✅ Deleted local file");
            }
        }

        // Delete from database
        await prescription.deleteOne();

        res.json({ 
            success: true,
            message: "Prescription deleted successfully" 
        });

    } catch (error) {
        console.error("❌ Delete error:", error.message);
        res.status(500).json({ 
            success: false,
            message: "Failed to delete prescription", 
            error: error.message 
        });
    }
};

/**
 * Get prescription file (protected download)
 */
export const getPrescriptionFile = async (req, res) => {
    try {
        const prescription = await Prescription.findById(req.params.id);

        if (!prescription) {
            return res.status(404).json({ message: "Prescription not found" });
        }

        // Check ownership
        if (prescription.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: "Not authorized to access this prescription" });
        }

        // If Cloudinary, redirect to signed URL or stream
        if (prescription.cloudinaryPublicId && isCloudinaryConfigured()) {
            // FIX: Generate signed URL for Cloudinary (if needed)
            // This depends on your Cloudinary setup
            const cloudinary = (await import('cloudinary')).v2;
            const signedUrl = cloudinary.url(prescription.cloudinaryPublicId, {
                secure: true,
                sign_url: true,
                expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour
            });
            return res.redirect(signedUrl);
        }

        // Serve local file
        const filePath = path.join(process.cwd(), "uploads", "prescriptions", prescription.fileName);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: "File not found" });
        }

        res.sendFile(filePath);

    } catch (error) {
        console.error("❌ File access error:", error.message);
        res.status(500).json({ 
            success: false,
            message: "Failed to access file", 
            error: error.message 
        });
    }
};