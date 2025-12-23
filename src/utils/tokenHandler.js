import { getApiBaseUrl } from './apiConfig';

let isRefreshing = false;
let refreshPromise = null;

/**
 * 토큰 갱신 함수
 */
export const refreshToken = async () => {
  if (isRefreshing) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('토큰이 없습니다.');
      }

      const response = await fetch(`${getApiBaseUrl()}/users/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success && data.data.token) {
        localStorage.setItem('token', data.data.token);
        return data.data.token;
      } else {
        throw new Error(data.message || '토큰 갱신 실패');
      }
    } catch (error) {
      console.error('토큰 갱신 실패:', error);
      throw error;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

/**
 * 토큰 만료 시 사용자에게 연장 여부를 묻는 함수
 * @param {Function} onExtend - 연장 시 콜백
 * @param {Function} onLogout - 로그아웃 시 콜백
 * @returns {Promise<boolean>} 연장 여부
 */
export const handleTokenExpired = async (onExtend, onLogout) => {
  return new Promise((resolve) => {
    const userChoice = window.confirm(
      '로그인 세션이 만료되었습니다.\n\n' +
      '확인: 로그인 연장\n' +
      '취소: 로그아웃'
    );

    if (userChoice) {
      // 연장 선택
      refreshToken()
        .then(() => {
          if (onExtend) onExtend();
          resolve(true);
        })
        .catch(() => {
          alert('토큰 갱신에 실패했습니다. 로그아웃됩니다.');
          if (onLogout) onLogout();
          resolve(false);
        });
    } else {
      // 로그아웃 선택
      if (onLogout) onLogout();
      resolve(false);
    }
  });
};