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
      `INSERT INTO users (user_id, password, name, email, phone, region, marketing_agree, nickname) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, hashedPassword, name, email, phone, region, marketing_agree, req.body.nickname]
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

    // 탈퇴/비활성화 계정 확인
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: '탈퇴하거나 비활성화된 계정입니다.'
      });
    }

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
    if (req.body.nickname) {
      updateFields.push('nickname = ?');
      updateValues.push(req.body.nickname);
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

exports.refreshToken = async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '토큰이 필요합니다.'
      });
    }

    // 만료된 토큰도 디코딩 가능하도록 설정
    const decoded = jwt.decode(token, { complete: true });

    if (!decoded || !decoded.payload.id) {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다.'
      });
    }

    // 새 토큰 발급
    const newToken = jwt.sign(
      { id: decoded.payload.id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      success: true,
      message: '토큰이 갱신되었습니다.',
      data: {
        token: newToken
      }
    });

  } catch (error) {
    console.error('토큰 갱신 실패:', error);
    res.status(500).json({
      success: false,
      message: '토큰 갱신 중 오류가 발생했습니다.'
    });
  }
};

// 비밀번호 변경
exports.changePassword = async (req, res) => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    // 사용자 조회
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }
    const user = users[0];

    // 현재 비밀번호 확인
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: '현재 비밀번호가 일치하지 않습니다.' });
    }

    // 새 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 업데이트
    await db.query('UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?', [hashedPassword, userId]);

    res.status(200).json({ success: true, message: '비밀번호가 변경되었습니다.' });
  } catch (error) {
    console.error('비밀번호 변경 실패:', error);
    res.status(500).json({ success: false, message: '비밀번호 변경 중 오류가 발생했습니다.' });
  }
};

// 회원 탈퇴
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.userId;
    const { password } = req.body;

    // 사용자 조회
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }
    const user = users[0];

    // 비밀번호 확인 (소셜 로그인이 아닌 경우에만 확인)
    const isSocialUser = user.user_id && user.user_id.startsWith('social_');

    if (!isSocialUser && user.password) {
      if (!password) {
        return res.status(400).json({ success: false, message: '비밀번호를 입력해주세요.' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
      }
    }

    // 탈퇴 처리 (Soft Delete or Hard Delete? 보통 Hard Delete or Flagging)
    // Soft Delete Implementation
    // 1. 개인정보 익명화
    const now = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 5);
    const deletedId = `deleted_${now}_${randomSuffix}`;
    const deletedEmail = `deleted_${now}_${randomSuffix}@deleted.com`;
    const deletedName = '탈퇴한 사용자';

    // 2. 비밀번호 무작위화 (로그인 불가능하게 변경)
    const randomPassword = Math.random().toString(36);
    const hashedRandomPassword = await bcrypt.hash(randomPassword, 10);

    // 3. 업데이트 (is_active = false, points = 0)
    await db.query(
      `UPDATE users 
       SET user_id = ?, 
           email = ?, 
           name = ?, 
           password = ?, 
           phone = NULL, 
           is_active = FALSE, 
           points = 0, 
           marketing_agree = FALSE,
           updated_at = NOW() 
       WHERE id = ?`,
      [deletedId, deletedEmail, deletedName, hashedRandomPassword, userId]
    );

    res.status(200).json({ success: true, message: '회원 탈퇴가 완료되었습니다.' });
  } catch (error) {
    console.error('회원 탈퇴 실패:', error);
    res.status(500).json({ success: false, message: '회원 탈퇴 중 오류가 발생했습니다.' });
  }
};
