// 마이페이지 “스토어 > 장바구니”에서 렌더링할 뷰
import React, { useEffect, useMemo, useState } from "react";
import "./Mypage.css";

import { readCart, updateQty, removeFromCart, getCartSummary } from "../../utils/cartStorage";

function CartView({ onGoCheckout }) {
  const [items, setItems] = useState([]);

  const reload = () => {
    setItems(readCart());
  };

  useEffect(() => {
    reload();

    const onStorage = (e) => {
      if (e.key !== "cart_store") return;
      reload();
    };

    const onCustom = () => reload();

    window.addEventListener("storage", onStorage);
    window.addEventListener("cart_store_changed", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cart_store_changed", onCustom);
    };
  }, []);

  const { count, subtotal } = useMemo(() => getCartSummary(), [items]);

  // 배송비 더미 정책(원하면 바꿔)
  const shippingFee = subtotal >= 30000 || subtotal === 0 ? 0 : 3000;
  const total = subtotal + shippingFee;

  const dec = (id) => {
    const target = items.find((x) => String(x.cartItemId) === String(id));
    if (!target) return;
    updateQty(id, Math.max(1, Number(target.qty || 1) - 1));
    reload();
  };

  const inc = (id) => {
    const target = items.find((x) => String(x.cartItemId) === String(id));
    if (!target) return;
    updateQty(id, Math.min(999, Number(target.qty || 1) + 1));
    reload();
  };

  const remove = (id) => {
    if (!window.confirm("장바구니에서 삭제하시겠습니까?")) return;
    removeFromCart(id);
    reload();
  };

  return (
    <div className="pf-panel">
      <div className="pf-panel-head">
        <h3 className="pf-panel-title">장바구니</h3>
      </div>

      {items.length === 0 ? (
        <div className="pf-empty">
          <p className="pf-empty-title">장바구니가 비어 있습니다</p>
          <p className="pf-empty-desc">스토어에서 상품을 담아 보세요.</p>
        </div>
      ) : (
        <>
          <div className="pf-list">
            {items.map((it) => {
              const line = Number(it.unitPrice || 0) * Number(it.qty || 0);

              return (
                <div className="pf-item" key={it.cartItemId}>
                  <div className="pf-item-main">
                    <p className="pf-item-title">{it.title}</p>
                    <p className="pf-item-sub">
                      {it.optionName ? `옵션: ${it.optionName} · ` : ""}
                      단가 {Number(it.unitPrice || 0).toLocaleString()}원{" · "}
                      합계 {line.toLocaleString()}원
                    </p>

                    <div className="pf-item-actions">
                      <button type="button" className="pf-linkbtn" onClick={() => dec(it.cartItemId)}>
                        -
                      </button>
                      <span className="pf-linkbtn is-disabled" style={{ cursor: "default" }}>
                        {it.qty}
                      </span>
                      <button type="button" className="pf-linkbtn" onClick={() => inc(it.cartItemId)}>
                        +
                      </button>

                      <button type="button" className="pf-linkbtn" onClick={() => remove(it.cartItemId)}>
                        삭제
                      </button>
                    </div>
                  </div>

                  <span className="pf-chip is-wait">스토어</span>
                </div>
              );
            })}
          </div>

          <div className="pf-divider" />

          <div className="pf-actions" style={{ display: "grid", gap: 10 }}>
            <div className="pf-item" style={{ margin: 0 }}>
              <div className="pf-item-main">
                <p className="pf-item-title">결제 요약</p>
                <p className="pf-item-sub">
                  상품 {count.toLocaleString()}개 · 소계 {subtotal.toLocaleString()}원 · 배송비{" "}
                  {shippingFee.toLocaleString()}원 · 총액 {total.toLocaleString()}원
                </p>
              </div>
            </div>

            <button type="button" className="pf-cta" onClick={() => onGoCheckout?.({ total })}>
              {total.toLocaleString()}원 결제하기
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default CartView;
