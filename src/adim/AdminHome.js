// src/admin/AdminHome.js
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminTabs from './components/AdminTabs';

import ProgramsTab from './tabs/ProgramsTab';
import ReservationsTab from './tabs/ReservationsTab';
import ProductsTab from './tabs/ProductsTab';
import OrdersTab from './tabs/OrdersTab';
import EventsTab from './tabs/EventsTab';
import UsersTab from './tabs/UsersTab';

const TAB_ITEMS = [
   { key: 'programs', label: '체험 관리' },
   { key: 'reservations', label: '체험 예약 현황' },
   { key: 'products', label: '상품 관리' },
   { key: 'orders', label: '상품 구매 현황' },
   { key: 'events', label: '이벤트 관리' },
   { key: 'users', label: '유저 관리' },
];

export default function AdminHome() {
   const [sp, setSp] = useSearchParams();
   const tab = sp.get('tab') || 'programs';

   const CurrentTab = useMemo(() => {
      switch (tab) {
         case 'reservations':
            return ReservationsTab;
         case 'products':
            return ProductsTab;
         case 'orders':
            return OrdersTab;
         case 'events':
            return EventsTab;
         case 'users':
            return UsersTab;
         case 'programs':
         default:
            return ProgramsTab;
      }
   }, [tab]);

   const onChangeTab = (nextKey) => {
      setSp({ tab: nextKey });
   };

   const activeLabel = TAB_ITEMS.find((t) => t.key === tab)?.label || '관리자';

   return (
      <div style={styles.wrap}>
         <header style={styles.header}>
            <div>
               <div style={styles.title}>PlayFarm 관리자</div>
               <div style={styles.sub}>현재 탭: {activeLabel}</div>
            </div>

            <div style={styles.headerRight}>{/* 나중에 로그아웃/관리자명 표시 붙이면 됨 */}</div>
         </header>

         <AdminTabs items={TAB_ITEMS} value={tab} onChange={onChangeTab} />

         <main style={styles.main}>
            <CurrentTab />
         </main>
      </div>
   );
}

const styles = {
   wrap: { padding: 20, maxWidth: 1200, margin: '0 auto' },
   header: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 14,
   },
   title: { fontSize: 22, fontWeight: 800 },
   sub: { fontSize: 12, opacity: 0.7, marginTop: 6 },
   headerRight: { display: 'flex', gap: 8, alignItems: 'center' },
   main: { marginTop: 16, padding: 16, border: '1px solid #e5e5e5', borderRadius: 12, background: '#fff' },
};
