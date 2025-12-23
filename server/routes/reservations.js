const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { authenticateToken } = require('../middleware/auth');

// 예약 생성 (인증 필요)
router.post('/', authenticateToken, reservationController.createReservation);

// 내 예약 목록 조회 (인증 필요)
router.get('/my', authenticateToken, reservationController.getMyReservations);

// 예약 상세 조회 (인증 필요)
router.get('/:id', authenticateToken, reservationController.getReservationById);

// 예약 취소 (인증 필요)
router.post('/:id/cancel', authenticateToken, reservationController.cancelReservation);

// 결제 완료 처리 (인증 필요)
router.post('/:id/payment', authenticateToken, reservationController.markPayment);

// 결제 실패 처리 (인증 필요)
router.post('/:id/payment-failed', authenticateToken, reservationController.markPaymentFailed);

// 결제 취소(환불) 처리 (인증 필요)
router.post('/:id/refund', authenticateToken, reservationController.refundReservation);

module.exports = router;