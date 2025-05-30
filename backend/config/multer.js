const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = ['vehicles', 'manuals', 'videos', 'thumbnails'];
  const uploadPath = path.join(__dirname, '..', '..', 'uploads');
  
  dirs.forEach(dir => {
    const dirPath = path.join(uploadPath, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
};

createUploadDirs();

// Configure storage for different file types
const createStorage = (subfolder) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, '..', '..', 'uploads', subfolder);
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      // Sanitize filename
      const safeName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      cb(null, `${safeName}-${uniqueSuffix}${ext}`);
    }
  });
};

// File filter functions
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const pdfFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    return cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'));
  }
};

const videoFilter = (req, file, cb) => {
  const allowedTypes = /mp4|avi|mov|wmv|flv|mkv|webm/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  if (extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only video files are allowed'));
  }
};

// Create multer instances for different upload types
const uploadVehicleImage = multer({
  storage: createStorage('vehicles'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: imageFilter
});

const uploadManual = multer({
  storage: createStorage('manuals'),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: pdfFilter
});

const uploadVideo = multer({
  storage: createStorage('videos'),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  fileFilter: videoFilter
});

const uploadThumbnail = multer({
  storage: createStorage('thumbnails'),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: imageFilter
});

module.exports = {
  uploadVehicleImage,
  uploadManual,
  uploadVideo,
  uploadThumbnail
};