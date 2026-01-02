// src/components/layout/Header.js
import React from 'react';
import './Header.css';
import { getImagePath } from '../../utils/imagePath';
import { Link } from 'react-router-dom';

function Header({ isLoggedIn, onLogout }) {
   // ✅ localStorage에 저장된 관리자 여부 확인
   const isAdmin = localStorage.getItem('isAdmin') === 'true';

   const handleLogoutClick = (e) => {
      e.preventDefault();
      if (window.confirm('로그아웃 하시겠습니까?')) {
         // ✅ 로그아웃 시 관리자 플래그, 토큰 다 제거
         localStorage.removeItem('isAdmin');
         localStorage.removeItem('token');
         onLogout();
      }
   };

   return (
      <header className="pf-header">
         <div className="pf-inner">
            <h1 className="pf-logo">
               <Link to="/">
                  <img src={getImagePath('/logos/textlogo.png')} alt="logo" />
               </Link>
            </h1>

            <nav className="pf-nav">
               <Link to="/">홈</Link>
               <Link to="/list?page=1&limit=20">체험</Link>
               <Link to="/shop">상품구매</Link>
               <Link to="/events">이벤트·공지</Link>
               <Link to="/support">고객지원</Link>
            </nav>

            <div className="pf-utils">
               {/* 로그인 / 로그아웃 */}
               <button className="pf-login-btn">
                  {!isLoggedIn ? (
                     <Link to="/user/login">login</Link>
                  ) : (
                     <Link to="/" onClick={handleLogoutClick}>
                        logout
                     </Link>
                  )}
               </button>

               {/* ✅ 여기서 일반유저 / 관리자 분기 */}
               <button className="pf-login-btn">
                  {!isLoggedIn ? (
                     <Link to="/user/signup">signup</Link>
                  ) : isAdmin ? (
                     // 관리자 로그인 상태
                     <Link to="/admin">Admin</Link>
                  ) : (
                     // 일반 사용자 로그인 상태
                     <Link to="/mypage">My Page</Link>
                  )}
               </button>
            </div>
         </div>
      </header>
   );
}

export default Header;
