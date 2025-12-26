// src/adim/components/AdminLogin.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../taps/Tabs.css';

function AdminLogin() {
   const navigate = useNavigate();
   const [id, setId] = useState('');
   const [pw, setPw] = useState('');
   const [error, setError] = useState('');

   const handleSubmit = (e) => {
      e.preventDefault();

      if (!id.trim() || !pw.trim()) {
         setError('아이디와 비밀번호를 모두 입력해 주세요.');
         return;
      }

      // ✅ 프론트 전용 하드코딩 관리자 계정
      // ID: admin, PW: 1234
      if (id === 'admin' && pw === '1234') {
         // 관리자 플래그 ON
         localStorage.setItem('isAdmin', 'true');
         alert('관리자 로그인에 성공했습니다.');
         navigate('/admin', { replace: true });
      } else {
         setError('관리자 아이디 또는 비밀번호가 올바르지 않습니다.');
      }
   };

   return (
      <main className="admin-page">
         <header className="admin-header">
            <h1 className="admin-title">Play Farm 관리자 로그인</h1>
         </header>

         <div className="admin-body" style={{ justifyContent: 'center' }}>
            <section className="admin-content" style={{ maxWidth: '400px' }}>
               <form onSubmit={handleSubmit} className="admin-form-grid">
                  <div className="admin-form-row">
                     <label className="admin-form-label">관리자 아이디</label>
                     <input type="text" value={id} onChange={(e) => setId(e.target.value)} placeholder="예: admin" />
                  </div>

                  <div className="admin-form-row">
                     <label className="admin-form-label">비밀번호</label>
                     <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="예: 1234" />
                  </div>

                  {error && <p style={{ fontSize: '12px', color: '#b91c1c' }}>{error}</p>}

                  <div className="admin-modal-footer" style={{ paddingTop: 8 }}>
                     <button type="submit" className="admin-primary-btn">
                        관리자 로그인
                     </button>
                  </div>
               </form>
            </section>
         </div>
      </main>
   );
}

export default AdminLogin;
