// src/adim/taps/OrdersTab.js
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import './Tabs.css';
import { readOrders } from '../../utils/orderStorage';

function OrdersTab() {
   const [statusFilter, setStatusFilter] = useState('ALL');
   const [keyword, setKeyword] = useState('');
   const [orders, setOrders] = useState([]); // ✅ 실제 주문 목록
   const navigate = useNavigate();

   // 초기 로딩
   useEffect(() => {
      const list = readOrders() || [];
      setOrders(Array.isArray(list) ? list : []);
   }, []);

   const filteredOrders = useMemo(() => {
      return orders.filter((o) => {
         const status = o.status || 'PENDING';

         if (statusFilter !== 'ALL' && status !== statusFilter) return false;

         if (!keyword.trim()) return true;
         const q = keyword.trim().toLowerCase();

         const id = (o.orderId || '').toLowerCase();
         const buyerName = (o.buyer?.name || '').toLowerCase();
         const firstItemTitle = (o.items?.[0]?.title || '').toLowerCase();

         return id.includes(q) || buyerName.includes(q) || firstItemTitle.includes(q);
      });
   }, [orders, statusFilter, keyword]);

   const handleRefresh = () => {
      const list = readOrders() || [];
      setOrders(Array.isArray(list) ? list : []);
      alert('주문 목록을 다시 불러왔습니다. (지금은 localStorage 기준)');
   };

   // ✅ 관리자 진입 플래그 전달
   const handleViewDetail = (id) => {
      navigate(`/orders/${encodeURIComponent(id)}`, {
         state: { fromAdminOrders: true },
      });
   };

   const handleRefund = (id) => {
      if (window.confirm(`주문번호 ${id} 를 환불 처리하시겠습니까?`)) {
         alert('현재는 관리자 화면에서 별도 환불 로직은 연결되어 있지 않습니다.');
      }
   };

   const renderStatusBadge = (statusRaw) => {
      const status = statusRaw || 'PENDING';
      switch (status) {
         case 'PAID':
            return <span className="badge badge-open">결제완료</span>;
         case 'PENDING':
            return <span className="badge badge-closed">결제대기</span>;
         case 'CANCELLED':
            return <span className="badge badge-closed">주문취소</span>;
         case 'REFUNDED':
            return <span className="badge badge-closed">환불완료</span>;
         default:
            return <span className="badge badge-closed">기타</span>;
      }
   };

   return (
      <div className="admin-section">
         <div className="admin-section-header">
            <div>
               <h2 className="admin-section-title">주문 내역</h2>
            </div>
            <button type="button" className="admin-primary-btn" onClick={handleRefresh}>
               주문 목록 새로고침
            </button>
         </div>

         <div className="admin-filters">
            <div className="admin-filter-item">
               <label className="admin-filter-label">상태</label>
               <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="ALL">전체</option>
                  <option value="PAID">결제완료</option>
                  <option value="PENDING">결제대기</option>
                  <option value="CANCELLED">주문취소</option>
                  <option value="REFUNDED">환불완료</option>
               </select>
            </div>

            <div className="admin-filter-item">
               <label className="admin-filter-label">검색</label>
               <input type="text" placeholder="주문번호, 구매자, 상품명 검색" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>
         </div>

         <div className="admin-table-wrapper">
            <table className="admin-table">
               <thead>
                  <tr>
                     <th>주문번호</th>
                     <th>구매자</th>
                     <th>주문 요약</th>
                     <th>주문일</th>
                     <th>결제금액</th>
                     <th>상태</th>
                     <th>관리</th>
                  </tr>
               </thead>
               <tbody>
                  {filteredOrders.length === 0 ? (
                     <tr>
                        <td colSpan={7} className="admin-table-empty">
                           조건에 맞는 주문이 없습니다.
                        </td>
                     </tr>
                  ) : (
                     filteredOrders.map((o) => {
                        const orderId = o.orderId || '(ID 없음)';
                        const buyerName = o.buyer?.name || '-';
                        const firstItem = o.items?.[0];
                        const itemTitle = firstItem?.title || '상품 없음';
                        const extraCount = (o.items?.length || 0) - 1;
                        const summary = extraCount > 0 ? `${itemTitle} 외 ${extraCount}건` : itemTitle;

                        const createdAt = o.createdAt ? dayjs(o.createdAt).format('YYYY-MM-DD') : '-';

                        const amount = Number(o.amount || 0);

                        return (
                           <tr key={orderId}>
                              <td>{orderId}</td>
                              <td>{buyerName}</td>
                              <td>{summary}</td>
                              <td>{createdAt}</td>
                              <td>{amount.toLocaleString()}원</td>
                              <td>{renderStatusBadge(o.status)}</td>
                              <td>
                                 <div className="admin-row-actions">
                                    <button type="button" className="admin-secondary-btn" onClick={() => handleViewDetail(orderId)}>
                                       상세
                                    </button>

                                    {o.status === 'PAID' && (
                                       <button type="button" className="admin-danger-btn" onClick={() => handleRefund(orderId)}>
                                          환불
                                       </button>
                                    )}
                                 </div>
                              </td>
                           </tr>
                        );
                     })
                  )}
               </tbody>
            </table>
         </div>
      </div>
   );
}

export default OrdersTab;
