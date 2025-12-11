import { getApiBaseUrl } from '../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

// 전체 프로그램 목록 조회
export const getAllPrograms = async (page = 1, limit = 20) => {
  try {
    const response = await fetch(`${API_BASE_URL}/programs?page=${page}&limit=${limit}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('프로그램 목록 조회 오류:', error);
    throw error;
  }
};

// 프로그램 상세 조회
export const getProgramById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/programs/${id}`);
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