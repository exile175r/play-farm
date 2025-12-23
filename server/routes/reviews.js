const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateToken } = require('../middleware/auth');
const { uploadReviewImages } = require('../middleware/upload');

// 후기 작성 (인증 필요)
router.post('/', authenticateToken, uploadReviewImages, reviewController.createReview);

// 프로그램별 후기 목록 조회 (인증 불필요)
router.get('/program/:program_id', reviewController.getReviewsByProgram);

// 내 후기 목록 조회 (인증 필요)
router.get('/my', authenticateToken, reviewController.getMyReviews);

// 후기 수정 (인증 필요)
router.put('/:id', authenticateToken, uploadReviewImages, reviewController.updateReview);

// 후기 삭제 (인증 필요)
router.delete('/:id', authenticateToken, reviewController.deleteReview);

module.exports = router;