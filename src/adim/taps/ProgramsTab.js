// src/adim/taps/ProgramsTab.js
import React, { useEffect, useState } from "react";
import "./Tabs.css";
import AdminModal from "../components/AdminModal";
import { getAllPrograms, deleteProgram, createProgram, updateProgram } from "../../services/adminApi";

const emptyProgramForm = {
  title: "",
  category: "",
  price: "",
  startDate: "",
  endDate: "",
  status: "OPEN",
  imageUrl: "",
};

function ProgramsTab() {
  const [programs, setPrograms] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [form, setForm] = useState(emptyProgramForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // 프로그램 목록 로드
  const loadPrograms = async (page = 1) => {
    try {
      setError(null);
      const result = await getAllPrograms({
        page,
        limit: 10,
        keyword: keyword.trim(),
        status: statusFilter,
      });

      if (result.success) {
        const replaceText = { 체험: " 체험", 및: " 및 " };
        setPrograms(
          result.data
            .map((item) => {
              const newItem = { ...item };
              try {
                if (typeof newItem.title === "string" && newItem.title.includes(" 체험")) {
                  return newItem;
                }
                newItem.title = JSON.parse(newItem.title)
                  .map((v) => v.replace(/체험|및/g, (match) => replaceText[match] || match))
                  .join(", ");
              } catch (error) {
                if (typeof newItem.title === "string" && !newItem.title.includes(" 체험")) {
                  newItem.title = newItem.title.replace(/체험|및/g, (match) => replaceText[match] || match);
                }
              }
              return newItem;
            })
            .sort((a, b) => b.id - a.id)
        );
        setPagination(result.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
        setCurrentPage(page);
      } else {
        setError(result.error?.message || "프로그램 목록을 불러오는데 실패했습니다.");
        setPrograms([]);
      }
    } catch (err) {
      setError("프로그램 목록을 불러오는데 실패했습니다.");
      setPrograms([]);
      console.error("프로그램 목록 로드 실패:", err);
    }
  };

  // 초기 로딩 및 필터 변경 시 재로딩
  useEffect(() => {
    loadPrograms(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // 검색어 변경 시 디바운스 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPrograms(1);
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  const openCreateModal = () => {
    setEditingProgram(null);
    setForm(emptyProgramForm);
    setImageFile(null);
    setImagePreview("");
    setIsModalOpen(true);
  };

  const openEditModal = (program) => {
    setEditingProgram(program);
    setForm({
      title: program.title || "",
      category: program.category || "",
      price: String(program.price ?? ""),
      startDate: program.startDate || "",
      endDate: program.endDate || "",
      status: program.status || "OPEN",
      imageUrl: program.imageUrl || "",
    });
    setImageFile(null);
    setImagePreview(program.imageUrl || "");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleFormChange = (e) => {
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

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      alert("체험명을 입력해 주세요.");
      return;
    }

    const priceNumber = form.price ? Number(form.price) : 0;
    if (form.price && (Number.isNaN(priceNumber) || priceNumber < 0)) {
      alert("가격은 0 이상의 숫자로 입력해 주세요.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("category", form.category.trim());
      formData.append("price", priceNumber);
      formData.append("startDate", form.startDate || "");
      formData.append("endDate", form.endDate || "");
      formData.append("status", form.status);

      if (imageFile) {
        formData.append("image", imageFile); // 서버 multer에서 single('image')
      }

      let result;
      if (editingProgram) {
        result = await updateProgram(editingProgram.id, formData);
      } else {
        result = await createProgram(formData);
      }

      if (result.success) {
        alert(editingProgram ? "체험이 수정되었습니다." : "새 체험이 등록되었습니다.");
        setIsModalOpen(false);
        loadPrograms(currentPage);
      } else {
        alert(result.error?.message || "체험 저장에 실패했습니다.");
      }
    } catch (err) {
      console.error("체험 저장 실패:", err);
      alert("체험 저장 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`체험 ID ${id} 를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const result = await deleteProgram(id);
      if (result.success) {
        alert("체험이 삭제되었습니다.");
        loadPrograms(currentPage);
      } else {
        alert(result.error?.message || "체험 삭제에 실패했습니다.");
      }
    } catch (err) {
      alert("체험 삭제 중 오류가 발생했습니다.");
      console.error("체험 삭제 실패:", err);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadPrograms(newPage);
    }
  };

  return (
    <div className="admin-section">
      {/* 상단 타이틀 + 버튼 */}
      <div className="admin-section-header">
        <div>
          <h2 className="admin-section-title">체험 관리</h2>
        </div>

        <button type="button" className="admin-primary-btn" onClick={openCreateModal}>
          + 새 체험 만들기
        </button>
      </div>

      {/* 필터 영역 */}
      <div className="admin-filters">
        <div className="admin-filter-item">
          <label className="admin-filter-label">상태</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">전체</option>
            <option value="OPEN">모집중 (OPEN)</option>
            <option value="CLOSED">종료 (CLOSED)</option>
          </select>
        </div>

        <div className="admin-filter-item">
          <label className="admin-filter-label">검색</label>
          <input
            type="text"
            placeholder="제목, 카테고리 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
      </div>

      {error && <div style={{ padding: "10px", color: "#b91c1c", marginBottom: "10px" }}>{error}</div>}

      {/* 테이블 */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>체험명</th>
              <th>카테고리</th>
              <th>기간</th>
              <th>가격</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {programs.length === 0 ? (
              <tr>
                <td colSpan={7} className="admin-table-empty">
                  {error ? "프로그램 목록을 불러올 수 없습니다." : "조건에 맞는 체험이 없습니다."}
                </td>
              </tr>
            ) : (
              programs.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.title}</td>
                  <td>{p.category}</td>
                  <td>{p.startDate ? `${p.startDate} ~ ${p.endDate || ""}` : "-"}</td>
                  <td>{p.price ? `${p.price.toLocaleString()}원` : "-"}</td>
                  <td>
                    {p.status === "OPEN" ? (
                      <span className="badge badge-open">OPEN</span>
                    ) : (
                      <span className="badge badge-closed">CLOSED</span>
                    )}
                  </td>
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

      {/* 새 체험 / 수정 모달 */}
      {isModalOpen && (
        <AdminModal
          title={editingProgram ? "체험 수정" : "새 체험 만들기"}
          onClose={closeModal}
          onSubmit={handleSubmit}
          submitLabel={editingProgram ? "수정 완료" : "등록하기"}
        >
          <div className="admin-form-grid">
            <div className="admin-form-row">
              <label className="admin-form-label">체험명</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleFormChange}
                placeholder="예: 딸기 수확 체험"
              />
            </div>

            <div className="admin-form-row">
              <label className="admin-form-label">카테고리</label>
              <input
                type="text"
                name="category"
                value={form.category}
                onChange={handleFormChange}
                placeholder="예: 가족, 주말, 농장 등"
              />
            </div>

            <div className="admin-form-row admin-form-row-inline">
              <div>
                <label className="admin-form-label">시작일</label>
                <input type="date" name="startDate" value={form.startDate} onChange={handleFormChange} />
              </div>
              <div>
                <label className="admin-form-label">종료일</label>
                <input type="date" name="endDate" value={form.endDate} onChange={handleFormChange} />
              </div>
            </div>

            <div className="admin-form-row">
              <label className="admin-form-label">가격(원)</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleFormChange}
                placeholder="예: 15000"
                min="0"
              />
            </div>

            <div className="admin-form-row">
              <label className="admin-form-label">상태</label>
              <select name="status" value={form.status} onChange={handleFormChange}>
                <option value="OPEN">모집중 (OPEN)</option>
                <option value="CLOSED">종료 (CLOSED)</option>
              </select>
            </div>

            <div className="admin-form-row">
              <label className="admin-form-label">대표 이미지</label>
              <input type="file" accept="image/*" onChange={handleImageChange} />
              {imagePreview && (
                <div style={{ marginTop: "8px" }}>
                  <img
                    src={imagePreview}
                    alt="체험 이미지 미리보기"
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

export default ProgramsTab;
