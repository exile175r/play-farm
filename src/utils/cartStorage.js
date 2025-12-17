/** cart storage key (user별) */
export function getCartKey() {
  try {
    const raw = localStorage.getItem("user");
    const user = raw ? JSON.parse(raw) : null;
    const userId = user?.user_id || user?.id || user?.email || "guest";
    return `cart_${userId}`;
  } catch {
    return "cart_guest";
  }
}

/** cart: [{ productId, name, price, qty, image }] */
export function getCart() {
  const key = getCartKey();
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setCart(next) {
  const key = getCartKey();
  localStorage.setItem(key, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("cart:updated"));
}

export function addToCart(item) {
  const curr = getCart();
  const idx = curr.findIndex((c) => String(c.productId) === String(item.productId));

  let next = [];
  if (idx >= 0) {
    next = curr.map((c, i) => (i === idx ? { ...c, qty: (c.qty || 1) + (item.qty || 1) } : c));
  } else {
    next = [{ ...item, qty: item.qty || 1 }, ...curr];
  }
  setCart(next);
  return next;
}

export function updateQty(productId, qty) {
  const curr = getCart();
  const next = curr
    .map((c) => (String(c.productId) === String(productId) ? { ...c, qty } : c))
    .filter((c) => (c.qty || 1) > 0);
  setCart(next);
  return next;
}

export function removeFromCart(productId) {
  const curr = getCart();
  const next = curr.filter((c) => String(c.productId) !== String(productId));
  setCart(next);
  return next;
}

export function getCartCount() {
  return getCart().reduce((sum, c) => sum + (Number(c.qty) || 0), 0);
}

export function getCartTotal() {
  return getCart().reduce((sum, c) => sum + (Number(c.price) || 0) * (Number(c.qty) || 0), 0);
}
