import React from 'react';
import './EventSection.css';
import { getImagePath } from '../utils/imagePath';

const events = [
   {
      id: 1,
      tag: 'Event',
      title: '딸기 수확 체험 오픈 기념',
      subTitle: '선착순 50명 1+1',
      image: getImagePath('/images/strbr.jpg'),
      items: [
         { name: '딸기 따기 체험권 (성인)', price: '18,000원' },
         { name: '딸기 따기 체험권 (어린이)', price: '12,000원' },
      ],
   },
   {
      id: 2,
      tag: 'Event',
      title: '가족과 함께하는 주말 농장투어',
      subTitle: '3가지 프로그램 패키지',
      image: getImagePath('/images/farm.jpg'),
      items: [
         { name: '트랙터 투어', price: '15,000원' },
         { name: '동물 먹이주기', price: '10,000원' },
         { name: '감자 캐기 체험', price: '20,000원' },
      ],
   },
   {
      id: 3,
      tag: 'Event',
      title: '겨울맞이 고구마 농장 체험',
      subTitle: '전원 2+2',
      image: getImagePath('/images/swtpott.jpg'),
      items: [
         { name: '고구마 무스 키링 만들기', price: '22,000원' },
         { name: '고구마 모형 케이크 만들기', price: '28,000원' },
      ],
   },
];

function EventSection() {
   return (
      <section className="event-section">
         <div className="event-header">
            <h2>진행 이벤트</h2>
            <p>지금만 즐길 수 있는 특별한 체험 혜택</p>
            <button className="more-btn">더 보기 ›</button>
         </div>

         <div className="event-list">
            {events.map((ev) => (
               <div key={ev.id} className="event-card">
                  <span className="event-tag">{ev.tag}</span>
                  <h3 className="event-title">{ev.title}</h3>
                  <p className="event-sub">{ev.subTitle}</p>

                  <img className="event-image" src={ev.image} alt={ev.title} />

                  <ul className="event-items">
                     {ev.items.map((item, idx) => (
                        <li key={idx}>
                           <span>{item.name}</span>
                           <strong>{item.price}</strong>
                        </li>
                     ))}
                  </ul>
               </div>
            ))}
         </div>
      </section>
   );
}

export default EventSection;
