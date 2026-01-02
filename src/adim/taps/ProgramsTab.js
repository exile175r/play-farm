// src/adim/taps/ProgramsTab.js
import React, { useEffect, useState } from 'react';
import './Tabs.css';
import AdminModal from '../components/AdminModal';
import { getAllPrograms, deleteProgram, createProgram, updateProgram, getAllProgramTypes } from '../../services/adminApi';

const emptyProgramForm = {
  title: '',
  category: '',
  price: '',
  startDate: '',
  endDate: '',
  status: 'OPEN',
  imageUrl: '',
  address: '',
  minPersonnel: '',
  maxPersonnel: '',
  useTime: '',
  programTypes: [], // 선택한 프로그램 타입 ID 배열
};

function ProgramsTab() {
  const [programs, setPrograms] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [keyword, setKeyword] = useState('');
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
  const [imagePreview, setImagePreview] = useState('');
  const [detailImageFiles, setDetailImageFiles] = useState([]);
  const [detailImagePreviews, setDetailImagePreviews] = useState([]);
  const [programTypes, setProgramTypes] = useState([]); // 전체 프로그램 타입 목록

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
        const replaceText = { 체험: ' 체험', 및: ' 및 ' };
        setPrograms(
          result.data
            .map((item) => {
              const newItem = { ...item };
              try {
                if (typeof newItem.title === 'string' && newItem.title.includes(' 체험')) {
                  return newItem;
                }
                newItem.title = JSON.parse(newItem.title)
                  .map((v) => v.replace(/체험|및/g, (match) => replaceText[match] || match))
                  .join(', ');
              } catch (error) {
                if (typeof newItem.title === 'string' && !newItem.title.includes(' 체험')) {
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
        setError(result.error?.message || '프로그램 목록을 불러오는데 실패했습니다.');
        setPrograms([]);
      }
    } catch (err) {
      setError('프로그램 목록을 불러오는데 실패했습니다.');
      setPrograms([]);
      console.error('프로그램 목록 로드 실패:', err);
    }
  };

  // 프로그램 타입 목록 로드
  useEffect(() => {
    const loadProgramTypes = async () => {
      try {
        const result = await getAllProgramTypes();
        if (result.success) {
          setProgramTypes(result.data || []);
        }
      } catch (err) {
        console.error('프로그램 타입 목록 로드 실패:', err);
      }
    };
    loadProgramTypes();
  }, []);

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
    setImagePreview('');
    setDetailImageFiles([]);
    setDetailImagePreviews([]);
    setIsModalOpen(true);
  };

  const openEditModal = async (program) => {
    setEditingProgram(program);

    // 프로그램 타입 목록이 없으면 먼저 로드
    if (programTypes.length === 0) {
      try {
        const result = await getAllProgramTypes();
        if (result.success) {
          setProgramTypes(result.data || []);
          // 타입 목록 로드 후 타입 ID 찾기
          const selectedTypeIds = [];
          if (program.program_types && program.program_types.length > 0) {
            result.data.forEach((type) => {
              if (program.program_types.includes(type.name)) {
                selectedTypeIds.push(type.id);
              }
            });
          }

          setForm({
            title: program.title || '',
            category: program.category || '',
            price: String(program.price ?? ''),
            startDate: program.startDate || '',
            endDate: program.endDate || '',
            status: program.status || 'OPEN',
            imageUrl: program.imageUrl || '',
            address: program.address || '',
            minPersonnel: String(program.minPersonnel ?? ''),
            maxPersonnel: String(program.maxPersonnel ?? ''),
            useTime: program.useTime || '',
            programTypes: selectedTypeIds,
          });
        }
      } catch (err) {
        console.error('프로그램 타입 로드 실패:', err);
      }
    } else {
      // 프로그램 타입을 ID 배열로 변환 (타입명으로 찾기)
      const selectedTypeIds = [];
      if (program.program_types && program.program_types.length > 0) {
        program.program_types.forEach((typeName) => {
          const type = programTypes.find((t) => t.name === typeName);
          if (type) {
            selectedTypeIds.push(type.id);
          }
        });
      }

      setForm({
        title: program.title || '',
        category: program.category || '',
        price: String(program.price ?? ''),
        startDate: program.startDate || '',
        endDate: program.endDate || '',
        status: program.status || 'OPEN',
        imageUrl: program.imageUrl || '',
        address: program.address || '',
        minPersonnel: String(program.minPersonnel ?? ''),
        maxPersonnel: String(program.maxPersonnel ?? ''),
        useTime: program.useTime || '',
        programTypes: selectedTypeIds,
      });
    }

    setImageFile(null);
    setImagePreview(program.imageUrl || '');

    // 기존 상세 이미지들 미리보기 설정 (display_order > 0인 이미지들)
    const existingDetailImages = program.images && program.images.length > 1
      ? program.images.slice(1) // 첫 번째 이미지(대표) 제외
      : [];
    setDetailImageFiles([]); // 새로 선택한 파일은 없음
    setDetailImagePreviews(existingDetailImages); // 기존 이미지 URL들

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

  const handleProgramTypeChange = (typeId) => {
    setForm((prev) => {
      const currentTypes = prev.programTypes || [];
      const isSelected = currentTypes.includes(typeId);

      if (isSelected) {
        // 선택 해제
        return {
          ...prev,
          programTypes: currentTypes.filter((id) => id !== typeId),
        };
      } else {
        // 선택 추가
        return {
          ...prev,
          programTypes: [...currentTypes, typeId],
        };
      }
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDetailImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // 기존 preview 개수 확인 (기존 이미지 + 새로 선택한 파일)
    const currentPreviewCount = detailImagePreviews.length;
    const availableSlots = 10 - currentPreviewCount;

    if (availableSlots <= 0) {
      alert('최대 10개까지 업로드 가능합니다.');
      return;
    }

    // 추가 가능한 파일만 선택
    const filesToAdd = files.slice(0, availableSlots);
    const newFiles = [...detailImageFiles, ...filesToAdd];
    setDetailImageFiles(newFiles);

    // 기존 preview 유지 + 새 파일의 preview 추가
    const newPreviews = filesToAdd.map((file) => URL.createObjectURL(file));
    setDetailImagePreviews([...detailImagePreviews, ...newPreviews]);
  };

  const handleRemoveDetailImage = (index) => {
    // 기존 이미지인지 새로 선택한 파일인지 확인
    // detailImagePreviews의 앞부분은 기존 이미지 URL, 뒷부분은 새로 선택한 파일의 preview
    const existingImageCount = detailImagePreviews.length - detailImageFiles.length;
    const isExistingImage = index < existingImageCount;

    if (isExistingImage) {
      // 기존 이미지 삭제: preview에서만 제거 (실제 삭제는 서버에서 처리)
      const newPreviews = detailImagePreviews.filter((_, i) => i !== index);
      setDetailImagePreviews(newPreviews);
    } else {
      // 새로 선택한 파일 삭제: files와 preview 모두에서 제거
      const fileIndex = index - existingImageCount;
      const newFiles = detailImageFiles.filter((_, i) => i !== fileIndex);
      const newPreviews = detailImagePreviews.filter((_, i) => i !== index);

      // 이전 URL 해제 (메모리 누수 방지)
      URL.revokeObjectURL(detailImagePreviews[index]);

      setDetailImageFiles(newFiles);
      setDetailImagePreviews(newPreviews);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      alert('체험명을 입력해 주세요.');
      return;
    }

    const priceNumber = form.price ? Number(form.price) : 0;
    if (form.price && (Number.isNaN(priceNumber) || priceNumber < 0)) {
      alert('가격은 0 이상의 숫자로 입력해 주세요.');
      return;
    }

    const minPersonnelNumber = form.minPersonnel ? Number(form.minPersonnel) : null;
    if (form.minPersonnel && (Number.isNaN(minPersonnelNumber) || minPersonnelNumber < 1)) {
      alert('최소 인원은 1 이상의 숫자로 입력해 주세요.');
      return;
    }

    const maxPersonnelNumber = form.maxPersonnel ? Number(form.maxPersonnel) : null;
    if (form.maxPersonnel && (Number.isNaN(maxPersonnelNumber) || maxPersonnelNumber < 1)) {
      alert('최대 인원은 1 이상의 숫자로 입력해 주세요.');
      return;
    }

    if (minPersonnelNumber && maxPersonnelNumber && minPersonnelNumber > maxPersonnelNumber) {
      alert('최소 인원은 최대 인원보다 작거나 같아야 합니다.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('category', form.category.trim());
      formData.append('price', priceNumber);
      formData.append('startDate', form.startDate || '');
      formData.append('endDate', form.endDate || '');
      formData.append('status', form.status);
      formData.append('address', form.address.trim() || '');
      formData.append('useTime', form.useTime.trim() || '');
      if (minPersonnelNumber) {
        formData.append('minPersonnel', minPersonnelNumber);
      }
      if (maxPersonnelNumber) {
        formData.append('maxPersonnel', maxPersonnelNumber);
      }

      // 프로그램 타입들 추가
      if (form.programTypes && form.programTypes.length > 0) {
        form.programTypes.forEach((typeId) => {
          formData.append('programTypes', typeId);
        });
      }

      if (imageFile) {
        formData.append('image', imageFile); // 대표 이미지
      }

      // 상세 이미지들 추가
      detailImageFiles.forEach((file) => {
        formData.append('detailImages', file);
      });

      let result;
      if (editingProgram) {
        result = await updateProgram(editingProgram.id, formData);
      } else {
        result = await createProgram(formData);
      }

      if (result.success) {
        alert(editingProgram ? '체험이 수정되었습니다.' : '새 체험이 등록되었습니다.');
        setIsModalOpen(false);
        loadPrograms(currentPage);
      } else {
        alert(result.error?.message || '체험 저장에 실패했습니다.');
      }
    } catch (err) {
      console.error('체험 저장 실패:', err);
      alert('체험 저장 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`체험 ID ${id} 를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const result = await deleteProgram(id);
      if (result.success) {
        alert('체험이 삭제되었습니다.');
        loadPrograms(currentPage);
      } else {
        alert(result.error?.message || '체험 삭제에 실패했습니다.');
      }
    } catch (err) {
      alert('체험 삭제 중 오류가 발생했습니다.');
      console.error('체험 삭제 실패:', err);
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
          <input type="text" placeholder="제목, 카테고리 검색" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        </div>
      </div>

      {error && <div style={{ padding: '10px', color: '#b91c1c', marginBottom: '10px' }}>{error}</div>}

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
                  {error ? '프로그램 목록을 불러올 수 없습니다.' : '조건에 맞는 체험이 없습니다.'}
                </td>
              </tr>
            ) : (
              programs.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.title}</td>
                  <td>{p.category}</td>
                  <td>{p.startDate ? `${p.startDate} ~ ${p.endDate || ''}` : '-'}</td>
                  <td>{p.price ? `${p.price.toLocaleString()}원` : '-'}</td>
                  <td>{p.status === 'OPEN' ? <span className="badge badge-open">OPEN</span> : <span className="badge badge-closed">CLOSED</span>}</td>
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
            marginTop: '20px',
            display: 'flex',
            justifyContent: 'center',
            gap: '10px',
            alignItems: 'center',
          }}>
          <button type="button" className="admin-secondary-btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
            이전
          </button>
          <span>
            {currentPage} / {pagination.totalPages} (총 {pagination.total}건)
          </span>
          <button type="button" className="admin-secondary-btn" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === pagination.totalPages}>
            다음
          </button>
        </div>
      )}

      {/* 새 체험 / 수정 모달 */}
      {isModalOpen && (
        <AdminModal
          title={editingProgram ? '체험 수정' : '새 체험 만들기'}
          onClose={closeModal}
          onSubmit={handleSubmit}
          submitLabel={editingProgram ? '수정 완료' : '등록하기'}>
          <div className="admin-form-grid">
            <div className="admin-form-row">
              <label className="admin-form-label">체험명</label>
              <input type="text" name="title" value={form.title} onChange={handleFormChange} placeholder="예: 딸기 수확 체험" />
            </div>

            <div className="admin-form-row">
              <label className="admin-form-label">카테고리</label>
              <input type="text" name="category" value={form.category} onChange={handleFormChange} placeholder="예: 가족, 주말, 농장 등" />
            </div>

            <div className="admin-form-row">
              <label className="admin-form-label">프로그램 구분</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                {programTypes.map((type) => {
                  const isSelected = form.programTypes && form.programTypes.includes(type.id);
                  return (
                    <label
                      key={type.id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: `1px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`,
                        backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                        cursor: 'pointer',
                        fontSize: '14px',
                        userSelect: 'none',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleProgramTypeChange(type.id)}
                        style={{ marginRight: '6px', width: 'auto', cursor: 'pointer' }}
                      />
                      {type.name}
                    </label>
                  );
                })}
              </div>
              {programTypes.length === 0 && (
                <p style={{ marginTop: '4px', color: '#6b7280', fontSize: '12px' }}>
                  프로그램 타입 목록을 불러오는 중...
                </p>
              )}
            </div>

            <div className="admin-form-row">
              <label className="admin-form-label">주소</label>
              <input type="text" name="address" value={form.address} onChange={handleFormChange} placeholder="예: 경기도 가평군 가평읍" />
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
              <input type="number" name="price" value={form.price} onChange={handleFormChange} placeholder="예: 15000" min="0" />
            </div>

            <div className="admin-form-row admin-form-row-inline">
              <div>
                <label className="admin-form-label">최소 인원</label>
                <input type="number" name="minPersonnel" value={form.minPersonnel} onChange={handleFormChange} placeholder="예: 2" min="1" />
              </div>
              <div>
                <label className="admin-form-label">최대 인원</label>
                <input type="number" name="maxPersonnel" value={form.maxPersonnel} onChange={handleFormChange} placeholder="예: 10" min="1" />
              </div>
            </div>

            <div className="admin-form-row">
              <label className="admin-form-label">소요시간</label>
              <input type="text" name="useTime" value={form.useTime} onChange={handleFormChange} placeholder="예: 2시간, 1일 등" />
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
                <div style={{ marginTop: '8px' }}>
                  <img src={imagePreview} alt="체험 이미지 미리보기" style={{ maxWidth: '200px', borderRadius: '8px' }} />
                </div>
              )}
            </div>

            <div className="admin-form-row">
              <label className="admin-form-label">상세 이미지 (최대 10개)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleDetailImagesChange}
                disabled={detailImagePreviews.length >= 10}
              />
              {detailImagePreviews.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {detailImagePreviews.map((preview, index) => (
                    <div key={index} style={{ position: 'relative', display: 'inline-block' }}>
                      <img
                        src={preview}
                        alt={`상세 이미지 ${index + 1}`}
                        style={{
                          width: '120px',
                          height: '120px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveDetailImage(index)}
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: '1'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {detailImagePreviews.length >= 10 && (
                <p style={{ marginTop: '8px', color: '#6b7280', fontSize: '12px' }}>
                  최대 10개까지 업로드 가능합니다.
                </p>
              )}
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}

export default ProgramsTab;
