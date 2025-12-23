// src/utils/orderStorage.js

const ORDER_KEY = "orders_store";

const safeJsonParse = (raw, fallback) => {
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

export const readOrders = () => safeJsonParse(localStorage.getItem(ORDER_KEY), []);
export const writeOrders = (next) => localStorage.setItem(ORDER_KEY, JSON.stringify(next));

const makeOrderId = () => `ord_${Date.now()}_${Math.random().toString(16).slice(2)}`;

export const addOrder = (payload) => {
  const list = readOrders();

  const next = [
    {
      orderId: makeOrderId(),
      status: "PAID",
      createdAt: new Date().toISOString(),
      ...payload,
    },
    ...list,
  ];

  writeOrders(next);
  return { success: true, orderId: next[0].orderId };
};

// ==============================
// ✅ 추가: 주문 조회/상태 변경(포트폴리오용)
// ==============================

export const readOrderById = (orderId) => {
  const list = readOrders();
  return list.find((o) => String(o.orderId) === String(orderId)) || null;
};

export const updateOrder = (orderId, patch) => {
  const list = readOrders();
  const idx = list.findIndex((o) => String(o.orderId) === String(orderId));
  if (idx < 0) return { success: false, error: "NOT_FOUND" };

  const prev = list[idx];

  const nextItem = {
    ...prev,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  const next = [...list];
  next[idx] = nextItem;

  writeOrders(next);
  return { success: true, data: nextItem };
};

// ✅ 취소(결제취소 느낌) - 상태만 변경
export const cancelOrder = (orderId, reason = "사용자 요청") => {
  const order = readOrderById(orderId);
  if (!order) return { success: false, error: "NOT_FOUND" };

  // 이미 취소/환불이면 막기
  if (order.status === "CANCELLED" || order.status === "REFUNDED") {
    return { success: false, error: "ALREADY_DONE" };
  }

  // 포트폴리오용: PAID -> CANCELLED
  return updateOrder(orderId, {
    status: "CANCELLED",
    cancelledAt: new Date().toISOString(),
    cancelReason: reason,
  });
};

// ✅ 환불 - 상태만 변경
export const refundOrder = (orderId, reason = "사용자 요청") => {
  const order = readOrderById(orderId);
  if (!order) return { success: false, error: "NOT_FOUND" };

  if (order.status === "REFUNDED") {
    return { success: false, error: "ALREADY_DONE" };
  }

  // 포트폴리오용: PAID/CANCELLED -> REFUNDED(둘 다 가능하게)
  return updateOrder(orderId, {
    status: "REFUNDED",
    refundedAt: new Date().toISOString(),
    refundReason: reason,
  });
};
