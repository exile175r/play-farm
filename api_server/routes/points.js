const express = require('express');
const router = express.Router();
const pointController = require('../controllers/pointController');
const { authenticateToken } = require('../middleware/auth');

// 내 포인트 조회 (인증 필요)
router.get('/my', authenticateToken, pointController.getMyPoints);

// 포인트 사용 내역 조회 (인증 필요)
router.get('/my/history', authenticateToken, pointController.getMyPointHistory);

module.exports = router;

