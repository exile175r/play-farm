/**
 * 소셜 로그인 성공 후 처리
 */
export const handleSocialLoginSuccess = (data, setIsLoggedIn, navigate) => {
  if (data.success && data.data.token) {
    localStorage.setItem('token', data.data.token);
    setIsLoggedIn(true);
    navigate('/');
    alert('로그인 성공');
  } else {
    alert(data.message || '로그인 실패');
  }
};

/**
 * 소셜 로그인 에러 처리
 */
export const handleSocialLoginError = (error) => {
  console.error('소셜 로그인 실패:', error);
  alert('로그인 중 오류가 발생했습니다.');
};