// src/components/EventPage.js
import React from 'react';
import './EventPage.css';
import { eventSections } from './data/eventData';

function EventPage() {
   return (
      <main className="pf-event-page">
         <div className="pf-event-inner">
            {eventSections.map((section) => (
               <div className="pf-event-group" key={section.id}>
                  <h2 className="pf-event-section-title">{section.title}</h2>

                  <div className="pf-event-row">
                     {section.items.map((item) => (
                        <div className="pf-event-card" key={item.id}>
                           <div className="pf-event-card-top">
                              <h3 className="pf-event-title">
                                 <span>{item.titleLine1}</span>
                                 <span>{item.titleLine2}</span>
                              </h3>

                              <p className="pf-event-subtitle">{item.subText}</p>
                           </div>

                           <div className="pf-event-thumb">
                              <img src={item.image} alt={item.titleLine1} className="pf-event-image" />
                           </div>

                           <div className="pf-event-bottom">
                              <div className="pf-event-bottom-left">
                                 <span className="pf-event-tag">{item.tag}</span>
                                 <span className="pf-event-unit-text">{item.unit}</span>
                              </div>

                              <div className="pf-event-bottom-right">
                                 <span className="pf-event-price">{item.price.toLocaleString()}원</span>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            ))}
         </div>
      </main>
   );
}

export default EventPage;
