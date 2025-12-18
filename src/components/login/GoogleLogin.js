import React from 'react';
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
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code && window.location.pathname.includes('/login/google/callback')) {
      handleGoogleCallback(code);
    }
  }, []);

  const handleGoogleCallback = async (code) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/social-auth/google/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirect_uri: REDIRECT_URI })
      });

      const data = await response.json();

      if (response.ok) {
        handleSocialLoginSuccess(data, setIsLoggedIn, navigate);
        // URL에서 code 제거
        window.history.replaceState({}, document.title, '/user/login');
      } else {
        handleSocialLoginError(data);
      }
    } catch (error) {
      handleSocialLoginError(error);
    }
  };

  return (
    <button type="button" className="login-btn" onClick={handleGoogleLogin}>
      <img src={getImagePath("/icons/Google.png")} alt="google" />
    </button>
  );
};

export default GoogleLogin;