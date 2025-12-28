// src/adim/taps/DashboardTab.js
import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import './Tabs.css';
import { getDashboardStats } from '../../services/adminApi';

function DashboardTab() {
   const [stats, setStats] = useState(null);
   const [error, setError] = useState(null);
   const today = dayjs();
   const thisMonth = today.startOf('month');

   useEffect(() => {
      const loadStats = async () => {
         try {
            const result = await getDashboardStats();
            if (result.success) {
               setStats(result.data);
               setError(null);
            } else {
               setError(result.error?.message || '통계 데이터를 불러오는데 실패했습니다.');
            }
         } catch (err) {
            setError('통계 데이터를 불러오는데 실패했습니다.');
            console.error('대시보드 통계 로드 실패:', err);
         }
      };

      loadStats();
   }, []);

   if (error) {
      return (
         <div className="admin-section">
            <div className="admin-section-header">
               <h2 className="admin-section-title">대시보드</h2>
            </div>
            <div style={{ padding: '20px', color: '#b91c1c' }}>
               {error}
            </div>
         </div>
      );
   }

   if (!stats) {
      return (
         <div className="admin-section">
            <div className="admin-section-header">
               <h2 className="admin-section-title">대시보드</h2>
            </div>
            <div style={{ padding: '20px' }}>로딩 중...</div>
         </div>
      );
   }

   const todayReservationsCount = stats.todayReservationsCount || 0;
   const monthReservationsCount = stats.monthReservationsCount || 0;
   const todaySalesAmount = stats.todaySalesAmount || 0;
   const monthSalesAmount = stats.monthSalesAmount || 0;
   const totalOrdersCount = stats.totalOrdersCount || 0;
   const topProgram = stats.topProgram;
   const topProduct = stats.topProduct;

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
