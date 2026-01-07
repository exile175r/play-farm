// src/components/events/EventDetail.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./EventDetail.css";
import { fetchWithAuthAndRetry, basicFetch } from "../../utils/apiConfig"; // Use basicFetch for public GET
// import { events } from "../data/eventData"; // Remove static data

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
        const result = await basicFetch(`/api/events/${id}`);
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
    <main className="pf-event-detail">
      <div className="pf-container">
        <header className="pf-ed-head">
          <span className={`pf-badge ${event.status === '진행중' ? 'active' : ''}`}>{event.status}</span>
          <h2 className="pf-ed-title">{displayTitle}</h2>
          <p className="pf-ed-date">{event.period}</p>
        </header>

        <div className="pf-ed-body">
          <div className="pf-ed-img">
            {/* Use getImagePath utility if possible or just absolute path if starts with / */}
            <img src={event.image} alt={displayTitle} />
          </div>
          <div className="pf-ed-content">
            {/* User requirement: "Content below image is description" */}
            {event.description ? (
              event.description.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))
            ) : (
              <p>상세 내용이 없습니다.</p>
            )}
          </div>
        </div>

        <div className="pf-ed-actions">
          <button className="pf-btn ghost" onClick={() => navigate('/events')}>목록으로</button>
        </div>
      </div>

      <style>{`
            .pf-event-detail { padding: 60px 0; }
            .pf-event-detail-empty { text-align: center; padding: 100px 0; font-size: 18px; color: #666; }
            .pf-ed-head { text-align: center; margin-bottom: 40px; border-bottom: 1px solid #eee; padding-bottom: 30px; }
            .pf-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; background: #eee; color: #666; font-size: 14px; margin-bottom: 16px; }
            .pf-badge.active { background: #2ecc71; color: #fff; }
            .pf-ed-title { font-size: 32px; margin-bottom: 12px; color: #333; }
            .pf-ed-date { font-size: 16px; color: #888; }
            .pf-ed-body { max-width: 800px; margin: 0 auto; }
            .pf-ed-img { margin-bottom: 40px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .pf-ed-img img { width: 100%; display: block; }
            .pf-ed-content { font-size: 18px; line-height: 1.8; color: #444; white-space: pre-wrap; margin-bottom: 60px; }
            .pf-ed-actions { text-align: center; padding-top: 40px; border-top: 1px solid #eee; }
         `}</style>
    </main>
  );
}

export default EventDetail;
