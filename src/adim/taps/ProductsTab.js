// src/adim/taps/ProductsTab.js
import React, { useEffect, useState } from "react";
import "./Tabs.css";
import AdminModal from "../components/AdminModal";
import {
  getAllProducts,
  deleteProduct,
  createProduct, // ✅ 추가
  updateProduct, // ✅ 추가
} from "../../services/adminApi";

const emptyForm = {
  name: "",
  stock: "",
  price: "",
  status: "ACTIVE",
  imageUrl: "", // 서버에서 기존 이미지 보여줄 때용 (수정 모드)
};

function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null); // ✅ 새로 추가 (업로드용 파일)
  const [imagePreview, setImagePreview] = useState(""); // ✅ 미리보기 (선택 사항)

  // 상품 목록 로드
  const loadProducts = async (page = 1) => {
    try {
      setError(null);
      const result = await getAllProducts({
        page,
        limit: 20,
        keyword: keyword.trim(),
        status: statusFilter,
      });

      if (result.success) {
        setProducts(result.data || []);
        setPagination(result.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
        setCurrentPage(page);
      } else {
        setError(result.error?.message || "상품 목록을 불러오는데 실패했습니다.");
        setProducts([]);
      }
    } catch (err) {
      setError("상품 목록을 불러오는데 실패했습니다.");
      setProducts([]);
      console.error("상품 목록 로드 실패:", err);
    }
  };

  // 초기 로딩 및 필터 변경 시 재로딩
  useEffect(() => {
    loadProducts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // 검색어 변경 시 디바운스 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts(1);
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  // ===== 모달 열기/닫기 =====
  const openCreateModal = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview("");
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name || "",
      stock: String(product.stock ?? ""),
      price: String(product.price ?? ""),
      status: product.status || "ACTIVE",
      imageUrl: product.imageUrl || "",
    });
    setImageFile(null);
    setImagePreview(product.imageUrl || "");
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

  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // ===== 저장 (생성/수정 공통) =====
  const handleSubmit = async () => {
    if (!form.name.trim()) {
      alert("상품명을 입력해 주세요.");
      return;
    }

    const stockNumber = Number(form.stock);
    if (Number.isNaN(stockNumber) || stockNumber < 0) {
      alert("재고는 0 이상의 숫자로 입력해 주세요.");
      return;
    }

    const priceNumber = Number(form.price);
    if (Number.isNaN(priceNumber) || priceNumber < 0) {
      alert("가격은 0 이상의 숫자로 입력해 주세요.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("stock", stockNumber);
      formData.append("price", priceNumber);
      formData.append("status", form.status);

      if (imageFile) {
        formData.append("image", imageFile); // 서버 multer에서 single('image') 사용
      }

      let result;
      if (editingProduct) {
        // 수정
        result = await updateProduct(editingProduct.id, formData);
      } else {
        // 생성
        result = await createProduct(formData);
      }

      if (result.success) {
        alert(editingProduct ? "상품이 수정되었습니다." : "상품이 등록되었습니다.");
        setIsModalOpen(false);
        loadProducts(currentPage);
      } else {
        alert(result.error?.message || "상품 저장에 실패했습니다.");
      }
    } catch (err) {
      console.error("상품 저장 실패:", err);
      alert("상품 저장 중 오류가 발생했습니다.");
    }
  };

  // ===== 삭제 =====
  const handleDelete = async (id) => {
    if (!window.confirm(`상품 ID ${id} 를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const result = await deleteProduct(id);
      if (result.success) {
        alert("상품이 삭제되었습니다.");
        loadProducts(currentPage);
      } else {
        alert(result.error?.message || "상품 삭제에 실패했습니다.");
      }
    } catch (err) {
      alert("상품 삭제 중 오류가 발생했습니다.");
      console.error("상품 삭제 실패:", err);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadProducts(newPage);
    }
  };

  const renderStatusBadge = (status) => {
    if (status === "ACTIVE") {
      return <span className="badge badge-open">판매중</span>;
    }
    if (status === "SOLD_OUT") {
      return <span className="badge badge-closed">품절</span>;
    }
    if (status === "INACTIVE") {
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
          <input type="text" placeholder="상품명 검색" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        </div>
      </div>

      {error && <div style={{ padding: "10px", color: "#b91c1c", marginBottom: "10px" }}>{error}</div>}

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
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="admin-table-empty">
                  {error ? "상품 목록을 불러올 수 없습니다." : "조건에 맞는 상품이 없습니다."}
                </td>
              </tr>
            ) : (
              products.map((p) => (
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

      {/* 페이지네이션 */}
      {pagination.totalPages > 1 && (
        <div
          style={{
            marginTop: "20px",
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            className="admin-secondary-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            이전
          </button>
          <span>
            {currentPage} / {pagination.totalPages} (총 {pagination.total}건)
          </span>
          <button
            type="button"
            className="admin-secondary-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pagination.totalPages}
          >
            다음
          </button>
        </div>
      )}

      {/* 모달 */}
      {isModalOpen && (
        <AdminModal
          title={editingProduct ? "상품 수정" : "새 상품 만들기"}
          onClose={closeModal}
          onSubmit={handleSubmit}
          submitLabel={editingProduct ? "수정 완료" : "등록하기"}
        >
          <div className="admin-form-grid">
            <div className="admin-form-row">
              <label className="admin-form-label">상품명</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="예: 유기농 감자 5kg"
              />
            </div>

            {/* ✅ 카테고리 입력 제거됨 */}

            <div className="admin-form-row admin-form-row-inline">
              <div>
                <label className="admin-form-label">재고</label>
                <input
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={handleChange}
                  placeholder="예: 100"
                  min="0"
                />
              </div>
              <div>
                <label className="admin-form-label">가격(원)</label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="예: 26000"
                  min="0"
                />
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

            {/* ✅ 이미지 업로드 */}
            <div className="admin-form-row">
              <label className="admin-form-label">대표 이미지</label>
              <input type="file" accept="image/*" onChange={handleImageChange} />
              {imagePreview && (
                <div style={{ marginTop: "8px" }}>
                  <img
                    src={imagePreview}
                    alt="상품 이미지 미리보기"
                    style={{ maxWidth: "200px", borderRadius: "8px" }}
                  />
                </div>
              )}
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}

export default ProductsTab;
