// src/adim/taps/ProgramsTab.js
import React, { useMemo, useState } from 'react';
import './Tabs.css';

const DUMMY_PROGRAMS = [
   {
      id: 1,
      title: '감자 캐기 체험',
      category: '농작물 수확',
      status: 'OPEN', // OPEN | CLOSED
      startDate: '2025-03-01',
      endDate: '2025-03-31',
      price: 15000,
   },
   {
      id: 2,
      title: '감귤 따기 주말 체험',
      category: '과수원',
      status: 'OPEN',
      startDate: '2025-02-01',
      endDate: '2025-02-28',
      price: 20000,
   },
   {
      id: 3,
      title: '트랙터 타고 둘러보기',
      category: '농장 투어',
      status: 'CLOSED',
      startDate: '2024-12-01',
      endDate: '2024-12-31',
      price: 10000,
   },
];

function ProgramsTab() {
   const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | OPEN | CLOSED
   const [keyword, setKeyword] = useState('');

   const filteredPrograms = useMemo(() => {
      return DUMMY_PROGRAMS.filter((p) => {
         // 상태 필터
         if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;

         // 검색어 (제목 + 카테고리)
         if (!keyword.trim()) return true;
         const q = keyword.trim().toLowerCase();
         return p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      });
   }, [statusFilter, keyword]);

   const handleCreate = () => {
      // TODO: 나중에 모달 열어서 생성 폼 띄우기
      alert('새 체험 생성 폼(모달) 여는 자리');
   };

   const handleEdit = (id) => {
      // TODO: 나중에 상세 수정 모달/페이지 연결
      alert(`체험 ID ${id} 수정 폼 여는 자리`);
   };

   const handleDelete = (id) => {
      // TODO: 실제 삭제 로직 나중에 서버 붙일 때 구현
      if (window.confirm(`체험 ID ${id} 를 삭제하시겠습니까?`)) {
         alert('지금은 더미라 실제 삭제는 안 됨');
      }
   };

   return (
      <div className="admin-section">
         {/* 상단 타이틀 + 버튼 */}
         <div className="admin-section-header">
            <div>
               <h2 className="admin-section-title">체험 관리</h2>
            </div>

            <button type="button" className="admin-primary-btn" onClick={handleCreate}>
               + 새 체험 만들기
            </button>
         </div>

         {/* 필터 영역 */}
         <div className="admin-filters">
            <div className="admin-filter-item">
               <label className="admin-filter-label">상태</label>
               <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="ALL">전체</option>
                  <option value="OPEN">모집중 (OPEN)</option>
                  <option value="CLOSED">종료 (CLOSED)</option>
               </select>
            </div>

            <div className="admin-filter-item">
               <label className="admin-filter-label">검색</label>
               <input type="text" placeholder="제목, 카테고리 검색" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>
         </div>

         {/* 테이블 */}
         <div className="admin-table-wrapper">
            <table className="admin-table">
               <thead>
                  <tr>
                     <th>ID</th>
                     <th>체험명</th>
                     <th>카테고리</th>
                     <th>기간</th>
                     <th>가격</th>
                     <th>상태</th>
                     <th>관리</th>
                  </tr>
               </thead>
               <tbody>
                  {filteredPrograms.length === 0 ? (
                     <tr>
                        <td colSpan={7} className="admin-table-empty">
                           조건에 맞는 체험이 없습니다.
                        </td>
                     </tr>
                  ) : (
                     filteredPrograms.map((p) => (
                        <tr key={p.id}>
                           <td>{p.id}</td>
                           <td>{p.title}</td>
                           <td>{p.category}</td>
                           <td>
                              {p.startDate} ~ {p.endDate}
                           </td>
                           <td>{p.price.toLocaleString()}원</td>
                           <td>{p.status === 'OPEN' ? <span className="badge badge-open">OPEN</span> : <span className="badge badge-closed">CLOSED</span>}</td>
                           <td>
                              <div className="admin-row-actions">
                                 <button type="button" className="admin-secondary-btn" onClick={() => handleEdit(p.id)}>
                                    수정
                                 </button>
                                 <button type="button" className="admin-danger-btn" onClick={() => handleDelete(p.id)}>
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
      </div>
   );
}

export default ProgramsTab;
