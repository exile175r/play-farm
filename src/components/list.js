import React from 'react';
import './list.css';
import { Link } from 'react-router-dom';
import { products } from './data/ListData';

function List() {
   return (
      <main className="list-wrap">
         <div className="list-inner">
            <section className="list-grid">
               {products.map((item) => (
                  <article key={item.id} className="list-card">
                     <div className="list-card-img">
                        <img src={item.image} alt={item.title} />
                     </div>

                     <div className="list-card-body">
                        <p className="list-title">{item.title}</p>
                        <p className="list-sub">{item.subtitle}</p>
                        <p className="list-date">{item.date}</p>
                        <div className="list-btn-wrap">
                           <button className="list-btn outline">
                              <Link to={`/list/${item.id}`} className="list-rtn-outline">
                                 상세보기
                              </Link>
                           </button>
                        </div>
                     </div>
                  </article>
               ))}
            </section>
         </div>
      </main>
   );
}

export default List;
