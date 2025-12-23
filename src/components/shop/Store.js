// src/components/shop/Store.js
import { useMemo, useState } from 'react';
import './Store.css';

import shopData from '../data/StoreData';
import ShopSearchBar from './ShopSearchBar';

function Store() {
   const products = shopData;

   // ✅ 검색은 "확정값"만 필터에 사용
   const [appliedKeyword, setAppliedKeyword] = useState('');

   // ✅ 필터/정렬 상태
   const [category, setCategory] = useState('전체');
   const [sort, setSort] = useState('recommend'); // recommend | priceAsc | priceDesc | nameAsc

   // ✅ 카테고리 자동 생성 (데이터 기반)
   const categories = useMemo(() => {
      const set = new Set(products.map((p) => p.category).filter(Boolean));
      return ['전체', ...Array.from(set)];
   }, [products]);

   const filteredProducts = useMemo(() => {
      const k = (appliedKeyword ?? '').trim().toLowerCase();
      const isAll = category === '전체';

      let list = products.filter((item) => {
         const matchCategory = isAll ? true : item.category === category;
         if (!matchCategory) return false;

         if (!k) return true;

         // name + desc + category까지 검색되게
         const hay = `${item.name ?? ''} ${item.desc ?? ''} ${item.category ?? ''}`.toLowerCase();
         return hay.includes(k);
      });

      // 정렬
      if (sort === 'priceAsc') list.sort((a, b) => Number(a.price) - Number(b.price));
      if (sort === 'priceDesc') list.sort((a, b) => Number(b.price) - Number(a.price));
      if (sort === 'nameAsc') list.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'ko'));

      return list;
   }, [products, appliedKeyword, category, sort]);

   const resetFilters = () => {
      setAppliedKeyword('');
      setCategory('전체');
      setSort('recommend');
   };

   // 이미지 필드 여러 케이스 대응
   const getThumb = (item) => item.image || item.img || item.thumbnail || item.thumb || '';

   return (
      <section className="pf-page store-wrap">
         <div className="pf-container store-inner">
            <header className="pf-head store-head">
               <h2 className="store-title">스토어</h2>
               <div className="pf-divider store-divider" />
            </header>

            {/* ✅ List 검색창과 같은 룩으로 통일된 ShopSearchBar */}
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

            <div className="list-grid store-grid">
               {filteredProducts.length === 0 ? (
                  <div className="store-empty">검색 결과가 없습니다.</div>
               ) : (
                  filteredProducts.map((item) => {
                     const thumb = getThumb(item);

                     return (
                        <div key={item.id} className="list-card store-card">
                           <div className="list-card-img store-card-img">
                              {thumb ? (
                                 <img
                                    src={thumb}
                                    alt={item.name}
                                    loading="lazy"
                                    onError={(e) => {
                                       e.currentTarget.style.display = 'none';
                                    }}
                                 />
                              ) : (
                                 <div className="shop-card-img-fallback" />
                              )}
                           </div>

                           <div className="list-card-body store-card-body">
                              <h3 className="list-item-title store-item-title">{item.name}</h3>
                              {item.desc ? <p className="list-sub store-sub">{item.desc}</p> : null}
                              <p className="store-price">{Number(item.price).toLocaleString()}원</p>
                           </div>
                        </div>
                     );
                  })
               )}
            </div>
         </div>
      </section>
   );
}

export default Store;
