// src/components/EventPage.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./EventPage.css";
import { getImagePath } from "../../utils/imagePath";
import { events, notices } from "../data/eventData";

function EventPage() {
  const [activeTab, setActiveTab] = useState("event");

  return (
    <main className="pf-event-page">
      <div className="pf-event-inner">
        <div className="pf-event-tabs">
          <button
            type="button"
            className={`pf-event-tab-btn ${activeTab === "event" ? "is-active" : ""}`}
            onClick={() => setActiveTab("event")}
          >
            이벤트
          </button>
          <button
            type="button"
            className={`pf-event-tab-btn ${activeTab === "notice" ? "is-active" : ""}`}
            onClick={() => setActiveTab("notice")}
          >
            공지사항
          </button>
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
            <div className="pf-event-banner">
              <img src={getImagePath(item.image)} alt={item.title} className="pf-event-banner-img" />

              {item.status === "종료" && <div className="pf-event-closed-overlay">이벤트 종료</div>}
            </div>
          </article>
        </Link>
      ))}
    </div>
  );
}

/* ===== 공지사항 리스트 ===== */
function NoticeList({ notices }) {
  if (!notices || notices.length === 0) {
    return <p className="pf-event-empty">등록된 공지사항이 없어요.</p>;
  }

  return (
    <ul className="pf-notice-list">
      {notices.map((item) => (
        <li key={item.id} className="pf-notice-item">
          <div className="pf-notice-main">
            <span className="pf-notice-tag">{item.tag}</span>
            <span className="pf-notice-title">{item.title}</span>
          </div>
          <span className="pf-notice-date">{item.date}</span>
        </li>
      ))}
    </ul>
  );
}

export default EventPage;
