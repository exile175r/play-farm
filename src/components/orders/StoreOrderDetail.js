// src/components/orders/StoreOrderDetail.js
import React, { useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import dayjs from 'dayjs';
import './StoreOrderDetail.css';

import { readOrderById, cancelOrder, refundOrder } from '../../utils/orderStorage';

function StoreOrderDetail() {
   const navigate = useNavigate();
   const { orderId } = useParams();

   const isLoggedIn = !!localStorage.getItem('token');

   const [tick, setTick] = useState(0); // 상태 변경 후 리렌더용

   const order = useMemo(() => {
      // tick을 의존성으로 걸어 상태변경 즉시 반영
      void tick;
      return readOrderById(orderId);
   }, [orderId, tick]);

   const items = useMemo(() => (Array.isArray(order?.items) ? order.items : []), [order]);

   const totalQty = useMemo(() => items.reduce((acc, it) => acc + Number(it.qty || 0), 0), [items]);

   const statusText = (s) => {
      if (s === 'PAID') return '결제 완료';
      if (s === 'CANCELLED') return '취소';
      if (s === 'REFUNDED') return '환불됨';
      return '처리중';
   };

   const canCancel = order?.status === 'PAID'; // 결제완료만 취소 가능(데모)
   const canRefund = order?.status === 'PAID' || order?.status === 'CANCELLED'; // 취소 후 환불 가능(데모)

   const onCancel = () => {
      if (!order) return;
      if (!canCancel) return;

      if (!window.confirm('주문을 취소하시겠습니까?')) return;

      const res = cancelOrder(order.orderId, '사용자 요청');
      if (!res?.success) {
         alert('주문 취소에 실패했습니다. 잠시 후 다시 시도해 주세요.');
         return;
      }

      alert('주문이 취소되었습니다.');
      setTick((v) => v + 1);
   };

   const onRefund = () => {
      if (!order) return;
      if (!canRefund) return;

      if (!window.confirm('환불 처리하시겠습니까?')) return;

      const res = refundOrder(order.orderId, '사용자 요청');
      if (!res?.success) {
         alert('환불 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.');
         return;
      }

      alert('환불 처리가 완료되었습니다.');
      setTick((v) => v + 1);
   };

   if (!isLoggedIn) {
      return (
         <main className="sod-wrap">
            <div className="sod-inner">
               <h2 className="sod-title">주문 상세</h2>
               <p className="sod-muted">로그인 후 확인하실 수 있습니다.</p>
               <button className="sod-btn" type="button" onClick={() => navigate('/user/login')}>
                  로그인
               </button>
            </div>
         </main>
      );
   }

   if (!order) {
      return (
         <main className="sod-wrap">
            <div className="sod-inner">
               <h2 className="sod-title">주문 상세</h2>
               <p className="sod-muted">주문 정보를 찾을 수 없습니다.</p>
               <button className="sod-btn" type="button" onClick={() => navigate('/mypage', { state: { openTab: 'store_orders' } })}>
                  주문내역으로 이동
               </button>
            </div>
         </main>
      );
   }

   return (
      <main className="sod-wrap">
         <div className="sod-inner">
            <div className="sod-head">
               <div>
                  <h2 className="sod-title">주문 상세</h2>
                  <p className="sod-sub">
                     주문번호: <b>{order.orderId}</b>
                     {' · '}주문일: {order.createdAt ? dayjs(order.createdAt).format('YYYY.MM.DD HH:mm') : '-'}
                  </p>
               </div>

               <div className={`sod-chip ${order.status === 'PAID' ? 'is-ok' : order.status === 'REFUNDED' ? 'is-refund' : 'is-cancel'}`}>{statusText(order.status)}</div>
            </div>

            {/* 요약 */}
            <section className="sod-card">
               <h4 className="sod-card-title">결제 요약</h4>
               <div className="sod-row">
                  <span className="k">결제 금액</span>
                  <span className="v">{Number(order.amount || 0).toLocaleString()}원</span>
               </div>
               <div className="sod-row">
                  <span className="k">결제 수단</span>
                  <span className="v">{order.payMethod || '-'}</span>
               </div>
               <div className="sod-row">
                  <span className="k">총 수량</span>
                  <span className="v">{totalQty}개</span>
               </div>
            </section>

            {/* 구매자 */}
            <section className="sod-card">
               <h4 className="sod-card-title">구매자 정보</h4>
               <div className="sod-row">
                  <span className="k">성함</span>
                  <span className="v">{order.buyer?.name || '-'}</span>
               </div>
               <div className="sod-row">
                  <span className="k">연락처</span>
                  <span className="v">{order.buyer?.phone || '-'}</span>
               </div>
               <div className="sod-row">
                  <span className="k">이메일</span>
                  <span className="v">{order.buyer?.email || '-'}</span>
               </div>
            </section>

            {/* 상품 목록 */}
            <section className="sod-card">
               <h4 className="sod-card-title">상품 목록</h4>

               {items.length === 0 ? (
                  <p className="sod-muted">상품 정보가 없습니다.</p>
               ) : (
                  <ul className="sod-items">
                     {items.map((it, idx) => {
                        const line = Number(it.unitPrice ?? it.unitPrice === 0 ? it.unitPrice : it.unitPrice) || Number(it.unitPrice || 0);
                        const unitPrice = Number(it.unitPrice || it.unitPrice === 0 ? it.unitPrice : it.unitPrice) || Number(it.unitPrice || 0);

                        const fallbackUnit = Number(it.unitPrice || 0);
                        const showUnit = unitPrice || fallbackUnit || Number(it.unitPrice || 0);

                        const lineTotal =
                           (Number(it.unitPrice || it.unitPrice === 0 ? it.unitPrice : it.unitPrice) || Number(it.unitPrice || 0) || Number(it.unitPrice || 0)) *
                           Number(it.qty || 0);

                        // unitPrice가 없을 수도 있어서: unitPrice 대신 it.unitPrice/it.unitPrice가 없다면 총액 계산은 0될 수 있음
                        const safeLineTotal =
                           (Number(it.unitPrice || 0) || Number(it.unitPrice || 0) || Number(it.unitPrice || 0) || Number(it.unitPrice || 0) || Number(it.unitPrice || 0)) > 0
                              ? (Number(it.unitPrice || 0) || Number(it.unitPrice || 0) || Number(it.unitPrice || 0)) * Number(it.qty || 0)
                              : Number(it.unitPrice || 0) * Number(it.qty || 0);

                        // ✅ CheckoutPage에서 items에 unitPrice로 저장했으니 대부분 정상
                        const finalLineTotal = (Number(it.unitPrice || 0) || Number(it.unitPrice || 0) || 0) * Number(it.qty || 0);

                        return (
                           <li key={`${order.orderId}_${idx}`} className="sod-item">
                              <div className="sod-item-left">
                                 <div className="sod-item-title">{it.title || `상품 #${it.productId}`}</div>
                                 <div className="sod-item-sub">
                                    {it.optionName ? `옵션: ${it.optionName} · ` : ''}
                                    수량: {it.qty}개
                                 </div>
                                 <div className="sod-item-actions">
                                    <Link className="sod-link" to={`/shop/${it.productId}`}>
                                       상품 상세로 이동
                                    </Link>
                                 </div>
                              </div>

                              <div className="sod-item-right">
                                 <div className="sod-item-price">{Number(it.unitPrice || 0).toLocaleString()}원</div>
                                 <div className="sod-item-total">{(Number(it.unitPrice || 0) * Number(it.qty || 0)).toLocaleString()}원</div>
                              </div>
                           </li>
                        );
                     })}
                  </ul>
               )}
            </section>

            {/* 액션 */}
            <div className="sod-actions">
               <button type="button" className={`sod-btn ghost`} onClick={() => navigate('/mypage', { state: { openTab: 'store_orders' } })}>
                  주문내역으로
               </button>

               <button type="button" className={`sod-btn ${canCancel ? '' : 'is-disabled'}`} onClick={onCancel} disabled={!canCancel}>
                  주문 취소
               </button>

               <button type="button" className={`sod-btn danger ${canRefund ? '' : 'is-disabled'}`} onClick={onRefund} disabled={!canRefund}>
                  환불 처리
               </button>
            </div>
         </div>
      </main>
   );
}

export default StoreOrderDetail;
