const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * payload 예시:
 * {
 *  programId, date, time, people, price, memo (optional)
 * }
 */
export async function createReservation(payload) {
  try {
    const res = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || '예약 생성 실패');
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
    const res = await fetch(`${API_BASE}/reservations/my`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || '예약 목록 조회 실패');
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
    const res = await fetch(`${API_BASE}/reservations/${bookingId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || '예약 취소 실패');
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
    const res = await fetch(`${API_BASE}/reservations/${bookingId}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ method }),
    });

    const data = await res.json();

    // 검증 실패로 취소된 경우
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: new Error(data.message || '결제 처리 실패'),
        data: data.data || null, // 취소된 예약 정보 포함
        cancelled: true // 취소 여부 플래그
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
    const res = await fetch(`${API_BASE}/reservations/${bookingId}/payment-failed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || '결제 실패 처리 실패');
    }

    const data = await res.json();
    return { success: true, data: data.data };
  } catch (e) {
    return { success: false, error: e };
  }
}