// src/components/List.js
import React from 'react';
import { Link } from 'react-router-dom';
import './List.css';
import { products } from './data/ListData';

function List() {
   return (
      <section className="list-wrap">
         <div className="list-inner">
            <h2 className="list-title">전체 체험 목록</h2>

            <div className="list-grid">
               {products.map((item) => (
                  <div className="list-card" key={item.id}>
                     <div className="list-card-img">
                        <img src={item.src || item.image} alt={item.title} />
                     </div>

                     <div className="list-card-body">
                        <h3 className="list-title">{item.title}</h3>
                        <p className="list-sub">{item.subtitle}</p>
                        <p className="list-date">{item.date}</p>
                        <div className="list-btn-wrap">
                           <Link to={`/list/${item.id}`} className="list-btn outline">
                              상세보기
                           </Link>
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
