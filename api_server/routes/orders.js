const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/auth');

// 주문 생성 (인증 필요)
router.post('/', authenticateToken, orderController.createOrder);

// 내 주문 목록 조회 (인증 필요)
router.get('/my', authenticateToken, orderController.getMyOrders);

// 주문 상세 조회 (인증 필요)
router.get('/:id', authenticateToken, orderController.getOrderById);

// 주문 결제 처리 (인증 필요)
router.post('/:id/payment', authenticateToken, orderController.payOrder);

// 주문 취소 (인증 필요)
router.post('/:id/cancel', authenticateToken, orderController.cancelOrder);

// 주문 환불 (인증 필요)
router.post('/:id/refund', authenticateToken, orderController.refundOrder);

module.exports = router;

