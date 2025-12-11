const db = require('../config/db');
const bcrypt = require('bcrypt'); // 비밀번호 해시화
const jwt = require('jsonwebtoken'); // 토큰 생성

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// 회원가입
exports.signup = async (req, res) => {
  try {
    const { user_id, password, name, email, phone, region, marketing_agree } = req.body;

    // 아이디 중복 확인
    const [existingUser] = await db.query(
      `SELECT * FROM users WHERE user_id = ?`,
      [user_id]
    );
    if (existingUser.length > 0) { // 이미 사용중인 아이디
      return res.status(400).json({ success: false, message: '이미 사용중인 아이디입니다.' });
    }

    // 이메일 중복 확인
    const [existingEmail] = await db.query(
      `SELECT * FROM users WHERE email = ?`,
      [email]
    );
    if (existingEmail.length > 0) { // 이미 사용중인 이메일
      return res.status(400).json({ success: false, message: '이미 사용중인 이메일입니다.' });
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 회원 정보 저장
    const [result] = await db.query(
      `INSERT INTO users (user_id, password, name, email, phone, region, marketing_agree) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id, hashedPassword, name, email, phone, region, marketing_agree]
    );

    return res.status(201).json({ success: true, message: '회원가입이 완료되었습니다.' });

  } catch (error) {
    console.error('회원가입 실패:', error);
    return res.status(500).json({ success: false, message: '회원가입 중 오류가 발생했습니다.' });
  };
};

// 로그인
exports.login = async (req, res) => {
  try {
    const { user_id, password } = req.body;

    // 사용자 조회
    const [users] = await db.query(
      'SELECT * FROM users WHERE user_id = ?',
      [user_id]
    );
    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: '아이디 또는 비밀번호가 일치하지 않습니다.'
      });
    };

    const user = users[0];

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: '아이디 또는 비밀번호가 일치하지 않습니다.'
      });
    };

    // 마지막 로그인 일시 업데이트
    await db.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = ?',
      [user.id]
    );

    // JWT 토큰 생성
    const token = jwt.sign(
      { id: user.id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      success: true,
      message: '로그인 성공',
      data: {
        token: token,
        user: {
          id: user.id,
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          region: user.region,
          marketing_agree: user.marketing_agree
        }
      }
    });
  } catch (error) {
    console.error('로그인 실패:', error);
    return res.status(500).json({ success: false, message: '로그인 중 오류가 발생했습니다.' });
  }
};