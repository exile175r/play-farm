const db = require('../config/db');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// 공통 소셜 로그인 처리 함수
const handleSocialLogin = async (req, res, socialType, userInfo) => {
  try {
    const { email, name, socialId } = userInfo;

    // 카카오와 네이버는 이메일이 없을 수 있으므로 임시 이메일 생성
    let finalEmail = email;
    if (!finalEmail && (socialType === 'kakao' || socialType === 'naver')) {
      finalEmail = `${socialType}_${socialId}@${socialType}.temp`;
    }

    // 구글은 이메일 필수
    if (!finalEmail && socialType === 'google') {
      return res.status(400).json({
        success: false,
        message: `${socialType} 이메일 정보가 필요합니다.`
      });
    }

    // user_id 생성 (socialId 기반, 길이가 50자를 초과하면 해시 사용)
    let safeSocialId = socialId;
    const prefix = `social_${socialType}_`;
    const maxLength = 50;

    // prefix + socialId가 50자를 초과하면 해시 사용
    if ((prefix + socialId).length > maxLength) {
      // SHA-256 해시의 앞 32자 사용 (항상 동일한 길이)
      safeSocialId = crypto.createHash('sha256').update(socialId).digest('hex').substring(0, 32);
    }

    const user_id = `${prefix}${safeSocialId}`;

    // user_id로 기존 사용자 확인 (카카오는 이메일이 없을 수 있으므로 user_id로 조회)
    const [existingUsersByUserId] = await db.query(
      'SELECT * FROM users WHERE user_id = ?',
      [user_id]
    );

    let user;

    if (existingUsersByUserId.length > 0) {
      // 기존 사용자 - 로그인 처리
      user = existingUsersByUserId[0];
    } else if (finalEmail) {
      // 이메일로도 확인 (다른 소셜 로그인과의 중복 방지)
      const [existingUsersByEmail] = await db.query(
        'SELECT * FROM users WHERE email = ?',
        [finalEmail]
      );

      if (existingUsersByEmail.length > 0) {
        // 기존 사용자 - 로그인 처리
        user = existingUsersByEmail[0];
      }
    }

    if (!user) {
      // 신규 사용자 - 자동 회원가입
      const bcrypt = require('bcrypt');
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      const [result] = await db.query(
        `INSERT INTO users (user_id, password, name, email, marketing_agree) VALUES (?, ?, ?, ?, ?)`,
        [user_id, hashedPassword, name || '소셜사용자', finalEmail, false]
      );

      const [newUsers] = await db.query(
        'SELECT * FROM users WHERE id = ?',
        [result.insertId]
      );
      user = newUsers[0];
    }

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
    console.error(`${socialType} 로그인 실패:`, error);
    return res.status(500).json({
      success: false,
      message: `${socialType} 로그인 중 오류가 발생했습니다.`
    });
  }
};

// 카카오 로그인
exports.kakaoLogin = async (req, res) => {
  try {
    const { access_token } = req.body;

    if (!access_token) {
      return res.status(400).json({
        success: false,
        message: '카카오 액세스 토큰이 필요합니다.'
      });
    }

    // 카카오 사용자 정보 가져오기
    const kakaoResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const kakaoUser = kakaoResponse.data;
    const email = kakaoUser.kakao_account?.email;
    const name = kakaoUser.kakao_account?.profile?.nickname || kakaoUser.properties?.nickname;
    const socialId = kakaoUser.id.toString();

    await handleSocialLogin(req, res, 'kakao', { email, name, socialId });
  } catch (error) {
    console.error('카카오 로그인 실패:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: '카카오 로그인 중 오류가 발생했습니다.'
    });
  }
};

// 카카오 콜백 처리 (인가 코드를 액세스 토큰으로 교환)
exports.kakaoCallback = async (req, res) => {
  try {
    const { code, redirect_uri } = req.body;
    const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID;
    const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: '인가 코드가 필요합니다.'
      });
    }

    if (!KAKAO_CLIENT_ID || !KAKAO_CLIENT_SECRET) {
      return res.status(500).json({
        success: false,
        message: '카카오 로그인 설정이 필요합니다.'
      });
    }

    // 인가 코드로 액세스 토큰 받기
    const tokenResponse = await axios.post(
      'https://kauth.kakao.com/oauth/token',
      null,
      {
        params: {
          grant_type: 'authorization_code',
          client_id: KAKAO_CLIENT_ID,
          client_secret: KAKAO_CLIENT_SECRET,
          redirect_uri: redirect_uri,
          code: code
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const access_token = tokenResponse.data?.access_token;

    if (!access_token) {
      console.error('카카오 토큰 응답:', tokenResponse.data);
      return res.status(500).json({
        success: false,
        message: '카카오 액세스 토큰을 받을 수 없습니다.'
      });
    }

    // 카카오 사용자 정보 가져오기
    const kakaoResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const kakaoUser = kakaoResponse.data;

    if (!kakaoUser || !kakaoUser.id) {
      console.error('카카오 사용자 정보 없음:', kakaoUser);
      return res.status(500).json({
        success: false,
        message: '카카오 사용자 정보를 가져올 수 없습니다.'
      });
    }

    const email = kakaoUser.kakao_account?.email;
    const name = kakaoUser.kakao_account?.profile?.nickname || kakaoUser.properties?.nickname;
    const socialId = kakaoUser.id.toString();

    await handleSocialLogin(req, res, 'kakao', { email, name, socialId });
  } catch (error) {
    console.error('카카오 콜백 실패:', error.response?.data || error.message);
    console.error('에러 스택:', error.stack);
    return res.status(500).json({
      success: false,
      message: '카카오 로그인 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 구글 로그인
exports.googleLogin = async (req, res) => {
  try {
    const { access_token } = req.body;

    if (!access_token) {
      return res.status(400).json({
        success: false,
        message: '구글 액세스 토큰이 필요합니다.'
      });
    }

    // 구글 사용자 정보 가져오기
    const googleResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const googleUser = googleResponse.data;
    const email = googleUser.email;
    const name = googleUser.name;
    const socialId = googleUser.id?.toString();

    await handleSocialLogin(req, res, 'google', { email, name, socialId });
  } catch (error) {
    console.error('구글 로그인 실패:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: '구글 로그인 중 오류가 발생했습니다.'
    });
  }
};

// 구글 콜백 처리
exports.googleCallback = async (req, res) => {
  try {
    const { code, redirect_uri } = req.body;
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: '인가 코드가 필요합니다.'
      });
    }

    // 인가 코드로 액세스 토큰 받기 (구글은 application/x-www-form-urlencoded 형식 사용)
    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        code: code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const access_token = tokenResponse.data.access_token;

    if (!access_token) {
      return res.status(500).json({
        success: false,
        message: '구글 액세스 토큰을 받을 수 없습니다.'
      });
    }

    // 구글 사용자 정보 가져오기
    const googleResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const googleUser = googleResponse.data;
    const email = googleUser.email;
    const name = googleUser.name;
    const socialId = googleUser.id?.toString();

    await handleSocialLogin(req, res, 'google', { email, name, socialId });
  } catch (error) {
    console.error('구글 콜백 실패:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: '구글 로그인 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? (error.response?.data || error.message) : undefined
    });
  }
};

// 네이버 로그인
exports.naverLogin = async (req, res) => {
  try {
    const { access_token } = req.body;

    if (!access_token) {
      return res.status(400).json({
        success: false,
        message: '네이버 액세스 토큰이 필요합니다.'
      });
    }

    // 네이버 사용자 정보 가져오기
    const naverResponse = await axios.get('https://openapi.naver.com/v1/nid/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const naverUser = naverResponse.data.response;
    const email = naverUser.email;
    const name = naverUser.name;
    const socialId = naverUser.id?.toString();

    if (!socialId) {
      return res.status(500).json({
        success: false,
        message: '네이버 사용자 ID를 가져올 수 없습니다.'
      });
    }

    await handleSocialLogin(req, res, 'naver', { email, name, socialId });
  } catch (error) {
    console.error('네이버 로그인 실패:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: '네이버 로그인 중 오류가 발생했습니다.'
    });
  }
};

// 네이버 콜백 처리
exports.naverCallback = async (req, res) => {
  try {
    const { code, redirect_uri, state } = req.body;
    const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
    const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: '인가 코드가 필요합니다.'
      });
    }

    // 인가 코드로 액세스 토큰 받기
    const tokenResponse = await axios.get(
      'https://nid.naver.com/oauth2.0/token',
      {
        params: {
          grant_type: 'authorization_code',
          client_id: NAVER_CLIENT_ID,
          client_secret: NAVER_CLIENT_SECRET,
          redirect_uri: redirect_uri,
          code: code,
          state: state
        }
      }
    );

    const access_token = tokenResponse.data.access_token;

    if (!access_token) {
      console.error('네이버 토큰 응답:', tokenResponse.data);
      return res.status(500).json({
        success: false,
        message: '네이버 액세스 토큰을 받을 수 없습니다.'
      });
    }

    // 네이버 사용자 정보 가져오기
    const naverResponse = await axios.get('https://openapi.naver.com/v1/nid/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const naverUser = naverResponse.data.response;

    if (!naverUser) {
      console.error('네이버 사용자 정보 없음:', naverResponse.data);
      return res.status(500).json({
        success: false,
        message: '네이버 사용자 정보를 가져올 수 없습니다.'
      });
    }

    const email = naverUser.email;
    const name = naverUser.name;
    const socialId = naverUser.id?.toString();

    if (!socialId) {
      return res.status(500).json({
        success: false,
        message: '네이버 사용자 ID를 가져올 수 없습니다.'
      });
    }

    // 네이버는 이메일이 없을 수 있으므로 handleSocialLogin에서 처리
    await handleSocialLogin(req, res, 'naver', { email, name, socialId });
  } catch (error) {
    console.error('네이버 콜백 실패:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: '네이버 로그인 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? (error.response?.data || error.message) : undefined
    });
  }
};
