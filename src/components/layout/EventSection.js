// src/components/layout/EventSection.js
import React from 'react';
import { Link } from 'react-router-dom';
import './EventSection.css';
import { getImagePath } from '../../utils/imagePath';
import { events } from '../data/eventData';

function EventSection() {
   // 종료 아닌 이벤트만, 최대 3개
   const featuredEvents = Array.isArray(events) ? events.filter((ev) => ev.status !== '종료').slice(0, 3) : [];

   if (!featuredEvents.length) return null;

   return (
      <section className="home-event-section">
         <div className="pf-container">
            <header className="home-event-head">
               <div>
                  <p className="home-event-eyebrow">Event · Notice</p>
                  <h2 className="home-event-title">진행 중인 이벤트</h2>
               </div>

               <Link to="/events" className="home-event-link">
                  이벤트·공지 전체 보기 ›
               </Link>
            </header>

            <div className="home-event-grid">
               {featuredEvents.map((item) => (
                  <Link key={item.id} to={`/event/${item.id}`} className="home-event-card-link">
                     <article className="home-event-card">
                        <img src={getImagePath(item.image)} alt={item.title} className="home-event-img" loading="lazy" />
                     </article>
                  </Link>
               ))}
            </div>
         </div>
      </section>
   );
}

export default EventSection;
