// server/middleware/upload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const createStorage = (subDir, prefix) => {
  const uploadDir = path.join(__dirname, `../../public/images/${subDir}`);
  ensureDir(uploadDir);

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `${prefix}_${uniqueSuffix}${ext}`);
    },
  });
};

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error("이미지 파일만 업로드 가능합니다. (jpeg, jpg, png, gif, webp)"));
  }
};

// 리뷰 이미지 업로드
const reviewUpload = multer({
  storage: createStorage("reviews", "review"),
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter,
});
const uploadReviewImages = reviewUpload.array("images", 6);

// 상품 이미지 업로드 (단일 - 기존 호환성 유지)
const productUpload = multer({
  storage: createStorage("products", "product"),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter,
});
const uploadProductImage = productUpload.single("image");

// 상품 이미지 업로드 (대표 이미지 + 상세 이미지 여러 개)
const productImagesUpload = multer({
  storage: createStorage("products", "product"),
  limits: { fileSize: 5 * 1024 * 1024, files: 11 }, // 대표 1개 + 상세 10개
  fileFilter,
});
const uploadProductImages = productImagesUpload.fields([
  { name: 'image', maxCount: 1 },        // 대표 이미지
  { name: 'detailImages', maxCount: 10 } // 상세 이미지 (최대 10개)
]);

// 체험 이미지 업로드 (단일 - 기존 호환성 유지)
const programUpload = multer({
  storage: createStorage("programs", "program"),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter,
});
const uploadProgramImage = programUpload.single("image");

// 체험 이미지 업로드 (대표 이미지 + 상세 이미지 여러 개)
// multer는 파일만 처리하고 텍스트 필드는 req.body에 넣지 않으므로
// .none()을 추가하여 텍스트 필드도 파싱하도록 설정
const programImagesUpload = multer({
  storage: createStorage("programs", "program"),
  limits: { fileSize: 5 * 1024 * 1024, files: 11 }, // 대표 1개 + 상세 10개
  fileFilter,
});
const uploadProgramImages = programImagesUpload.fields([
  { name: 'image', maxCount: 1 },        // 대표 이미지
  { name: 'detailImages', maxCount: 10 } // 상세 이미지 (최대 10개)
]);

// ✅ 이벤트 이미지 업로드 추가
const eventUpload = multer({
  storage: createStorage("events", "event"),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter,
});
const uploadEventImage = eventUpload.single("image");

module.exports = {
  uploadReviewImages,
  uploadProductImage,
  uploadProductImages, // ✅ 대표 이미지 + 상세 이미지 여러 개
  uploadProgramImage,
  uploadProgramImages, // ✅ 대표 이미지 + 상세 이미지 여러 개
  uploadEventImage, // ✅ 꼭 export
};
