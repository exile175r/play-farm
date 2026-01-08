// src/components/lists/List.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Link 제거
import "./List.css";
import dayjs from "dayjs";
import { useBookmark } from "../../hooks/useBookmark";
import { getAllPrograms } from "../../services/programApi";
import { getImagePath } from "../../utils/imagePath";
import ListSearchBar from "./ListSearchBar";
import { useProgramParsing } from "../../hooks/useProgramParsing";

function List({ searchData, setSearchData }) {
  const navigate = useNavigate();

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

  // 체험명 가공 Hook
  const { parseProgramList } = useProgramParsing();

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
          if (!append) setPrograms([]);
          setHasMore(false);
          return;
        }

        if (result.success) {
          // 검색 데이터 있으면 검색 데이터 사용, 없으면 전체 데이터 사용
          const data = searchData ? searchData : result.data || [];
          const processedData = parseProgramList(data);

          if (append) {
            setPrograms((prev) => {
              // ID 기반 중복 제거
              const existingIds = new Set(prev.map(p => p.id));
              const uniqueNew = processedData.filter(p => !existingIds.has(p.id));
              return [...prev, ...uniqueNew];
            });
          } else {
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
          if (!append) setPrograms([]);
          setHasMore(false);
        }
      } catch (err) {
        console.error("예상치 못한 오류:", err);
        setError("프로그램 목록을 불러오는 중 오류가 발생했습니다.");
        if (!append) setPrograms([]);
        setHasMore(false);
      } finally {
        isLoadingRef.current = false;
        setLoading(false);
      }
    },
    [searchData, parseProgramList]
  );

  // ✅ searchData 변경 감지 및 초기 로딩 통합
  useEffect(() => {
    // 검색 모드일 때
    if (searchData) {
      const processedData = parseProgramList(searchData);
      setPrograms(processedData);
      setHasMore(false);
      setPage(1);
      // 검색 모드에서는 스크롤 리스너 차단이 필요하므로 loading/isLoadingRef와 무관하게 동작
    } else {
      // 일반 목록 모드일 때 (초기 진입 또는 검색 취소 시)
      // 기존에 데이터가 없고 로딩중이 아니라면 초기 데이터 로드
      // 단, 검색 취소 직후라면 prevSearchDataRef 체크 등으로 판단할 수 있으나,
      // 여기서는 그냥 searchData가 없으면 page=1부터 다시 로드하도록 단순화
      // (기존 데이터가 있어도 덮어써야 함)

      // 검색어가 지워졌을 때(null이 되었을 때)만 실행하거나, 
      // 컴포넌트 마운트 시 실행.
      // 이를 위해 별도의 flag나 ref를 쓸 수도 있지만, 
      // searchData가 null이 되는 순간 fetchPrograms(1, false)를 호출.

      fetchPrograms(1, false);
      setPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchData]); // parseProgramList, fetchPrograms는 deps에서 제외하여 불필요한 호출 방지

  // 중복 데이터를 걸러내기 위한 헬퍼 (append 시 사용)
  const mergePrograms = (prev, next) => {
    const existingIds = new Set(prev.map(p => p.id));
    const filteredNext = next.filter(p => !existingIds.has(p.id));
    return [...prev, ...filteredNext];
  };

  // ✅ 무한 스크롤: Intersection Observer로 스크롤 감지
  useEffect(() => {
    if (searchData || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !isLoadingRef.current) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchPrograms(nextPage, true);
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
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
              <div className="list-card" key={data.id}>
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

                  {/* ✅ "상세보기" 버튼만 이동 */}
                  <button type="button" className="list-detail-btn" onClick={() => navigate(`/list/${data.id}`)}>
                    상세보기
                  </button>
                </div>
              </div>
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
