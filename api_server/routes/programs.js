const express = require('express');
const router = express.Router();
const programController = require('../controllers/programController');

// 전체 프로그램 목록 조회
router.get('/', programController.getAllPrograms);

// 프로그램 검색
router.get('/search', programController.searchPrograms);

// 프로그램 상세 조회
router.get('/:id', programController.getProgramById);


module.exports = router;