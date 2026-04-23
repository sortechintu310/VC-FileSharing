import multer from "multer";

const maxUploadSizeMb = Number.parseInt(process.env.MAX_FILE_UPLOAD_MB || "25", 10);
const maxFileSizeInBytes = (Number.isFinite(maxUploadSizeMb) ? maxUploadSizeMb : 25) * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxFileSizeInBytes,
  },
});

export default upload;
