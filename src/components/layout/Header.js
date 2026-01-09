// src/components/layout/Header.js
import React from 'react';
import './Header.css';
import { getImagePath } from '../../utils/imagePath';
import { Link } from 'react-router-dom';

function Header({ isLoggedIn, onLogout }) {
   // ✅ localStorage에 저장된 관리자 여부 확인
   const isAdmin = localStorage.getItem('isAdmin') === 'true';

   const [isMenuOpen, setIsMenuOpen] = React.useState(false);

   const toggleMenu = () => {
      setIsMenuOpen(!isMenuOpen);
   };

   const closeMenu = () => {
      setIsMenuOpen(false);
   };

   const handleLogoutClick = (e) => {
      e.preventDefault();
      closeMenu();
      if (window.confirm('로그아웃 하시겠습니까?')) {
         // ✅ 로그아웃 시 관리자 플래그, 토큰 다 제거
         localStorage.removeItem('isAdmin');
         localStorage.removeItem('token');
         onLogout();
      }
   };

   return (
      <header className={`pf-header ${isMenuOpen ? 'is-open' : ''}`}>
         <div className="pf-inner">
            <h1 className="pf-logo">
               <Link to="/" onClick={closeMenu}>
                  <img src={getImagePath('/logos/textlogo.png')} alt="logo" />
               </Link>
            </h1>

            <button className="pf-menu-toggle" onClick={toggleMenu} aria-label="메뉴 열기">
               <span className="pf-menu-bar"></span>
               <span className="pf-menu-bar"></span>
               <span className="pf-menu-bar"></span>
            </button>

            <div className={`pf-nav-wrap ${isMenuOpen ? 'is-active' : ''}`}>
               <nav className="pf-nav">
                  <Link to="/" onClick={closeMenu}>
                     홈
                  </Link>
                  <Link to="/list?page=1&limit=20" onClick={closeMenu}>
                     체험
                  </Link>
                  <Link to="/shop" onClick={closeMenu}>
                     상품구매
                  </Link>
                  <Link to="/events" onClick={closeMenu}>
                     이벤트·공지
                  </Link>
                  <Link to="/support" onClick={closeMenu}>
                     고객지원
                  </Link>
               </nav>

               <div className="pf-utils">
                  {/* 로그인 / 로그아웃 */}
                  <button className="pf-login-btn">
                     {!isLoggedIn ? (
                        <Link to="/user/login" onClick={closeMenu}>
                           login
                        </Link>
                     ) : (
                        <Link to="/" onClick={handleLogoutClick}>
                           logout
                        </Link>
                     )}
                  </button>

                  {/* ✅ 여기서 일반유저 / 관리자 분기 */}
                  <button className="pf-login-btn">
                     {!isLoggedIn ? (
                        <Link to="/user/signup" onClick={closeMenu}>
                           signup
                        </Link>
                     ) : isAdmin ? (
                        // 관리자 로그인 상태
                        <Link to="/admin" onClick={closeMenu}>
                           Admin
                        </Link>
                     ) : (
                        // 일반 사용자 로그인 상태
                        <Link to="/mypage" onClick={closeMenu}>
                           My Page
                        </Link>
                     )}
                  </button>
               </div>
            </div>

            {isMenuOpen && <div className="pf-nav-overlay" onClick={closeMenu}></div>}
         </div>
      </header>
   );
}

export default Header;
