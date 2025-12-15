import React, { useMemo, useState } from "react";
import "./Mypage.css";

function Mypage() {
  const [tab, setTab] = useState("profile");

  // token/user는 서버 붙기 전까지 localStorage로 임시 처리
  const token = localStorage.getItem("token");
  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  // 임시 데이터(서버 붙이면 API로 교체)
  const reservations = [
    { id: 1, title: "겨울 딸기 수확 체험", date: "2025-12-20", status: "예약완료" },
    { id: 2, title: "쿠키 만들기 패키지", date: "2025-12-28", status: "대기중" },
  ];

  const myPosts = [
    { id: 1, title: "딸기 체험 후기", date: "2025-12-01" },
    { id: 2, title: "농장 추천 코스 공유", date: "2025-12-05" },
  ];

  // 로그인 보호는 App에서 PrivateRoute로 하고 있으니까 여기선 UI만
  const displayName = user?.name || user?.user_id || "로그인 사용자";
  const displayId = user?.user_id || "unknown_id";

  return (
    <main className="pf-mypage">
      <div className="pf-mypage-inner">
        <header className="pf-mypage-head">
          <div>
            <h2 className="pf-mypage-title">마이페이지</h2>
            <p className="pf-mypage-sub">
              {token ? "로그인 상태" : "토큰 없음(원래는 접근 불가)"} · {displayName}
            </p>
          </div>

          <div className="pf-mypage-badges">
            <span className="pf-badge">회원</span>
            <span className="pf-badge is-accent">Play Farm</span>
          </div>
        </header>

        <div className="pf-mypage-grid">
          {/* Left */}
          <aside className="pf-mypage-left">
            <div className="pf-profile-card">
              <div className="pf-avatar">{displayName?.slice(0, 1)}</div>
              <div className="pf-profile-info">
                <p className="pf-profile-name">{displayName}</p>
                <p className="pf-profile-id">ID: {displayId}</p>
                <p className="pf-profile-desc">예약/후기/설정 관리</p>
              </div>
            </div>

            <nav className="pf-tabs">
              <button
                type="button"
                className={`pf-tab ${tab === "profile" ? "is-active" : ""}`}
                onClick={() => setTab("profile")}
              >
                내 정보
              </button>
              <button
                type="button"
                className={`pf-tab ${tab === "reservations" ? "is-active" : ""}`}
                onClick={() => setTab("reservations")}
              >
                예약/신청 내역
              </button>
              <button
                type="button"
                className={`pf-tab ${tab === "posts" ? "is-active" : ""}`}
                onClick={() => setTab("posts")}
              >
                내가 쓴 글
              </button>
              <button
                type="button"
                className={`pf-tab ${tab === "settings" ? "is-active" : ""}`}
                onClick={() => setTab("settings")}
              >
                설정
              </button>
            </nav>
          </aside>

          {/* Right */}
          <section className="pf-mypage-right">
            {tab === "profile" && (
              <div className="pf-panel">
                <h3 className="pf-panel-title">내 정보</h3>
                <p className="pf-panel-desc">서버 붙이면 여기서 /users/me 같은 API로 진짜 정보 뿌리면 됨.</p>

                <div className="pf-kv">
                  <div className="pf-kv-row">
                    <span className="pf-kv-key">이름</span>
                    <span className="pf-kv-val">{displayName}</span>
                  </div>
                  <div className="pf-kv-row">
                    <span className="pf-kv-key">아이디</span>
                    <span className="pf-kv-val">{displayId}</span>
                  </div>
                  <div className="pf-kv-row">
                    <span className="pf-kv-key">토큰</span>
                    <span className="pf-kv-val pf-mono">{token ? "저장됨" : "없음"}</span>
                  </div>
                </div>
              </div>
            )}

            {tab === "reservations" && (
              <div className="pf-panel">
                <h3 className="pf-panel-title">예약/신청 내역</h3>
                <p className="pf-panel-desc">임시 데이터. 실제 예약 테이블 붙이면 여기로.</p>

                <div className="pf-list">
                  {reservations.map((it) => (
                    <div className="pf-item" key={it.id}>
                      <div className="pf-item-main">
                        <p className="pf-item-title">{it.title}</p>
                        <p className="pf-item-sub">체험일: {it.date}</p>
                      </div>
                      <span className={`pf-chip ${it.status === "예약완료" ? "is-ok" : "is-wait"}`}>{it.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "posts" && (
              <div className="pf-panel">
                <h3 className="pf-panel-title">내가 쓴 글</h3>
                <p className="pf-panel-desc">후기/문의 같은 게시글 영역.</p>

                <ul className="pf-posts">
                  {myPosts.map((p) => (
                    <li className="pf-post" key={p.id}>
                      <div>
                        <p className="pf-post-title">{p.title}</p>
                        <p className="pf-post-date">{p.date}</p>
                      </div>
                      <button type="button" className="pf-linkbtn" onClick={() => alert("상세 연결은 나중에")}>
                        보기
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tab === "settings" && (
              <div className="pf-panel">
                <h3 className="pf-panel-title">설정</h3>
                <p className="pf-panel-desc">비번 변경/회원정보 수정/탈퇴</p>

                <div className="pf-actions">
                  <button
                    type="button"
                    className="pf-btn"
                    onClick={() => {
                      localStorage.removeItem("user");
                      alert("로컬 user 삭제 완료");
                    }}
                  >
                    로컬 user 삭제
                  </button>
                  <button
                    type="button"
                    className="pf-btn is-danger"
                    onClick={() => {
                      localStorage.removeItem("token");
                      localStorage.removeItem("user");
                      alert("토큰 삭제 완료(새로고침하면 로그아웃 상태)");
                    }}
                  >
                    토큰 삭제(강제 로그아웃)
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

export default Mypage;
