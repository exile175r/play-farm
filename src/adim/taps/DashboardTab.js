// src/adim/taps/DashboardTab.js
import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import './Tabs.css';
import { readOrders } from '../../utils/orderStorage';

// ✅ 예약 로컬스토리지 키 (reservationApi.js와 맞춰서 사용)
const RESV_KEY = 'reservations_program';

const safeJsonParse = (raw, fallback) => {
   try {
      const parsed = JSON.parse(raw);
      return parsed ?? fallback;
   } catch {
      return fallback;
   }
};

const readAllReservations = () => {
   const raw = localStorage.getItem(RESV_KEY);
   const list = safeJsonParse(raw, []);
   return Array.isArray(list) ? list : [];
};

function DashboardTab() {
   const today = dayjs();
   const thisMonth = today.startOf('month');

   // ✅ 예약 데이터
   const reservations = useMemo(() => readAllReservations(), []);

   // ✅ 주문 데이터
   const orders = useMemo(() => {
      const list = readOrders() || [];
      return Array.isArray(list) ? list : [];
   }, []);

   // ----- 예약 통계 -----
   const todayReservationsCount = useMemo(
      () =>
         reservations.filter((r) => {
            const d = r.date || r.reservationDate || r.createdAt;
            if (!d) return false;
            return dayjs(d).isSame(today, 'day');
         }).length,
      [reservations, today]
   );

   const monthReservationsCount = useMemo(
      () =>
         reservations.filter((r) => {
            const d = r.date || r.reservationDate || r.createdAt;
            if (!d) return false;
            return dayjs(d).isSame(thisMonth, 'month');
         }).length,
      [reservations, thisMonth]
   );

   // ----- 주문/매출 통계 -----
   const todaySalesAmount = useMemo(
      () =>
         orders
            .filter((o) => {
               const d = o.createdAt;
               if (!d) return false;
               return dayjs(d).isSame(today, 'day');
            })
            .reduce((sum, o) => sum + Number(o.amount || 0), 0),
      [orders, today]
   );

   const monthSalesAmount = useMemo(
      () =>
         orders
            .filter((o) => {
               const d = o.createdAt;
               if (!d) return false;
               return dayjs(d).isSame(thisMonth, 'month');
            })
            .reduce((sum, o) => sum + Number(o.amount || 0), 0),
      [orders, thisMonth]
   );

   const totalOrdersCount = orders.length;

   // ----- 인기 체험 / 인기 상품 -----
   const topProgram = useMemo(() => {
      const counter = {};
      reservations.forEach((r) => {
         const key = r.programTitle || r.title || `프로그램 #${r.programId || '?'}`;
         counter[key] = (counter[key] || 0) + 1;
      });

      const entries = Object.entries(counter);
      if (entries.length === 0) return null;

      entries.sort((a, b) => b[1] - a[1]);
      const [name, count] = entries[0];
      return { name, count };
   }, [reservations]);

   const topProduct = useMemo(() => {
      const counter = {};
      orders.forEach((o) => {
         if (!Array.isArray(o.items)) return;
         o.items.forEach((it) => {
            const key = it.title || `상품 #${it.productId || '?'}`;
            counter[key] = (counter[key] || 0) + Number(it.qty || 0);
         });
      });

      const entries = Object.entries(counter);
      if (entries.length === 0) return null;

      entries.sort((a, b) => b[1] - a[1]);
      const [name, qty] = entries[0];
      return { name, qty };
   }, [orders]);

   return (
      <div className="admin-section">
         {/* 상단 타이틀 */}
         <div className="admin-section-header">
            <div>
               <h2 className="admin-section-title">대시보드</h2>
            </div>
         </div>

         {/* 주요 지표 카드 */}
         <div className="admin-dashboard-grid">
            <div className="admin-stat-card">
               <div className="admin-stat-label">오늘 예약 건수</div>
               <div className="admin-stat-value">{todayReservationsCount}건</div>
               <div className="admin-stat-sub">{today.format('YYYY.MM.DD')} 기준</div>
            </div>

            <div className="admin-stat-card">
               <div className="admin-stat-label">이번 달 예약 건수</div>
               <div className="admin-stat-value">{monthReservationsCount}건</div>
               <div className="admin-stat-sub">{thisMonth.format('YYYY.MM')} 기준</div>
            </div>

            <div className="admin-stat-card">
               <div className="admin-stat-label">오늘 스토어 매출</div>
               <div className="admin-stat-value">{todaySalesAmount.toLocaleString()}원</div>
               <div className="admin-stat-sub">주문 생성일 기준 매출 합계</div>
            </div>

            <div className="admin-stat-card">
               <div className="admin-stat-label">이번 달 스토어 매출</div>
               <div className="admin-stat-value">{monthSalesAmount.toLocaleString()}원</div>
               <div className="admin-stat-sub">총 주문 {totalOrdersCount}건 기준</div>
            </div>
         </div>

         {/* 인기 체험 / 인기 상품 */}
         <div className="admin-dashboard-bottom">
            <div className="admin-widget">
               <h3 className="admin-widget-title">인기 체험</h3>
               {topProgram ? (
                  <div className="admin-widget-body">
                     <div className="admin-widget-main">{topProgram.name}</div>
                     <div className="admin-widget-sub">예약 {topProgram.count}건</div>
                  </div>
               ) : (
                  <p className="admin-widget-empty">예약 데이터가 없습니다.</p>
               )}
            </div>

            <div className="admin-widget">
               <h3 className="admin-widget-title">인기 상품</h3>
               {topProduct ? (
                  <div className="admin-widget-body">
                     <div className="admin-widget-main">{topProduct.name}</div>
                     <div className="admin-widget-sub">판매 수량 {topProduct.qty}개</div>
                  </div>
               ) : (
                  <p className="admin-widget-empty">주문 데이터가 없습니다.</p>
               )}
            </div>
         </div>
      </div>
   );
}

export default DashboardTab;
