const db = require('../config/db');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// 로그 파일 경로 및 디렉토리 설정
const LOG_DIR = path.join(__dirname, '../../..', '.cursor');
const LOG_FILE = path.join(LOG_DIR, 'debug.log');

// 로그 디렉토리 생성 함수
const ensureLogDir = () => {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('로그 디렉토리 생성 실패:', err);
  }
};

// 로그 작성 헬퍼 함수
const writeLog = (logData) => {
  try {
    ensureLogDir();
    fs.appendFileSync(LOG_FILE, JSON.stringify(logData) + '\n', 'utf8');
  } catch (err) {
    console.error('로그 작성 실패:', err);
  }
};

// 공통 소셜 로그인 처리 함수
const handleSocialLogin = async (req, res, socialType, userInfo) => {
  try {
    const { email, name, socialId } = userInfo;
    // #region agent log
    writeLog({ location: 'socialAuthController.js:9', message: 'handleSocialLogin 시작', data: { socialType, email: email || null, name: name || null, socialId: socialId || null, socialIdType: typeof socialId }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'D' });
    // #endregion

    // 카카오의 경우 이메일이 없을 수 있으므로 임시 이메일 생성
    let finalEmail = email;
    if (!finalEmail && socialType === 'kakao') {
      finalEmail = `kakao_${socialId}@kakao.temp`;
    }
    // #region agent log
    writeLog({ location: 'socialAuthController.js:17', message: '이메일 처리 완료', data: { finalEmail, originalEmail: email || null }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'D' });
    // #endregion

    // 카카오가 아닌 경우 이메일 필수
    if (!finalEmail && socialType !== 'kakao') {
      return res.status(400).json({
        success: false,
        message: `${socialType} 이메일 정보가 필요합니다.`
      });
    }

    // user_id 생성 (socialId 기반)
    const user_id = `social_${socialType}_${socialId}`;
    // #region agent log
    writeLog({ location: 'socialAuthController.js:28', message: 'user_id 생성 완료', data: { user_id, socialId, socialIdType: typeof socialId }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'D' });
    // #endregion

    // user_id로 기존 사용자 확인 (카카오는 이메일이 없을 수 있으므로 user_id로 조회)
    // #region agent log
    writeLog({ location: 'socialAuthController.js:31', message: 'DB 쿼리 시작 - user_id로 조회', data: { user_id }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' });
    // #endregion
    const [existingUsersByUserId] = await db.query(
      'SELECT * FROM users WHERE user_id = ?',
      [user_id]
    );
    // #region agent log
    writeLog({ location: 'socialAuthController.js:34', message: 'DB 쿼리 완료 - user_id로 조회', data: { foundUsers: existingUsersByUserId.length, userId: existingUsersByUserId[0]?.id || null }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' });
    // #endregion

    let user;

    if (existingUsersByUserId.length > 0) {
      // 기존 사용자 - 로그인 처리
      user = existingUsersByUserId[0];
      // #region agent log
      writeLog({ location: 'socialAuthController.js:40', message: '기존 사용자 발견 - user_id로', data: { userId: user.id, userEmail: user.email }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' });
      // #endregion
    } else if (finalEmail) {
      // 이메일로도 확인 (다른 소셜 로그인과의 중복 방지)
      // #region agent log
      writeLog({ location: 'socialAuthController.js:42', message: 'DB 쿼리 시작 - email로 조회', data: { finalEmail }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' });
      // #endregion
      const [existingUsersByEmail] = await db.query(
        'SELECT * FROM users WHERE email = ?',
        [finalEmail]
      );
      // #region agent log
      writeLog({ location: 'socialAuthController.js:46', message: 'DB 쿼리 완료 - email로 조회', data: { foundUsers: existingUsersByEmail.length }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' });
      // #endregion

      if (existingUsersByEmail.length > 0) {
        // 기존 사용자 - 로그인 처리
        user = existingUsersByEmail[0];
        // #region agent log
        writeLog({ location: 'socialAuthController.js:50', message: '기존 사용자 발견 - email로', data: { userId: user.id }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' });
        // #endregion
      }
    }

    if (!user) {
      // 신규 사용자 - 자동 회원가입
      // #region agent log
      writeLog({ location: 'socialAuthController.js:54', message: '신규 사용자 - INSERT 시작', data: { user_id, finalEmail, name: name || '소셜사용자' }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'E' });
      // #endregion
      const bcrypt = require('bcrypt');
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      const [result] = await db.query(
        `INSERT INTO users (user_id, password, name, email, marketing_agree) VALUES (?, ?, ?, ?, ?)`,
        [user_id, hashedPassword, name || '소셜사용자', finalEmail, false]
      );
      // #region agent log
      writeLog({ location: 'socialAuthController.js:63', message: 'INSERT 완료', data: { insertId: result.insertId, affectedRows: result.affectedRows }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'E' });
      // #endregion

      const [newUsers] = await db.query(
        'SELECT * FROM users WHERE id = ?',
        [result.insertId]
      );
      user = newUsers[0];
      // #region agent log
      writeLog({ location: 'socialAuthController.js:69', message: '신규 사용자 조회 완료', data: { userId: user?.id || null, hasUser: !!user }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'E' });
      // #endregion
    }

    // 마지막 로그인 일시 업데이트
    // #region agent log
    writeLog({ location: 'socialAuthController.js:73', message: 'UPDATE 시작 - last_login_at', data: { userId: user.id }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' });
    // #endregion
    await db.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = ?',
      [user.id]
    );
    // #region agent log
    writeLog({ location: 'socialAuthController.js:76', message: 'UPDATE 완료', data: { userId: user.id }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' });
    // #endregion

    // JWT 토큰 생성
    // #region agent log
    writeLog({ location: 'socialAuthController.js:79', message: 'JWT 토큰 생성 시작', data: { userId: user.id, hasJwtSecret: !!JWT_SECRET }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'F' });
    // #endregion
    const token = jwt.sign(
      { id: user.id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    // #region agent log
    writeLog({ location: 'socialAuthController.js:83', message: 'JWT 토큰 생성 완료', data: { hasToken: !!token, tokenLength: token?.length || 0 }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'F' });
    // #endregion

    // #region agent log
    writeLog({ location: 'socialAuthController.js:85', message: '응답 전송 시작', data: { hasToken: !!token, userId: user.id }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'F' });
    // #endregion
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
    // #region agent log
    writeLog({ location: 'socialAuthController.js:101', message: 'handleSocialLogin catch 블록', data: { errorMessage: error.message, errorStack: error.stack, errorCode: error.code, sqlMessage: error.sqlMessage }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' });
    // #endregion
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
    // #region agent log
    writeLog({ location: 'socialAuthController.js:145', message: '카카오 콜백 시작', data: { hasCode: !!code, hasRedirectUri: !!redirect_uri, hasClientId: !!KAKAO_CLIENT_ID, hasClientSecret: !!KAKAO_CLIENT_SECRET }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' });
    // #endregion

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
    // #region agent log
    writeLog({ location: 'socialAuthController.js:165', message: '카카오 토큰 요청 전', data: { codeLength: code?.length, redirectUri: redirect_uri }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' });
    // #endregion
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
    // #region agent log
    writeLog({ location: 'socialAuthController.js:183', message: '카카오 토큰 응답 받음', data: { hasAccessToken: !!access_token, tokenResponseKeys: Object.keys(tokenResponse.data || {}), errorInResponse: !!tokenResponse.data?.error }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' });
    // #endregion

    if (!access_token) {
      console.error('카카오 토큰 응답:', tokenResponse.data);
      return res.status(500).json({
        success: false,
        message: '카카오 액세스 토큰을 받을 수 없습니다.'
      });
    }

    // 카카오 사용자 정보 가져오기
    // #region agent log
    writeLog({ location: 'socialAuthController.js:193', message: '카카오 사용자 정보 요청 전', data: { hasAccessToken: !!access_token }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' });
    // #endregion
    const kakaoResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const kakaoUser = kakaoResponse.data;
    // #region agent log
    writeLog({ location: 'socialAuthController.js:200', message: '카카오 사용자 정보 받음', data: { hasKakaoUser: !!kakaoUser, hasId: !!kakaoUser?.id, idType: typeof kakaoUser?.id, idValue: kakaoUser?.id, hasKakaoAccount: !!kakaoUser?.kakao_account, hasProperties: !!kakaoUser?.properties }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' });
    // #endregion

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
    // #region agent log
    writeLog({ location: 'socialAuthController.js:212', message: '카카오 사용자 정보 파싱 완료', data: { email: email || null, name: name || null, socialId: socialId, socialIdType: typeof socialId }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'D' });
    // #endregion

    // #region agent log
    writeLog({ location: 'socialAuthController.js:214', message: 'handleSocialLogin 호출 전', data: { socialType: 'kakao', hasEmail: !!email, hasName: !!name, hasSocialId: !!socialId }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' });
    // #endregion
    await handleSocialLogin(req, res, 'kakao', { email, name, socialId });
  } catch (error) {
    // #region agent log
    writeLog({ location: 'socialAuthController.js:215', message: '카카오 콜백 catch 블록', data: { errorMessage: error.message, errorStack: error.stack, hasResponse: !!error.response, responseStatus: error.response?.status, responseData: error.response?.data }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'F' });
    // #endregion
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
    const socialId = googleUser.id;

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
    const socialId = googleUser.id;

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
    const socialId = naverUser.id;

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

    console.log('네이버 사용자 정보 응답:', JSON.stringify(naverResponse.data, null, 2));

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
    const socialId = naverUser.id;

    console.log('네이버 사용자 정보:', { email, name, socialId });

    if (!email) {
      return res.status(400).json({
        success: false,
        message: '네이버 이메일 정보가 필요합니다. 네이버 로그인 시 이메일 제공 동의를 해주세요.'
      });
    }

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