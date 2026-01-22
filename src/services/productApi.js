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

    const contentType = res.headers.get('content-type');
    if (!res.ok) {
      if (contentType && contentType.includes('application/json')) {
        const error = await res.json();
        throw new Error(error.message || "상품 목록 조회 실패");
      } else {
        const text = await res.text();
        console.error("비정상 서버 응답 (JSON 아님):", text);
        throw new Error(`서버 에러 (${res.status}): ${text.substring(0, 50)}...`);
      }
    }

    if (contentType && contentType.includes('application/json')) {
      const data = await res.json();
      return { success: true, data: data.data, pagination: data.pagination };
    } else {
      const text = await res.text();
      console.error("성공 응답이나 JSON 아님:", text);
      throw new Error("서버가 JSON 형식이 아닌 데이터를 반환했습니다.");
    }
  } catch (e) {
    console.error("getProducts 에러 상세:", e);
    return { success: false, error: e.message || String(e), data: [] };
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

