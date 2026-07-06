import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure upload directory exists
const uploadPath = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Ensure trail upload directory exists
const trailUploadPath = path.join(__dirname, "../../uploads/trail-attachments");
if (!fs.existsSync(trailUploadPath)) {
  fs.mkdirSync(trailUploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const trailStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, trailUploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `trail-${uniqueSuffix}${ext}`);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx|txt|zip/;
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedExtensions.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type. Only standard documents/images are allowed."));
    }
  }
});

export const trailUpload = multer({
  storage: trailStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    // PDF, DOC, DOCX, TXT, XLS, XLSX, PPT, PPTX, PNG, JPG, JPEG, ZIP, RAR
    const allowedExtensions = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx|txt|zip|rar|ppt|pptx/;
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type."));
    }
  }
});

