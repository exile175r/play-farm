// src/components/List.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './List.css';
import dayjs from 'dayjs';
import { getAllPrograms } from '../../services/programApi';
import { getImagePath } from '../../utils/imagePath';

function List() {
   const [programs, setPrograms] = useState([]);
   const [page, setPage] = useState(1);
   const [error, setError] = useState(null);

   // 중복 호출 방지
   const isLoadingRef = useRef(false);

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

   // 전체 프로그램 목록 조회
   const fetchPrograms = useCallback(async (pageNum = 1) => {
      // 이미 로딩 중이면 중복 호출 방지
      if (isLoadingRef.current) return;

      isLoadingRef.current = true;
      setError(null);

      try {
         const result = await getAllPrograms(pageNum, 20);

         if (result.success) {
            // 텍스트 패턴 치환
            const replaceText = { 체험: ' 체험', 및: ' 및 ' };
            result.data.forEach((data) => {
               try {
                  data.program_nm = JSON.parse(data.program_nm)
                     .map((v) => v.replace(/체험|및/g, (match) => replaceText[match]))
                     .join(', ');
               } catch (error) {
                  data.program_nm = data.program_nm.replace(/체험|및/g, (match) => replaceText[match]);
               }
            });
            setPrograms(result.data || []);
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
   }, []); // 의존성 배열이 비어있어서 함수가 한 번만 생성됨

   useEffect(() => {
      fetchPrograms(page);
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

   return (
      <section className="pf-page list-wrap">
         <div className="pf-container list-inner">
            <header className="pf-head list-head">
               <h2 className="pf-title-lg list-title">전체 체험 목록</h2>
               <div className="pf-divider list-divider" />
            </header>

            {error && <p className="list-error">{error}</p>}

            <div className="list-grid">
               {programs.map((data) => {
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
                           {/* ✅ (수정) 카드 제목 클래스만 분리 */}
                           <h3 className="list-item-title">{data.program_nm}</h3>
                           <p className="list-sub">{data.side_activities}</p>
                           <p className="list-date">{dayjs(data.reqst_endde).format('YYYY.MM.DD')}</p>
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
