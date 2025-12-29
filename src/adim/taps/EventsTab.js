// src/adim/taps/EventsTab.js
import React, { useEffect, useState } from "react";
import "./Tabs.css";
import AdminModal from "../components/AdminModal";
import { getAllEvents, deleteEvent, createEvent, updateEvent } from "../../services/adminApi";

const emptyForm = {
  title: "",
  startDate: "",
  endDate: "",
  status: "SCHEDULED",
  imageUrl: "",
};

function EventsTab() {
  // 상태
  const [events, setEvents] = useState([]);
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
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // 이벤트 목록 로드
  const loadEvents = async (page = 1) => {
    try {
      setError(null);
      const result = await getAllEvents({
        page,
        limit: 20,
        keyword: keyword.trim(),
        status: statusFilter,
      });

      if (result.success) {
        setEvents(result.data || []);
        setPagination(
          result.pagination || {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
          }
        );
        setCurrentPage(page);
      } else {
        setError(result.error?.message || "이벤트 목록을 불러오는데 실패했습니다.");
        setEvents([]);
      }
    } catch (err) {
      setError("이벤트 목록을 불러오는데 실패했습니다.");
      setEvents([]);
      console.error("이벤트 목록 로드 실패:", err);
    }
  };

  // 필터 변경 시 재로딩
  useEffect(() => {
    loadEvents(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // 검색 디바운스
  useEffect(() => {
    const timer = setTimeout(() => {
      loadEvents(1);
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  // 모달 열기/닫기
  const openCreateModal = () => {
    setEditingEvent(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview("");
    setIsModalOpen(true);
  };

  const openEditModal = (event) => {
    setEditingEvent(event);
    setForm({
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      status: event.status,
      imageUrl: event.imageUrl || event.image_url || "",
    });
    setImageFile(null);
    setImagePreview(event.imageUrl || event.image_url || "");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // 폼 입력
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

  // 저장 (생성/수정)
  const handleSubmit = async () => {
    if (!form.title.trim()) {
      alert("이벤트 제목을 입력해 주세요.");
      return;
    }
    if (!form.startDate || !form.endDate) {
      alert("이벤트 기간(시작일/종료일)을 입력해 주세요.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("startDate", form.startDate);
      formData.append("endDate", form.endDate);
      formData.append("status", form.status);

      if (imageFile) {
        formData.append("image", imageFile);
      }

      let result;
      if (editingEvent) {
        result = await updateEvent(editingEvent.id, formData);
      } else {
        result = await createEvent(formData);
      }

      if (result.success) {
        alert(editingEvent ? "이벤트가 수정되었습니다." : "이벤트가 등록되었습니다.");
        setIsModalOpen(false);
        loadEvents(currentPage);
      } else {
        alert(result.error?.message || "이벤트 저장에 실패했습니다.");
      }
    } catch (err) {
      console.error("이벤트 저장 실패:", err);
      alert("이벤트 저장 중 오류가 발생했습니다.");
    }
  };

  // 삭제
  const handleDelete = async (id) => {
    if (!window.confirm(`이벤트 ID ${id} 를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const result = await deleteEvent(id);
      if (result.success) {
        alert("이벤트가 삭제되었습니다.");
        loadEvents(currentPage);
      } else {
        alert(result.error?.message || "이벤트 삭제에 실패했습니다.");
      }
    } catch (err) {
      alert("이벤트 삭제 중 오류가 발생했습니다.");
      console.error("이벤트 삭제 실패:", err);
    }
  };

  // 페이지네이션
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadEvents(newPage);
    }
  };

  // 상태 뱃지
  const renderStatusBadge = (status) => {
    switch (status) {
      case "SCHEDULED":
        return <span className="badge badge-closed">진행 예정</span>;
      case "ONGOING":
        return <span className="badge badge-open">진행 중</span>;
      case "ENDED":
        return <span className="badge badge-closed">종료</span>;
      default:
        return <span className="badge badge-closed">기타</span>;
    }
  };

  // 렌더
  return (
    <div className="admin-section events">
      {/* 상단 */}
      <div className="admin-section-header">
        <div>
          <h2 className="admin-section-title">이벤트 관리</h2>
        </div>
        <button type="button" className="admin-primary-btn" onClick={openCreateModal}>
          + 새 이벤트 만들기
        </button>
      </div>

      {/* 필터 */}
      <div className="admin-filters">
        <div className="admin-filter-item">
          <label className="admin-filter-label">상태</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">전체</option>
            <option value="SCHEDULED">진행 예정</option>
            <option value="ONGOING">진행 중</option>
            <option value="ENDED">종료</option>
          </select>
        </div>

        <div className="admin-filter-item">
          <label className="admin-filter-label">검색</label>
          <input type="text" placeholder="이벤트명 검색" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "10px",
            color: "#b91c1c",
            marginBottom: "10px",
          }}
        >
          {error}
        </div>
      )}

      {/* 테이블 */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>이벤트ID</th>
              <th>제목</th>
              <th>기간</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={5} className="admin-table-empty">
                  {error ? "이벤트 목록을 불러올 수 없습니다." : "조건에 맞는 이벤트가 없습니다."}
                </td>
              </tr>
            ) : (
              events.map((e) => (
                <tr key={e.id}>
                  <td>{e.id}</td>
                  <td>{e.title}</td>
                  <td>{e.startDate ? `${e.startDate} ~ ${e.endDate || ""}` : "-"}</td>
                  <td>{renderStatusBadge(e.status)}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" className="admin-secondary-btn" onClick={() => openEditModal(e)}>
                        수정
                      </button>
                      <button type="button" className="admin-danger-btn" onClick={() => handleDelete(e.id)}>
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
          title={editingEvent ? "이벤트 수정" : "새 이벤트 만들기"}
          onClose={closeModal}
          onSubmit={handleSubmit}
          submitLabel={editingEvent ? "수정 완료" : "등록하기"}
        >
          <div className="admin-form-grid">
            <div className="admin-form-row">
              <label className="admin-form-label">이벤트 제목</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="예: 봄맞이 체험 할인 이벤트"
              />
            </div>

            <div className="admin-form-row admin-form-row-inline">
              <div>
                <label className="admin-form-label">시작일</label>
                <input type="date" name="startDate" value={form.startDate} onChange={handleChange} />
              </div>
              <div>
                <label className="admin-form-label">종료일</label>
                <input type="date" name="endDate" value={form.endDate} onChange={handleChange} />
              </div>
            </div>

            <div className="admin-form-row">
              <label className="admin-form-label">상태</label>
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="SCHEDULED">진행 예정</option>
                <option value="ONGOING">진행 중</option>
                <option value="ENDED">종료</option>
              </select>
            </div>

            <div className="admin-form-row">
              <label className="admin-form-label">대표 이미지</label>
              <input type="file" accept="image/*" onChange={handleImageChange} />
              {imagePreview && (
                <div style={{ marginTop: "8px" }}>
                  <img
                    src={imagePreview}
                    alt="이벤트 이미지 미리보기"
                    style={{ maxWidth: "240px", borderRadius: "8px" }}
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

export default EventsTab;
