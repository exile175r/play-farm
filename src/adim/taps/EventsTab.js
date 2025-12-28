// src/adim/taps/EventsTab.js
import React, { useEffect, useState } from 'react';
import './Tabs.css';
import AdminModal from '../components/AdminModal';
import { getAllEvents, deleteEvent } from '../../services/adminApi';

const emptyForm = {
   title: '',
   position: '',
   startDate: '',
   endDate: '',
   status: 'SCHEDULED',
};

function EventsTab() {
   const [events, setEvents] = useState([]);
   const [statusFilter, setStatusFilter] = useState('ALL');
   const [keyword, setKeyword] = useState('');
   const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
   const [currentPage, setCurrentPage] = useState(1);
   const [error, setError] = useState(null);

   const [isModalOpen, setIsModalOpen] = useState(false);
   const [editingEvent, setEditingEvent] = useState(null);
   const [form, setForm] = useState(emptyForm);

   // 이벤트 목록 로드
   const loadEvents = async (page = 1) => {
      try {
         setError(null);
         const result = await getAllEvents({
            page,
            limit: 20,
            keyword: keyword.trim(),
            status: statusFilter
         });

         if (result.success) {
            setEvents(result.data || []);
            setPagination(result.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
            setCurrentPage(page);
         } else {
            setError(result.error?.message || '이벤트 목록을 불러오는데 실패했습니다.');
            setEvents([]);
         }
      } catch (err) {
         setError('이벤트 목록을 불러오는데 실패했습니다.');
         setEvents([]);
         console.error('이벤트 목록 로드 실패:', err);
      }
   };

   // 초기 로딩 및 필터 변경 시 재로딩
   useEffect(() => {
      loadEvents(1);
   }, [statusFilter]);

   // 검색어 변경 시 디바운스 처리
   useEffect(() => {
      const timer = setTimeout(() => {
         loadEvents(1);
      }, 500);

      return () => clearTimeout(timer);
   }, [keyword]);

   // ===== 모달 열기/닫기 =====
   const openCreateModal = () => {
      setEditingEvent(null);
      setForm(emptyForm);
      setIsModalOpen(true);
   };

   const openEditModal = (event) => {
      setEditingEvent(event);
      setForm({
         title: event.title,
         position: event.position,
         startDate: event.startDate,
         endDate: event.endDate,
         status: event.status,
      });
      setIsModalOpen(true);
   };

   const closeModal = () => {
      setIsModalOpen(false);
   };

   // ===== 폼 입력 =====
   const handleChange = (e) => {
      const { name, value } = e.target;
      setForm((prev) => ({
         ...prev,
         [name]: value,
      }));
   };

   // ===== 저장 (생성/수정 공통) =====
   const handleSubmit = () => {
      if (!form.title.trim()) {
         alert('이벤트 제목을 입력해 주세요.');
         return;
      }
      if (!form.position.trim()) {
         alert('노출 위치를 입력해 주세요. (예: 메인 배너, 이벤트 페이지 등)');
         return;
      }
      if (!form.startDate || !form.endDate) {
         alert('이벤트 기간(시작일/종료일)을 입력해 주세요.');
         return;
      }

      alert('이벤트 생성/수정 기능은 이미지 업로드 구현 후 추가됩니다.');
      setIsModalOpen(false);
   };

   // ===== 삭제 =====
   const handleDelete = async (id) => {
      if (!window.confirm(`이벤트 ID ${id} 를 삭제하시겠습니까?`)) {
         return;
      }

      try {
         const result = await deleteEvent(id);
         if (result.success) {
            alert('이벤트가 삭제되었습니다.');
            loadEvents(currentPage);
         } else {
            alert(result.error?.message || '이벤트 삭제에 실패했습니다.');
         }
      } catch (err) {
         alert('이벤트 삭제 중 오류가 발생했습니다.');
         console.error('이벤트 삭제 실패:', err);
      }
   };

   const handlePageChange = (newPage) => {
      if (newPage >= 1 && newPage <= pagination.totalPages) {
         loadEvents(newPage);
      }
   };

   const renderStatusBadge = (status) => {
      switch (status) {
         case 'SCHEDULED':
            return <span className="badge badge-closed">진행 예정</span>;
         case 'ONGOING':
            return <span className="badge badge-open">진행 중</span>;
         case 'ENDED':
            return <span className="badge badge-closed">종료</span>;
         default:
            return <span className="badge badge-closed">기타</span>;
      }
   };

   return (
      <div className="admin-section">
         {/* 상단 영역 */}
         <div className="admin-section-header">
            <div>
               <h2 className="admin-section-title">이벤트 관리</h2>
            </div>
            <button type="button" className="admin-primary-btn" onClick={openCreateModal}>
               + 새 이벤트 만들기
            </button>
         </div>

         {/* 필터 */}
         <div className="admin-filters">
            <div className="admin-filter-item">
               <label className="admin-filter-label">상태</label>
               <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="ALL">전체</option>
                  <option value="SCHEDULED">진행 예정</option>
                  <option value="ONGOING">진행 중</option>
                  <option value="ENDED">종료</option>
               </select>
            </div>

            <div className="admin-filter-item">
               <label className="admin-filter-label">검색</label>
               <input type="text" placeholder="이벤트명, 노출 위치 검색" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
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
                     <th>이벤트ID</th>
                     <th>제목</th>
                     <th>노출 위치</th>
                     <th>기간</th>
                     <th>상태</th>
                     <th>관리</th>
                  </tr>
               </thead>
               <tbody>
                  {events.length === 0 ? (
                     <tr>
                        <td colSpan={6} className="admin-table-empty">
                           {error ? '이벤트 목록을 불러올 수 없습니다.' : '조건에 맞는 이벤트가 없습니다.'}
                        </td>
                     </tr>
                  ) : (
                     events.map((e) => (
                        <tr key={e.id}>
                           <td>{e.id}</td>
                           <td>{e.title}</td>
                           <td>{e.position}</td>
                           <td>
                              {e.startDate ? `${e.startDate} ~ ${e.endDate || ''}` : '-'}
                           </td>
                           <td>{renderStatusBadge(e.status)}</td>
                           <td>
                              <div className="admin-row-actions">
                                 <button type="button" className="admin-secondary-btn" onClick={() => openEditModal(e)}>
                                    수정
                                 </button>
                                 <button type="button" className="admin-danger-btn" onClick={() => handleDelete(e.id)}>
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

         {/* 모달 */}
         {isModalOpen && (
            <AdminModal
               title={editingEvent ? '이벤트 수정' : '새 이벤트 만들기'}
               onClose={closeModal}
               onSubmit={handleSubmit}
               submitLabel={editingEvent ? '수정 완료' : '등록하기'}>
               <div className="admin-form-grid">
                  <div className="admin-form-row">
                     <label className="admin-form-label">이벤트 제목</label>
                     <input type="text" name="title" value={form.title} onChange={handleChange} placeholder="예: 봄맞이 체험 할인 이벤트" />
                  </div>

                  <div className="admin-form-row">
                     <label className="admin-form-label">노출 위치</label>
                     <input type="text" name="position" value={form.position} onChange={handleChange} placeholder="예: 메인 배너, 이벤트 페이지" />
                  </div>

                  <div className="admin-form-row admin-form-row-inline">
                     <div>
                        <label className="admin-form-label">시작일</label>
                        <input type="date" name="startDate" value={form.startDate} onChange={handleChange} />
                     </div>
                     <div>
                        <label className="admin-form-label">종료일</label>
                        <input type="date" name="endDate" value={form.endDate} onChange={handleChange} />
                     </div>
                  </div>

                  <div className="admin-form-row">
                     <label className="admin-form-label">상태</label>
                     <select name="status" value={form.status} onChange={handleChange}>
                        <option value="SCHEDULED">진행 예정</option>
                        <option value="ONGOING">진행 중</option>
                        <option value="ENDED">종료</option>
                     </select>
                  </div>
               </div>
            </AdminModal>
         )}
      </div>
   );
}

export default EventsTab;
