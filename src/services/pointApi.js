import { fetchWithAuthAndRetry, getApiBaseUrl } from "../utils/apiConfig";

const API_BASE = getApiBaseUrl();

let onLogout = null;

export const setPointApiLogoutHandler = (handler) => {
  onLogout = handler;
};

// 내 포인트 조회
export async function getMyPoints() {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/points/my?t=${Date.now()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
      onLogout
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "포인트 조회 실패");
    }

    const data = await res.json();
    return { success: true, data: data.data };
  } catch (e) {
    return { success: false, error: e };
  }
}

// 포인트 사용 내역 조회
export async function getMyPointHistory({ page = 1, limit = 20 } = {}) {
  try {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);

    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/points/my/history?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
      onLogout
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "포인트 내역 조회 실패");
    }

    const data = await res.json();
    return { success: true, data: data.data, pagination: data.pagination };
  } catch (e) {
    return { success: false, error: e, data: [] };
  }
}

