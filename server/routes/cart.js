const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticateToken } = require('../middleware/auth');

// 장바구니 담기 (인증 필요)
router.post('/', authenticateToken, cartController.addToCart);

// 내 장바구니 조회 (인증 필요)
router.get('/my', authenticateToken, cartController.getMyCart);

// 장바구니 수량 수정 (인증 필요)
router.put('/:id', authenticateToken, cartController.updateCartItem);

// 장바구니 항목 삭제 (인증 필요)
router.delete('/:id', authenticateToken, cartController.removeCartItem);

// 장바구니 비우기 (인증 필요)
router.delete('/', authenticateToken, cartController.clearCart);

module.exports = router;

