import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { products } from './data/ListData';
import './ListDetail.css';

function ListDetail() {
   const { id } = useParams();
   console.log('id: ', id);
   const product = products.find((item) => item.id === Number(id));

   if (!product) {
      return (
         <main className="detail-wrap">
            <div className="detail-inner">
               <p>존재하지 않는 체험 상품.</p>
               <Link to="/list" className="detail-back">
                  목록으로 돌아가기
               </Link>
            </div>
         </main>
      );
   }

   return (
      <main className="detail-wrap">
         <div className="detail-inner">
            <section className="detail-top">
               <div className="detail-img">
                  <img src={product.image} alt={product.title} />
               </div>

               <div className="detail-info">
                  <p className="detail-label">체험 프로그램</p>
                  <h1 className="detail-title">{product.title}</h1>
                  <p className="detail-sub">{product.subtitle}</p>
                  <p className="detail-date">{product.date}</p>

                  <div className="detail-btns">
                     <button className="detail-btn primary">예약하기</button>
                  </div>
               </div>
            </section>

            <section className="detail-body">
               <h2>상세 설명</h2>
               <p>{product.description || '상세 설명 준비 중입니다.'}</p>
            </section>
         </div>
      </main>
   );
}

export default ListDetail;
