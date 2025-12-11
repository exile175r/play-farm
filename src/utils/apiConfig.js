export const getApiBaseUrl = () => {
  // 환경 변수가 설정되어 있으면 사용
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // 개발 환경: API 서버 포트 사용
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }

  // 프로덕션 환경: 같은 호스트의 /api 사용
  return `${window.location.origin}/api`;
};