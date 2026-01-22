const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// 공지사항 목록 조회 (누구나)
router.get('/', noticeController.getAllNotices);

// 공지사항 생성/수정/삭제 (관리자 전용)
router.post('/', authenticateToken, isAdmin, noticeController.createNotice);
router.put('/:id', authenticateToken, isAdmin, noticeController.updateNotice);
router.delete('/:id', authenticateToken, isAdmin, noticeController.deleteNotice);

module.exports = router;
