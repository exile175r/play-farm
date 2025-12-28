import { fetchWithAuthAndRetry, getApiBaseUrl } from "../utils/apiConfig";

const API_BASE = getApiBaseUrl();

let onLogout = null;

export const setOrderApiLogoutHandler = (handler) => {
  onLogout = handler;
};

// 주문 생성
export async function createOrder({ items, buyer, amount, payMethod }) {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/orders`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items, buyer, amount, payMethod }),
      },
      onLogout
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "주문 생성 실패");
    }

    const data = await res.json();
    return { success: true, data: data.data };
  } catch (e) {
    return { success: false, error: e };
  }
}

// 내 주문 목록 조회
export async function getMyOrders() {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/orders/my`,
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
    return { success: true, data: data.data || [] };
  } catch (e) {
    return { success: false, error: e, data: [] };
  }
}

// 주문 상세 조회
export async function getOrderById(orderId) {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/orders/${orderId}`,
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
      throw new Error(error.message || "주문 조회 실패");
    }

    const data = await res.json();
    return { success: true, data: data.data };
  } catch (e) {
    return { success: false, error: e };
  }
}

// 주문 결제 처리
export async function payOrder({ orderId, method = "CARD", buyerName, buyerPhone, buyerEmail }) {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/orders/${orderId}/payment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ method, buyerName, buyerPhone, buyerEmail }),
      },
      onLogout
    );

    const data = await res.json();

    if (!res.ok || !data.success) {
      return {
        success: false,
        error: new Error(data.message || "결제 처리 실패"),
        data: data.data || null,
      };
    }

    return { success: true, data: data.data };
  } catch (e) {
    return { success: false, error: e };
  }
}

// 주문 취소
export async function cancelOrder(orderId, reason = "사용자 요청") {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/orders/${orderId}/cancel`,
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
      throw new Error(error.message || "주문 취소 실패");
    }

    const data = await res.json();
    return { success: true, data: data.data, message: data.message };
  } catch (e) {
    return { success: false, error: e };
  }
}

// 주문 환불
export async function refundOrder(orderId, reason = "사용자 요청") {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/orders/${orderId}/refund`,
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
      throw new Error(error.message || "주문 환불 실패");
    }

    const data = await res.json();
    return { success: true, data: data.data, message: data.message };
  } catch (e) {
    return { success: false, error: e };
  }
}

