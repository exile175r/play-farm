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

/**
 * 인증이 필요한 API 요청을 위한 헤더 생성
 * @returns {Object} Authorization 헤더가 포함된 헤더 객체
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * 인증이 필요한 API 요청을 위한 fetch 래퍼
 * @param {string} url - 요청 URL
 * @param {Object} options - fetch 옵션
 * @returns {Promise<Response>} fetch 응답
 */
export const fetchWithAuth = async (url, options = {}) => {
  const headers = getAuthHeaders();

  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
};