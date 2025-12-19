import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getImagePath } from '../../utils/imagePath';
import { getApiBaseUrl } from '../../utils/apiConfig';
import { handleSocialLoginSuccess, handleSocialLoginError } from '../../utils/socialAuth';

const GoogleLogin = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();
  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const REDIRECT_URI = `${window.location.origin}/login/google/callback`;

  const handleGoogleLogin = () => {
    if (!GOOGLE_CLIENT_ID) {
      alert('구글 로그인 설정이 필요합니다. REACT_APP_GOOGLE_CLIENT_ID를 확인해주세요.');
      return;
    }

    // 구글 로그인 페이지로 리다이렉트
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=email profile`;
    window.location.href = googleAuthUrl;
  };

  // 구글 콜백 처리
  const processingRef = React.useRef(false);

  const handleGoogleCallback = useCallback(async (code) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/social-auth/google/callback`, {
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
        processingRef.current = false; // 에러 시 플래그 리셋
        return;
      }

      // 성공 응답 파싱
      const data = await response.json();

      if (data.success && data.data?.token) {
        handleSocialLoginSuccess(data, setIsLoggedIn, navigate);
      } else {
        handleSocialLoginError(data);
        processingRef.current = false; // 에러 시 플래그 리셋
      }
    } catch (error) {
      console.error('구글 콜백 처리 중 오류:', error);
      handleSocialLoginError({ success: false, message: '네트워크 오류가 발생했습니다.' });
      processingRef.current = false; // 에러 시 플래그 리셋
    }
  }, [setIsLoggedIn, navigate, REDIRECT_URI]);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code && window.location.pathname.includes('/login/google/callback') && !processingRef.current) {
      processingRef.current = true;
      // URL에서 code를 즉시 제거하여 중복 실행 방지
      window.history.replaceState({}, document.title, window.location.pathname);
      handleGoogleCallback(code);
    }
  }, [handleGoogleCallback]);

  return (
    <button type="button" className="login-btn" onClick={handleGoogleLogin}>
      <img src={getImagePath("/icons/Google.png")} alt="google" />
    </button>
  );
};

export default GoogleLogin;
