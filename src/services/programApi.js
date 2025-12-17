import { getApiBaseUrl } from '../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

// 전체 프로그램 목록 조회
export const getAllPrograms = async (page = 1, limit = 20) => {
  try {
    const response = await fetch(`${API_BASE_URL}/programs?page=${page}&limit=${limit}`);
    
    // 네트워크 에러나 응답이 없는 경우
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: `서버 오류가 발생했습니다. (${response.status})` 
      }));
      return {
        success: false,
        error: errorData.error || `HTTP 오류: ${response.status}`,
        data: null
      };
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('프로그램 목록 조회 오류:', error);
    
    // 네트워크 에러 구분
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      return {
        success: false,
        error: '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.',
        data: null
      };
    }
    
    return {
      success: false,
      error: error.message || '데이터를 불러오는 중 오류가 발생했습니다.',
      data: null
    };
  }
};

// 프로그램 상세 조회
export const getProgramById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/programs/${id}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류가 발생했습니다.' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('프로그램 상세 조회 오류:', error);
    throw error;
  }
};

// 프로그램 검색
export const searchPrograms = async (keyword, type, village, page = 1, limit = 20) => {
  try {
    const params = new URLSearchParams({
      page,
      limit,
    });

    if (keyword) params.append('keyword', keyword);
    if (type) params.append('type', type);
    if (village) params.append('village', village);

    const response = await fetch(`${API_BASE_URL}/programs/search?${params}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('프로그램 검색 오류:', error);
    throw error;
  }
};