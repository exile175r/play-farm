// src/components/events/EventDetail.js
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./EventDetail.css";
import { getImagePath } from "../../utils/imagePath";
import { events } from "../data/eventData";

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const event = events.find((item) => String(item.id) === String(id));

  if (!event) {
    return (
      <main className="pf-event-detail-page">
        <div className="pf-event-detail-inner">
          <p className="pf-event-detail-empty">해당 이벤트를 찾을 수 없습니다.</p>
          <button type="button" className="pf-event-detail-back-btn" onClick={() => navigate("/event")}>
            이벤트 목록으로 돌아가기
          </button>
        </div>
      </main>
    );
  }

  const isClosed = event.status === "종료";

  return (
    <main className="pf-event-detail-page">
      <div className="pf-event-detail-inner">
        <button type="button" className="pf-event-detail-back-btn" onClick={() => navigate("/event")}>
          ← 이벤트 목록으로
        </button>

        <section className="pf-event-detail-hero">
          <div className="pf-event-detail-banner">
            <img src={getImagePath(event.image)} alt={event.title} className="pf-event-detail-banner-img" />
            <span
              className={`pf-event-detail-badge ${
                isClosed ? "pf-event-detail-badge-closed" : "pf-event-detail-badge-ing"
              }`}
            >
              {isClosed ? "종료된 이벤트" : "진행 중"}
            </span>
          </div>

          <div className="pf-event-detail-info">
            {event.tag && <span className="pf-event-detail-tag">{event.tag}</span>}
            <h1 className="pf-event-detail-title">{event.title}</h1>
            {event.description && <p className="pf-event-detail-desc">{event.description}</p>}

            <dl className="pf-event-detail-meta">
              <div className="pf-event-detail-meta-row">
                <dt>이벤트 기간</dt>
                <dd>{event.period}</dd>
              </div>
              <div className="pf-event-detail-meta-row">
                <dt>진행 상태</dt>
                <dd>{event.status}</dd>
              </div>
            </dl>

            {event.notice && (
              <div className="pf-event-detail-notice">
                <h2>유의 사항</h2>
                <p>{event.notice}</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default EventDetail;
