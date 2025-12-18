import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getImagePath } from '../../utils/imagePath';
import { getApiBaseUrl } from '../../utils/apiConfig';
import { handleSocialLoginSuccess, handleSocialLoginError } from '../../utils/socialAuth';

const NaverLogin = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();
  const NAVER_CLIENT_ID = process.env.REACT_APP_NAVER_CLIENT_ID;
  const REDIRECT_URI = `${window.location.origin}/login/naver/callback`;
  const STATE = 'RANDOM_STATE_STRING'; // CSRF 방지를 위한 랜덤 문자열

  const handleNaverLogin = () => {
    if (!NAVER_CLIENT_ID) {
      alert('네이버 로그인 설정이 필요합니다. REACT_APP_NAVER_CLIENT_ID를 확인해주세요.');
      return;
    }

    // 네이버 로그인 페이지로 리다이렉트 (scope에 name,email 추가)
    const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${STATE}&scope=name,email`;
    window.location.href = naverAuthUrl;
  };

  // 네이버 콜백 처리
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state && window.location.pathname.includes('/login/naver/callback')) {
      handleNaverCallback(code, state);
    }
  }, []);

  const handleNaverCallback = async (code, state) => {
    try {
      if (state !== STATE) {
        alert('잘못된 요청입니다.');
        return;
      }

      const response = await fetch(`${getApiBaseUrl()}/social-auth/naver/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirect_uri: REDIRECT_URI, state })
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
    <button type="button" className="login-btn" onClick={handleNaverLogin}>
      <img src={getImagePath("/icons/Naver.png")} alt="naver" />
    </button>
  );
};

export default NaverLogin;