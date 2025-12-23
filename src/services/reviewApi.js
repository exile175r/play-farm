import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * 후기 작성
 * @param {Object} payload - { program_id, rating, content, images: File[] }
 */
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

    const res = await axios.post(`${API_URL}/reviews`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...getAuthHeaders(),
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
    const res = await axios.get(`${API_URL}/reviews/program/${programId}`);
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
    const res = await axios.get(`${API_URL}/reviews/my`, {
      headers: getAuthHeaders(),
    });
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

/**
 * 후기 수정
 * @param {number} reviewId
 * @param {Object} payload - { rating, content, images: File[] }
 */
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

    const res = await axios.put(`${API_URL}/reviews/${reviewId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...getAuthHeaders(),
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

/**
 * 후기 삭제
 * @param {number} reviewId
 */
export async function deleteReview(reviewId) {
  try {
    const res = await axios.delete(`${API_URL}/reviews/${reviewId}`, {
      headers: getAuthHeaders(),
    });
    return { success: true, message: res.data.message };
  } catch (error) {
    console.error('후기 삭제 실패:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
}