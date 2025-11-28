import React from "react";
import "./Header.css";
import { getImagePath } from "../../utils/imagePath";

function Header() {
  return (
    <header className="pf-header">
      <div className="pf-inner">
        <h1 className="pf-logo">
          <a href="/">
            <img src={getImagePath("/logos/textlogo.png")} alt="logo" />
          </a>
        </h1>

        <nav className="pf-nav">
          <a href="/">홈</a>
          <a href="/">이벤트</a>
          <a href="/">고객지원</a>
        </nav>

        <div className="pf-utils">
          <button className="pf-login-btn">login</button>
          <button className="pf-login-btn">signup</button>
        </div>
      </div>
    </header>
  );
}

export default Header;
