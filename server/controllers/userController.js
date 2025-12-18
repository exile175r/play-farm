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

// 마이페이지 - 내 정보 조회 (인증 필요)
exports.getMyProfile = async (req, res) => {
  try {
    // authenticateToken 미들웨어에서 설정한 req.userId 사용
    const userId = req.userId;

    // 사용자 정보 조회
    const [users] = await db.query(
      'SELECT id, user_id, name, email, phone, region, marketing_agree, created_at, last_login_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    const user = users[0];

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          region: user.region,
          marketing_agree: user.marketing_agree,
          created_at: user.created_at,
          last_login_at: user.last_login_at
        }
      }
    });
  } catch (error) {
    console.error('마이페이지 조회 실패:', error);
    return res.status(500).json({ success: false, message: '마이페이지 조회 중 오류가 발생했습니다.' });
  }
};

// 마이페이지 - 내 정보 수정 (인증 필요)
exports.updateMyProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, email, phone, region, marketing_agree } = req.body;

    // 이메일 중복 확인 (본인 이메일 제외)
    if (email) {
      const [existingEmail] = await db.query(
        `SELECT * FROM users WHERE email = ? AND id != ?`,
        [email, userId]
      );
      if (existingEmail.length > 0) {
        return res.status(400).json({ success: false, message: '이미 사용중인 이메일입니다.' });
      }
    }

    // 업데이트할 필드만 동적으로 구성
    const updateFields = [];
    const updateValues = [];

    if (name) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (email) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (phone) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (region) {
      updateFields.push('region = ?');
      updateValues.push(region);
    }
    if (marketing_agree !== undefined) {
      updateFields.push('marketing_agree = ?');
      updateValues.push(marketing_agree);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: '수정할 정보가 없습니다.' });
    }

    updateValues.push(userId);

    await db.query(
      `UPDATE users SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      updateValues
    );

    res.status(200).json({
      success: true,
      message: '정보가 수정되었습니다.'
    });
  } catch (error) {
    console.error('정보 수정 실패:', error);
    return res.status(500).json({ success: false, message: '정보 수정 중 오류가 발생했습니다.' });
  }
};