// 마이페이지 "스토어>주문내역"에서 "뷰"
import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import "./Mypage.css";

import { readOrders } from "../../utils/orderStorage";

function OrderListView() {
  const [orders, setOrders] = useState([]);

  const reload = () => setOrders(readOrders());

  useEffect(() => {
    reload();

    const onStorage = (e) => {
      if (e.key !== "orders_store") return;
      reload();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const sorted = useMemo(() => {
    return [...orders].sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());
  }, [orders]);

  return (
    <div className="pf-panel">
      <div className="pf-panel-head">
        <h3 className="pf-panel-title">주문내역</h3>
      </div>

      {sorted.length === 0 ? (
        <div className="pf-empty">
          <p className="pf-empty-title">주문 내역이 없습니다</p>
          <p className="pf-empty-desc">장바구니에서 결제를 완료하면 주문내역에 표시됩니다.</p>
        </div>
      ) : (
        <div className="pf-list">
          {sorted.map((o) => {
            const amount = Number(o.amount || 0);
            const count = Array.isArray(o.items) ? o.items.reduce((acc, it) => acc + Number(it.qty || 0), 0) : 0;

            return (
              <div className="pf-item" key={o.orderId}>
                <div className="pf-item-main">
                  <p className="pf-item-title">주문번호: {o.orderId}</p>
                  <p className="pf-item-sub">
                    주문일: {o.createdAt ? dayjs(o.createdAt).format("YYYY.MM.DD HH:mm") : "-"}
                    {" · "}
                    상품 {count}개{" · "}
                    결제금액 {amount.toLocaleString()}원
                  </p>

                  {Array.isArray(o.items) && o.items.length > 0 && (
                    <div className="pf-item-actions">
                      <button type="button" className="pf-linkbtn is-disabled" style={{ cursor: "default" }}>
                        {o.items[0]?.title || "상품"}
                        {o.items.length > 1 ? ` 외 ${o.items.length - 1}개` : ""}
                      </button>
                    </div>
                  )}
                </div>

                <span className="pf-chip is-ok">결제 완료</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OrderListView;
