// src/components/lists/List.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import "./List.css";
import dayjs from "dayjs";
import { useBookmark } from "../../hooks/useBookmark";
import { getAllPrograms } from "../../services/programApi";
import { getImagePath } from "../../utils/imagePath";
import ListSearchBar from "./ListSearchBar";

function List({ searchData, setSearchData }) {
  const [programs, setPrograms] = useState([]);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // 중복 호출 방지
  const isLoadingRef = useRef(false);
  // ✅ searchData 이전 값 추적 (무한 루프 방지)
  const prevSearchDataRef = useRef(null);
  // 스크롤 감지용 ref
  const observerTarget = useRef(null);

  // ✅ 북마크 훅 사용
  const programIds = useMemo(() => programs.map((p) => p.id), [programs]);
  // isBookmarked: 북마크 상태, toggleBookmark: 북마크 토글, isLoggedIn: 로그인 여부 (useBookmark 훅에서 처리)
  const { isBookmarked, toggleBookmark, isLoggedIn } = useBookmark(programIds);

  // ✅ 북마크 토글 핸들러
  const handleToggleBookmark = useCallback(
    async (data) => {
      if (!isLoggedIn) return;

      const pid = String(data.id);

      // ✅ "클릭 직전"의 현재 상태를 기준으로, 성공 후 localStorage를 추가/삭제
      const wasBookmarked = isBookmarked(pid);

      // ✅ Mypage가 읽는 localStorage 포맷과 동일하게 payload 표준화
      const bookmarkPayload = {
        programId: pid,
        title: data.program_nm,
        image: data.images?.[0] ? getImagePath(data.images[0]) : "",
        savedAt: new Date().toISOString(),
      };

      const result = await toggleBookmark(pid, bookmarkPayload);

      if (!result?.success && result?.requiresLogin) {
        // 로그인 필요 시 처리 (선택사항)
        return;
      }
      if (!result?.success) return;

      // ✅ 핵심: 서버 토글 성공 후 localStorage(bookmarks_program)도 같이 동기화
      // - wasBookmarked === true  -> localStorage에서 제거 (해제)
      // - wasBookmarked === false -> localStorage에 추가 (등록)
      try {
        const KEY = "bookmarks_program";
        const prev = JSON.parse(localStorage.getItem(KEY) || "[]");
        const list = Array.isArray(prev) ? prev : [];

        const next = wasBookmarked
          ? list.filter((b) => String(b.programId) !== pid)
          : [bookmarkPayload, ...list.filter((b) => String(b.programId) !== pid)];

        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // 무시
      }
    },
    [toggleBookmark, isLoggedIn, isBookmarked]
  );

  // ✅ 데이터 처리 함수 (메모이제이션으로 중복 처리 방지)
  const processProgramData = useCallback((data) => {
    if (!data || !Array.isArray(data)) return [];

    const replaceText = { 체험: " 체험", 및: " 및 " };
    return data.map((item) => {
      const newItem = { ...item };
      try {
        if (typeof newItem.program_nm === "string" && newItem.program_nm.includes(" 체험")) {
          return newItem;
        }
        newItem.program_nm = JSON.parse(newItem.program_nm)
          .map((v) => v.replace(/체험|및/g, (match) => replaceText[match] || match))
          .join(", ");
      } catch (error) {
        if (typeof newItem.program_nm === "string" && !newItem.program_nm.includes(" 체험")) {
          newItem.program_nm = newItem.program_nm.replace(/체험|및/g, (match) => replaceText[match] || match);
        }
      }
      return newItem;
    });
  }, []);

  // 전체 프로그램 목록 조회
  const fetchPrograms = useCallback(
    async (pageNum = 1, append = false) => {
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
          setError(result?.error || "데이터를 불러오는데 실패했습니다.");
          if (!append) {
            setPrograms([]);
          }
          setHasMore(false);
          return;
        }

        if (result.success) {
          // 검색 데이터 있으면 검색 데이터 사용, 없으면 전체 데이터 사용
          const data = searchData ? searchData : result.data || [];
          const processedData = processProgramData(data);

          if (append) {
            // 무한 스크롤: 기존 데이터에 추가
            setPrograms((prev) => [...prev, ...processedData]);
          } else {
            // 초기 로드: 데이터 교체
            setPrograms(processedData);
          }

          // hasMore 업데이트
          if (result.pagination) {
            const currentPage = result.pagination.page;
            const totalPages = result.pagination.totalPages;
            setHasMore(currentPage < totalPages);
          } else {
            setHasMore(processedData.length === 20);
          }
        } else {
          setError(result.error || "데이터를 불러오는데 실패했습니다.");
          if (!append) {
            setPrograms([]);
          }
          setHasMore(false);
        }
      } catch (err) {
        console.error("예상치 못한 오류:", err);
        setError("프로그램 목록을 불러오는 중 오류가 발생했습니다.");
        if (!append) {
          setPrograms([]);
        }
        setHasMore(false);
      } finally {
        isLoadingRef.current = false;
        setLoading(false);
      }
    },
    [searchData, processProgramData]
  );

  // ✅ searchData 변경 감지 및 처리
  useEffect(() => {
    if (searchData !== prevSearchDataRef.current) {
      prevSearchDataRef.current = searchData;

      if (searchData) {
        const processedData = processProgramData(searchData);
        setPrograms(processedData);
        setHasMore(false);
        setPage(1);
      } else {
        setPrograms([]);
        setPage(1);
        setHasMore(true);
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
        rootMargin: "100px",
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

  // ✅ 처리된 프로그램 데이터 메모이제이션
  const processedPrograms = useMemo(() => {
    return programs.map((data) => ({
      ...data,
      formattedDate: data.reqst_endde ? dayjs(data.reqst_endde).format("YYYY.MM.DD") : "",
    }));
  }, [programs]);

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

        <ListSearchBar setSearchData={setSearchData} setError={setError} />

        {error && <p className="list-error">{error}</p>}

        <div className="list-grid">
          {processedPrograms.map((data) => {
            const bookmarked = isBookmarked(String(data.id));

            return (
              <Link to={`/list/${data.id}`} className="list-card" key={data.id}>
                {/* 이미지 영역 */}
                <div className="list-card-img">
                  {data.images && data.images.length > 0 && (
                    <img src={getImagePath(data.images[0])} alt={data.program_nm} loading="lazy" />
                  )}

                  {/* ✅ hover 했을때만 뜨는 하트 버튼 */}
                  <button
                    type="button"
                    className={`list-heart-btn ${bookmarked ? "is-on" : ""}`}
                    aria-label={bookmarked ? "찜 해제" : "찜하기"}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggleBookmark(data);
                    }}
                  >
                    {bookmarked ? "♥" : "♡"}
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
