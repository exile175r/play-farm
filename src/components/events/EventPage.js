import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./EventPage.css";
import { getImagePath } from "../../utils/imagePath";
import { getAllEvents } from "../../services/eventApi";
import { getAllNotices } from "../../services/noticeApi";

function EventPage() {
  const [activeTab, setActiveTab] = useState("event");
  const [events, setEvents] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [eventRes, noticeRes] = await Promise.all([
          getAllEvents({ status: 'ONGOING' }), // Only ongoing for public? or ALL? Let's show ALL but potentially filter in UI or backend. Usually public shows Ongoing + maybe Ended.
          getAllNotices()
        ]);

        if (eventRes.success) {
          setEvents(eventRes.data || []);
        }
        if (noticeRes.success) setNotices(noticeRes.data || []);
      } catch (err) {
        console.error("데이터 로드 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <main className="pf-page pf-event-page">
      <div className="pf-container pf-event-inner">
        <header className="pf-head pf-event-head">
          <h2 className="pf-title-lg pf-event-title">이벤트·공지</h2>
          <div className="pf-divider" />
        </header>

        <div className="pf-event-tabs">
          <div className="pf-event-tab-left">
            <button
              type="button"
              className={`pf-event-tab-btn ${activeTab === "event" ? "is-active" : ""}`}
              onClick={() => setActiveTab("event")}
            >
              이벤트
            </button>
            <span className="pf-event-sep">|</span>
            <button
              type="button"
              className={`pf-event-tab-btn ${activeTab === "notice" ? "is-active" : ""}`}
              onClick={() => setActiveTab("notice")}
            >
              공지사항
            </button>
          </div>

          <p className="pf-event-count">
            총 {activeTab === "event" ? events.length : notices.length}개의{" "}
            {activeTab === "event" ? "이벤트" : "공지사항"}이 있습니다.
          </p>
          {/* DEBUG: Render raw data check */}
          {/* <div style={{display: 'none'}}>{JSON.stringify(events)}</div> */}
        </div>

        <section className="pf-event-content">
          {loading ? (
            <p style={{ textAlign: 'center', padding: '50px' }}>로딩 중...</p>
          ) : (
            activeTab === "event" ? <EventList events={events} /> : <NoticeList notices={notices} />
          )}
        </section>
      </div>
    </main>
  );
}

/* ===== 이벤트 리스트 ===== */
function EventList({ events }) {
  if (!events || events.length === 0) {
    return <p className="pf-event-empty">진행 중인 이벤트가 없어요.</p>;
  }

  return (
    <div className="pf-event-grid">
      {events.map((item) => (
        <Link key={item.id} to={`/event/${item.id}`} className="pf-event-card-link">
          <article className={`pf-event-card ${item.status === "종료" ? "is-closed" : ""}`}>
            {/* ✅ 오버레이를 카드(article) 바로 아래로 빼서 "카드 전체"를 덮게 함 */}
            {item.status === "종료" && <div className="pf-event-closed-overlay">이벤트 종료</div>}

            <div className="pf-event-banner">
              <img src={getImagePath(item.image)} alt={item.title} className="pf-event-banner-img" />
            </div>

            {/* <div className="pf-event-body">
              <p className="pf-event-card-desc" style={{ fontSize: '15px', fontWeight: '500', color: '#333' }}>
                {item.description || item.title}
              </p>
              <p className="pf-event-card-date">{item.period}</p>
            </div> */}
          </article>
        </Link>
      ))}
    </div>
  );
}

/* ===== 공지사항 리스트(아코디언) ===== */
function NoticeList({ notices }) {
  const [openId, setOpenId] = useState(null);

  const toggle = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  if (!notices || notices.length === 0) {
    return <p className="pf-event-empty">등록된 공지사항이 없어요.</p>;
  }

  return (
    <ul className="pf-notice-list">
      {notices.map((item) => {
        const isOpen = openId === item.id;

        return (
          <li key={item.id} className={`pf-notice-item ${isOpen ? "is-open" : ""}`}>
            <button type="button" className="pf-notice-head" onClick={() => toggle(item.id)}>
              <div className="pf-notice-main">
                <span className="pf-notice-tag">{item.tag}</span>
                <span className="pf-notice-title">{item.title}</span>
              </div>

              <div className="pf-notice-right">
                <span className="pf-notice-date">{item.date}</span>
                <span className={`pf-notice-arrow ${isOpen ? "is-open" : ""}`} aria-hidden="true">
                  ▾
                </span>
              </div>
            </button>

            <div className="pf-notice-body">
              <p className="pf-notice-content">{item.content || "내용이 아직 없어요."}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default EventPage;
