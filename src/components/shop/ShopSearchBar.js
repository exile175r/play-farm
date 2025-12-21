import React, { useEffect, useState } from "react";
import "./ShopSearchBar.css";

function ShopSearchBar({
  categories = [],
  category,
  onCategoryChange,
  onSearch,
  onReset,
  resultCount,
  appliedKeyword,
}) {
  const [keyword, setKeyword] = useState(appliedKeyword ?? "");

  useEffect(() => {
    setKeyword(appliedKeyword ?? "");
  }, [appliedKeyword]);

  const submit = (e) => {
    e.preventDefault();
    onSearch?.(keyword);
  };

  const reset = () => {
    setKeyword("");
    onReset?.();
  };

  return (
    <form className="shop-searchbar" onSubmit={submit}>
      {/* ✅ 카테고리 셀렉트 (1개만) */}
      <select value={category} onChange={(e) => onCategoryChange(e.target.value)}>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <input type="search" placeholder="상품 검색" value={keyword} onChange={(e) => setKeyword(e.target.value)} />

      <button type="submit">검색</button>
      <button type="button" className="is-ghost" onClick={reset}>
        초기화
      </button>
    </form>
  );
}

export default ShopSearchBar;
