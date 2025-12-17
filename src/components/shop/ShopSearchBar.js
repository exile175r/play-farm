import { useState } from "react";
import "./ShopSearchBar.css";

function ShopSearchBar({
  categories,
  category,
  onCategoryChange,
  sort,
  onSortChange,
  onSearch,
  onReset,
  resultCount,
  appliedKeyword,
}) {
  // ✅ 입력 중 값(타이핑) / 적용 값(appliedKeyword)은 분리
  const [inputKeyword, setInputKeyword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(inputKeyword.trim()); // ✅ 여기서만 검색 확정
  };

  const handleReset = () => {
    setInputKeyword("");
    onReset();
  };

  return (
    <section className="shop-controls">
      {/* 검색 */}
      <form className="shop-search" onSubmit={handleSubmit}>
        <input
          className="shop-search-input"
          value={inputKeyword}
          onChange={(e) => setInputKeyword(e.target.value)}
          placeholder="상품명/설명/카테고리 검색"
        />
        <button className="shop-search-btn" type="submit">
          검색
        </button>
      </form>

      {/* 필터/정렬/초기화 */}
      <div className="shop-filter-row">
        <div className="shop-field">
          <span className="shop-label">카테고리</span>
          <div className="shop-seg">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                className={`shop-seg-btn ${category === c ? "is-active" : ""}`}
                onClick={() => onCategoryChange(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="shop-field">
          <span className="shop-label">정렬</span>
          <select className="shop-select" value={sort} onChange={(e) => onSortChange(e.target.value)}>
            <option value="recommend">추천순</option>
            <option value="priceAsc">낮은가격</option>
            <option value="priceDesc">높은가격</option>
            <option value="nameAsc">이름순</option>
          </select>
        </div>

        <button type="button" className="shop-reset" onClick={handleReset}>
          필터 초기화
        </button>
      </div>

      {/* 결과 메타 */}
      <div className="shop-result-meta">
        <span>
          총 <b>{resultCount}</b>개
        </span>
        {appliedKeyword ? (
          <span className="shop-meta-muted">
            적용 검색어: <b>{appliedKeyword}</b>
          </span>
        ) : null}
      </div>
    </section>
  );
}

export default ShopSearchBar;
