// src/adim/taps/UsersTab.js
import React, { useMemo, useState } from 'react';
import './Tabs.css';

const DUMMY_USERS = [
   {
      id: 1,
      name: '홍길동',
      email: 'hong@example.com',
      userId: 'hong123',
      joinedAt: '2024-12-01',
      role: 'USER', // USER | ADMIN
      status: 'ACTIVE', // ACTIVE | BANNED
   },
   {
      id: 2,
      name: '관리자',
      email: 'admin@example.com',
      userId: 'admin',
      joinedAt: '2024-11-20',
      role: 'ADMIN',
      status: 'ACTIVE',
   },
   {
      id: 3,
      name: '이영희',
      email: 'lee@example.com',
      userId: 'lee_2024',
      joinedAt: '2025-01-05',
      role: 'USER',
      status: 'BANNED',
   },
];

function UsersTab() {
   const [roleFilter, setRoleFilter] = useState('ALL'); // ALL | USER | ADMIN
   const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | ACTIVE | BANNED
   const [keyword, setKeyword] = useState('');

   const filteredUsers = useMemo(() => {
      return DUMMY_USERS.filter((u) => {
         if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
         if (statusFilter !== 'ALL' && u.status !== statusFilter) return false;

         if (!keyword.trim()) return true;
         const q = keyword.trim().toLowerCase();
         return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.userId.toLowerCase().includes(q);
      });
   }, [roleFilter, statusFilter, keyword]);

   const handleRefresh = () => {
      alert('지금은 더미 데이터입니다. 서버 연결 후 유저 목록을 새로고침하세요.');
   };

   const handleToggleBan = (id, currentStatus) => {
      if (currentStatus === 'ACTIVE') {
         if (window.confirm(`유저 ID ${id} 를 이용 제한 처리하시겠습니까?`)) {
            alert('현재는 더미 데이터라 실제 상태 변경은 되지 않습니다.');
         }
      } else {
         if (window.confirm(`유저 ID ${id} 의 이용 제한을 해제하시겠습니까?`)) {
            alert('현재는 더미 데이터라 실제 상태 변경은 되지 않습니다.');
         }
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
                  {filteredUsers.length === 0 ? (
                     <tr>
                        <td colSpan={8} className="admin-table-empty">
                           조건에 맞는 유저가 없습니다.
                        </td>
                     </tr>
                  ) : (
                     filteredUsers.map((u) => (
                        <tr key={u.id}>
                           <td>{u.id}</td>
                           <td>{u.userId}</td>
                           <td>{u.name}</td>
                           <td>{u.email}</td>
                           <td>{u.joinedAt}</td>
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
      </div>
   );
}

export default UsersTab;
