// src/adim/taps/OrdersTab.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import './Tabs.css';
import { getAllOrders, refundOrder } from '../../services/adminApi';

function OrdersTab() {
   const [statusFilter, setStatusFilter] = useState('ALL');
   const [keyword, setKeyword] = useState('');
   const [orders, setOrders] = useState([]);
   const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
   const [currentPage, setCurrentPage] = useState(1);
   const [error, setError] = useState(null);
   const navigate = useNavigate();

   // 주문 목록 로드
   const loadOrders = async (page = 1) => {
      try {
         setError(null);
         const result = await getAllOrders({
            page,
            limit: 20,
            keyword: keyword.trim(),
            status: statusFilter
         });

         if (result.success) {
            setOrders(result.data || []);
            setPagination(result.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
            setCurrentPage(page);
         } else {
            setError(result.error?.message || '주문 목록을 불러오는데 실패했습니다.');
            setOrders([]);
         }
      } catch (err) {
         setError('주문 목록을 불러오는데 실패했습니다.');
         setOrders([]);
         console.error('주문 목록 로드 실패:', err);
      }
   };

   // 초기 로딩 및 필터 변경 시 재로딩
   useEffect(() => {
      loadOrders(1);
   }, [statusFilter]);

   // 검색어 변경 시 디바운스 처리
   useEffect(() => {
      const timer = setTimeout(() => {
         loadOrders(1);
      }, 500);

      return () => clearTimeout(timer);
   }, [keyword]);

   const handleRefresh = () => {
      loadOrders(currentPage);
   };

   // ✅ 관리자 진입 플래그 전달
   const handleViewDetail = (id) => {
      navigate(`/orders/${encodeURIComponent(id)}`, {
         state: { fromAdminOrders: true },
      });
   };

   const handleRefund = async (id) => {
      if (!window.confirm(`주문번호 ${id} 를 환불 처리하시겠습니까?`)) {
         return;
      }

      try {
         const result = await refundOrder(id, '관리자 환불 처리');
         if (result.success) {
            alert('환불 처리가 완료되었습니다.');
            loadOrders(currentPage);
         } else {
            alert(result.error?.message || '환불 처리에 실패했습니다.');
         }
      } catch (err) {
         alert('환불 처리 중 오류가 발생했습니다.');
         console.error('환불 처리 실패:', err);
      }
   };

   const handlePageChange = (newPage) => {
      if (newPage >= 1 && newPage <= pagination.totalPages) {
         loadOrders(newPage);
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

         {error && (
            <div style={{ padding: '10px', color: '#b91c1c', marginBottom: '10px' }}>
               {error}
            </div>
         )}

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
                  {orders.length === 0 ? (
                     <tr>
                        <td colSpan={7} className="admin-table-empty">
                           {error ? '주문 목록을 불러올 수 없습니다.' : '조건에 맞는 주문이 없습니다.'}
                        </td>
                     </tr>
                  ) : (
                     orders.map((o) => {
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

         {/* 페이지네이션 */}
         {pagination.totalPages > 1 && (
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center' }}>
               <button
                  type="button"
                  className="admin-secondary-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}>
                  이전
               </button>
               <span>
                  {currentPage} / {pagination.totalPages} (총 {pagination.total}건)
               </span>
               <button
                  type="button"
                  className="admin-secondary-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}>
                  다음
               </button>
            </div>
         )}
      </div>
   );
}

export default OrdersTab;
