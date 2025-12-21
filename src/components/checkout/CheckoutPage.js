import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { listMyReservations, markReservationPaid, markReservationPaymentFailed } from "../../services/reservationApi";

function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const userId = user?.user_id || user?.id || user?.email || "";
  const bookingId = location.state?.bookingId || null;

  const [loading, setLoading] = useState(true);
  const [reservation, setReservation] = useState(null);

  const fetchReservation = async () => {
    setLoading(true);
    try {
      const res = await listMyReservations({ userId });
      if (!res?.success) {
        setReservation(null);
        return;
      }
      const list = Array.isArray(res.data) ? res.data : [];
      const found = list.find((r) => String(r.bookingId) === String(bookingId));
      setReservation(found || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!bookingId) {
      navigate("/mypage", { state: { openTab: "reservations" } });
      return;
    }
    fetchReservation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const paySuccess = async (method) => {
    const res = await markReservationPaid({ bookingId, method });
    if (!res?.success) {
      alert("결제 처리에 실패했습니다. 다시 시도해 주세요.");
      return;
    }
    alert("결제가 완료되었습니다(시뮬레이션).");
    navigate("/mypage", { state: { openTab: "reservations" } });
  };

  const payFail = async () => {
    const res = await markReservationPaymentFailed({ bookingId });
    if (!res?.success) {
      alert("결제 실패 처리에 실패했습니다. 다시 시도해 주세요.");
      return;
    }
    alert("결제가 실패한 것으로 처리되었습니다(시뮬레이션).");
    navigate("/mypage", { state: { openTab: "reservations" } });
  };

  if (loading) {
    return (
      <main className="pf-page">
        <div className="pf-container">
          <h2>결제 정보를 불러오는 중입니다...</h2>
        </div>
      </main>
    );
  }

  if (!reservation) {
    return (
      <main className="pf-page">
        <div className="pf-container">
          <h2>결제 대상 예약을 찾을 수 없습니다.</h2>
          <button type="button" onClick={() => navigate("/mypage", { state: { openTab: "reservations" } })}>
            마이페이지로 이동
          </button>
        </div>
      </main>
    );
  }

  const amount = Number(reservation.price || 0);

  return (
    <main className="pf-page">
      <div className="pf-container" style={{ maxWidth: 720, margin: "0 auto", padding: 20 }}>
        <h2 style={{ marginBottom: 10 }}>결제 시뮬레이션</h2>
        <p style={{ opacity: 0.8, marginBottom: 20 }}>
          포트폴리오용 데모 화면입니다. 실제 결제는 진행되지 않으며, 결제 상태만 시뮬레이션합니다.
        </p>

        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>{reservation.title}</div>
          <div style={{ fontSize: 14, opacity: 0.85 }}>
            체험일: {reservation.date ? dayjs(reservation.date).format("YYYY.MM.DD") : "-"}
            {reservation.time ? ` · ${reservation.time}` : ""}
          </div>
          <div style={{ fontSize: 14, opacity: 0.85 }}>
            인원: {reservation.people}명 · 결제금액: {amount.toLocaleString()}원
          </div>
          <div style={{ fontSize: 14, opacity: 0.85 }}>결제상태: {reservation.paymentStatus || "UNPAID"}</div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={() => paySuccess("CARD")}>
            카드 결제 성공(시뮬레이션)
          </button>
          <button type="button" onClick={() => paySuccess("KAKAO_PAY")}>
            카카오페이 성공(시뮬레이션)
          </button>
          <button type="button" onClick={payFail}>
            결제 실패(시뮬레이션)
          </button>
          <button type="button" onClick={() => navigate("/mypage", { state: { openTab: "reservations" } })}>
            결제 없이 돌아가기
          </button>
        </div>
      </div>
    </main>
  );
}

export default CheckoutPage;
