// src/components/checkout/CheckoutResult.js
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { listMyReservations } from '../../services/reservationApi';

function CheckoutResult() {
   const navigate = useNavigate();
   const location = useLocation();

   const bookingId = location.state?.bookingId || null;
   const result = location.state?.result || null; // "success" | "fail"
   const method = location.state?.method || '';

   const user = useMemo(() => {
      try {
         const raw = localStorage.getItem('user');
         return raw ? JSON.parse(raw) : null;
      } catch {
         return null;
      }
   }, []);

   const userId = user?.user_id || user?.id || user?.email || '';

   const [reservation, setReservation] = useState(null);

   useEffect(() => {
      if (!bookingId) {
         navigate('/mypage', { state: { openTab: 'reservations' } });
         return;
      }

      (async () => {
         const res = await listMyReservations({ userId });
         const list = Array.isArray(res?.data) ? res.data : [];
         const found = list.find((r) => String(r.bookingId) === String(bookingId));
         setReservation(found || null);
      })();
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [bookingId]);

   const title = result === 'success' ? '결제가 완료되었습니다' : '결제가 실패했습니다';
   const desc = result === 'success' ? '포트폴리오용 시뮬레이션입니다. 결제 상태가 반영되었습니다.' : '포트폴리오용 시뮬레이션입니다. 결제 실패 상태로 반영되었습니다.';

   return (
      <main className="pf-page">
         <div className="pf-container" style={{ maxWidth: 720, margin: '0 auto', padding: 20 }}>
            <h2 style={{ marginBottom: 10 }}>{title}</h2>
            <p style={{ opacity: 0.8, marginBottom: 20 }}>{desc}</p>

            {reservation ? (
               <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>{reservation.title}</div>
                  <div style={{ fontSize: 14, opacity: 0.85 }}>
                     체험일: {reservation.date ? dayjs(reservation.date).format('YYYY.MM.DD') : '-'}
                     {reservation.time ? ` · ${reservation.time}` : ''}
                  </div>
                  <div style={{ fontSize: 14, opacity: 0.85 }}>
                     인원: {reservation.people}명 · 결제금액: {Number(reservation.price || 0).toLocaleString()}원
                  </div>
                  <div style={{ fontSize: 14, opacity: 0.85 }}>
                     결제상태: {reservation.paymentStatus || 'UNPAID'}
                     {result === 'success' && method ? ` · 결제수단: ${method}` : ''}
                  </div>
                  <div style={{ fontSize: 14, opacity: 0.85 }}>예약상태: {reservation.status || 'BOOKED'}</div>
               </div>
            ) : null}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
               <button type="button" onClick={() => navigate('/mypage', { state: { openTab: 'reservations' } })}>
                  마이페이지(예약)로 이동
               </button>
               <button type="button" onClick={() => navigate('/list')}>
                  체험 보러가기
               </button>
            </div>
         </div>
      </main>
   );
}

export default CheckoutResult;
