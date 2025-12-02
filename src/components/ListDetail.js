// src/components/ListDetail.js
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { products } from './data/ListData';
import './ListDetail.css';

function ListDetail() {
   const { id } = useParams();
   const item = products.find((p) => p.id === Number(id));

   if (!item) {
      return (
         <div className="detail-wrap">
            <p>존재하지 않는 체험상품.</p>
            <Link to="/" className="detail-back">
               뒤로가기
            </Link>
         </div>
      );
   }

   return (
      <section className="detail-wrap">
         <div className="detail-inner">
            <div className="detail-top">
               {/* 이미지 불러오기 */}
               <div className="detail-img">
                  <img src={item.src || item.image} alt={item.title} />
               </div>

               <div className="detail-info">
                  <p className="detail-label">{item.subtitle}</p>
                  <h1 className="detail-title">{item.title}</h1>
                  <p className="detail-date">{item.date}</p>

                  <div className="detail-btns">
                     <Link to="/" className="detail-btn outline">
                        돌아가기
                     </Link>
                     <button className="detail-btn primary">예약하기</button>
                  </div>
               </div>
            </div>

            <div className="detail-body">
               <h2>상세 설명</h2>
               <p>이 상품의 상세 설명이 여기에 들어갑니다.</p>
            </div>
         </div>
      </section>
   );
}

export default ListDetail;
