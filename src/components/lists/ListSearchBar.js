// src/components/lists/ListSearchBar.js
import React, { useState } from "react";
import "./ListSearchBar.css";
import { getApiBaseUrl } from '../../utils/apiConfig';

function ListSearchBar({ setSearchData, setError }) {
  const [keyword, setKeyword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const q = keyword.trim();

    // ✅ 빈 값이면 검색 해제
    if (!q) {
      setSearchData(null);
      return;
    }

    setSubmitting(true);
    setError?.(null);

    try {
      // ✅ TODO: 너 서버 검색 라우트로 맞추기
      // 예: /programs/search, /api/programs/search, /api/search/programs 등
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}/programs/search?keyword=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error("검색 API 응답 실패");

      const json = await res.json();

      // 응답 형태 흡수: 배열 / {data: []} / {success, data: []}
      const list = Array.isArray(json)
        ? json
        : Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json?.result)
            ? json.result
            : Array.isArray(json?.data?.data)
              ? json.data.data
              : [];

      setSearchData(list);
    } catch (err) {
      console.error(err);
      setError?.("검색 중 오류가 발생했습니다.");
      setSearchData([]); // 결과 없음 처리
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setKeyword("");
    setError?.(null);
    setSearchData(null);
  };

  return (
    <form className="list-search" onSubmit={submit}>
      <input
        type="search"
        className="list-search-input"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="체험 검색"
        aria-label="체험 검색"
      />
      <button className="list-search-btn" type="submit" disabled={submitting}>
        {submitting ? "검색중" : "검색"}
      </button>
      <button className="list-search-btn is-ghost" type="button" onClick={reset}>
        초기화
      </button>
    </form>
  );
}

export default ListSearchBar;
