import axios from 'axios';
import { handleTokenExpired } from '../utils/tokenHandler';

const API_URL = process.env.REACT_APP_API_URL;

// 전역 로그아웃 핸들러
let globalLogoutHandler = null;

export const setReviewApiLogoutHandler = (handler) => {
  globalLogoutHandler = handler;
};

// Axios 인스턴스 생성
const axiosInstance = axios.create({
  baseURL: API_URL,
});

// 요청 인터셉터
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 에러이고 아직 재시도하지 않은 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const errorMessage = error.response?.data?.message || '';

      // 토큰 만료 에러인 경우
      if (errorMessage.includes('만료') || errorMessage.includes('expired')) {
        try {
          const extended = await handleTokenExpired(
            () => {
              // 연장 성공
            },
            () => {
              // 로그아웃 처리
              if (globalLogoutHandler) {
                globalLogoutHandler();
              }
            }
          );

          if (extended) {
            // 새 토큰으로 재시도
            const token = localStorage.getItem('token');
            originalRequest.headers.Authorization = `Bearer ${token}`;
            // 재시도 - 실패하면 자동으로 catch로 이동하므로 무한 루프 방지됨 (_retry 플래그로)
            return axiosInstance(originalRequest);
          } else {
            return Promise.reject(new Error('로그아웃되었습니다.'));
          }
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export async function createReview(payload) {
  try {
    const formData = new FormData();
    formData.append('program_id', payload.program_id);
    formData.append('rating', payload.rating);
    formData.append('content', payload.content);

    if (payload.images && payload.images.length > 0) {
      payload.images.forEach((file) => {
        formData.append('images', file);
      });
    }

    const res = await axiosInstance.post('/reviews', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
    });

    return { success: true, data: res.data.data };
  } catch (error) {
    console.error('후기 작성 실패:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
}

/**
 * 프로그램별 후기 목록 조회
 * @param {number} programId
 */
export async function getReviewsByProgram(programId) {
  try {
    const res = await axiosInstance.get(`/reviews/program/${programId}`);
    return { success: true, data: res.data.data };
  } catch (error) {
    console.error('후기 조회 실패:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      data: [],
    };
  }
}

/**
 * 내 후기 목록 조회
 */
export async function getMyReviews() {
  try {
    const res = await axiosInstance.get('/reviews/my');
    return { success: true, data: res.data.data };
  } catch (error) {
    console.error('내 후기 조회 실패:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      data: [],
    };
  }
}

export async function updateReview(reviewId, payload) {
  try {
    const formData = new FormData();
    formData.append('rating', payload.rating);
    formData.append('content', payload.content);

    if (payload.images && payload.images.length > 0) {
      payload.images.forEach((file) => {
        formData.append('images', file);
      });
    }

    const res = await axiosInstance.put(`/reviews/${reviewId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return { success: true, data: res.data.data };
  } catch (error) {
    console.error('후기 수정 실패:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
}

export async function deleteReview(reviewId) {
  try {
    const res = await axiosInstance.delete(`/reviews/${reviewId}`);
    return { success: true, message: res.data.message };
  } catch (error) {
    console.error('후기 삭제 실패:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
}