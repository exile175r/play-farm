const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faqController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// FAQ 목록 조회 (누구나)
router.get('/', faqController.getAllFaqs);

// FAQ 생성/수정/삭제 (관리자 전용)
router.post('/', authenticateToken, isAdmin, faqController.createFaq);
router.put('/:id', authenticateToken, isAdmin, faqController.updateFaq);
router.delete('/:id', authenticateToken, isAdmin, faqController.deleteFaq);

module.exports = router;
