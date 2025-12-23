// src/utils/cartStorage.js
// ✅ store cart localStorage helper
// ✅ Checkout / Mypage 공통 사용

const CART_KEY = "cart_store";

const safeParse = (raw, fallback) => {
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

export const readCart = () => {
  const list = safeParse(localStorage.getItem(CART_KEY), []);
  return Array.isArray(list) ? list : [];
};

export const writeCart = (next) => {
  localStorage.setItem(CART_KEY, JSON.stringify(next));
};

/**
 * ✅ 장바구니 담기
 * - 같은 상품 + 같은 옵션이면 qty 합침
 */
export const addToCart = (payload) => {
  const list = readCart();

  const nextItem = {
    id: String(payload.id), // productId
    name: payload.name || "",
    image: payload.image || "",
    optionId: payload.optionId ? String(payload.optionId) : null,
    optionName: payload.optionName || null,
    price: Number(payload.price || 0), // unit price
    qty: Math.max(1, Number(payload.qty || 1)),
  };

  const idx = list.findIndex(
    (it) => String(it.id) === String(nextItem.id) && String(it.optionId || "") === String(nextItem.optionId || "")
  );

  let next = list;

  if (idx >= 0) {
    next = list.map((it, i) => (i === idx ? { ...it, qty: Math.min(999, Number(it.qty || 1) + nextItem.qty) } : it));
  } else {
    next = [nextItem, ...list];
  }

  writeCart(next);
  window.dispatchEvent(new Event("cart_store_updated"));

  return { success: true };
};

/**
 * ✅ 여러 상품 한 번에 제거 (결제 완료 후 사용)
 * @param {Array<{id, optionId}>} targets
 */
export const removeManyFromCart = (targets = []) => {
  if (!Array.isArray(targets) || targets.length === 0) return;

  const list = readCart();

  const next = list.filter((item) => {
    return !targets.some(
      (t) => String(t.id) === String(item.id) && String(t.optionId || "") === String(item.optionId || "")
    );
  });

  writeCart(next);
  window.dispatchEvent(new Event("cart_store_updated"));
};
