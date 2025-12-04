import React from 'react';
import './Header.css';
import { getImagePath } from '../../utils/imagePath';
import { Link } from 'react-router-dom';

function Header() {
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
          <Link to="/list">체험</Link>
          <Link to="/">이벤트</Link>
          <Link to="/">고객지원</Link>
        </nav>

        <div className="pf-utils">
          <button className="pf-login-btn"><Link to="/login">login</Link></button>
          <button className="pf-login-btn"><Link to="/signup">signup</Link></button>
        </div>
      </div>
    </header>
  );
}

export default Header;
