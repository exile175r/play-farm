// src/components/events/EventPage.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./EventPage.css";
import { getImagePath } from "../../utils/imagePath";
import { events, notices } from "../data/eventData";

function EventPage() {
  const [activeTab, setActiveTab] = useState("event");

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
        </div>

        <section className="pf-event-content">
          {activeTab === "event" ? <EventList events={events} /> : <NoticeList notices={notices} />}
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

            <div className="pf-event-body">
              <h3 className="pf-event-card-title">{item.title}</h3>
              <p className="pf-event-card-desc">{item.description || ""}</p>
              <p className="pf-event-card-date">{item.period}</p>
            </div>
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
