import { getApiBaseUrl } from "../utils/apiConfig";

const API_BASE = getApiBaseUrl();

// 상품 목록 조회
export async function getProducts({ category, keyword, page = 1, limit = 20 } = {}) {
  try {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (keyword) params.append('keyword', keyword);
    params.append('page', page);
    params.append('limit', limit);

    const res = await fetch(`${API_BASE}/products?${params.toString()}`);

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "상품 목록 조회 실패");
    }

    const data = await res.json();
    return { success: true, data: data.data, pagination: data.pagination };
  } catch (e) {
    return { success: false, error: e, data: [] };
  }
}

// 상품 상세 조회
export async function getProductById(productId) {
  try {
    const res = await fetch(`${API_BASE}/products/${productId}`);

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "상품 조회 실패");
    }

    const data = await res.json();
    return { success: true, data: data.data };
  } catch (e) {
    return { success: false, error: e };
  }
}

