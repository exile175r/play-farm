// src/adim/components/AdminHome.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../taps/Tabs.css';

import DashboardTab from '../taps/DashboardTab';
import ProgramsTab from '../taps/ProgramsTab';
import ReservationsTab from '../taps/ReservationsTab';
import ProductsTab from '../taps/ProductsTab';
import OrdersTab from '../taps/OrdersTab';
import UsersTab from '../taps/UsersTab';
import EventsTab from '../taps/EventsTab';

const TAB_LIST = [
   { id: 'dashboard', label: '대시보드' },
   { id: 'programs', label: '체험 관리' },
   { id: 'reservations', label: '예약 관리' },
   { id: 'products', label: '상품 관리' },
   { id: 'orders', label: '주문 내역' },
   { id: 'users', label: '회원 관리' },
   { id: 'events', label: '이벤트 관리' },
];

function AdminHome() {
   const navigate = useNavigate();
   const [activeTab, setActiveTab] = useState('dashboard');

   // ✅ localStorage 값 한 번만 읽어서 의존성으로 사용
   const isAdmin = localStorage.getItem('isAdmin') === 'true';

   useEffect(() => {
      if (!isAdmin) {
         // ✅ 관리자 아니면 기존 로그인 페이지로 튕김
         navigate('/user/login', { replace: true });
      }
   }, [isAdmin, navigate]);

   const renderTab = () => {
      switch (activeTab) {
         case 'dashboard':
            return <DashboardTab />;
         case 'programs':
            return <ProgramsTab />;
         case 'reservations':
            return <ReservationsTab />;
         case 'products':
            return <ProductsTab />;
         case 'orders':
            return <OrdersTab />;
         case 'users':
            return <UsersTab />;
         case 'events':
            return <EventsTab />;
         default:
            return <DashboardTab />;
      }
   };

   return (
      <main className="admin-page">
         <header className="admin-header">
            <h1 className="admin-title">Play Farm 관리자</h1>
         </header>

         <div className="admin-body">
            {/* 왼쪽 사이드바: 브랜드 + 탭 메뉴 */}
            <aside className="admin-sidebar">
               <div style={{ marginBottom: '16px' }}>
                  <p
                     style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        marginTop: '4px',
                        lineHeight: 1.5,
                     }}></p>
               </div>

               <div className="admin-tabs">
                  {TAB_LIST.map((tab) => (
                     <button key={tab.id} type="button" className={'admin-tab-btn' + (activeTab === tab.id ? ' is-active' : '')} onClick={() => setActiveTab(tab.id)}>
                        {tab.label}
                     </button>
                  ))}
               </div>
            </aside>

            {/* 오른쪽 콘텐츠: 선택된 탭 내용만 렌더링 */}
            <section className={`admin-content ${activeTab}`}>{renderTab()}</section>
         </div>
      </main>
   );
}

export default AdminHome;
