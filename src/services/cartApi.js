import { fetchWithAuthAndRetry, getApiBaseUrl } from "../utils/apiConfig";

const API_BASE = getApiBaseUrl();

let onLogout = null;

export const setCartApiLogoutHandler = (handler) => {
  onLogout = handler;
};

// 장바구니 담기
export async function addToCart({ productId, optionId, quantity = 1 }) {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/cart`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId, optionId, quantity }),
      },
      onLogout
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "장바구니 담기 실패");
    }

    const data = await res.json();
    return { success: true, message: data.message };
  } catch (e) {
    return { success: false, error: e };
  }
}

// 내 장바구니 조회
export async function getMyCart() {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/cart/my`,
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
      throw new Error(error.message || "장바구니 조회 실패");
    }

    const data = await res.json();
    return { success: true, data: data.data || [] };
  } catch (e) {
    return { success: false, error: e, data: [] };
  }
}

// 장바구니 수량 수정
export async function updateCartItem(cartItemId, { quantity }) {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/cart/${cartItemId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity }),
      },
      onLogout
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "장바구니 수정 실패");
    }

    const data = await res.json();
    return { success: true, message: data.message };
  } catch (e) {
    return { success: false, error: e };
  }
}

// 장바구니 항목 삭제
export async function removeCartItem(cartItemId) {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/cart/${cartItemId}`,
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
      throw new Error(error.message || "장바구니 삭제 실패");
    }

    const data = await res.json();
    return { success: true, message: data.message };
  } catch (e) {
    return { success: false, error: e };
  }
}

// 장바구니 비우기
export async function clearCart() {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/cart`,
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
      throw new Error(error.message || "장바구니 비우기 실패");
    }

    const data = await res.json();
    return { success: true, message: data.message };
  } catch (e) {
    return { success: false, error: e };
  }
}

