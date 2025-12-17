// src/components/List.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './List.css';
import dayjs from 'dayjs';
import { getAllPrograms } from '../../services/programApi';
import { getImagePath } from '../../utils/imagePath';

// ✅ 개별 카드 컴포넌트 (Lazy Loading 적용)
const ListCard = React.memo(({ data, bookmarked, toggleBookmark, index }) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    // 처음 몇 개 카드는 즉시 로드 (초기 화면에 보이는 카드들)
    if (index < 8) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // 한 번만 실행
        }
      },
      {
        rootMargin: '100px', // 화면에 보이기 100px 전에 미리 로드
        threshold: 0.1
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [index]);

  const formattedDate = data.reqst_endde ? dayjs(data.reqst_endde).format('YYYY.MM.DD') : '';

  return (
    <Link to={`/list/${data.id}`} className="list-card" key={data.id} ref={cardRef}>
      {/* 이미지 영역 */}
      <div className="list-card-img">
        {isVisible ? (
          <>
            {data.images && data.images.length > 0 && (
              <img 
                src={getImagePath(data.images[0])} 
                alt={data.program_nm} 
                loading="lazy"
              />
            )}
            {/* ✅ hover 했을때만 뜨는 하트 버튼 */}
            <button
              type="button"
              className={`list-heart-btn ${bookmarked ? 'is-on' : ''}`}
              aria-label={bookmarked ? '찜 해제' : '찜하기'}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleBookmark(data);
              }}>
              {bookmarked ? '♥' : '♡'}
            </button>
          </>
        ) : (
          <div className="list-card-skeleton">
            <div className="skeleton-loader"></div>
          </div>
        )}
      </div>

      {/* 텍스트 영역 */}
      <div className="list-card-body">
        {isVisible ? (
          <>
            <h3 className="list-item-title">{data.program_nm}</h3>
            <p className="list-sub">{data.side_activities}</p>
            <p className="list-date">{formattedDate}</p>
          </>
        ) : (
          <div className="list-card-skeleton-text">
            <div className="skeleton-line"></div>
            <div className="skeleton-line short"></div>
            <div className="skeleton-line shorter"></div>
          </div>
        )}
      </div>
    </Link>
  );
});

ListCard.displayName = 'ListCard';

function List({ searchData }) {
  const [programs, setPrograms] = useState([]);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [pagination, setPagination] = useState(null);

  // 중복 호출 방지
  const isLoadingRef = useRef(false);
  // ✅ searchData 이전 값 추적 (무한 루프 방지)
  const prevSearchDataRef = useRef(null);
  // 스크롤 감지용 ref
  const observerTarget = useRef(null);

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

  // 다른 탭/페이지에서 localStorage 변경 시 동기화
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
    return data.map((item) => {
      const newItem = { ...item };
      try {
        if (typeof newItem.program_nm === 'string' && newItem.program_nm.includes(' 체험')) {
          return newItem;
        }
        newItem.program_nm = JSON.parse(newItem.program_nm)
          .map((v) => v.replace(/체험|및/g, (match) => replaceText[match] || match))
          .join(', ');
      } catch (error) {
        if (typeof newItem.program_nm === 'string' && !newItem.program_nm.includes(' 체험')) {
          newItem.program_nm = newItem.program_nm.replace(/체험|및/g, (match) => replaceText[match] || match);
        }
      }
      return newItem;
    });
  }, []);

  // 전체 프로그램 목록 조회
  const fetchPrograms = useCallback(async (pageNum = 1, append = false) => {
    // 이미 로딩 중이면 중복 호출 방지
    if (isLoadingRef.current) return;

    // 검색 데이터가 있으면 무한 스크롤 비활성화
    if (searchData && append) return;

    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const result = await getAllPrograms(pageNum, 20);
      
      // getAllPrograms가 에러 객체를 반환한 경우
      if (!result || result.success === false) {
        setError(result?.error || '데이터를 불러오는데 실패했습니다.');
        if (!append) {
          setPrograms([]);
        }
        setHasMore(false);
        return;
      }

      if (result.success) {
        // 검색 데이터 있으면 검색 데이터 사용, 없으면 전체 데이터 사용
        const data = searchData ? searchData : (result.data || []);
        const processedData = processProgramData(data);

        if (append) {
          // 무한 스크롤: 기존 데이터에 추가
          setPrograms((prev) => [...prev, ...processedData]);
        } else {
          // 초기 로드: 데이터 교체
          setPrograms(processedData);
        }

        // pagination 정보 저장 및 hasMore 업데이트
        if (result.pagination) {
          setPagination(result.pagination);
          const currentPage = result.pagination.page;
          const totalPages = result.pagination.totalPages;
          setHasMore(currentPage < totalPages);
        } else {
          setHasMore(processedData.length === 20);
        }
      } else {
        setError(result.error || '데이터를 불러오는데 실패했습니다.');
        if (!append) {
          setPrograms([]);
        }
        setHasMore(false);
      }
    } catch (err) {
      console.error('예상치 못한 오류:', err);
      setError('프로그램 목록을 불러오는 중 오류가 발생했습니다.');
      if (!append) {
        setPrograms([]);
      }
      setHasMore(false);
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  }, [searchData, processProgramData]);

  // ✅ searchData 변경 감지 및 처리
  useEffect(() => {
    if (searchData !== prevSearchDataRef.current) {
      prevSearchDataRef.current = searchData;
      if (searchData) {
        const processedData = processProgramData(searchData);
        setPrograms(processedData);
        setHasMore(false);
        setPage(1);
        setPagination(null);
      } else {
        setPrograms([]);
        setPage(1);
        setHasMore(true);
        setPagination(null);
      }
    }
  }, [searchData, processProgramData]);

  // ✅ searchData가 없을 때만 API 호출
  useEffect(() => {
    if (!searchData && prevSearchDataRef.current === null) {
      fetchPrograms(1, false);
      setPage(1);
    } else if (!searchData && prevSearchDataRef.current !== null) {
      prevSearchDataRef.current = null;
      fetchPrograms(1, false);
      setPage(1);
    }
  }, [fetchPrograms, searchData]);

  // ✅ 무한 스크롤: Intersection Observer로 스크롤 감지
  useEffect(() => {
    if (searchData || !hasMore || loading) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !isLoadingRef.current) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchPrograms(nextPage, true);
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [page, hasMore, loading, searchData, fetchPrograms]);

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

  // ✅ Dots Loader 컴포넌트
  const DotsLoader = () => (
    <div className="dots-loader">
      <div className="dots-loader-dot"></div>
      <div className="dots-loader-dot"></div>
      <div className="dots-loader-dot"></div>
    </div>
  );

  return (
    <section className="pf-page list-wrap">
      <div className="pf-container list-inner">
        <header className="pf-head list-head">
          <h2 className="list-title">전체 체험 목록</h2>
          <div className="pf-divider list-divider" />
        </header>

        {error && <p className="list-error">{error}</p>}

        <div className="list-grid">
        {programs.map((data, index) => {
            const bookmarked = bookmarkedSet.has(String(data.id));
            return (
              <ListCard
                key={data.id}
                data={data}
                bookmarked={bookmarked}
                toggleBookmark={toggleBookmark}
                index={index}
              />
            );
          })}
        </div>
        
        {/* 무한 스크롤 감지 영역 및 로더 */}
        {!searchData && (
          <>
            <div ref={observerTarget} className="observer-target" />
            {loading && hasMore && <DotsLoader />}
          </>
        )}
      </div>
    </section>
  );
}

export default List;