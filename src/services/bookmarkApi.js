import { getApiBaseUrl, fetchWithAuth } from '../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

// 북마크 토글 (추가/삭제)
export const toggleBookmark = async (programId) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/bookmarks/toggle`, {
      method: 'POST',
      body: JSON.stringify({ program_id: programId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '북마크 처리에 실패했습니다.');
    }

    return data;
  } catch (error) {
    console.error('북마크 토글 오류:', error);
    throw error;
  }
};

// 내 북마크 목록 조회
export const getMyBookmarks = async () => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/bookmarks/my`, {
      method: 'GET',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '북마크 목록 조회에 실패했습니다.');
    }

    return data;
  } catch (error) {
    console.error('북마크 목록 조회 오류:', error);
    throw error;
  }
};

// 특정 프로그램 북마크 여부 확인
export const checkBookmark = async (programId) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/bookmarks/check/${programId}`, {
      method: 'GET',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '북마크 확인에 실패했습니다.');
    }

    return data;
  } catch (error) {
    console.error('북마크 확인 오류:', error);
    throw error;
  }
};

// 여러 프로그램 북마크 여부 일괄 확인
export const checkBookmarks = async (programIds) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/bookmarks/check`, {
      method: 'POST',
      body: JSON.stringify({ program_ids: programIds }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '북마크 확인에 실패했습니다.');
    }

    return data;
  } catch (error) {
    console.error('북마크 일괄 확인 오류:', error);
    throw error;
  }
};