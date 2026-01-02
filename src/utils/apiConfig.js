import { handleTokenExpired } from './tokenHandler';

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

// 전역 로그아웃 핸들러 (App.js에서 설정)
let globalLogoutHandler = null;

export const setGlobalLogoutHandler = (handler) => {
  globalLogoutHandler = handler;
};

/**
 * 토큰 만료 처리가 포함된 fetch 래퍼
 * @param {string} url - 요청 URL
 * @param {Object} options - fetch 옵션
 * @param {Function} onLogout - 로그아웃 콜백 (선택사항)
 * @returns {Promise<Response>} fetch 응답
 */
export const fetchWithAuthAndRetry = async (url, options = {}, onLogout = null) => {
  const headers = getAuthHeaders();

  // FormData인 경우 Content-Type 헤더 제거 (브라우저가 자동으로 설정)
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  let response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  // 401 에러 처리 (토큰 만료)
  if (response.status === 401) {
    const errorData = await response.json().catch(() => ({}));

    // 토큰 만료 에러인 경우
    if (errorData.message?.includes('만료') || errorData.message?.includes('expired')) {
      const extended = await handleTokenExpired(
        () => {
          // 연장 성공 시 아무것도 하지 않음 (다시 요청할 예정)
        },
        () => {
          // 로그아웃 처리
          if (onLogout) {
            onLogout();
          } else if (globalLogoutHandler) {
            globalLogoutHandler();
          }
        }
      );

      // 연장 성공 시 원래 요청 재시도
      if (extended) {
        const newHeaders = getAuthHeaders();

        // 재시도 시에도 FormData 체크
        if (options.body instanceof FormData) {
          delete newHeaders['Content-Type'];
        }

        response = await fetch(url, {
          ...options,
          headers: {
            ...newHeaders,
            ...options.headers,
          },
        });

        // 재시도 후에도 401이면 무한 루프 방지를 위해 에러 반환
        if (response.status === 401) {
          throw new Error('인증에 실패했습니다. 다시 로그인해주세요.');
        }
      } else {
        // 로그아웃 선택 시 에러 반환
        throw new Error('로그아웃되었습니다.');
      }
    }
  }

  return response;
};