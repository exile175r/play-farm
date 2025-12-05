// src/components/EventPage.js
import React, { useState } from 'react';
import './EventPage.css';
import { events, notices } from './data/eventData';

function EventPage() {
   const [activeTab, setActiveTab] = useState('event');

   return (
      <main className="pf-event-page">
         <div className="pf-event-inner">
            {/* 상단 헤더 */}
            <header className="pf-event-header">
               <h1 className="pf-event-title">이벤트 · 공지</h1>
               <p className="pf-event-desc">Play Farm의 최신 이벤트와 공지사항.</p>
            </header>

            {/* 탭 영역 */}
            <div className="pf-event-tabs">
               <button type="button" className={`pf-event-tab-btn ${activeTab === 'event' ? 'is-active' : ''}`} onClick={() => setActiveTab('event')}>
                  이벤트
               </button>
               <button type="button" className={`pf-event-tab-btn ${activeTab === 'notice' ? 'is-active' : ''}`} onClick={() => setActiveTab('notice')}>
                  공지사항
               </button>
            </div>

            {/* 내용 영역 */}
            <section className="pf-event-content">{activeTab === 'event' ? <EventList events={events} /> : <NoticeList notices={notices} />}</section>
         </div>
      </main>
   );
}

// 이벤트 리스트
function EventList({ events }) {
   if (!events || events.length === 0) {
      return <p className="pf-event-empty">진행 중인 이벤트가 없어요.</p>;
   }

   return (
      <div className="pf-event-grid">
         {events.map((item) => (
            <article key={item.id} className="pf-event-card">
               <div className="pf-event-thumb">
                  {item.image && <img src={item.image} alt={item.title} />}
                  <span className={`pf-event-status ${item.status === '진행중' ? 'pf-event-status-on' : 'pf-event-status-off'}`}>{item.status}</span>
               </div>

               <div className="pf-event-body">
                  <span className="pf-event-tag">{item.tag}</span>
                  <h3 className="pf-event-card-title">{item.title}</h3>
                  <p className="pf-event-card-desc">{item.description}</p>
                  <p className="pf-event-period">기간 | {item.period}</p>
               </div>
            </article>
         ))}
      </div>
   );
}

// 공지 리스트
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
