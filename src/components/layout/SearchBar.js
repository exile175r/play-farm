// src/components/layout/SearchBar.js
import React, { useState, useEffect } from "react";
import "./SearchBar.css";
import { getAllPrograms, searchPrograms } from "../../services/programApi";
import { getImagePath } from "../../utils/imagePath";

function SearchBar({ setSearchData }) {
  const [page, setPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState("");

  // 전체 프로그램 목록 조회
  const fetchPrograms = async (pageNum = 1) => {
    try {
      const result = await getAllPrograms(pageNum, 20);
      if (result.success) {
        console.log(result.data);
      } else {
        console.error(result.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
    }
  };

  const handleSearch = async (e, pageNum = 1) => {
    // 프로그램 검색
    e.preventDefault();
    try {
      const result = await searchPrograms(searchKeyword, null, null, pageNum, 20);
      if (result.success) {
        console.log(result.data);
        setSearchData(result.data);
      } else {
        console.error(result.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPrograms(page);
  }, [page]);

  return (
    <section className="pf-search-section">
      <form className="pf-search-bar" action="/" method="get" onSubmit={handleSearch}>
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
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
        />
        <button type="submit" className="pf-search-btn">
          <img src={getImagePath("/icons/free-icon-font-search-3917132.png")} alt="검색" className="pf-search-img" />
        </button>
      </form>
    </section>
  );
}

export default SearchBar;
