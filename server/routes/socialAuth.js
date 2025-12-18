const express = require('express');
const router = express.Router();
const socialAuthController = require('../controllers/socialAuthController');

// 카카오 로그인 (직접 액세스 토큰 전달)
router.post('/kakao', socialAuthController.kakaoLogin);

// 카카오 콜백 (인가 코드를 액세스 토큰으로 교환 후 로그인)
router.post('/kakao/callback', socialAuthController.kakaoCallback);

// 구글 로그인 (직접 액세스 토큰 전달)
router.post('/google', socialAuthController.googleLogin);

// 구글 콜백 (인가 코드를 액세스 토큰으로 교환 후 로그인)
router.post('/google/callback', socialAuthController.googleCallback);

// 네이버 로그인 (직접 액세스 토큰 전달)
router.post('/naver', socialAuthController.naverLogin);

// 네이버 콜백 (인가 코드를 액세스 토큰으로 교환 후 로그인)
router.post('/naver/callback', socialAuthController.naverCallback);

module.exports = router;