"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
// Configure multer for image uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/media';
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = file.originalname.includes('.') ? file.originalname.substring(file.originalname.lastIndexOf('.')) : '';
        cb(null, `image-${uniqueSuffix}${ext}`);
    }
});
const upload = (0, multer_1.default)({
    storage,
    fileFilter: (req, file, cb) => {
        if (/^image\//.test(file.mimetype))
            return cb(null, true);
        cb(new Error('Only image uploads are allowed'));
    },
    limits: { fileSize: 10 * 1024 * 1024 }
});
// POST /api/v1/media/upload  (field: image)
router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ error: 'Image file is required' });
        const urlPath = `/uploads/media/${req.file.filename}`;
        res.status(201).json({ url: urlPath, filename: req.file.filename });
    }
    catch (e) {
        console.error('Media upload error', e);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});
exports.default = router;
