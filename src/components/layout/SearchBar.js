// src/components/layout/SearchBar.js
import React from "react";
import "./SearchBar.css";

function SearchBar() {
  return (
    <section className="pf-search-section">
      <form className="pf-search-bar" action="/" method="get">
        {/* 왼쪽 드롭다운 */}
        <div className="pf-search-category">
          <select name="region">
            <option value="">지역 선택</option>
            <option value="suwon">수원</option>
            <option value="jeju">제주도</option>
            <option value="gangwon">강원도</option>
            <option value="gyeonggi">경기도</option>
          </select>
        </div>

        <input
          type="text"
          name="q"
          className="pf-search-input"
          placeholder="# 수원 # 제주도귤 #딸기농장 #고구마캐기 #체험농장"
        />
        <button type="submit" className="pf-search-btn">
          <img src="/icons/free-icon-font-search-3917132.png" alt="검색" className="pf-search-img" />
        </button>
      </form>
    </section>
  );
}

export default SearchBar;
