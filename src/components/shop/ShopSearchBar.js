import { useState } from 'react';
import './ShopSearchBar.css';

function ShopSearchBar({ onSearch }) {
   const [inputKeyword, setInputKeyword] = useState('');
   const [productType, setProductType] = useState(''); // ✅ 상품 선택

   const handleSubmit = (e) => {
      e.preventDefault();
      onSearch({
         keyword: inputKeyword.trim(),
         type: productType, // fruit | vegetable
      });
   };

   return (
      <section className="pf-search-section">
         <form className="pf-search-bar" onSubmit={handleSubmit}>
            <div className="pf-search-row">
               {/* ✅ SearchBar의 지역선택 자리 → 상품선택 */}
               <div className="pf-search-category">
                  <select name="productType" value={productType} onChange={(e) => setProductType(e.target.value)}>
                     <option value="">상품 선택</option>
                     <option value="fruit">과일</option>
                     <option value="vegetable">야채소</option>
                  </select>
               </div>

               <input type="text" className="pf-search-input" value={inputKeyword} onChange={(e) => setInputKeyword(e.target.value)} placeholder="상품명을 입력해주세요." />

               <button className="pf-search-btn" type="submit">
                  검색
               </button>
            </div>
         </form>
      </section>
   );
}

export default ShopSearchBar;
