// src/services/adminApi.js
import { fetchWithAuthAndRetry, getApiBaseUrl } from "../utils/apiConfig";

const API_BASE = getApiBaseUrl();

let onLogout = null;

export const setAdminApiLogoutHandler = (handler) => {
  onLogout = handler;
};

// 대시보드 통계 조회
export async function getDashboardStats() {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/admin/dashboard/stats`,
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
      throw new Error(error.message || "대시보드 통계 조회 실패");
    }

    const data = await res.json();
    return { success: true, data: data.data };
  } catch (e) {
    return { success: false, error: e };
  }
}

// 전체 주문 목록 조회
export async function getAllOrders({ page = 1, limit = 20, keyword = "", status = "ALL" }) {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      keyword: keyword,
      status: status,
    });

    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/admin/orders?${params.toString()}`,
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
      throw new Error(error.message || "주문 목록 조회 실패");
    }

    const data = await res.json();
    return { success: true, data: data.data, pagination: data.pagination };
  } catch (e) {
    return { success: false, error: e, data: [], pagination: null };
  }
}

// 주문 환불 처리
export async function refundOrder(orderId, reason = "관리자 환불 처리") {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/admin/orders/${encodeURIComponent(orderId)}/refund`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      },
      onLogout
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "환불 처리 실패");
    }

    const data = await res.json();
    return { success: true, message: data.message };
  } catch (e) {
    return { success: false, error: e };
  }
}

// 전체 프로그램 목록 조회
export async function getAllPrograms({ page = 1, limit = 20, keyword = "", status = "ALL" }) {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      keyword: keyword,
      status: status,
    });

    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/admin/programs?${params.toString()}`,
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
      throw new Error(error.message || "프로그램 목록 조회 실패");
    }

    const data = await res.json();
    return { success: true, data: data.data, pagination: data.pagination };
  } catch (e) {
    return { success: false, error: e, data: [], pagination: null };
  }
}

// 프로그램 생성 (이미지 포함)
export async function createProgram(formData) {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/admin/programs`,
      {
        method: "POST",
        body: formData, // FormData (이미지 포함)
      },
      onLogout
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "프로그램 생성 실패");
    }

    const data = await res.json();
    return { success: true, data: data.data };
  } catch (e) {
    return { success: false, error: e };
  }
}

// 프로그램 수정 (이미지 포함)
export async function updateProgram(id, formData) {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/admin/programs/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: formData, // FormData (이미지 포함)
      },
      onLogout
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "프로그램 수정 실패");
    }

    const data = await res.json();
    return { success: true, data: data.data };
  } catch (e) {
    return { success: false, error: e };
  }
}

// 프로그램 삭제
export async function deleteProgram(id) {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/admin/programs/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      },
      onLogout
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "프로그램 삭제 실패");
    }

    const data = await res.json();
    return { success: true, message: data.message };
  } catch (e) {
    return { success: false, error: e };
  }
}

// 전체 예약 목록 조회
export async function getAllReservations({ page = 1, limit = 20, keyword = "", status = "ALL" }) {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      keyword: keyword,
      status: status,
    });

    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/admin/reservations?${params.toString()}`,
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
      throw new Error(error.message || "예약 목록 조회 실패");
    }

    const data = await res.json();
    return { success: true, data: data.data, pagination: data.pagination };
  } catch (e) {
    return { success: false, error: e, data: [], pagination: null };
  }
}

// 예약 상태 변경
export async function updateReservationStatus(reservationId, status) {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/admin/reservations/${encodeURIComponent(reservationId)}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      },
      onLogout
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "예약 상태 변경 실패");
    }

    const data = await res.json();
    return { success: true, message: data.message };
  } catch (e) {
    return { success: false, error: e };
  }
}

// 전체 상품 목록 조회
export async function getAllProducts({ page = 1, limit = 20, keyword = "", status = "ALL" }) {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      keyword: keyword,
      status: status,
    });

    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/admin/products?${params.toString()}`,
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
      throw new Error(error.message || "상품 목록 조회 실패");
    }

    const data = await res.json();
    return { success: true, data: data.data, pagination: data.pagination };
  } catch (e) {
    return { success: false, error: e, data: [], pagination: null };
  }
}

// 상품 생성 (이미지 포함)
export async function createProduct(formData) {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/admin/products`,
      {
        method: "POST",
        body: formData, // FormData (이미지 포함)
      },
      onLogout
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "상품 생성 실패");
    }

    const data = await res.json();
    return { success: true, data: data.data };
  } catch (e) {
    return { success: false, error: e };
  }
}

// 상품 수정 (이미지 포함)
export async function updateProduct(id, formData) {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/admin/products/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: formData, // FormData (이미지 포함)
      },
      onLogout
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "상품 수정 실패");
    }

    const data = await res.json();
    return { success: true, data: data.data };
  } catch (e) {
    return { success: false, error: e };
  }
}

// 상품 삭제
export async function deleteProduct(id) {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/admin/products/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      },
      onLogout
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "상품 삭제 실패");
    }

    const data = await res.json();
    return { success: true, message: data.message };
  } catch (e) {
    return { success: false, error: e };
  }
}

// 전체 사용자 목록 조회
export async function getAllUsers({ page = 1, limit = 20, keyword = "", role = "ALL", status = "ALL" }) {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      keyword: keyword,
      role: role,
      status: status,
    });

    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/admin/users?${params.toString()}`,
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
      throw new Error(error.message || "사용자 목록 조회 실패");
    }

    const data = await res.json();
    return { success: true, data: data.data, pagination: data.pagination };
  } catch (e) {
    return { success: false, error: e, data: [], pagination: null };
  }
}

// 사용자 상태 변경
export async function updateUserStatus(userId, status) {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/admin/users/${encodeURIComponent(userId)}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      },
      onLogout
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "사용자 상태 변경 실패");
    }

    const data = await res.json();
    return { success: true, message: data.message };
  } catch (e) {
    return { success: false, error: e };
  }
}

// =========================
// 이벤트 (관리자) API
// =========================

// 전체 이벤트 목록 조회
export async function getAllEvents({ page = 1, limit = 20, keyword = "", status = "ALL" }) {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      keyword: keyword,
      status: status,
    });

    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/admin/events?${params.toString()}`,
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
      throw new Error(error.message || "이벤트 목록 조회 실패");
    }

    const data = await res.json();
    return { success: true, data: data.data, pagination: data.pagination };
  } catch (e) {
    return { success: false, error: e, data: [], pagination: null };
  }
}

// 이벤트 생성 (이미지 포함)
export async function createEvent(formData) {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/admin/events`,
      {
        method: "POST",
        body: formData, // FormData (이미지 포함)
      },
      onLogout
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "이벤트 생성 실패");
    }

    const data = await res.json();
    return { success: true, data: data.data };
  } catch (e) {
    return { success: false, error: e };
  }
}

// 이벤트 수정 (이미지 포함)
export async function updateEvent(id, formData) {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/admin/events/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: formData, // FormData (이미지 포함)
      },
      onLogout
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "이벤트 수정 실패");
    }

    const data = await res.json();
    return { success: true, data: data.data };
  } catch (e) {
    return { success: false, error: e };
  }
}

// 이벤트 삭제
export async function deleteEvent(id) {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/admin/events/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      },
      onLogout
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "이벤트 삭제 실패");
    }

    const data = await res.json();
    return { success: true, message: data.message };
  } catch (e) {
    return { success: false, error: e };
  }
}
