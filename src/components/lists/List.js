// src/components/List.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './List.css';
import dayjs from 'dayjs';
import { getAllPrograms } from '../../services/programApi';
import { getImagePath } from '../../utils/imagePath';

function List({ searchData }) {
   const [programs, setPrograms] = useState([]);
   const [page, setPage] = useState(1);
   const [error, setError] = useState(null);

   // 중복 호출 방지
   const isLoadingRef = useRef(false);
   // ✅ searchData 이전 값 추적 (무한 루프 방지)
   const prevSearchDataRef = useRef(null);

   // ✅ 북마크(찜) - List/Detail/Mypage 동일 키로 동기화
   const BOOKMARK_KEY = 'bookmarks_program';

   const [bookmarks, setBookmarks] = useState(() => {
      try {
         return JSON.parse(localStorage.getItem(BOOKMARK_KEY) || '[]');
      } catch {
         return [];
      }
   });

   // ✅ 북마크 id 빠른 조회용 Set
   const bookmarkedSet = useMemo(() => {
      return new Set((bookmarks || []).map((b) => String(b.programId)));
   }, [bookmarks]);

   // 다른 탭/페이지에서 localStorage 변경 시 동기화(같은 탭에서는 storage 이벤트 미발생하는 게 정상이라, 안전용)
   useEffect(() => {
      const onStorage = (e) => {
         if (e.key !== BOOKMARK_KEY) return;
         try {
            const next = JSON.parse(e.newValue || '[]');
            setBookmarks(Array.isArray(next) ? next : []);
         } catch {
            setBookmarks([]);
         }
      };
      window.addEventListener('storage', onStorage);
      return () => window.removeEventListener('storage', onStorage);
   }, []);

   // ✅ 데이터 처리 함수 (메모이제이션으로 중복 처리 방지)
   const processProgramData = useCallback((data) => {
      if (!data || !Array.isArray(data)) return [];

      const replaceText = { 체험: ' 체험', 및: ' 및 ' };
      // ✅ 원본 데이터를 직접 수정하지 않고 새 배열 생성 (불변성 유지)
      return data.map((item) => {
         const newItem = { ...item };
         try {
            // 이미 처리된 데이터인지 확인 (공백이 포함되어 있으면 처리된 것으로 간주)
            if (typeof newItem.program_nm === 'string' && newItem.program_nm.includes(' 체험')) {
               return newItem; // 이미 처리됨
            }
            newItem.program_nm = JSON.parse(newItem.program_nm)
               .map((v) => v.replace(/체험|및/g, (match) => replaceText[match] || match))
               .join(', ');
         } catch (error) {
            // JSON 파싱 실패 시 문자열로 처리
            if (typeof newItem.program_nm === 'string' && !newItem.program_nm.includes(' 체험')) {
               newItem.program_nm = newItem.program_nm.replace(/체험|및/g, (match) => replaceText[match] || match);
            }
         }
         return newItem;
      });
   }, []);

   // 전체 프로그램 목록 조회
   const fetchPrograms = useCallback(
      async (pageNum = 1) => {
         // 이미 로딩 중이면 중복 호출 방지
         if (isLoadingRef.current) return;

         isLoadingRef.current = true;
         setError(null);

         try {
            const result = await getAllPrograms(pageNum, 20);

            if (result.success) {
               // 검색 데이터 있으면 검색 데이터 사용, 없으면 전체 데이터 사용
               const data = searchData ? searchData : result.data || [];
               // ✅ 원본 데이터를 직접 수정하지 않고 새 배열 생성
               const processedData = processProgramData(data);
               setPrograms(processedData);
            } else {
               setError(result.error || '데이터를 불러오는데 실패했습니다.');
               setPrograms([]);
            }
         } catch (err) {
            setError('프로그램 목록을 불러오는 중 오류가 발생했습니다.');
            setPrograms([]);
         } finally {
            isLoadingRef.current = false;
         }
      },
      [searchData, processProgramData]
   );

   // ✅ searchData 변경 감지 및 처리 (별도 useEffect로 분리하여 무한 루프 방지)
   useEffect(() => {
      // searchData가 실제로 변경되었는지 확인 (참조 비교)
      if (searchData !== prevSearchDataRef.current) {
         prevSearchDataRef.current = searchData;
         if (searchData) {
            const processedData = processProgramData(searchData);
            setPrograms(processedData);
         }
      }
   }, [searchData, processProgramData]);

   // ✅ searchData가 없을 때만 API 호출 (불필요한 호출 방지)
   useEffect(() => {
      // searchData가 없고, 이전에 searchData가 없었을 때만 API 호출
      if (!searchData && prevSearchDataRef.current === null) {
         fetchPrograms(page);
      } else if (!searchData && prevSearchDataRef.current !== null) {
         // searchData가 null로 변경된 경우 (검색 초기화)
         prevSearchDataRef.current = null;
         fetchPrograms(page);
      }
   }, [page, fetchPrograms]);

   // ✅ 북마크 토글
   const toggleBookmark = useCallback(
      (data) => {
         if (!data?.id) return;

         const pid = String(data.id);
         const exists = bookmarkedSet.has(pid);

         const next = exists
            ? bookmarks.filter((b) => String(b.programId) !== pid)
            : [
                 {
                    programId: pid,
                    title: data.program_nm,
                    image: data.images?.[0] ? getImagePath(data.images[0]) : '',
                    savedAt: new Date().toISOString(),
                 },
                 ...bookmarks,
              ];

         setBookmarks(next);
         localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next));
      },
      [bookmarks, bookmarkedSet]
   );

   // ✅ 처리된 프로그램 데이터 메모이제이션 (불필요한 재계산 방지)
   const processedPrograms = useMemo(() => {
      return programs.map((data) => ({
         ...data,
         formattedDate: data.reqst_endde ? dayjs(data.reqst_endde).format('YYYY.MM.DD') : '',
      }));
   }, [programs]);

   return (
      <section className="pf-page list-wrap">
         <div className="pf-container list-inner">
            <header className="pf-head list-head">
               <div className="pf-divider list-divider" />
            </header>

            {error && <p className="list-error">{error}</p>}

            <div className="list-grid">
               {processedPrograms.map((data) => {
                  const bookmarked = bookmarkedSet.has(String(data.id));

                  return (
                     <Link to={`/list/${data.id}`} className="list-card" key={data.id}>
                        {/* 이미지 영역 */}
                        <div className="list-card-img">
                           {data.images && data.images.length > 0 && <img src={getImagePath(data.images[0])} alt={data.program_nm} loading="lazy" />}

                           {/* ✅ hover 했을때만 뜨는 하트 버튼 */}
                           <button
                              type="button"
                              className={`list-heart-btn ${bookmarked ? 'is-on' : ''}`}
                              aria-label={bookmarked ? '찜 해제' : '찜하기'}
                              onClick={(e) => {
                                 // ✅ 카드(Link) 이동 막고 찜만 토글
                                 e.preventDefault();
                                 e.stopPropagation();
                                 toggleBookmark(data);
                              }}>
                              {bookmarked ? '♥' : '♡'}
                           </button>
                        </div>

                        {/* 텍스트 영역 */}
                        <div className="list-card-body">
                           <h3 className="list-item-title">{data.program_nm}</h3>
                           <p className="list-sub">{data.side_activities}</p>
                           <p className="list-date">{data.formattedDate}</p>
                        </div>
                     </Link>
                  );
               })}
            </div>
         </div>
      </section>
   );
}

export default List;
