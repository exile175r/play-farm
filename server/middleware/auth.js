const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

/**
 * JWT 토큰 검증 미들웨어
 * 로그인한 사용자만 접근할 수 있는 API에 사용
 */
const authenticateToken = (req, res, next) => {
  // 1. 헤더에서 토큰 추출
  // Authorization: Bearer <token> 형식
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer " 제거

  // 2. 토큰이 없으면 에러 반환
  if (!token) {
    return res.status(401).json({
      success: false,
      message: '인증 토큰이 필요합니다. 로그인해주세요.'
    });
  }

  // 3. 토큰 검증
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      // 토큰이 만료되었거나 유효하지 않은 경우
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: '토큰이 만료되었습니다. 다시 로그인해주세요.'
        });
      }
      return res.status(403).json({
        success: false,
        message: '유효하지 않은 토큰입니다.'
      });
    }

    // 4. 검증 성공 - 사용자 ID를 req에 저장하여 컨트롤러에서 사용 가능하도록 함
    req.userId = decoded.id; // 로그인 시 { id: user.id }로 저장했던 값
    req.user = decoded; // 전체 디코딩된 정보도 저장 (필요시 사용)
    next(); // 다음 미들웨어/컨트롤러로 진행
  });
};

module.exports = { authenticateToken };