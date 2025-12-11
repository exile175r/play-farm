// src/components/ProgramTest.js
import React, { useState, useEffect, useRef } from 'react';
import { getAllPrograms, getProgramById, searchPrograms } from '../services/programApi';
import { getImagePath } from '../utils/imagePath';

const ProgramTest = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);

  // 모달 관련 상태
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 중복 호출 방지
  const isLoadingRef = useRef(false);

  // 전체 프로그램 목록 조회
  const fetchPrograms = async (pageNum = 1) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const result = await getAllPrograms(pageNum, 20);
      if (result.success) {
        setPrograms(result.data);
        console.log("🔍 ~  ~ play-farm/src/components/DataCheck.js:20 ~ result.data:", result.data);
        setPagination(result.pagination);
      } else {
        setError(result.error || '데이터를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError('API 호출 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  // 프로그램 상세 조회 - 모달 열기
  const fetchProgramDetail = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getProgramById(id);
      if (result.success) {
        // 이미지 배열 중복 제거 (안전장치)
        const programData = {
          ...result.data,
          images: result.data.images ? [...new Set(result.data.images)] : []
        };
        setSelectedProgram(programData);
        setCurrentImageIndex(0);
        setIsModalOpen(true);
      } else {
        setError(result.error || '데이터를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError('API 호출 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 모달 닫기
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProgram(null);
    setCurrentImageIndex(0);
  };

  // 다음 이미지
  const nextImage = () => {
    if (selectedProgram && selectedProgram.images && selectedProgram.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev < selectedProgram.images.length - 1 ? prev + 1 : 0
      );
    }
  };

  // 이전 이미지
  const prevImage = () => {
    if (selectedProgram && selectedProgram.images && selectedProgram.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev > 0 ? prev - 1 : selectedProgram.images.length - 1
      );
    }
  };

  // 프로그램 검색
  const handleSearch = async (pageNum = 1) => {
    if (!searchKeyword.trim()) {
      alert('검색어를 입력해주세요.');
      return;
    }
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    setIsSearchMode(true);  // 검색 모드 활성화
    try {
      const result = await searchPrograms(searchKeyword, null, null, pageNum, 20);
      if (result.success) {
        setPrograms(result.data);
        setPage(pageNum);
        // 검색 결과에는 pagination이 없을 수 있으므로 확인 필요
        // setPagination(result.pagination);
      } else {
        setError(result.error || '검색에 실패했습니다.');
      }
    } catch (err) {
      setError('검색 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  useEffect(() => {
    // 초기 로드만 실행 (검색 버튼 클릭 시에는 handleSearch가 직접 호출됨)
    if (!isSearchMode) {
      fetchPrograms(page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // 검색 버튼 클릭
  const onSearchClick = () => {
    setPage(1);  // 검색 시 첫 페이지로
    handleSearch(1);
  };

  // 전체 목록 버튼 클릭
  const onResetClick = () => {
    setSearchKeyword('');
    setIsSearchMode(false);  // 검색 모드 해제
    setPage(1);
    fetchPrograms(1);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Program API 테스트</h2>

      {/* 검색 */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          placeholder="검색어 입력"
          style={{ padding: '8px', marginRight: '10px' }}
        />
        <button onClick={onSearchClick}>검색</button>
        <button onClick={onResetClick} style={{ marginLeft: '10px' }}>
          전체 목록
        </button>
      </div>

      {/* 로딩 및 에러 */}
      {loading && <p>로딩 중...</p>}
      {error && <p style={{ color: 'red' }}>에러: {error}</p>}

      {/* 페이지네이션 정보 */}
      {pagination && (
        <div style={{ marginBottom: '20px' }}>
          <p>
            페이지 {pagination.page} / {pagination.totalPages}
            (전체 {pagination.total}개)
          </p>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            이전
          </button>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= pagination.totalPages}
            style={{ marginLeft: '10px' }}
          >
            다음
          </button>
        </div>
      )}

      {/* 프로그램 목록 */}
      <div>
        <h3>프로그램 목록 ({programs.length}개)</h3>
        {programs.map((program) => (
          <div
            key={program.id}
            style={{
              marginBottom: '10px',
              padding: '10px',
              display: 'flex',
              gap: '10px',
              height: '100px',
              border: '1px solid #ccc',
              cursor: 'pointer'
            }}
            onClick={() => fetchProgramDetail(program.id)}
          >
            <div className='imgBox' style={{ display: 'flex', alignItems: 'center', width: '100px', height: '100%', overflow: 'hidden' }}>
              {program.images && program.images.length > 0 ? (
                <img
                  key={`thumb-${program.id}`}
                  style={{ width: '100%' }}
                  src={getImagePath(program.images[0])}
                  alt={program.village_nm}
                  loading="lazy"
                />
              ) : (
                <img
                  key={`thumb-default-${program.id}`}
                  style={{ width: '100%' }}
                  src={getImagePath('/images/temp.png')}
                  alt="기본 이미지"
                  loading="lazy"
                />
              )}
            </div>
            <div className='infoBox'>
              <h4>{program.program_nm}</h4>
              <p>마을명: {program.village_nm}</p>
              <p>주소: {program.address}</p>
              {program.program_types && program.program_types.length > 0 && (
                <p>프로그램 유형: {program.program_types.join(', ')}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 이미지 모달 */}
      {isModalOpen && selectedProgram && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={closeModal}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '10px',
              padding: '20px',
              maxWidth: '90%',
              maxHeight: '90%',
              overflow: 'auto',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 닫기 버튼 */}
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666',
                zIndex: 1001
              }}
            >
              ×
            </button>

            {/* 프로그램 정보 */}
            <h2 style={{ marginTop: 0 }}>{selectedProgram.program_nm}</h2>
            <p><strong>마을명:</strong> {selectedProgram.village_nm}</p>
            {selectedProgram.address && (
              <p><strong>주소:</strong> {selectedProgram.address}</p>
            )}
            {selectedProgram.program_types && selectedProgram.program_types.length > 0 && (
              <p><strong>프로그램 유형:</strong> {selectedProgram.program_types.join(', ')}</p>
            )}

            {/* 이미지 갤러리 */}
            {selectedProgram.images && selectedProgram.images.length > 0 ? (
              <div style={{ marginTop: '20px' }}>
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                  {/* 이전 버튼 */}
                  {selectedProgram.images.length > 1 && (
                    <button
                      onClick={prevImage}
                      style={{
                        position: 'absolute',
                        left: '10px',
                        background: 'rgba(0, 0, 0, 0.5)',
                        color: 'white',
                        border: 'none',
                        padding: '10px 15px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '18px',
                        zIndex: 1002
                      }}
                    >
                      ‹
                    </button>
                  )}

                  {/* 현재 이미지 */}
                  <img
                    key={`main-${currentImageIndex}`}
                    src={getImagePath(selectedProgram.images[currentImageIndex])}
                    alt={`${selectedProgram.program_nm} - 이미지 ${currentImageIndex + 1}`}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '500px',
                      objectFit: 'contain'
                    }}
                    onError={(e) => {
                      e.target.src = getImagePath('/images/temp.png');
                    }}
                  />

                  {/* 다음 버튼 */}
                  {selectedProgram.images.length > 1 && (
                    <button
                      onClick={nextImage}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        background: 'rgba(0, 0, 0, 0.5)',
                        color: 'white',
                        border: 'none',
                        padding: '10px 15px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '18px',
                        zIndex: 1002
                      }}
                    >
                      ›
                    </button>
                  )}
                </div>

                {/* 이미지 인디케이터 */}
                {selectedProgram.images.length > 1 && (
                  <div style={{ marginTop: '15px', textAlign: 'center' }}>
                    <p style={{ margin: '0 0 10px 0' }}>
                      {currentImageIndex + 1} / {selectedProgram.images.length}
                    </p>
                    {/* 썸네일 목록 */}
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {selectedProgram.images.map((image, index) => (
                        <img
                          key={index}
                          src={getImagePath(image)}
                          alt={`썸네일 ${index + 1}`}
                          onClick={() => setCurrentImageIndex(index)}
                          loading="lazy"
                          style={{
                            width: '80px',
                            height: '80px',
                            objectFit: 'cover',
                            cursor: 'pointer',
                            border: index === currentImageIndex ? '3px solid #007bff' : '1px solid #ccc',
                            borderRadius: '5px'
                          }}
                          onError={(e) => {
                            e.target.src = getImagePath('/images/temp.png');
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <img
                  src={getImagePath('/images/temp.png')}
                  alt="이미지 없음"
                  style={{ maxWidth: '300px' }}
                />
                <p>이미지가 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramTest;

// import React, { useState, useEffect } from 'react';
// import './DataCheck.css';
// import { getImagePath } from '../utils/imagePath';

// const DataCheck = ({ farmData }) => {

//   const [allData, setAllData] = useState([]);
//   const [district, setDistrict] = useState('');
//   const [sigungu, setSigungu] = useState('');
//   const [experience, setExperience] = useState('');
//   const [currentPage, setCurrentPage] = useState(1);
//   const [startPage, setStartPage] = useState(1); // 페이지 버튼 범위 시작점

//   const { DESCRIPTION: des, DATA: data } = farmData;

//   // 데이터 분할
//   const splitData = (dataToSplit) => {
//     const splitData = [];
//     let newData = [];
//     dataToSplit.forEach((v, i) => {
//       newData.push(v);
//       if ((i + 1) % 20 === 0) {
//         splitData.push(newData);
//         newData = [];
//       }
//     });
//     if (newData.length) splitData.push(newData);
//     setAllData(splitData);
//     setCurrentPage(1); // 필터링 시 첫 페이지로 리셋
//     setStartPage(1); // 페이지 버튼 범위도 리셋
//   }

//   // 필터링 및 데이터 분할
//   useEffect(() => {
//     const filteredData = data.filter(item => {
//       // district 필터
//       if (district) {
//         const addr1 = item.REFINE_LOTNO_ADDR?.split(' ')[0];
//         const addr2 = item.REFINE_ROADNM_ADDR?.split(' ')[0];
//         if (addr1 !== district && addr2 !== district) {
//           return false;
//         }
//       }
//       // sigungu 필터
//       if (sigungu) {
//         const addr1 = item.REFINE_LOTNO_ADDR?.split(' ')[1];
//         const addr2 = item.REFINE_ROADNM_ADDR?.split(' ')[1];
//         if (addr1 !== sigungu && addr2 !== sigungu) {
//           return false;
//         }
//       }
//       // experience 필터
//       if (experience) {
//         if (!Array.isArray(item.PROGRAM_TYPE)) {
//           if (item.PROGRAM_TYPE !== experience) return false;
//         } else {
//           if (!item.PROGRAM_TYPE?.some(v => v === experience)) return false;
//         }
//       }
//       return true;
//     });
//     splitData(filteredData);
//   }, [data, district, sigungu, experience]);

//   console.log('allData:', allData);

//   // 중복 제거
//   const uniqueList = (list) => {
//     const newList = [];
//     list.forEach(v => {
//       if (newList.includes(v)) return;
//       newList.push(v);
//     });
//     return newList;
//   }

//   // 주소 리스트 생성
//   const addressList = [];
//   const siguNm = (address) => address && address.split(' ').slice(0, 2).join(' ');
//   data.forEach(item => {
//     if (
//       (Object.keys(item).includes('REFINE_LOTNO_ADDR') && item.REFINE_LOTNO_ADDR)
//       ||
//       (Object.keys(item).includes('REFINE_ROADNM_ADDR') && item.REFINE_ROADNM_ADDR)
//     ) {
//       if (
//         addressList.length &&
//         addressList.includes(
//           siguNm(item.REFINE_LOTNO_ADDR)
//           || siguNm(item.REFINE_ROADNM_ADDR)
//         )) return;
//       addressList.push(siguNm(item.REFINE_LOTNO_ADDR) || siguNm(item.REFINE_ROADNM_ADDR));
//     }
//   });
//   // console.log("addressList:", addressList);

//   // 체험 리스트 생성
//   const experienceList = [];
//   data.forEach(item => {
//     if (item.PROGRAM_TYPE) {
//       if (Array.isArray(item.PROGRAM_TYPE)) {
//         item.PROGRAM_TYPE.map(v => {
//           experienceList.push(v);
//           return null;
//         })
//       } else {
//         experienceList.push(item.PROGRAM_TYPE);
//       }
//     }
//   });
//   // console.log("experienceList:", experienceList);

//   const handleSearch = (e) => {
//     e.preventDefault();
//     const searchValue = e.target.search.value;
//     if (searchValue) {

//       const nowData = [];
//       allData.forEach(v => nowData.push(...v));
//       console.log('🔍 ~ handleSearch ~ nowData:', nowData);
//       const filteredData = nowData.filter(item => {
//         const { PROGRAM_NM, PROGRAM_TYPE, PROGRAM_CONTENT } = item;
//         if (
//           (PROGRAM_NM && PROGRAM_NM.includes(searchValue)) ||
//           (PROGRAM_TYPE && PROGRAM_TYPE.includes(searchValue)) ||
//           (PROGRAM_CONTENT && PROGRAM_CONTENT.includes(searchValue))
//         ) {
//           return true;
//         }
//         return false;
//       });
//       console.log('🔍 ~ handleSearch ~ filteredData:', filteredData);
//       splitData(filteredData);
//       setCurrentPage(1);
//       setStartPage(1);
//     }
//   }

//   return (
//     <div>
//       <div className='category-container'>
//         <label htmlFor='district'>지역</label>
//         <select name='district' id='district' onChange={(e) => setDistrict(e.target.value)}>
//           <option value=''>전체</option>
//           {uniqueList(addressList.map(v => v.split(' ')[0])).map((address, i) => {
//             return <option key={i + 1} value={address}>{address}</option>
//           })}
//         </select>
//         <label htmlFor='sigungu'>도시</label>
//         <select name='' id='' onChange={(e) => setSigungu(e.target.value)}>
//           <option value=''>전체</option>
//           {uniqueList(addressList.map(v => district ? v.split(' ')[0] === district && v.split(' ')[1] : v.split(' ')[1]))
//             .filter(v => v)
//             .map((address, i) => {
//               return <option key={i + 1} value={address}>{address}</option>
//             })}
//         </select>
//         <label>체험</label>
//         <select name='experience' id='experience' onChange={(e) => setExperience(e.target.value)}>
//           <option value=''>전체</option>
//           {uniqueList(experienceList).map((experience, i) => {
//             return <option key={i + 1} value={experience}>{experience}</option>
//           })}
//         </select>
//         <form action='' onSubmit={handleSearch}>
//           <input type='text' placeholder='검색' name='search' id='search' />
//           <button type='submit'>검색</button>
//         </form>
//       </div>
//       <ul className='farm-data-list'>
//         {allData[currentPage - 1]?.map((item, i, arr) => (
//           <li key={i}>
//             <div className='index'><p>{arr.length * (currentPage - 1) + i + 1}</p></div>
//             <div className='imgBox'>
//               <img src={item.IMAGES.length ? getImagePath(item.IMAGES[0]) : getImagePath('/images/temp.png')} alt='village' />
//             </div>
//             <div className='infoBox'>
//               {Object.keys(item).filter(key => key !== 'IMAGES' && key !== 'CN' && key !== 'DATA').map(key => (
//                 <p key={key}>
//                   <strong>{Object.keys(des).find(k => k === key) ? des[key] : key}</strong>
//                   {key === 'HMPG_ADDR' ?
//                     <a href={item[key]} target='_blank' rel='noopener noreferrer'>{item[key]}</a>
//                     :
//                     <span>{item[key]}</span>}
//                 </p>
//               ))}
//             </div>
//           </li>
//         ))}
//       </ul>
//       <div className='page-container'>
//         <button
//           onClick={() => {
//             if (currentPage > 1) {
//               setCurrentPage(currentPage - 1);
//               // 현재 페이지가 표시 범위 밖이면 범위 조정
//               if (currentPage - 1 < startPage) {
//                 setStartPage(Math.max(1, currentPage - 1));
//               }
//             }
//           }}
//           disabled={currentPage === 1}
//         >
//           Prev
//         </button>
//         <ul className='page-list'>
//           {allData?.slice(startPage - 1, Math.min(startPage + 29, allData.length)).map((_, i) => {
//             const pageNum = startPage + i;
//             return (
//               <li key={pageNum - 1} className={currentPage === pageNum ? 'active' : ''}>
//                 <button onClick={() => {
//                   setCurrentPage(pageNum);
//                   // 현재 페이지가 표시 범위 밖이면 범위 조정
//                   if (pageNum >= startPage + 30) {
//                     setStartPage(pageNum - 29);
//                   } else if (pageNum < startPage) {
//                     setStartPage(Math.max(1, pageNum));
//                   }
//                 }}>
//                   {pageNum}
//                 </button>
//               </li>
//             );
//           })}
//         </ul>
//         <button
//           onClick={() => {
//             if (currentPage < allData.length) {
//               setCurrentPage(currentPage + 1);
//               // 현재 페이지가 표시 범위 밖이면 범위 조정
//               if (currentPage + 1 >= startPage + 30) {
//                 setStartPage(Math.min(allData.length - 29, currentPage + 1 - 29));
//               }
//             }
//           }}
//           disabled={currentPage === allData.length}
//         >
//           Next
//         </button>
//       </div>
//     </div >
//   )
// }

// export default DataCheck;