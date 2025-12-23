import { fetchWithAuthAndRetry } from "../utils/apiConfig";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// 전역 로그아웃 핸들러 (App.js에서 설정됨)
let onLogout = null;

export const setReservationApiLogoutHandler = (handler) => {
  onLogout = handler;
};

export async function createReservation(payload) {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/reservations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
      onLogout
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "예약 생성 실패");
    }

    const data = await res.json();
    return { success: true, data: data.data };
  } catch (e) {
    return { success: false, error: e };
  }
}

/**
 * 내 예약 불러오기 (마이페이지에서 사용)
 */
export async function listMyReservations({ userId } = {}) {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/reservations/my`,
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
    return { success: true, data: data.data || [] };
  } catch (e) {
    return { success: false, error: e, data: [] };
  }
}

/**
 * 예약 취소
 */
export async function cancelReservation({ bookingId, userId }) {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/reservations/${bookingId}/cancel`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
      onLogout
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "예약 취소 실패");
    }

    const data = await res.json();
    return { success: true, data: data.data };
  } catch (e) {
    return { success: false, error: e };
  }
}

/**
 * 결제 성공 처리 (서버에서 예약 검토 후 승인/취소 결정)
 */
export async function markReservationPaid({ bookingId, method = "CARD" }) {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/reservations/${bookingId}/payment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ method }),
      },
      onLogout
    );

    const data = await res.json();

    // 검증 실패로 취소된 경우
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: new Error(data.message || "결제 처리 실패"),
        data: data.data || null,
        cancelled: true,
      };
    }

    return { success: true, data: data.data };
  } catch (e) {
    return { success: false, error: e };
  }
}

/**
 * 결제 실패 연출 (포트폴리오 시뮬레이션)
 */
export async function markReservationPaymentFailed({ bookingId }) {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/reservations/${bookingId}/payment-failed`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
      onLogout
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "결제 실패 처리 실패");
    }

    const data = await res.json();
    return { success: true, data: data.data };
  } catch (e) {
    return { success: false, error: e };
  }
}

// src/services/reservationApi.js 파일 끝에 추가

/**
 * 예약 상태 정규화 함수
 * 예약일이 지난 예약을 자동으로 COMPLETED로 변경
 * @param {Array} reservations - 예약 목록
 * @returns {Object} { next: Array, changed: boolean }
 */
export function normalizeReservationStatus(reservations) {
  if (!Array.isArray(reservations)) {
    return { next: [], changed: false };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let changed = false;
  const next = reservations.map((res) => {
    // BOOKED 상태이고 결제 완료된 예약만 체크
    if (res.status === "BOOKED" && res.paymentStatus === "PAID") {
      const resDate = new Date(res.date);
      resDate.setHours(0, 0, 0, 0);

      // 예약일이 오늘 이전이면 COMPLETED로 변경
      if (resDate <= today) {
        changed = true;
        return {
          ...res,
          status: "COMPLETED",
        };
      }
    }
    return res;
  });

  return { next, changed };
}

/**
 * 결제 취소(환불) 처리
 * @param {Object} params - { bookingId, userId, reason }
 */
export async function refundReservation({ bookingId, userId, reason }) {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/reservations/${bookingId}/refund`,
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
    return { success: true, data: data.data };
  } catch (e) {
    return { success: false, error: e };
  }
}
