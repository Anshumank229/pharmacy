// src/middleware/upload.js
// When Cloudinary is configured, files are stored in memory (buffer) and
// streamed to Cloudinary by the controller. When not configured, files fall
// back to local disk storage (development only).

import fs from "fs";
import multer from "multer";
import path from "path";
import { isCloudinaryConfigured } from "../services/cloudinaryService.js";

// ─── Ensure upload directories exist at startup ───────────────────────────────
// { recursive: true } = creates parent dirs and never throws if already exists
const uploadDirs = [
  "uploads/prescriptions",
  "uploads/medicines",
  "uploads/temp"
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created upload directory: ${dir}`);
  }
});

// ─── File Type Filters ─────────────────────────────────────────────────────────

// SECURITY: For medicine images - only images allowed
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  const allowedExtensions = /\.(jpeg|jpg|png|gif|webp)$/i;
  
  const mimetypeValid = allowedTypes.includes(file.mimetype);
  const extnameValid = allowedExtensions.test(path.extname(file.originalname));
  
  if (mimetypeValid && extnameValid) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPEG, JPG, PNG, GIF, WEBP) are allowed"), false);
  }
};

// SECURITY: For prescriptions - images and PDFs allowed
const prescriptionFileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
  const allowedExtensions = /\.(jpeg|jpg|png|pdf)$/i;
  
  const mimetypeValid = allowedTypes.includes(file.mimetype);
  const extnameValid = allowedExtensions.test(path.extname(file.originalname));
  
  if (mimetypeValid && extnameValid) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, and PDF files are allowed for prescriptions"), false);
  }
};

// ─── Storage Strategy ─────────────────────────────────────────────────────────
// If Cloudinary is configured → use memoryStorage (buffer sent to Cloudinary)
// Otherwise → use diskStorage (local uploads/ folder for dev)

// Storage for prescriptions (private)
const prescriptionStorage = isCloudinaryConfigured()
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => cb(null, "uploads/prescriptions/"),
      filename: (req, file, cb) => {
        // Include user ID in filename for traceability when available
        const userId = req.user?._id || 'anonymous';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `rx-${userId}-${uniqueSuffix}${ext}`);
      },
    });

// Storage for medicine images (public)
const medicineStorage = isCloudinaryConfigured()
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => cb(null, "uploads/medicines/"),
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `medicine-${uniqueSuffix}${ext}`);
      },
    });

// Storage for general/temp uploads
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/temp/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `temp-${uniqueSuffix}${ext}`);
  },
});

// ─── Exports ──────────────────────────────────────────────────────────────────

// Prescription upload: 10MB max, prescription file filter
export const uploadPrescription = multer({
  storage: prescriptionStorage,
  fileFilter: prescriptionFileFilter,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1 // Only one file at a time
  },
});

// Medicine image upload: 5MB max, image file filter
export const uploadMedicine = multer({
  storage: medicineStorage,
  fileFilter: imageFileFilter,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
});

// General upload (for backward compatibility): 5MB max, image file filter
export const uploadGeneral = multer({
  storage: medicineStorage, // Use medicine storage for consistency
  fileFilter: imageFileFilter,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
});

// Temp upload (for bulk processing, etc.): 10MB max, accepts any file type (use with caution)
export const uploadTemp = multer({
  storage: tempStorage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  },
});

// Multiple file upload helper (max 5 files)
export const uploadMultiple = multer({
  storage: medicineStorage,
  fileFilter: imageFileFilter,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5 // Max 5 files
  },
});

// Error handler wrapper for multer
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: 'File too large. Maximum size is 5MB for images, 10MB for prescriptions.' 
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        message: 'Too many files uploaded.' 
      });
    }
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};