// src/components/events/EventDetail.js
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./EventDetail.css";
import { events } from "../data/eventData";

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const event = events.find((e) => e.id === parseInt(id));

  // Mock descriptions for better content
  const descriptions = {
    1: "겨울 시즌을 맞아 플레이팜에서 특별한 이벤트를 준비했습니다.\n가족과 함께 따뜻한 추억을 만들어보세요.",
    2: "지난 시즌 많은 사랑을 받았던 체험 프로그램이 종료되었습니다.\n다음 시즌에 더 좋은 모습으로 찾아뵙겠습니다.",
    3: "신규 회원가입 시 2,000 포인트를 즉시 지급해 드립니다.\n지금 바로 가입하고 혜택을 받아보세요!",
    4: "리뷰를 작성해주신 분들 중 추첨을 통해 선물을 드립니다.\n정성스러운 후기를 남겨주세요.",
    5: "주말 한정 특별 할인 이벤트가 진행됩니다.\n최대 30% 할인된 가격으로 체험을 즐겨보세요."
  };

  // Mock titles
  const titles = {
    1: "겨울바람, 따뜻한 추억",
    2: "가을 수확 체험 종료",
    3: "신규 가입 웰컴 이벤트",
    4: "베스트 리뷰어 도전",
    5: "주말 반짝 할인"
  };

  if (!event) {
    return (
      <div className="pf-event-detail-empty">
        <p>이벤트를 찾을 수 없습니다.</p>
        <button className="pf-btn" onClick={() => navigate(-1)}>뒤로가기</button>
      </div>
    );
  }

  const desc = descriptions[event.id] || "이벤트 상세 내용입니다.";
  const title = titles[event.id] || `이벤트 #${event.id}`;

  return (
    <main className="pf-event-detail">
      <div className="pf-container">
        <header className="pf-ed-head">
          <span className={`pf-badge ${event.status === '진행중' ? 'active' : ''}`}>{event.status}</span>
          <h2 className="pf-ed-title">{title}</h2>
          <p className="pf-ed-date">2025.12.01 ~ 2025.12.31</p>
        </header>

        <div className="pf-ed-body">
          <div className="pf-ed-img">
            <img src={event.image || `/images/events/event (${event.id}).png`} alt={title} />
          </div>
          <div className="pf-ed-content">
            {desc.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
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
