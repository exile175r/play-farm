import React from "react";
import "./Header.css";
import { getImagePath } from "../../utils/imagePath";
import { Link } from "react-router-dom";

function Header({ isLoggedIn, onLogout }) {
  const handleLogoutClick = (e) => {
    e.preventDefault();
    if (window.confirm('로그아웃 하시겠습니까?')) {
      onLogout();
    }
  };
  return (
    <header className="pf-header">
      <div className="pf-inner">
        <h1 className="pf-logo">
          <Link to="/">
            <img src={getImagePath("/logos/textlogo.png")} alt="logo" />
          </Link>
        </h1>

        <nav className="pf-nav">
          <Link to="/">홈</Link>
          <Link to="/list?page=1&limit=20">체험</Link>
          <Link to="/events">이벤트·공지</Link>
          <Link to="/support">고객지원</Link>
        </nav>

        <div className="pf-utils">
          <button className="pf-login-btn">
            {!isLoggedIn ? <Link to="/user/login">login</Link> : <Link to="/" onClick={handleLogoutClick}>logout</Link>}
          </button>
          <button className="pf-login-btn">
            {!isLoggedIn ? <Link to="/user/signup">signup</Link> : <Link to="">My Page</Link>}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
