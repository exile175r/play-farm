// src/components/layout/SearchBar.js
import React, { useState, useEffect } from 'react';
import './SearchBar.css';
import { getAllPrograms, searchPrograms } from '../../services/programApi';
import { getImagePath } from '../../utils/imagePath';

function SearchBar({ setSearchData }) {
   const [page, setPage] = useState(1);
   const [searchKeyword, setSearchKeyword] = useState('');
   const [region, setRegion] = useState(''); // ✅ 추가: 지역 state

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
         const regionParam = region ? region : null; // ✅ 추가: 지역값 전달(없으면 null)

         const result = await searchPrograms(searchKeyword, regionParam, null, pageNum, 20); // ✅ 수정: null -> regionParam
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
      // <section className="pf-search-section">
      //    <form className="pf-search-bar" action="/" method="get" onSubmit={handleSearch}>
      //       {/* 왼쪽 드롭다운 */}
      //       <div className="pf-search-category">
      //          <select name="region">
      //             <option value="">지역 선택</option>
      //             <option value="suwon">수원</option>
      //             <option value="jeju">제주도</option>
      //             <option value="gangwon">강원도</option>
      //             <option value="gyeonggi">경기도</option>
      //          </select>
      //       </div>

      //       <input
      //          type="text"
      //          name="q"
      //          className="pf-search-input"
      //          placeholder="# 수원 # 제주도귤 #딸기농장 #고구마캐기 #체험농장"
      //          value={searchKeyword}
      //          onChange={(e) => setSearchKeyword(e.target.value)}
      //       />
      //       <button type="submit" className="pf-search-btn">
      //          <img src={getImagePath('/icons/free-icon-font-search-3917132.png')} alt="검색" className="pf-search-img" />
      //       </button>
      //    </form>
      // </section>

      <section className="pf-search-section">
         {/* ✅ 수정: form으로 바꿔서 Enter/Submit 동작하게 */}
         <form className="pf-search-bar" onSubmit={handleSearch}>
            <div className="pf-search-row">
               <div className="pf-search-category">
                  {/* ✅ 수정: value/onChange로 region state 연결 */}
                  <select name="region" value={region} onChange={(e) => setRegion(e.target.value)}>
                     <option value="">지역 선택</option>
                     <option value="suwon">수원</option>
                     <option value="jeju">제주도</option>
                     <option value="gangwon">강원도</option>
                     <option value="gyeonggi">경기도</option>{' '}
                  </select>
               </div>

               {/* ✅ 수정: value/onChange로 searchKeyword state 연결 */}
               <input
                  type="text"
                  name="q"
                  className="pf-search-input"
                  placeholder="검색어를 입력해주세요."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
               />

               {/* ✅ 수정: submit으로 바꿔야 onSubmit 실행됨 */}
               <button className="pf-search-btn" type="submit">
                  검색
               </button>
            </div>

            {/* 여기 아래에 필터 row 같은거 붙일거면 추가 가능 */}
         </form>
      </section>
   );
}

export default SearchBar;
