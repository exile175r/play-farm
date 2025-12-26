// src/adim/taps/ReservationsTab.js
import React, { useMemo, useState } from 'react';
import './Tabs.css';
import AdminModal from '../components/AdminModal';

// 데모용 더미 데이터 (나중에 서버/DB로 교체)
const INITIAL_RESERVATIONS = [
   {
      id: 101,
      programTitle: '감자 캐기 체험',
      userName: '홍길동',
      userPhone: '010-1111-2222',
      date: '2025-03-10',
      timeSlot: '오전 10:00',
      people: 4,
      totalPrice: 60000,
      createdAt: '2025-02-20 14:32',
      paymentMethod: '카드',
      status: 'CONFIRMED', // PENDING | CONFIRMED | CANCELLED | REFUNDED
   },
   {
      id: 102,
      programTitle: '감귤 따기 주말 체험',
      userName: '이영희',
      userPhone: '010-3333-4444',
      date: '2025-02-15',
      timeSlot: '오후 14:00',
      people: 2,
      totalPrice: 40000,
      createdAt: '2025-02-01 09:10',
      paymentMethod: '카드',
      status: 'PENDING',
   },
   {
      id: 103,
      programTitle: '트랙터 타고 둘러보기',
      userName: '박민수',
      userPhone: '010-5555-6666',
      date: '2024-12-20',
      timeSlot: '오후 16:00',
      people: 3,
      totalPrice: 30000,
      createdAt: '2024-12-10 19:45',
      paymentMethod: '계좌이체',
      status: 'CANCELLED',
   },
   {
      id: 104,
      programTitle: '감자 캐기 체험',
      userName: '정우성',
      userPhone: '010-7777-8888',
      date: '2025-03-21',
      timeSlot: '오전 11:00',
      people: 1,
      totalPrice: 15000,
      createdAt: '2025-02-25 11:20',
      paymentMethod: '카드',
      status: 'REFUNDED',
   },
];

function ReservationsTab() {
   const [reservations] = useState(INITIAL_RESERVATIONS);
   const [statusFilter, setStatusFilter] = useState('ALL');
   const [keyword, setKeyword] = useState('');

   const [detailModalOpen, setDetailModalOpen] = useState(false);
   const [selectedReservation, setSelectedReservation] = useState(null);

   const filteredReservations = useMemo(() => {
      return reservations.filter((r) => {
         if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;

         if (!keyword.trim()) return true;
         const q = keyword.trim().toLowerCase();
         return r.programTitle.toLowerCase().includes(q) || r.userName.toLowerCase().includes(q);
      });
   }, [reservations, statusFilter, keyword]);

   const handleRefresh = () => {
      // 나중에 서버 붙이면 여기서 API 다시 호출
      alert('지금은 더미 데이터입니다. 서버 연결 후 예약 목록을 새로고침하도록 변경해 주세요.');
   };

   const handleViewDetail = (reservation) => {
      setSelectedReservation(reservation);
      setDetailModalOpen(true);
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
                  {filteredReservations.length === 0 ? (
                     <tr>
                        <td colSpan={8} className="admin-table-empty">
                           조건에 맞는 예약이 없습니다.
                        </td>
                     </tr>
                  ) : (
                     filteredReservations.map((r) => (
                        <tr key={r.id}>
                           <td>{r.id}</td>
                           <td>{r.programTitle}</td>
                           <td>{r.userName}</td>
                           <td>{r.date}</td>
                           <td>{r.people}명</td>
                           <td>{r.totalPrice.toLocaleString()}원</td>
                           <td>{renderStatusBadge(r.status)}</td>
                           <td>
                              <div className="admin-row-actions">
                                 <button type="button" className="admin-secondary-btn" onClick={() => handleViewDetail(r)}>
                                    상세
                                 </button>
                              </div>
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>

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
