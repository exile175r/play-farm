const express = require('express');
const router = express.Router();
const bookmarkController = require('../controllers/bookmarkController');
const { authenticateToken } = require('../middleware/auth');

// 북마크 추가/삭제 (토글) - 인증 필요
router.post('/toggle', authenticateToken, bookmarkController.toggleBookmark);

// 내 북마크 목록 조회 - 인증 필요
router.get('/my', authenticateToken, bookmarkController.getMyBookmarks);

// 특정 프로그램 북마크 여부 확인 - 인증 필요
router.get('/check/:program_id', authenticateToken, bookmarkController.checkBookmark);

// 여러 프로그램 북마크 여부 일괄 확인 - 인증 필요
router.post('/check', authenticateToken, bookmarkController.checkBookmarks);

module.exports = router;