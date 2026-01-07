// src/adim/taps/NoticesTab.js
import React, { useEffect, useState } from "react";
import "./Tabs.css";
import AdminModal from "../components/AdminModal";
import { getAllNotices, createNotice, updateNotice, deleteNotice } from "../../services/noticeApi";

const emptyForm = {
    title: "",
    content: "",
    is_important: false,
};

function NoticesTab() {
    const [notices, setNotices] = useState([]);
    const [keyword, setKeyword] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [error, setError] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNotice, setEditingNotice] = useState(null);
    const [form, setForm] = useState(emptyForm);

    const loadNotices = async (pageNum = 1) => {
        try {
            const result = await getAllNotices({ page: pageNum, limit: 10, keyword });
            if (result.success) {
                setNotices(result.data);
                setTotalPages(result.pagination.totalPages);
                setPage(pageNum);
            } else {
                setError(result.message);
            }
        } catch (err) {
            console.error("공지사항 로드 실패:", err);
            setError("공지사항을 불러오는데 실패했습니다.");
        }
    };

    useEffect(() => {
        loadNotices(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = () => {
        loadNotices(1);
    };

    const openCreateModal = () => {
        setEditingNotice(null);
        setForm(emptyForm);
        setIsModalOpen(true);
    };

    const openEditModal = (notice) => {
        setEditingNotice(notice);
        setForm({
            title: notice.title,
            content: notice.content,
            is_important: !!notice.is_important,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async () => {
        if (!form.title.trim() || !form.content.trim()) {
            alert("제목과 내용은 필수입니다.");
            return;
        }

        try {
            let result;
            if (editingNotice) {
                result = await updateNotice(editingNotice.id, form);
            } else {
                result = await createNotice(form);
            }

            if (result.success) {
                alert(editingNotice ? "수정되었습니다." : "등록되었습니다.");
                closeModal();
                loadNotices(page);
            } else {
                alert(result.message || "저장에 실패했습니다.");
            }
        } catch (err) {
            console.error("저장 오류:", err);
            alert("오류가 발생했습니다.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("정말 삭제하시겠습니까?")) return;
        try {
            const result = await deleteNotice(id);
            if (result.success) {
                alert("삭제되었습니다.");
                loadNotices(page);
            } else {
                alert(result.message || "삭제 실패");
            }
        } catch (err) {
            console.error("삭제 오류:", err);
            alert("오류가 발생했습니다.");
        }
    };

    return (
        <div className="admin-section">
            <div className="admin-section-header">
                <h2 className="admin-section-title">공지사항 관리</h2>
                <button className="admin-primary-btn" onClick={openCreateModal}>
                    + 공지사항 등록
                </button>
            </div>

            <div className="admin-filters">
                <label className="admin-filter-label">검색</label>
                <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="제목/내용 검색"
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <button className="admin-secondary-btn" onClick={handleSearch}>검색</button>
            </div>

            {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}

            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>중요</th>
                            <th>제목</th>
                            <th>등록일</th>
                            <th>관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {notices.length === 0 ? (
                            <tr><td colSpan="5" className="admin-table-empty">공지사항이 없습니다.</td></tr>
                        ) : (
                            notices.map((n) => (
                                <tr key={n.id}>
                                    <td>{n.id}</td>
                                    <td>{n.is_important ? "⭐️" : "-"}</td>
                                    <td style={{ textAlign: "left" }}>{n.title}</td>
                                    <td>{n.created_at?.substring(0, 10)}</td>
                                    <td>
                                        <div className="admin-row-actions">
                                            <button className="admin-secondary-btn" onClick={() => openEditModal(n)}>수정</button>
                                            <button className="admin-danger-btn" onClick={() => handleDelete(n.id)}>삭제</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "20px" }}>
                    <button disabled={page === 1} onClick={() => loadNotices(page - 1)}>이전</button>
                    <span>{page} / {totalPages}</span>
                    <button disabled={page === totalPages} onClick={() => loadNotices(page + 1)}>다음</button>
                </div>
            )}

            {isModalOpen && (
                <AdminModal
                    title={editingNotice ? "공지사항 수정" : "공지사항 등록"}
                    onClose={closeModal}
                    onSubmit={handleSubmit}
                >
                    <div className="admin-form-grid">
                        <div className="admin-form-row is-checkbox">
                            <input
                                type="checkbox"
                                id="is_important"
                                name="is_important"
                                checked={form.is_important}
                                onChange={handleChange}
                            />
                            <label htmlFor="is_important">중요 공지</label>
                        </div>
                        <div className="admin-form-row">
                            <label>제목</label>
                            <input
                                type="text"
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                placeholder="제목을 입력하세요"
                            />
                        </div>
                        <div className="admin-form-row">
                            <label>내용</label>
                            <textarea
                                name="content"
                                value={form.content}
                                onChange={handleChange}
                                placeholder="내용을 입력하세요"
                                rows={10}
                                style={{ width: "100%", padding: "8px" }}
                            />
                        </div>
                    </div>
                </AdminModal>
            )}
        </div>
    );
}

export default NoticesTab;
