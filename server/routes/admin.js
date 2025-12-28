const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/auth');

// 관리자 로그인 (인증 미들웨어 없이 접근 가능)
router.post('/login', adminController.adminLogin);

// 모든 관리자 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 대시보드 통계
router.get('/dashboard/stats', adminController.getDashboardStats);

// 주문 관리
router.get('/orders', adminController.getAllOrders);
router.post('/orders/:id/refund', adminController.refundOrder);

// 체험 관리
router.get('/programs', adminController.getAllPrograms);
router.post('/programs', adminController.createProgram);
router.put('/programs/:id', adminController.updateProgram);
router.delete('/programs/:id', adminController.deleteProgram);

// 예약 관리
router.get('/reservations', adminController.getAllReservations);
router.put('/reservations/:id/status', adminController.updateReservationStatus);

// 상품 관리
router.get('/products', adminController.getAllProducts);
router.post('/products', adminController.createProduct);
router.put('/products/:id', adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

// 회원 관리
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/status', adminController.updateUserStatus);



module.exports = router;

