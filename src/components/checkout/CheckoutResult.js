// src/components/checkout/CheckoutResult.js
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

function CheckoutResult() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const ok = !!state?.ok;

  return (
    <main style={{ padding: 24, maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
      <h2 style={{ marginBottom: 10 }}>{ok ? "결제 완료" : "결제 실패"}</h2>

      <p style={{ marginTop: 0, color: "#666" }}>
        {ok ? "결제가 완료되었습니다." : "결제에 실패했습니다. 다시 시도해주세요."}
      </p>

      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16 }}>
        <button type="button" onClick={() => navigate("/mypage", { state: { openTab: "reservations" } })}>
          마이페이지로
        </button>
        <button type="button" onClick={() => navigate("/list")}>
          체험 보러가기
        </button>
      </div>

      <p style={{ marginTop: 18, fontSize: 13, color: "#888" }}>결제 시뮬레이션이며 실제 결제는 발생하지 않습니다.</p>
    </main>
  );
}

export default CheckoutResult;
