// src/components/events/EventDetail.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./EventDetail.css";
import { getEventById } from "../../services/eventApi";
import { getImagePath } from "../../utils/imagePath";

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const result = await getEventById(id);
        if (result.success) {
          setEvent(result.data);
        } else {
          setError(result.message);
        }
      } catch (err) {
        console.error(err);
        // Show actual error message for debugging
        setError(err.message || "이벤트 정보를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchEvent();
    } else {
      setError("잘못된 접근입니다 (ID 없음).");
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return <div className="pf-event-detail-empty"><p>로딩 중...</p></div>;
  }

  if (error || !event) {
    return (
      <div className="pf-event-detail-empty">
        <p>{error || "이벤트를 찾을 수 없습니다."}</p>
        <p style={{ fontSize: '12px', color: '#999' }}>ID: {id}</p> {/* DEBUG INFO */}
        <button className="pf-btn" onClick={() => navigate('/events')}>뒤로가기</button>
      </div>
    );
  }

  // User requirement: "Title at the top is subtitle"
  // So we display event.subtitle as the main header title.
  // If subtitle is empty, we fallback to event.title.
  const displayTitle = event.subtitle || event.title;

  return (
    <main className="pf-event-detail-page">
      <div className="pf-event-detail-inner">
        <button className="pf-event-detail-back-btn" onClick={() => navigate('/events')}>
          <span>←</span> 목록으로
        </button>

        <header className="pf-event-detail-header">
          <span className={`pf-event-detail-badge ${event.status === '진행중' || event.status === 'ONGOING' ? 'pf-event-detail-badge-ing' : 'pf-event-detail-badge-closed'}`}>
            {event.status === 'ONGOING' ? '진행중' : event.status}
          </span>
          <h2 className="pf-event-detail-title">{displayTitle}</h2>
          <div className="pf-event-detail-meta">
            <div className="pf-event-detail-meta-row">
              <span className="pf-event-detail-meta-label">일정</span>
              <span className="pf-event-detail-meta-value">{event.period}</span>
            </div>
          </div>
        </header>

        <div className="pf-event-detail-body">
          {/* 3. 이미지 */}
          <div className="pf-event-detail-banner">
            <img src={getImagePath(event.image)} alt={displayTitle} className="pf-event-detail-banner-img" />
          </div>

          <div className="pf-event-detail-content">
            {/* 4. 상세 내용 */}
            {event.description ? (
              event.description.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))
            ) : (
              <p>상세 내용이 없습니다.</p>
            )}
          </div>
        </div>

        <div className="pf-event-detail-actions">
          <button className="pf-btn ghost" onClick={() => navigate('/events')}>목록으로</button>
        </div>
      </div>
    </main>
  );
}

export default EventDetail;
