// src/adim/components/AdminTabs.js
import React, { useState } from 'react';
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

function AdminTabs() {
   const [activeTab, setActiveTab] = useState('dashboard');

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
      <main className="admin-shell">
         <aside className="admin-sidemenu">
            <h1 className="admin-brand">PlayFarm Admin</h1>
            <nav className="admin-nav">
               {TAB_LIST.map((tab) => (
                  <button key={tab.id} type="button" className={'admin-nav-item' + (activeTab === tab.id ? ' is-active' : '')} onClick={() => setActiveTab(tab.id)}>
                     <span className="admin-nav-label">{tab.label}</span>
                  </button>
               ))}
            </nav>
         </aside>

         <section className="admin-main">{renderTab()}</section>
      </main>
   );
}

export default AdminTabs;
