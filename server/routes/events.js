const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticateToken } = require('../middleware/auth');

// 모든 이벤트 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 이벤트 목록 조회 (검색/필터링 + 페이지네이션)
router.get('/', eventController.getAllEvents);

// 이벤트 생성
router.post('/', eventController.createEvent);

// 이벤트 수정
router.put('/:id', eventController.updateEvent);

// 이벤트 삭제
router.delete('/:id', eventController.deleteEvent);

module.exports = router;

