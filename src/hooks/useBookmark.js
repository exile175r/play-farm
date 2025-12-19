import { useState, useEffect, useCallback, useMemo } from 'react';
import { toggleBookmark as toggleBookmarkApi, checkBookmark, checkBookmarks } from '../services/bookmarkApi';

/**
 * 북마크 기능을 관리하는 커스텀 훅
 * @param {Array<number>} programIds - 북마크 상태를 확인할 프로그램 ID 배열 (선택)
 * @returns {Object} 북마크 관련 상태와 함수들
 */
export const useBookmark = (programIds = []) => {
  // 로그인 여부 확인
  const isLoggedIn = useMemo(() => !!localStorage.getItem('token'), []);

  // 북마크된 프로그램 ID Set
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());

  // 로딩 상태
  const [loading, setLoading] = useState(false);

  // ✅ programIds를 문자열로 변환 (의존성 배열용)
  const programIdsKey = useMemo(() => {
    if (!Array.isArray(programIds) || programIds.length === 0) return '';
    return JSON.stringify([...programIds].sort((a, b) => a - b));
  }, [programIds]);

  // ✅ programIdsKey를 파싱하여 안정화된 배열 생성
  const stableProgramIds = useMemo(() => {
    if (!programIdsKey) return [];
    try {
      return JSON.parse(programIdsKey);
    } catch {
      return [];
    }
  }, [programIdsKey]); // programIdsKey만 의존성으로 사용

  // ✅ 프로그램 목록의 북마크 상태 일괄 로드
  useEffect(() => {
    if (!isLoggedIn || stableProgramIds.length === 0) {
      setBookmarkedIds(new Set());
      return;
    }

    const loadBookmarks = async () => {
      try {
        setLoading(true);
        const result = await checkBookmarks(stableProgramIds);
        if (result.success) {
          setBookmarkedIds(new Set(result.data.bookmarkedIds));
        }
      } catch (error) {
        console.error('북마크 상태 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBookmarks();
  }, [isLoggedIn, stableProgramIds]); // stableProgramIds를 의존성으로 사용

  // ✅ 특정 프로그램의 북마크 여부 확인
  const isBookmarked = useCallback(
    (programId) => {
      if (!programId) return false;
      return bookmarkedIds.has(Number(programId));
    },
    [bookmarkedIds]
  );

  // ✅ 북마크 토글 (추가/삭제)
  const toggleBookmark = useCallback(
    async (programId, programData = null) => {
      if (!programId) return { success: false, message: '프로그램 ID가 필요합니다.' };

      // 로그인하지 않은 경우
      if (!isLoggedIn) {
        return {
          success: false,
          message: '북마크 기능을 사용하려면 로그인이 필요합니다.',
          requiresLogin: true
        };
      }

      try {
        setLoading(true);
        const result = await toggleBookmarkApi(programId);

        if (result.success) {
          // 북마크 상태 업데이트
          setBookmarkedIds((prev) => {
            const next = new Set(prev);
            if (result.data.isBookmarked) {
              next.add(Number(programId));
            } else {
              next.delete(Number(programId));
            }
            return next;
          });

          return result;
        }

        return result;
      } catch (error) {
        console.error('북마크 토글 실패:', error);
        return {
          success: false,
          message: error.message || '북마크 처리에 실패했습니다.'
        };
      } finally {
        setLoading(false);
      }
    },
    [isLoggedIn]
  );

  // ✅ 특정 프로그램의 북마크 상태만 로드 (단일 프로그램용)
  const loadBookmarkStatus = useCallback(
    async (programId) => {
      if (!isLoggedIn || !programId) {
        setBookmarkedIds(new Set());
        return;
      }

      try {
        setLoading(true);
        const result = await checkBookmark(programId);
        if (result.success) {
          setBookmarkedIds((prev) => {
            const next = new Set(prev);
            if (result.data.isBookmarked) {
              next.add(Number(programId));
            } else {
              next.delete(Number(programId));
            }
            return next;
          });
        }
      } catch (error) {
        console.error('북마크 상태 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    },
    [isLoggedIn]
  );

  return {
    // 상태
    bookmarkedIds,
    isBookmarked,
    isLoggedIn,
    loading,
    // 함수
    toggleBookmark,
    loadBookmarkStatus
  };
};