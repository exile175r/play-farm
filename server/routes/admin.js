// server/routes/admin.js (경로는 네 프로젝트 기준으로)
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const eventController = require("../controllers/eventController");
const { authenticateToken } = require("../middleware/auth");
const {
  uploadProductImage,
  uploadProductImages, // ✅ 대표 이미지 + 상세 이미지 여러 개
  uploadProgramImage,
  uploadProgramImages, // ✅ 대표 이미지 + 상세 이미지 여러 개
  uploadEventImage, // ✅ 이벤트 이미지 업로드 추가
} = require("../middleware/upload");

// 관리자 로그인 (인증 미들웨어 없이 접근 가능)
router.post("/login", adminController.adminLogin);

// 모든 관리자 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 대시보드 통계
router.get("/dashboard/stats", adminController.getDashboardStats);

// 주문 관리
router.get("/orders", adminController.getAllOrders);
router.get("/orders/:id", adminController.getOrderById); // 관리자용 주문 상세 조회
router.post("/orders/:id/refund", adminController.refundOrder);

// 체험 관리
router.get("/programs", adminController.getAllPrograms);
router.get("/program-types", adminController.getAllProgramTypes);
router.post("/programs", uploadProgramImages, adminController.createProgram);
router.put("/programs/:id", uploadProgramImages, adminController.updateProgram);
router.delete("/programs/:id", adminController.deleteProgram);

// ✅ 이벤트 관리
router.get("/events", eventController.getAllEvents);
router.post("/events", uploadEventImage, eventController.createEvent);
router.put("/events/:id", uploadEventImage, eventController.updateEvent);
router.delete("/events/:id", eventController.deleteEvent);

// 예약 관리
router.get("/reservations", adminController.getAllReservations);
router.put("/reservations/:id/status", adminController.updateReservationStatus);
router.delete("/reservations/:id", adminController.deleteReservation);

// 상품 관리
router.get("/products", adminController.getAllProducts);
router.post("/products", uploadProductImages, adminController.createProduct);
router.put("/products/:id", uploadProductImages, adminController.updateProduct);
router.delete("/products/:id", adminController.deleteProduct);

// 회원 관리
router.get("/users", adminController.getAllUsers);
router.put("/users/:id/status", adminController.updateUserStatus);

module.exports = router;
