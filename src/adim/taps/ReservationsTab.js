// src/adim/taps/ReservationsTab.js
import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import './Tabs.css';
import AdminModal from '../components/AdminModal';
import { getAllReservations, deleteReservation } from '../../services/adminApi';

function ReservationsTab() {
   const [reservations, setReservations] = useState([]);
   const [statusFilter, setStatusFilter] = useState('ALL');
   const [keyword, setKeyword] = useState('');
   const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
   const [currentPage, setCurrentPage] = useState(1);
   const [error, setError] = useState(null);

   const [detailModalOpen, setDetailModalOpen] = useState(false);
   const [selectedReservation, setSelectedReservation] = useState(null);

   // 예약 목록 로드
   const loadReservations = async (page = 1) => {
      try {
         setError(null);
         const result = await getAllReservations({
            page,
            limit: 10,
            keyword: keyword.trim(),
            status: statusFilter
         });

         if (result.success) {
            const replaceText = { 체험: ' 체험', 및: ' 및 ' };
            setReservations(
               result.data
                  .map((item) => {
                  const newItem = { ...item };
                  try {
                     if (typeof newItem.programTitle === 'string' && newItem.programTitle.includes(' 체험')) {
                        return newItem;
                     }
                     newItem.programTitle = JSON.parse(newItem.programTitle)
                        .map((v) => v.replace(/체험|및/g, (match) => replaceText[match] || match))
                        .join(', ');
                  } catch (error) {
                     if (typeof newItem.programTitle === 'string' && !newItem.programTitle.includes(' 체험')) {
                        newItem.programTitle = newItem.programTitle.replace(/체험|및/g, (match) => replaceText[match] || match);
                     }
                  }
                  return newItem;
                  })
                  .sort((a, b) => b.id - a.id)
            );
            setPagination(result.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
            setCurrentPage(page);
         } else {
            setError(result.error?.message || '예약 목록을 불러오는데 실패했습니다.');
            setReservations([]);
         }
      } catch (err) {
         setError('예약 목록을 불러오는데 실패했습니다.');
         setReservations([]);
         console.error('예약 목록 로드 실패:', err);
      }
   };

   // 초기 로딩 및 필터 변경 시 재로딩
   useEffect(() => {
      loadReservations(1);
   }, [statusFilter]);

   // 검색어 변경 시 디바운스 처리
   useEffect(() => {
      const timer = setTimeout(() => {
         loadReservations(1);
      }, 500);

      return () => clearTimeout(timer);
   }, [keyword]);

   const handleRefresh = () => {
      loadReservations(currentPage);
   };

   const handlePageChange = (newPage) => {
      if (newPage >= 1 && newPage <= pagination.totalPages) {
         loadReservations(newPage);
      }
   };

   const handleViewDetail = (reservation) => {
      setSelectedReservation(reservation);
      setDetailModalOpen(true);
   };

   const handleDelete = async (reservation) => {
      if (!window.confirm(`예약번호 ${reservation.id}를 정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
         return;
      }

      try {
         const result = await deleteReservation(reservation.id);
         if (result.success) {
            alert('예약이 삭제되었습니다.');
            loadReservations(currentPage);
         } else {
            alert(result.error?.message || '예약 삭제에 실패했습니다.');
         }
      } catch (err) {
         console.error('예약 삭제 실패:', err);
         alert('예약 삭제 중 오류가 발생했습니다.');
      }
   };

   const renderStatusBadge = (status) => {
      switch (status) {
         case 'PENDING':
            return <span className="badge badge-open">대기</span>;
         case 'CONFIRMED':
            return <span className="badge badge-open">확정</span>;
         case 'CANCELLED':
            return <span className="badge badge-closed">취소</span>;
         case 'REFUNDED':
            return <span className="badge badge-closed">환불</span>;
         default:
            return <span className="badge badge-closed">기타</span>;
      }
   };

   const renderStatusLabel = (status) => {
      switch (status) {
         case 'PENDING':
            return '대기 (PENDING)';
         case 'CONFIRMED':
            return '확정 (CONFIRMED)';
         case 'CANCELLED':
            return '취소 (CANCELLED)';
         case 'REFUNDED':
            return '환불 (REFUNDED)';
         default:
            return status;
      }
   };

   return (
      <div className="admin-section">
         {/* 상단 타이틀 + 버튼 */}
         <div className="admin-section-header">
            <div>
               <h2 className="admin-section-title">예약 관리</h2>
            </div>

            <button type="button" className="admin-primary-btn" onClick={handleRefresh}>
               예약 목록 새로고침
            </button>
         </div>

         {/* 필터 영역 */}
         <div className="admin-filters">
            <div className="admin-filter-item">
               <label className="admin-filter-label">상태</label>
               <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="ALL">전체</option>
                  <option value="PENDING">대기 (PENDING)</option>
                  <option value="CONFIRMED">확정 (CONFIRMED)</option>
                  <option value="CANCELLED">취소 (CANCELLED)</option>
                  <option value="REFUNDED">환불 (REFUNDED)</option>
               </select>
            </div>

            <div className="admin-filter-item">
               <label className="admin-filter-label">검색</label>
               <input type="text" placeholder="체험명, 예약자 이름 검색" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>
         </div>

         {error && (
            <div style={{ padding: '10px', color: '#b91c1c', marginBottom: '10px' }}>
               {error}
            </div>
         )}

         {/* 테이블 */}
         <div className="admin-table-wrapper">
            <table className="admin-table">
               <thead>
                  <tr>
                     <th>예약번호</th>
                     <th>체험명</th>
                     <th>예약자</th>
                     <th>체험일</th>
                     <th>인원</th>
                     <th>결제금액</th>
                     <th>상태</th>
                     <th>관리</th>
                  </tr>
               </thead>
               <tbody>
                  {reservations.length === 0 ? (
                     <tr>
                        <td colSpan={8} className="admin-table-empty">
                           {error ? '예약 목록을 불러올 수 없습니다.' : '조건에 맞는 예약이 없습니다.'}
                        </td>
                     </tr>
                  ) : (
                     reservations.map((r) => (
                        <tr key={r.id}>
                           <td>{r.id}</td>
                           <td>{r.programTitle}</td>
                           <td>{r.userName}</td>
                           <td>{dayjs(r.date).format('YYYY-MM-DD')}</td>
                           <td>{r.people}명</td>
                           <td>{r.totalPrice.toLocaleString()}원</td>
                           <td>{renderStatusBadge(r.status)}</td>
                           <td>
                              <div className="admin-row-actions">
                                 <button type="button" className="admin-secondary-btn" onClick={() => handleViewDetail(r)}>
                                    상세
                                 </button>
                                 <button 
                                    type="button" 
                                    className="admin-danger-btn" 
                                    onClick={() => handleDelete(r)}
                                    style={{ marginLeft: '5px', backgroundColor: '#dc2626', color: 'white' }}
                                 >
                                    삭제
                                 </button>
                              </div>
                           </td>
                        </tr>
                     ))
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

         {/* 상세 모달 */}
         {detailModalOpen && selectedReservation && (
            <AdminModal title={`예약 상세 - ${selectedReservation.id}`} onClose={() => setDetailModalOpen(false)} onSubmit={() => setDetailModalOpen(false)} submitLabel="확인">
               <div className="admin-detail-grid">
                  <div className="admin-detail-row">
                     <span className="admin-detail-label">예약번호</span>
                     <span className="admin-detail-value">{selectedReservation.id}</span>
                  </div>
                  <div className="admin-detail-row">
                     <span className="admin-detail-label">체험명</span>
                     <span className="admin-detail-value">{selectedReservation.programTitle}</span>
                  </div>
                  <div className="admin-detail-row">
                     <span className="admin-detail-label">예약자</span>
                     <span className="admin-detail-value">{selectedReservation.userName}</span>
                  </div>
                  <div className="admin-detail-row">
                     <span className="admin-detail-label">연락처</span>
                     <span className="admin-detail-value">{selectedReservation.userPhone}</span>
                  </div>
                  <div className="admin-detail-row">
                     <span className="admin-detail-label">체험일시</span>
                     <span className="admin-detail-value">
                        {selectedReservation.date} {selectedReservation.timeSlot}
                     </span>
                  </div>
                  <div className="admin-detail-row">
                     <span className="admin-detail-label">인원</span>
                     <span className="admin-detail-value">{selectedReservation.people}명</span>
                  </div>
                  <div className="admin-detail-row">
                     <span className="admin-detail-label">결제금액</span>
                     <span className="admin-detail-value">{selectedReservation.totalPrice.toLocaleString()}원</span>
                  </div>
                  <div className="admin-detail-row">
                     <span className="admin-detail-label">결제수단</span>
                     <span className="admin-detail-value">{selectedReservation.paymentMethod}</span>
                  </div>
                  <div className="admin-detail-row">
                     <span className="admin-detail-label">예약일시</span>
                     <span className="admin-detail-value">{selectedReservation.createdAt}</span>
                  </div>
                  <div className="admin-detail-row">
                     <span className="admin-detail-label">상태</span>
                     <span className="admin-detail-value">{renderStatusLabel(selectedReservation.status)}</span>
                  </div>
               </div>
            </AdminModal>
         )}
      </div>
   );
}

export default ReservationsTab;
