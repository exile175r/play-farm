// src/components/orders/StoreOrderDetail.js
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import dayjs from 'dayjs';
import './StoreOrderDetail.css';

import { getOrderById as getUserOrderById, cancelOrder, refundOrder } from '../../services/orderApi';
import { getOrderById as getAdminOrderById } from '../../services/adminApi';
import { useLocation } from 'react-router-dom';

function StoreOrderDetail() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const location = useLocation();

  const isLoggedIn = !!localStorage.getItem('token');
  const isFromAdmin = location.state?.fromAdminOrders === true; // 관리자 페이지에서 온 경우

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 주문 상세 조회
  useEffect(() => {
    if (!isLoggedIn || !orderId) {
      setLoading(false);
      return;
    }

    const loadOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        // 관리자 페이지에서 온 경우 관리자용 API 사용
        const result = isFromAdmin
          ? await getAdminOrderById(orderId)
          : await getUserOrderById(orderId);

        if (result.success) {
          setOrder(result.data);
        } else {
          setError(result.error?.message || '주문 정보를 불러올 수 없습니다.');
        }
      } catch (err) {
        setError('주문 정보를 불러오는 중 오류가 발생했습니다.');
        console.error('주문 조회 오류:', err);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId, isLoggedIn, isFromAdmin]);

  const items = useMemo(() => {
    if (!order?.items) return [];
    // API 응답의 quantity를 qty로 매핑하여 기존 코드와 호환
    return order.items.map(item => ({
      ...item,
      qty: item.quantity || item.qty || 0
    }));
  }, [order]);

  const totalQty = useMemo(() => items.reduce((acc, it) => acc + Number(it.qty || it.quantity || 0), 0), [items]);

  const statusText = (s) => {
    if (s === 'PAID') return '결제 완료';
    if (s === 'CANCELLED') return '취소';
    if (s === 'REFUNDED') return '환불됨';
    return '처리중';
  };

  const canCancel = order?.status === 'PAID'; // 결제완료만 취소 가능(데모)
  const canRefund = order?.status === 'PAID' || order?.status === 'CANCELLED'; // 취소 후 환불 가능(데모)

  const onCancel = async () => {
    if (!order) return;
    if (!canCancel) return;

    if (!window.confirm('주문을 취소하시겠습니까?')) return;

    try {
      const res = await cancelOrder(order.orderId, '사용자 요청');
      if (!res?.success) {
        alert(res?.error?.message || '주문 취소에 실패했습니다. 잠시 후 다시 시도해 주세요.');
        return;
      }

      alert('주문이 취소되었습니다.');
      // 주문 정보 다시 불러오기
      const result = isFromAdmin
        ? await getAdminOrderById(orderId)
        : await getUserOrderById(orderId);
      if (result.success) {
        setOrder(result.data);
      }
    } catch (err) {
      console.error('주문 취소 오류:', err);
      alert('주문 취소 중 오류가 발생했습니다.');
    }
  };

  const onRefund = async () => {
    if (!order) return;
    if (!canRefund) return;

    if (!window.confirm('환불 처리하시겠습니까?')) return;

    try {
      const res = await refundOrder(order.orderId, '사용자 요청');
      if (!res?.success) {
        alert(res?.error?.message || '환불 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.');
        return;
      }

      const refundedPoints = res.data?.refundedPoints || 0;
      const message = refundedPoints > 0
        ? `환불 처리가 완료되었습니다. (환불된 포인트: ${refundedPoints.toLocaleString()}P)`
        : '환불 처리가 완료되었습니다.';
      alert(message);

      // 주문 정보 다시 불러오기
      const result = isFromAdmin
        ? await getAdminOrderById(orderId)
        : await getUserOrderById(orderId);
      if (result.success) {
        setOrder(result.data);
      }
    } catch (err) {
      console.error('환불 처리 오류:', err);
      alert('환불 처리 중 오류가 발생했습니다.');
    }
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

  if (loading) {
    return (
      <main className="sod-wrap">
        <div className="sod-inner">
          <h2 className="sod-title">주문 상세</h2>
          <p className="sod-muted">주문 정보를 불러오는 중...</p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="sod-wrap">
        <div className="sod-inner">
          <h2 className="sod-title">주문 상세</h2>
          <p className="sod-muted">{error || '주문 정보를 찾을 수 없습니다.'}</p>
          <button
            className="sod-btn"
            type="button"
            onClick={() => {
              if (isFromAdmin) {
                navigate('/admin', { state: { activeTab: 'orders' } });
              } else {
                navigate('/mypage', { state: { openTab: 'store_orders' } });
              }
            }}
          >
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
            <span className="v">{Number(order.totalAmount || 0).toLocaleString()}원</span>
          </div>
          <div className="sod-row">
            <span className="k">결제 수단</span>
            <span className="v">{order.payment?.method || '-'}</span>
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
            <span className="v">{order.payment?.buyerName || '-'}</span>
          </div>
          <div className="sod-row">
            <span className="k">연락처</span>
            <span className="v">{order.payment?.buyerPhone || '-'}</span>
          </div>
          <div className="sod-row">
            <span className="k">이메일</span>
            <span className="v">{order.payment?.buyerEmail || '-'}</span>
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
                const unitPrice = Number(it.unitPrice || 0);
                const qty = Number(it.qty || 0);
                const lineTotal = unitPrice * qty;

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
                      <div className="sod-item-price">{unitPrice.toLocaleString()}원</div>
                      <div className="sod-item-total">{lineTotal.toLocaleString()}원</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* 액션 */}
        <div className="sod-actions">
          <button
            className="sod-btn"
            type="button"
            onClick={() => {
              if (isFromAdmin) {
                navigate('/admin', { state: { activeTab: 'orders' } });
              } else {
                navigate('/mypage', { state: { openTab: 'store_orders' } });
              }
            }}
          >
            주문내역으로 이동
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
