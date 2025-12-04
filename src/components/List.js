// src/components/List.js
import React from 'react';
import { Link } from 'react-router-dom';
import './List.css';
import { products } from './data/ListData';

function List({ farmData }) {
   console.log(farmData);
   return (
      <section className="list-wrap">
         <div className="list-inner">
            <h2 className="list-title">전체 체험 목록</h2>

            <div className="list-grid">
               {products.map((item) => (
                  <div className="list-card" key={item.id}>
                     {/* 이미지 영역 */}
                     <div className="list-card-img">
                        <img src={item.src || item.image} alt={item.title} />
                     </div>

                     {/* 텍스트 영역 */}
                     <div className="list-card-body">
                        <h3 className="list-title">{item.title}</h3>
                        <p className="list-sub">{item.subtitle}</p>
                        <p className="list-date">{item.date}</p>

                        {/* 버튼 영역 */}
                        <div className="list-btn-wrap">
                           <button>
                              <Link to={`/list/${item.id}`} className="list-btn outline">
                                 상세보기
                              </Link>
                           </button>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </section>
   );
}

export default List;
