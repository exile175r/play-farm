import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getImagePath } from '../../utils/imagePath';
import { getApiBaseUrl } from '../../utils/apiConfig';
import { handleSocialLoginSuccess, handleSocialLoginError } from '../../utils/socialAuth';

const KakaoLogin = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();
  const KAKAO_CLIENT_ID = process.env.REACT_APP_KAKAO_CLIENT_ID;
  const REDIRECT_URI = `${window.location.origin}/login/kakao/callback`;

  const handleKakaoLogin = () => {
    if (!KAKAO_CLIENT_ID) {
      alert('카카오 로그인 설정이 필요합니다. REACT_APP_KAKAO_CLIENT_ID를 확인해주세요.');
      return;
    }

    // 디버깅: redirect_uri 확인
    console.log('카카오 로그인 - Redirect URI:', REDIRECT_URI);
    console.log('카카오 로그인 - Client ID:', KAKAO_CLIENT_ID);

    // 카카오 로그인 페이지로 리다이렉트 (scope 제거 - 기본 정보만 요청)
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code`;

    console.log('카카오 인증 URL:', kakaoAuthUrl);

    window.location.href = kakaoAuthUrl;
  };

  // 카카오 콜백 처리 (URL에 code가 있을 때)
  const processingRef = React.useRef(false);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code && window.location.pathname.includes('/login/kakao/callback') && !processingRef.current) {
      processingRef.current = true;
      // URL에서 code를 즉시 제거하여 중복 실행 방지
      window.history.replaceState({}, document.title, window.location.pathname);
      handleKakaoCallback(code);
    }
  }, []);

  const handleKakaoCallback = async (code) => {
    try {
      const apiUrl = `${getApiBaseUrl()}/social-auth/kakao/callback`;
      // 백엔드에서 액세스 토큰 교환 및 로그인 처리
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirect_uri: REDIRECT_URI })
      });

      // 응답이 ok가 아니면 에러 처리
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { success: false, message: `서버 오류 (${response.status})` };
        }
        handleSocialLoginError(errorData);
        return;
      }

      // 성공 응답 파싱
      const data = await response.json();

      if (data.success && data.data?.token) {
        handleSocialLoginSuccess(data, setIsLoggedIn, navigate);
        // URL에서 code 제거 (이미 useEffect에서 제거했지만 안전을 위해)
        window.history.replaceState({}, document.title, '/user/login');
      } else {
        handleSocialLoginError(data);
        processingRef.current = false; // 에러 시 플래그 리셋
      }
    } catch (error) {
      console.error('카카오 콜백 처리 중 오류:', error);
      handleSocialLoginError({ success: false, message: '네트워크 오류가 발생했습니다.' });
      processingRef.current = false; // 에러 시 플래그 리셋
    }
  };

  return (
    <button type="button" className="login-btn" onClick={handleKakaoLogin}>
      <img src={getImagePath("/icons/Kakao.png")} alt="kakao" />
    </button>
  );
};

export default KakaoLogin;