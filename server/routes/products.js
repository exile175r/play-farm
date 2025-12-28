const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// 상품 목록 조회 (인증 불필요)
router.get('/', productController.getProducts);

// 상품 상세 조회 (인증 불필요)
router.get('/:id', productController.getProductById);

module.exports = router;

