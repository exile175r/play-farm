import React, { useCallback } from 'react';
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
  const processingRef = React.useRef(false);

  const handleNaverCallback = useCallback(async (code, state) => {
    try {
      if (state !== STATE) {
        alert('잘못된 요청입니다.');
        processingRef.current = false;
        return;
      }

      const response = await fetch(`${getApiBaseUrl()}/social-auth/naver/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirect_uri: REDIRECT_URI, state })
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
      console.error('네이버 콜백 처리 중 오류:', error);
      handleSocialLoginError({ success: false, message: '네트워크 오류가 발생했습니다.' });
      processingRef.current = false; // 에러 시 플래그 리셋
    }
  }, [setIsLoggedIn, navigate, REDIRECT_URI, STATE]);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state && window.location.pathname.includes('/login/naver/callback') && !processingRef.current) {
      processingRef.current = true;
      // URL에서 code를 즉시 제거하여 중복 실행 방지
      window.history.replaceState({}, document.title, window.location.pathname);
      handleNaverCallback(code, state);
    }
  }, [handleNaverCallback]);

  return (
    <button type="button" className="login-btn" onClick={handleNaverLogin}>
      <img src={getImagePath("/icons/Naver.png")} alt="naver" />
    </button>
  );
};

export default NaverLogin;