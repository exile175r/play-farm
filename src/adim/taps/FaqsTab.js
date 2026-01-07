// src/adim/taps/FaqsTab.js
import React, { useEffect, useState } from "react";
import "./Tabs.css";
import AdminModal from "../components/AdminModal";
import { getAllFaqs, createFaq, updateFaq, deleteFaq } from "../../services/faqApi";

const emptyForm = {
    question: "",
    answer: "",
    category: "일반",
    display_order: 0,
};

function FaqsTab() {
    const [faqs, setFaqs] = useState([]);
    const [categoryFilter, setCategoryFilter] = useState("ALL");
    const [error, setError] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFaq, setEditingFaq] = useState(null);
    const [form, setForm] = useState(emptyForm);

    const loadFaqs = async () => {
        try {
            const result = await getAllFaqs(categoryFilter);
            if (result.success) {
                setFaqs(result.data);
            } else {
                setError(result.message);
            }
        } catch (err) {
            console.error("FAQ 로드 실패:", err);
            setError("FAQ를 불러오는데 실패했습니다.");
        }
    };

    useEffect(() => {
        loadFaqs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categoryFilter]);

    const openCreateModal = () => {
        setEditingFaq(null);
        setForm(emptyForm);
        setIsModalOpen(true);
    };

    const openEditModal = (faq) => {
        setEditingFaq(faq);
        setForm({
            question: faq.question,
            answer: faq.answer,
            category: faq.category,
            display_order: faq.display_order,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async () => {
        if (!form.question.trim() || !form.answer.trim()) {
            alert("질문과 답변은 필수입니다.");
            return;
        }

        try {
            let result;
            if (editingFaq) {
                result = await updateFaq(editingFaq.id, form);
            } else {
                result = await createFaq(form);
            }

            if (result.success) {
                alert(editingFaq ? "수정되었습니다." : "등록되었습니다.");
                closeModal();
                loadFaqs();
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
            const result = await deleteFaq(id);
            if (result.success) {
                alert("삭제되었습니다.");
                loadFaqs();
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
                <h2 className="admin-section-title">FAQ 관리</h2>
                <button className="admin-primary-btn" onClick={openCreateModal}>
                    + FAQ 등록
                </button>
            </div>

            <div className="admin-filters">
                <label className="admin-filter-label">카테고리</label>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    <option value="ALL">전체</option>
                    <option value="일반">일반</option>
                    <option value="결제/환불">결제/환불</option>
                    <option value="계정">계정</option>
                    <option value="예약">예약</option>
                </select>
            </div>

            {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}

            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>순서</th>
                            <th>카테고리</th>
                            <th>질문</th>
                            <th>관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {faqs.length === 0 ? (
                            <tr><td colSpan="4" className="admin-table-empty">FAQ가 없습니다.</td></tr>
                        ) : (
                            faqs.map((f) => (
                                <tr key={f.id}>
                                    <td>{f.display_order}</td>
                                    <td>{f.category}</td>
                                    <td style={{ textAlign: "left" }}>{f.question}</td>
                                    <td>
                                        <div className="admin-row-actions">
                                            <button className="admin-secondary-btn" onClick={() => openEditModal(f)}>수정</button>
                                            <button className="admin-danger-btn" onClick={() => handleDelete(f.id)}>삭제</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <AdminModal
                    title={editingFaq ? "FAQ 수정" : "FAQ 등록"}
                    onClose={closeModal}
                    onSubmit={handleSubmit}
                >
                    <div className="admin-form-grid">
                        <div className="admin-form-row">
                            <label>카테고리</label>
                            <select name="category" value={form.category} onChange={handleChange}>
                                <option value="일반">일반</option>
                                <option value="결제/환불">결제/환불</option>
                                <option value="계정">계정</option>
                                <option value="예약">예약</option>
                            </select>
                        </div>
                        <div className="admin-form-row">
                            <label>순서</label>
                            <input
                                type="number"
                                name="display_order"
                                value={form.display_order}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="admin-form-row">
                            <label>질문</label>
                            <input
                                type="text"
                                name="question"
                                value={form.question}
                                onChange={handleChange}
                                placeholder="질문을 입력하세요"
                            />
                        </div>
                        <div className="admin-form-row">
                            <label>답변</label>
                            <textarea
                                name="answer"
                                value={form.answer}
                                onChange={handleChange}
                                placeholder="답변을 입력하세요"
                                rows={5}
                                style={{ width: "100%", padding: "8px" }}
                            />
                        </div>
                    </div>
                </AdminModal>
            )}
        </div>
    );
}

export default FaqsTab;
