// server/middleware/upload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

// 런타임에 폴더 자동 생성을 하지 않음 (Cloudinary 클라우드 프로젝트로 전환)
const createStorage = (subDir, prefix) => {
  // Cloudinary로 업로드하기 위해 모든 환경에서 메모리 저장소 사용
  return multer.memoryStorage();
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
  storage: createStorage("store", "product"),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter,
});
const uploadProductImage = productUpload.single("image");

// 상품 이미지 업로드 (대표 이미지 + 상세 이미지 여러 개)
const productImagesUpload = multer({
  storage: createStorage("store", "product"),
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

// 마이페이지 프로필 이미지 업로드 추가
const userUpload = multer({
  storage: createStorage("user", "profile"),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 }, // 2MB 제한
  fileFilter,
});
const uploadProfileImage = userUpload.single("profile_image");

module.exports = {
  uploadReviewImages,
  uploadProductImage,
  uploadProductImages, // ✅ 대표 이미지 + 상세 이미지 여러 개
  uploadProgramImage,
  uploadProgramImages, // ✅ 대표 이미지 + 상세 이미지 여러 개
  uploadEventImage, // ✅ 꼭 export
  uploadProfileImage, // 마이페이지 프로필 이미지
};
