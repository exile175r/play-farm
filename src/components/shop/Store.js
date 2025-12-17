import { useMemo, useState } from "react";
import "./Store.css";

import shopData from "./ShopData";
import ShopSearchBar from "./ShopSearchBar";

function Store() {
  const products = shopData;

  // ✅ 검색은 "확정값"만 필터에 사용
  const [appliedKeyword, setAppliedKeyword] = useState("");

  // ✅ 필터/정렬 상태
  const [category, setCategory] = useState("전체");
  const [sort, setSort] = useState("recommend"); // recommend | priceAsc | priceDesc | nameAsc

  // ✅ 카테고리 자동 생성 (데이터 기반)
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ["전체", ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const k = (appliedKeyword ?? "").trim().toLowerCase();
    const isAll = category === "전체";

    let list = products.filter((item) => {
      const matchCategory = isAll ? true : item.category === category;
      if (!matchCategory) return false;

      if (!k) return true;

      // name + desc + category까지 검색되게(포폴 체감 좋음)
      const hay = `${item.name ?? ""} ${item.desc ?? ""} ${item.category ?? ""}`.toLowerCase();
      return hay.includes(k);
    });

    // 정렬
    if (sort === "priceAsc") list.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === "priceDesc") list.sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === "nameAsc") list.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "ko"));

    return list;
  }, [products, appliedKeyword, category, sort]);

  const resetFilters = () => {
    setAppliedKeyword("");
    setCategory("전체");
    setSort("recommend");
  };

  // 이미지 필드 여러 케이스 대응
  const getThumb = (item) => item.image || item.img || item.thumbnail || item.thumb || "";

  return (
    <main className="shop-page">
      <div className="shop-inner">
        {/* ✅ “처음 디자인” 느낌: 검색 + 필터 + 정렬 + 초기화 한 덩어리 */}
        <ShopSearchBar
          categories={categories}
          category={category}
          onCategoryChange={setCategory}
          sort={sort}
          onSortChange={setSort}
          onSearch={setAppliedKeyword}
          onReset={resetFilters}
          resultCount={filteredProducts.length}
          appliedKeyword={appliedKeyword}
        />

        <section className="shop-grid">
          {filteredProducts.length === 0 ? (
            <div className="shop-empty">검색 결과가 없습니다.</div>
          ) : (
            filteredProducts.map((item) => {
              const thumb = getThumb(item);

              return (
                <div key={item.id} className="shop-card">
                  <div className="shop-card-img">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={item.name}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="shop-card-img-fallback" />
                    )}
                  </div>

                  <div className="shop-card-body">
                    <h3 className="shop-card-title">{item.name}</h3>
                    {item.desc ? <p className="shop-card-desc">{item.desc}</p> : null}
                    <p className="shop-card-price">{Number(item.price).toLocaleString()}원</p>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}

export default Store;
