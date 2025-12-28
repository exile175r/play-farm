// src/adim/taps/ProgramsTab.js
import React, { useEffect, useState } from 'react';
import './Tabs.css';
import { getAllPrograms, deleteProgram } from '../../services/adminApi';

function ProgramsTab() {
   const [programs, setPrograms] = useState([]);
   const [statusFilter, setStatusFilter] = useState('ALL');
   const [keyword, setKeyword] = useState('');
   const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
   const [currentPage, setCurrentPage] = useState(1);
   const [error, setError] = useState(null);

   // 프로그램 목록 로드
   const loadPrograms = async (page = 1) => {
      try {
         setError(null);
         const result = await getAllPrograms({
            page,
            limit: 20,
            keyword: keyword.trim(),
            status: statusFilter
         });

         if (result.success) {
            console.log(result.data);
            const replaceText = { 체험: " 체험", 및: " 및 " };
            setPrograms(result.data.map((item) => {
               const newItem = { ...item };
               try {
                 if (typeof newItem.title === "string" && newItem.title.includes(" 체험")) {
                   return newItem;
                 }
                 newItem.title = JSON.parse(newItem.title)
                   .map((v) => v.replace(/체험|및/g, (match) => replaceText[match] || match))
                   .join(", ");
               } catch (error) {
                 if (typeof newItem.title === "string" && !newItem.title.includes(" 체험")) {
                   newItem.title = newItem.title.replace(/체험|및/g, (match) => replaceText[match] || match);
                 }
               }
               return newItem;
             }).sort((a, b) => b.id - a.id));
            setPagination(result.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
            setCurrentPage(page);
         } else {
            setError(result.error?.message || '프로그램 목록을 불러오는데 실패했습니다.');
            setPrograms([]);
         }
      } catch (err) {
         setError('프로그램 목록을 불러오는데 실패했습니다.');
         setPrograms([]);
         console.error('프로그램 목록 로드 실패:', err);
      }
   };

   // 초기 로딩 및 필터 변경 시 재로딩
   useEffect(() => {
      loadPrograms(1);
   }, [statusFilter]);

   // 검색어 변경 시 디바운스 처리
   useEffect(() => {
      const timer = setTimeout(() => {
         loadPrograms(1);
      }, 500);

      return () => clearTimeout(timer);
   }, [keyword]);

   const handleCreate = () => {
      alert('새 체험 생성 기능은 이미지 업로드 구현 후 추가됩니다.');
   };

   const handleEdit = (id) => {
      alert(`체험 ID ${id} 수정 기능은 이미지 업로드 구현 후 추가됩니다.`);
   };

   const handleDelete = async (id) => {
      if (!window.confirm(`체험 ID ${id} 를 삭제하시겠습니까?`)) {
         return;
      }

      try {
         const result = await deleteProgram(id);
         if (result.success) {
            alert('체험이 삭제되었습니다.');
            loadPrograms(currentPage);
         } else {
            alert(result.error?.message || '체험 삭제에 실패했습니다.');
         }
      } catch (err) {
         alert('체험 삭제 중 오류가 발생했습니다.');
         console.error('체험 삭제 실패:', err);
      }
   };

   const handlePageChange = (newPage) => {
      if (newPage >= 1 && newPage <= pagination.totalPages) {
         loadPrograms(newPage);
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
                  {programs.length === 0 ? (
                     <tr>
                        <td colSpan={7} className="admin-table-empty">
                           {error ? '프로그램 목록을 불러올 수 없습니다.' : '조건에 맞는 체험이 없습니다.'}
                        </td>
                     </tr>
                  ) : (
                     programs.map((p) => (
                        <tr key={p.id}>
                           <td>{p.id}</td>
                           <td>{p.title}</td>
                           <td>{p.category}</td>
                           <td>
                              {p.startDate ? `${p.startDate} ~ ${p.endDate || ''}` : '-'}
                           </td>
                           <td>{p.price ? p.price.toLocaleString() + '원' : '-'}</td>
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

export default ProgramsTab;
