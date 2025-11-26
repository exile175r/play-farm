// src/components/layout/Header.js
import React from "react";
import "./Header.css";

function Header() {
  return (
    <header className="pf-header">
      <div className="pf-inner">
        <h1 className="pf-logo">
          <a href="/">
            <img src="./images/3kki_logo.png" alt="Play Farm 로고" />
          </a>
        </h1>

        <nav className="pf-nav">
          <a href="/">홈</a>
          <a href="/">이벤트</a>
          <a href="/">고객지원</a>
        </nav>

        <div className="pf-utils">
          <button className="pf-login-btn">login</button>
          <button className="pf-login-btn">siginup</button>
        </div>
      </div>
    </header>
  );
}

export default Header;
