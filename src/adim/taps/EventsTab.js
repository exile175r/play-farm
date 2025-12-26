// src/adim/taps/EventsTab.js
import React, { useMemo, useState } from 'react';
import './Tabs.css';
import AdminModal from '../components/AdminModal';

const INITIAL_EVENTS = [
   {
      id: 1,
      title: '봄맞이 체험 할인 이벤트',
      position: '메인 배너', // 노출 위치
      startDate: '2025-03-01',
      endDate: '2025-03-31',
      status: 'ONGOING', // SCHEDULED | ONGOING | ENDED
   },
   {
      id: 2,
      title: '감귤 수확 시즌 한정 이벤트',
      position: '이벤트 페이지',
      startDate: '2025-02-01',
      endDate: '2025-02-28',
      status: 'SCHEDULED',
   },
   {
      id: 3,
      title: '겨울 방학 농촌 체험 패키지',
      position: '메인 배너',
      startDate: '2024-12-20',
      endDate: '2025-01-15',
      status: 'ENDED',
   },
];

const emptyForm = {
   title: '',
   position: '',
   startDate: '',
   endDate: '',
   status: 'SCHEDULED',
};

function EventsTab() {
   const [events, setEvents] = useState(INITIAL_EVENTS);
   const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | SCHEDULED | ONGOING | ENDED
   const [keyword, setKeyword] = useState('');

   const [isModalOpen, setIsModalOpen] = useState(false);
   const [editingEvent, setEditingEvent] = useState(null);
   const [form, setForm] = useState(emptyForm);

   const filteredEvents = useMemo(() => {
      return events.filter((e) => {
         if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;

         if (!keyword.trim()) return true;
         const q = keyword.trim().toLowerCase();
         return e.title.toLowerCase().includes(q) || e.position.toLowerCase().includes(q);
      });
   }, [events, statusFilter, keyword]);

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

      if (editingEvent) {
         // 수정 모드
         setEvents((prev) =>
            prev.map((e) =>
               e.id === editingEvent.id
                  ? {
                       ...e,
                       title: form.title.trim(),
                       position: form.position.trim(),
                       startDate: form.startDate,
                       endDate: form.endDate,
                       status: form.status,
                    }
                  : e
            )
         );
         alert('이벤트 정보가 수정되었습니다. (지금은 메모리 상에서만 적용)');
      } else {
         // 생성 모드
         const maxId = events.reduce((max, e) => Math.max(max, e.id), 0);
         const newEvent = {
            id: maxId + 1,
            title: form.title.trim(),
            position: form.position.trim(),
            startDate: form.startDate,
            endDate: form.endDate,
            status: form.status,
         };
         setEvents((prev) => [...prev, newEvent]);
         alert('새 이벤트가 추가되었습니다. (지금은 메모리 상에서만 적용)');
      }

      setIsModalOpen(false);
   };

   // ===== 삭제 =====
   const handleDelete = (id) => {
      if (window.confirm(`이벤트 ID ${id} 를 삭제하시겠습니까?`)) {
         setEvents((prev) => prev.filter((e) => e.id !== id));
         alert('현재는 메모리 상에서만 삭제되었습니다.');
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
                  {filteredEvents.length === 0 ? (
                     <tr>
                        <td colSpan={6} className="admin-table-empty">
                           조건에 맞는 이벤트가 없습니다.
                        </td>
                     </tr>
                  ) : (
                     filteredEvents.map((e) => (
                        <tr key={e.id}>
                           <td>{e.id}</td>
                           <td>{e.title}</td>
                           <td>{e.position}</td>
                           <td>
                              {e.startDate} ~ {e.endDate}
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
