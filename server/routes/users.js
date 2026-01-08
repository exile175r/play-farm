const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { uploadProfileImage } = require('../middleware/upload');

// 회원가입
router.post('/signup', userController.signup);

// 로그인
router.post('/login', userController.login);

// 토큰 갱신
router.post('/refresh-token', userController.refreshToken);

// 마이페이지 - 내 정보 조회
router.get('/me', authenticateToken, userController.getMyProfile);

// 마이페이지 - 내 정보 수정
router.put('/me', authenticateToken, uploadProfileImage, userController.updateMyProfile);

// 비밀번호 변경
router.put('/change-password', authenticateToken, userController.changePassword);

// 회원 탈퇴
router.delete('/me', authenticateToken, userController.deleteAccount);


module.exports = router;