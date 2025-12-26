// src/adim/taps/ProductsTab.js
import React, { useMemo, useState } from 'react';
import './Tabs.css';
import AdminModal from '../components/AdminModal';

const INITIAL_PRODUCTS = [
   {
      id: 1,
      name: '유기농 감자 5kg',
      category: '채소',
      stock: 120,
      price: 26000,
      status: 'ACTIVE', // ACTIVE | INACTIVE | SOLD_OUT
   },
   {
      id: 2,
      name: '제주 감귤 3kg',
      category: '과일',
      stock: 0,
      price: 18000,
      status: 'SOLD_OUT',
   },
   {
      id: 3,
      name: '현미 10kg',
      category: '곡물',
      stock: 45,
      price: 33000,
      status: 'ACTIVE',
   },
   {
      id: 4,
      name: '건조 아몬드 500g',
      category: '견과류',
      stock: 10,
      price: 15000,
      status: 'INACTIVE',
   },
];

const emptyForm = {
   name: '',
   category: '',
   stock: '',
   price: '',
   status: 'ACTIVE',
};

function ProductsTab() {
   const [products, setProducts] = useState(INITIAL_PRODUCTS);
   const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | ACTIVE | INACTIVE | SOLD_OUT
   const [keyword, setKeyword] = useState('');

   const [isModalOpen, setIsModalOpen] = useState(false);
   const [editingProduct, setEditingProduct] = useState(null);
   const [form, setForm] = useState(emptyForm);

   const filteredProducts = useMemo(() => {
      return products.filter((p) => {
         if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;

         if (!keyword.trim()) return true;
         const q = keyword.trim().toLowerCase();
         return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      });
   }, [products, statusFilter, keyword]);

   // ===== 모달 열기/닫기 =====
   const openCreateModal = () => {
      setEditingProduct(null);
      setForm(emptyForm);
      setIsModalOpen(true);
   };

   const openEditModal = (product) => {
      setEditingProduct(product);
      setForm({
         name: product.name,
         category: product.category,
         stock: String(product.stock),
         price: String(product.price),
         status: product.status,
      });
      setIsModalOpen(true);
   };

   const closeModal = () => {
      setIsModalOpen(false);
   };

   // ===== 폼 입력 =====
   const handleChange = (e) => {
      const { name, value } = e.target;
      setForm((prev) => ({
         ...prev,
         [name]: value,
      }));
   };

   // ===== 저장 (생성/수정 공통) =====
   const handleSubmit = () => {
      if (!form.name.trim()) {
         alert('상품명을 입력해 주세요.');
         return;
      }
      if (!form.category.trim()) {
         alert('카테고리를 입력해 주세요.');
         return;
      }

      const stockNumber = Number(form.stock);
      if (Number.isNaN(stockNumber) || stockNumber < 0) {
         alert('재고는 0 이상의 숫자로 입력해 주세요.');
         return;
      }

      const priceNumber = Number(form.price);
      if (Number.isNaN(priceNumber) || priceNumber < 0) {
         alert('가격은 0 이상의 숫자로 입력해 주세요.');
         return;
      }

      // 수정 모드
      if (editingProduct) {
         setProducts((prev) =>
            prev.map((p) =>
               p.id === editingProduct.id
                  ? {
                       ...p,
                       name: form.name.trim(),
                       category: form.category.trim(),
                       stock: stockNumber,
                       price: priceNumber,
                       status: form.status,
                    }
                  : p
            )
         );
         alert('상품 정보가 수정되었습니다. (지금은 메모리 상에서만 적용)');
      } else {
         // 생성 모드
         const maxId = products.reduce((max, p) => Math.max(max, p.id), 0);
         const newProduct = {
            id: maxId + 1,
            name: form.name.trim(),
            category: form.category.trim(),
            stock: stockNumber,
            price: priceNumber,
            status: form.status,
         };
         setProducts((prev) => [...prev, newProduct]);
         alert('새 상품이 추가되었습니다. (지금은 메모리 상에서만 적용)');
      }

      setIsModalOpen(false);
   };

   // ===== 삭제 =====
   const handleDelete = (id) => {
      if (window.confirm(`상품 ID ${id} 를 삭제하시겠습니까?`)) {
         setProducts((prev) => prev.filter((p) => p.id !== id));
         alert('현재는 메모리 상에서만 삭제되었습니다.');
      }
   };

   const renderStatusBadge = (status) => {
      if (status === 'ACTIVE') {
         return <span className="badge badge-open">판매중</span>;
      }
      if (status === 'SOLD_OUT') {
         return <span className="badge badge-closed">품절</span>;
      }
      if (status === 'INACTIVE') {
         return <span className="badge badge-closed">비노출</span>;
      }
      return <span className="badge badge-closed">기타</span>;
   };

   return (
      <div className="admin-section">
         {/* 상단 영역 */}
         <div className="admin-section-header">
            <div>
               <h2 className="admin-section-title">상품 관리</h2>
            </div>
            <button type="button" className="admin-primary-btn" onClick={openCreateModal}>
               + 새 상품 만들기
            </button>
         </div>

         {/* 필터 */}
         <div className="admin-filters">
            <div className="admin-filter-item">
               <label className="admin-filter-label">상태</label>
               <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="ALL">전체</option>
                  <option value="ACTIVE">판매중</option>
                  <option value="SOLD_OUT">품절</option>
                  <option value="INACTIVE">비노출</option>
               </select>
            </div>

            <div className="admin-filter-item">
               <label className="admin-filter-label">검색</label>
               <input type="text" placeholder="상품명, 카테고리 검색" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>
         </div>

         {/* 테이블 */}
         <div className="admin-table-wrapper">
            <table className="admin-table">
               <thead>
                  <tr>
                     <th>상품ID</th>
                     <th>상품명</th>
                     <th>카테고리</th>
                     <th>재고</th>
                     <th>가격</th>
                     <th>상태</th>
                     <th>관리</th>
                  </tr>
               </thead>
               <tbody>
                  {filteredProducts.length === 0 ? (
                     <tr>
                        <td colSpan={7} className="admin-table-empty">
                           조건에 맞는 상품이 없습니다.
                        </td>
                     </tr>
                  ) : (
                     filteredProducts.map((p) => (
                        <tr key={p.id}>
                           <td>{p.id}</td>
                           <td>{p.name}</td>
                           <td>{p.category}</td>
                           <td>{p.stock}</td>
                           <td>{p.price.toLocaleString()}원</td>
                           <td>{renderStatusBadge(p.status)}</td>
                           <td>
                              <div className="admin-row-actions">
                                 <button type="button" className="admin-secondary-btn" onClick={() => openEditModal(p)}>
                                    수정
                                 </button>
                                 <button type="button" className="admin-danger-btn" onClick={() => handleDelete(p.id)}>
                                    삭제
                                 </button>
                              </div>
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>

         {/* 모달 */}
         {isModalOpen && (
            <AdminModal
               title={editingProduct ? '상품 수정' : '새 상품 만들기'}
               onClose={closeModal}
               onSubmit={handleSubmit}
               submitLabel={editingProduct ? '수정 완료' : '등록하기'}>
               <div className="admin-form-grid">
                  <div className="admin-form-row">
                     <label className="admin-form-label">상품명</label>
                     <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="예: 유기농 감자 5kg" />
                  </div>

                  <div className="admin-form-row">
                     <label className="admin-form-label">카테고리</label>
                     <input type="text" name="category" value={form.category} onChange={handleChange} placeholder="예: 채소, 과일, 곡물 등" />
                  </div>

                  <div className="admin-form-row admin-form-row-inline">
                     <div>
                        <label className="admin-form-label">재고</label>
                        <input type="number" name="stock" value={form.stock} onChange={handleChange} placeholder="예: 100" min="0" />
                     </div>
                     <div>
                        <label className="admin-form-label">가격(원)</label>
                        <input type="number" name="price" value={form.price} onChange={handleChange} placeholder="예: 26000" min="0" />
                     </div>
                  </div>

                  <div className="admin-form-row">
                     <label className="admin-form-label">상태</label>
                     <select name="status" value={form.status} onChange={handleChange}>
                        <option value="ACTIVE">판매중</option>
                        <option value="SOLD_OUT">품절</option>
                        <option value="INACTIVE">비노출</option>
                     </select>
                  </div>
               </div>
            </AdminModal>
         )}
      </div>
   );
}

export default ProductsTab;
