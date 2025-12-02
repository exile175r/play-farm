// src/components/List.js
import React from 'react';
import { Link } from 'react-router-dom';
import './List.css';
import { products } from './data/ListData';

function List() {
   return (
      <section className="list">
         <div className="list-inner">
            <h2 className="list-title">전체 체험 목록</h2>

            <div className="list-grid">
               {products.map((item) => (
                  <Link to={`/list/${item.id}`} className="list-card" key={item.id}>
                     <div className="list-thumb">
                        <img src={item.src || item.image} alt={item.title} />
                     </div>

                     <div className="list-info">
                        <h3 className="list-name">{item.title}</h3>
                        <p className="list-sub">{item.subtitle}</p>
                        <span className="list-date">{item.date}</span>
                     </div>
                  </Link>
               ))}
            </div>
         </div>
      </section>
   );
}

export default List;
