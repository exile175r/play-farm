// src/adim/taps/UsersTab.js
import React, { useEffect, useState } from 'react';
import './Tabs.css';
import { getAllUsers, updateUserStatus } from '../../services/adminApi';

function UsersTab() {
   const [users, setUsers] = useState([]);
   const [roleFilter, setRoleFilter] = useState('ALL');
   const [statusFilter, setStatusFilter] = useState('ALL');
   const [keyword, setKeyword] = useState('');
   const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
   const [currentPage, setCurrentPage] = useState(1);
   const [error, setError] = useState(null);

   // 사용자 목록 로드
   const loadUsers = async (page = 1) => {
      try {
         setError(null);
         const result = await getAllUsers({
            page,
            limit: 10,
            keyword: keyword.trim(),
            role: roleFilter,
            status: statusFilter
         });

         if (result.success) {
            setUsers(result.data || []);
            setPagination(result.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
            setCurrentPage(page);
         } else {
            setError(result.error?.message || '사용자 목록을 불러오는데 실패했습니다.');
            setUsers([]);
         }
      } catch (err) {
         setError('사용자 목록을 불러오는데 실패했습니다.');
         setUsers([]);
         console.error('사용자 목록 로드 실패:', err);
      }
   };

   // 초기 로딩 및 필터 변경 시 재로딩
   useEffect(() => {
      loadUsers(1);
   }, [roleFilter, statusFilter]);

   // 검색어 변경 시 디바운스 처리
   useEffect(() => {
      const timer = setTimeout(() => {
         loadUsers(1);
      }, 500);

      return () => clearTimeout(timer);
   }, [keyword]);

   const handleRefresh = () => {
      loadUsers(currentPage);
   };

   const handleToggleBan = async (id, currentStatus) => {
      const newStatus = currentStatus === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
      const action = currentStatus === 'ACTIVE' ? '이용 제한' : '제한 해제';

      if (!window.confirm(`유저 ID ${id} 를 ${action} 처리하시겠습니까?`)) {
         return;
      }

      try {
         const result = await updateUserStatus(id, newStatus);
         if (result.success) {
            alert(`${action} 처리가 완료되었습니다.`);
            loadUsers(currentPage);
         } else {
            alert(result.error?.message || `${action} 처리에 실패했습니다.`);
         }
      } catch (err) {
         alert(`${action} 처리 중 오류가 발생했습니다.`);
         console.error('사용자 상태 변경 실패:', err);
      }
   };

   const handlePageChange = (newPage) => {
      if (newPage >= 1 && newPage <= pagination.totalPages) {
         loadUsers(newPage);
      }
   };

   const renderStatusBadge = (status) => {
      if (status === 'ACTIVE') {
         return <span className="badge badge-open">정상</span>;
      }
      if (status === 'BANNED') {
         return <span className="badge badge-closed">제한</span>;
      }
      return <span className="badge badge-closed">기타</span>;
   };

   return (
      <div className="admin-section">
         <div className="admin-section-header">
            <div>
               <h2 className="admin-section-title">유저 관리</h2>
            </div>
            <button type="button" className="admin-primary-btn" onClick={handleRefresh}>
               유저 목록 새로고침
            </button>
         </div>

         <div className="admin-filters">
            <div className="admin-filter-item">
               <label className="admin-filter-label">권한</label>
               <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value="ALL">전체</option>
                  <option value="USER">일반 유저</option>
                  <option value="ADMIN">관리자</option>
               </select>
            </div>

            <div className="admin-filter-item">
               <label className="admin-filter-label">상태</label>
               <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="ALL">전체</option>
                  <option value="ACTIVE">정상</option>
                  <option value="BANNED">제한</option>
               </select>
            </div>

            <div className="admin-filter-item">
               <label className="admin-filter-label">검색</label>
               <input type="text" placeholder="이름, 이메일, 아이디 검색" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
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
                     <th>내부ID</th>
                     <th>아이디</th>
                     <th>이름</th>
                     <th>이메일</th>
                     <th>가입일</th>
                     <th>권한</th>
                     <th>상태</th>
                     <th>관리</th>
                  </tr>
               </thead>
               <tbody>
                  {users.length === 0 ? (
                     <tr>
                        <td colSpan={8} className="admin-table-empty">
                           {error ? '사용자 목록을 불러올 수 없습니다.' : '조건에 맞는 유저가 없습니다.'}
                        </td>
                     </tr>
                  ) : (
                     users.map((u) => (
                        <tr key={u.id}>
                           <td>{u.id}</td>
                           <td>{u.userId}</td>
                           <td>{u.name}</td>
                           <td>{u.email}</td>
                           <td>{u.joinedAt ? new Date(u.joinedAt).toISOString().split('T')[0] : '-'}</td>
                           <td>{u.role === 'ADMIN' ? '관리자' : '일반 유저'}</td>
                           <td>{renderStatusBadge(u.status)}</td>
                           <td>
                              <div className="admin-row-actions">
                                 <button type="button" className="admin-danger-btn" onClick={() => handleToggleBan(u.id, u.status)}>
                                    {u.status === 'ACTIVE' ? '이용 제한' : '제한 해제'}
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

export default UsersTab;
