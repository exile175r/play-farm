// src/services/adminApi.js
import { fetchWithAuthAndRetry, getApiBaseUrl } from "../utils/apiConfig";

const API_BASE = getApiBaseUrl();

let onLogout = null;

export const setAdminApiLogoutHandler = (handler) => {
  onLogout = handler;
};

/**
 * 공통: JSON 응답 안전하게 파싱 + 에러 처리
 * - 응답 바디는 한 번만 text()로 읽음
 * - JSON 파싱 실패하면 raw 텍스트 로그 찍고 에러 던짐
 * - res.ok === false 면 data.message 또는 기본 메시지로 에러 던짐
 */
async function parseJsonResponse(res, defaultErrorMessage) {
  const raw = await res.text();

  let data = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch (err) {
      console.error("❌ JSON 파싱 실패, RAW RESPONSE (앞부분만):");
      console.error(raw.slice(0, 500)); // HTML이면 여기서 바로 보임
      throw new Error(defaultErrorMessage || "서버 응답이 올바른 JSON 형식이 아닙니다.");
    }
  }

  if (!res.ok) {
    const msg =
      (data && (data.message || data.error || data.msg)) || defaultErrorMessage || `요청 실패 (status: ${res.status})`;
    throw new Error(msg);
  }

  return data;
}

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

    const data = await parseJsonResponse(res, "대시보드 통계 조회 실패");
    return { success: true, data: data.data };
  } catch (e) {
    console.error("getDashboardStats 실패:", e);
    return { success: false, error: e };
  }
}

// 전체 주문 목록 조회
export async function getAllOrders({ page = 1, limit, keyword = "", status = "ALL" }) {
  try {
    const params = new URLSearchParams({
      page: String(page),
      keyword: keyword,
      status: status,
    });
    if (limit !== undefined) {
      params.append('limit', String(limit));
    }

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

    const data = await parseJsonResponse(res, "주문 목록 조회 실패");
    return { success: true, data: data.data, pagination: data.pagination };
  } catch (e) {
    console.error("getAllOrders 실패:", e);
    return { success: false, error: e, data: [], pagination: null };
  }
}

// 관리자용 주문 상세 조회
export async function getOrderById(orderId) {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/admin/orders/${encodeURIComponent(orderId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
      onLogout
    );

    const data = await parseJsonResponse(res, "주문 상세 조회 실패");
    return { success: true, data: data.data };
  } catch (e) {
    console.error("getOrderById 실패:", e);
    return { success: false, error: e };
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

    const data = await parseJsonResponse(res, "환불 처리 실패");
    return { success: true, message: data.message };
  } catch (e) {
    console.error("refundOrder 실패:", e);
    return { success: false, error: e };
  }
}

// 프로그램 타입 목록 조회
export async function getAllProgramTypes() {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/admin/program-types`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
      onLogout
    );

    const data = await parseJsonResponse(res, "프로그램 타입 목록 조회 실패");
    return { success: true, data: data.data };
  } catch (e) {
    console.error("getAllProgramTypes 실패:", e);
    return { success: false, error: e, data: [] };
  }
}

// 전체 프로그램 목록 조회
export async function getAllPrograms({ page = 1, limit, keyword = "", status = "ALL" }) {
  try {
    const params = new URLSearchParams({
      page: String(page),
      keyword: keyword,
      status: status,
    });
    if (limit !== undefined) {
      params.append('limit', String(limit));
    }

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

    const data = await parseJsonResponse(res, "프로그램 목록 조회 실패");
    return { success: true, data: data.data, pagination: data.pagination };
  } catch (e) {
    console.error("getAllPrograms 실패:", e);
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

    const data = await parseJsonResponse(res, "프로그램 생성 실패");
    return { success: true, data: data.data };
  } catch (e) {
    console.error("createProgram 실패:", e);
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

    const data = await parseJsonResponse(res, "프로그램 수정 실패");
    return { success: true, data: data.data };
  } catch (e) {
    console.error("updateProgram 실패:", e);
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

    const data = await parseJsonResponse(res, "프로그램 삭제 실패");
    return { success: true, message: data.message };
  } catch (e) {
    console.error("deleteProgram 실패:", e);
    return { success: false, error: e };
  }
}

// 전체 예약 목록 조회
export async function getAllReservations({ page = 1, limit, keyword = "", status = "ALL" }) {
  try {
    const params = new URLSearchParams({
      page: String(page),
      keyword: keyword,
      status: status,
    });
    if (limit !== undefined) {
      params.append('limit', String(limit));
    }

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

    const data = await parseJsonResponse(res, "예약 목록 조회 실패");
    return { success: true, data: data.data, pagination: data.pagination };
  } catch (e) {
    console.error("getAllReservations 실패:", e);
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

    const data = await parseJsonResponse(res, "예약 상태 변경 실패");
    return { success: true, message: data.message };
  } catch (e) {
    console.error("updateReservationStatus 실패:", e);
    return { success: false, error: e };
  }
}

// 예약 삭제
export async function deleteReservation(reservationId) {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/admin/reservations/${encodeURIComponent(reservationId)}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      },
      onLogout
    );

    const data = await parseJsonResponse(res, "예약 삭제 실패");
    return { success: true, message: data.message };
  } catch (e) {
    console.error("deleteReservation 실패:", e);
    return { success: false, error: e };
  }
}

// 전체 상품 목록 조회
export async function getAllProducts({ page = 1, limit, keyword = "", status = "ALL" }) {
  try {
    const params = new URLSearchParams({
      page: String(page),
      keyword: keyword,
      status: status,
    });
    if (limit !== undefined) {
      params.append('limit', String(limit));
    }

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

    const data = await parseJsonResponse(res, "상품 목록 조회 실패");
    return { success: true, data: data.data, pagination: data.pagination };
  } catch (e) {
    console.error("getAllProducts 실패:", e);
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

    const data = await parseJsonResponse(res, "상품 생성 실패");
    return { success: true, data: data.data };
  } catch (e) {
    console.error("createProduct 실패:", e);
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

    const data = await parseJsonResponse(res, "상품 수정 실패");
    return { success: true, data: data.data };
  } catch (e) {
    console.error("updateProduct 실패:", e);
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

    const data = await parseJsonResponse(res, "상품 삭제 실패");
    return { success: true, message: data.message };
  } catch (e) {
    console.error("deleteProduct 실패:", e);
    return { success: false, error: e };
  }
}

// 전체 사용자 목록 조회
export async function getAllUsers({ page = 1, limit, keyword = "", role = "ALL", status = "ALL" }) {
  try {
    const params = new URLSearchParams({
      page: String(page),
      keyword: keyword,
      role: role,
      status: status,
    });
    if (limit !== undefined) {
      params.append('limit', String(limit));
    }

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

    const data = await parseJsonResponse(res, "사용자 목록 조회 실패");
    return { success: true, data: data.data, pagination: data.pagination };
  } catch (e) {
    console.error("getAllUsers 실패:", e);
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

    const data = await parseJsonResponse(res, "사용자 상태 변경 실패");
    return { success: true, message: data.message };
  } catch (e) {
    console.error("updateUserStatus 실패:", e);
    return { success: false, error: e };
  }
}

// =========================
// 이벤트 (관리자) API
// =========================

// 전체 이벤트 목록 조회
export async function getAllEvents({ page = 1, limit, keyword = "", status = "ALL" }) {
  try {
    const params = new URLSearchParams({
      page: String(page),
      keyword: keyword,
      status: status,
    });
    if (limit !== undefined) {
      params.append('limit', String(limit));
    }

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

    const data = await parseJsonResponse(res, "이벤트 목록 조회 실패");
    return { success: true, data: data.data, pagination: data.pagination };
  } catch (e) {
    console.error("getAllEvents 실패:", e);
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

    const data = await parseJsonResponse(res, "이벤트 생성 실패");
    return { success: true, data: data.data };
  } catch (e) {
    console.error("createEvent 실패:", e);
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

    const data = await parseJsonResponse(res, "이벤트 수정 실패");
    return { success: true, data: data.data };
  } catch (e) {
    console.error("updateEvent 실패:", e);
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

    const data = await parseJsonResponse(res, "이벤트 삭제 실패");
    return { success: true, message: data.message };
  } catch (e) {
    console.error("deleteEvent 실패:", e);
    return { success: false, error: e };
  }
}
