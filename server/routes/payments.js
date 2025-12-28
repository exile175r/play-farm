const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');

// 통합 결제 처리 (인증 필요)
router.post('/', authenticateToken, paymentController.processPayment);

module.exports = router;

