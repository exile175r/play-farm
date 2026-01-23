// src/components/checkout/CheckoutModal.js
import React, { useEffect, useMemo, useState } from 'react';
import './CheckoutModal.css';
import Loading from '../layout/Loading';
import { createOrder, payOrder, cancelOrder } from '../../services/orderApi';
import { getMyPoints } from '../../services/pointApi';

function CheckoutModal({ open, onClose, items, onSuccess }) {
  const [payMethod, setPayMethod] = useState('CARD');
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 포인트 관련
  const [userPoints, setUserPoints] = useState(0);
  const [usePoints, setUsePoints] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);

  // 카드 결제 입력
  const [cardCompany, setCardCompany] = useState('현대');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // 결제자 정보
  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const [buyerName, setBuyerName] = useState(user?.nickname || user?.name || user?.user_id || '');
  const [buyerPhone, setBuyerPhone] = useState(user?.phone || '');
  const [buyerEmail, setBuyerEmail] = useState(user?.email || '');

  // 모달이 열릴 때 사용자 정보 & 포인트 초기화
  useEffect(() => {
    if (open) {
      if (user) {
        setBuyerName(user?.nickname || user?.name || user?.user_id || '');
        setBuyerPhone(user?.phone || '');
        setBuyerEmail(user?.email || '');
      }
      // 포인트 조회
      getMyPoints().then((res) => {
        if (res.success) {
          setUserPoints(res.data.points || 0);
        }
      });
      setUsePoints(0);
    }
  }, [open, user]);

  // 금액 계산
  const subtotal = useMemo(() => {
    return (items || []).reduce((acc, it) => acc + Number(it.price || 0) * Number(it.qty || 0), 0);
  }, [items]);

  const shippingFee = subtotal >= 30000 || subtotal === 0 ? 0 : 3000;
  const total = subtotal + shippingFee;

  // 포인트 적용 후 최종 금액
  useEffect(() => {
    setFinalAmount(Math.max(0, total - usePoints));
  }, [total, usePoints]);

  const handlePointChange = (e) => {
    let val = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0;
    if (val > userPoints) val = userPoints;
    if (val > total) val = total;
    setUsePoints(val);
  };

  const useAllPoints = () => {
    const val = Math.min(userPoints, total);
    setUsePoints(val);
  };

  // 입력 포맷 helpers
  const formatCardNumber = (v) =>
    v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');

  const formatExp = (v) => {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const onlyDigits = (v, max) => v.replace(/\D/g, '').slice(0, max);

  // 검증
  const validate = () => {
    if (!buyerName.trim()) return '결제자 성함을 입력해 주세요.';
    if (!buyerPhone.trim()) return '결제자 연락처를 입력해 주세요.';
    if (!buyerEmail.trim()) return '결제자 이메일을 입력해 주세요.';
    if (!agree) return '약관에 동의해 주셔야 결제가 가능합니다.';

    if (payMethod === 'CARD') {
      const n = cardNumber.replace(/\s/g, '');
      if (n.length !== 16) return '카드번호 16자리를 정확히 입력해 주세요.';
      if (cardExp.replace('/', '').length !== 4) return '유효기간(MM/YY)을 정확히 입력해 주세요.';
      if (cardCvc.length !== 3) return 'CVC 3자리를 정확히 입력해 주세요.';
    }

    if (!items || items.length === 0) return '상품 정보가 없습니다.';
    return null;
  };

  // 결제 처리
  const handlePay = async () => {
    const msg = validate();
    if (msg) {
      alert(msg);
      return;
    }

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));

    const isFail = Math.random() < 0.12;

    try {
      // 1. 주문 생성
      const orderResult = await createOrder({
        items: items.map((it) => ({
          productId: String(it.id),
          title: it.name || it.title || `상품 #${it.id}`,
          image: it.image || '',
          optionId: it.optionId || null,
          optionName: it.optionName || null,
          unitPrice: Number(it.price || 0),
          qty: Number(it.qty || 0),
        })),
        buyer: { name: buyerName, phone: buyerPhone, email: buyerEmail },
        amount: total, // 원래 주문 총액
        payMethod,
        usedPoints: usePoints, // 사용 포인트 전달
      });

      if (!orderResult?.success) {
        alert('주문 생성에 실패했습니다. 다시 시도해 주세요.');
        setSubmitting(false);
        return;
      }

      if (isFail) {
        alert('결제가 실패했습니다. 결제 정보를 확인하신 뒤 다시 시도해 주세요.');
        // 실패 시 생성된 주문 취소 처리
        if (orderResult?.data?.orderId) {
          await cancelOrder(orderResult.data.orderId, { reason: '결제 실패 시뮬레이션' });
        }
        setSubmitting(false);
        return;
      }

      // 2. 결제 처리
      const paymentResult = await payOrder({
        orderId: orderResult.data.orderId,
        method: payMethod,
        buyerName,
        buyerPhone,
        buyerEmail,
        usedPoints: usePoints, // 사용 포인트 전달
      });

      if (!paymentResult?.success) {
        alert('결제 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.');
        // 실패 시 생성된 주문 취소 처리
        if (orderResult?.data?.orderId) {
          await cancelOrder(orderResult.data.orderId, { reason: '결제 처리 실패' });
        }
        setSubmitting(false);
        return;
      }

      // 포인트 사용 시 전역 이벤트 발생
      if (usePoints > 0) {
        window.dispatchEvent(new Event('pointUpdated'));
      }

      alert('결제가 정상적으로 완료되었습니다.');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('결제 처리 오류:', error);
      alert('결제 처리 중 오류가 발생했습니다.');
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const close = () => {
    if (submitting) return;
    onClose?.();
  };

  return (
    <div className="pf-modal-overlay" onMouseDown={close} role="dialog" aria-modal="true">
      <div className="pf-modal checkout-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="pf-modal-head">
          <h3 className="pf-modal-title">결제하기</h3>
          <button type="button" className="pf-modal-x" onClick={close} aria-label="닫기" disabled={submitting}>
            ✕
          </button>
        </div>

        <div className="pf-modal-body checkout-modal-body">
          {/* 상품 정보 */}
          <div className="checkout-items">
            {items.map((item, idx) => (
              <div key={idx} className="checkout-item">
                <div className="checkout-item-info">
                  <div className="checkout-item-name">{item.name}</div>
                  {item.optionName && (
                    <div className="checkout-item-option">옵션: {item.optionName}</div>
                  )}
                  <div className="checkout-item-qty">수량: {item.qty}개</div>
                </div>
                <div className="checkout-item-price">
                  {(Number(item.price || 0) * Number(item.qty || 0)).toLocaleString()}원
                </div>
              </div>
            ))}
          </div>

          {/* 결제 금액 요약 */}
          <div className="checkout-summary">
            <div className="checkout-summary-row">
              <span>상품금액</span>
              <span>{subtotal.toLocaleString()}원</span>
            </div>
            {shippingFee > 0 && (
              <div className="checkout-summary-row">
                <span>배송비</span>
                <span>+{shippingFee.toLocaleString()}원</span>
              </div>
            )}

            {/* 포인트 사용 UI */}
            <div className="checkout-summary-row point-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px', marginTop: '12px', borderTop: '1px dashed #eee', paddingTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>포인트 사용</span>
                <span style={{ fontSize: '13px', color: '#666' }}>보유: {userPoints.toLocaleString()}P</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={usePoints.toLocaleString()}
                  onChange={handlePointChange}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    textAlign: 'right',
                    fontWeight: 600
                  }}
                />
                <button
                  type="button"
                  onClick={useAllPoints}
                  style={{
                    padding: '0 12px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    background: '#fff',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  전액
                </button>
              </div>
            </div>
            {usePoints > 0 && (
              <div className="checkout-summary-row" style={{ color: '#e74c3c' }}>
                <span>포인트 할인</span>
                <span>-{usePoints.toLocaleString()}원</span>
              </div>
            )}

            <div className="checkout-summary-total">
              <span style={{ fontSize: '15px' }}>총 결제금액</span>
              <strong style={{ fontSize: '20px', color: '#3a8e87' }}>{finalAmount.toLocaleString()}원</strong>
            </div>
            <div className="checkout-summary-row" style={{ justifyContent: 'flex-end', gap: '6px', marginTop: '4px', fontSize: '13px', color: '#27ae60', fontWeight: 600 }}>
              <span style={{ color: '#888', fontWeight: 500 }}>적립 예정 포인트</span>
              <span>+{Math.floor(finalAmount * 0.05).toLocaleString()}P</span>
            </div>
          </div>

          {/* 결제 수단 */}
          <div className="checkout-payment-method">
            <label className="checkout-label">결제 수단</label>
            <div className="checkout-method-options">
              <label className="checkout-method-option">
                <input
                  type="radio"
                  value="CARD"
                  checked={payMethod === 'CARD'}
                  onChange={(e) => setPayMethod(e.target.value)}
                  disabled={submitting}
                />
                <span>카드 결제</span>
              </label>
              <label className="checkout-method-option">
                <input
                  type="radio"
                  value="KAKAO_PAY"
                  checked={payMethod === 'KAKAO_PAY'}
                  onChange={(e) => setPayMethod(e.target.value)}
                  disabled={submitting}
                />
                <span>카카오페이</span>
              </label>
              <label className="checkout-method-option">
                <input
                  type="radio"
                  value="TRANSFER"
                  checked={payMethod === 'TRANSFER'}
                  onChange={(e) => setPayMethod(e.target.value)}
                  disabled={submitting}
                />
                <span>계좌이체</span>
              </label>
            </div>
          </div>

          {/* 카드 결제 입력 (CARD 선택 시) */}
          {payMethod === 'CARD' && (
            <div className="checkout-card-form">
              <div className="checkout-form-row">
                <label className="checkout-label">카드사</label>
                <select
                  className="pf-modal-input"
                  value={cardCompany}
                  onChange={(e) => setCardCompany(e.target.value)}
                  disabled={submitting}
                >
                  <option>현대</option>
                  <option>삼성</option>
                  <option>신한</option>
                  <option>KB</option>
                </select>
              </div>
              <div className="checkout-form-row">
                <label className="checkout-label">카드번호</label>
                <input
                  className="pf-modal-input"
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  maxLength={19}
                  disabled={submitting}
                />
              </div>
              <div className="checkout-form-row">
                <label className="checkout-label">유효기간</label>
                <input
                  className="pf-modal-input"
                  type="text"
                  placeholder="MM/YY"
                  value={cardExp}
                  onChange={(e) => setCardExp(formatExp(e.target.value))}
                  maxLength={5}
                  disabled={submitting}
                />
              </div>
              <div className="checkout-form-row">
                <label className="checkout-label">CVC</label>
                <input
                  className="pf-modal-input"
                  type="text"
                  placeholder="123"
                  value={cardCvc}
                  onChange={(e) => setCardCvc(onlyDigits(e.target.value, 3))}
                  maxLength={3}
                  disabled={submitting}
                />
              </div>
            </div>
          )}

          {/* 결제자 정보 */}
          <div className="checkout-buyer-form">
            <div className="checkout-form-row">
              <label className="checkout-label">성함</label>
              <input
                className="pf-modal-input"
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="홍길동"
                disabled={submitting}
              />
            </div>
            <div className="checkout-form-row">
              <label className="checkout-label">연락처</label>
              <input
                className="pf-modal-input"
                type="text"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                placeholder="010-0000-0000"
                disabled={submitting}
              />
            </div>
            <div className="checkout-form-row">
              <label className="checkout-label">이메일</label>
              <input
                className="pf-modal-input"
                type="email"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                placeholder="user@example.com"
                disabled={submitting}
              />
            </div>
          </div>

          {/* 약관 동의 */}
          <div className="checkout-agree">
            <label>
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                disabled={submitting}
              />
              <span>결제 진행에 동의합니다.</span>
            </label>
          </div>
        </div>

        <div className="pf-modal-foot">
          <button type="button" className="pf-modal-btn ghost" onClick={close} disabled={submitting}>
            취소
          </button>
          <button type="button" className="pf-modal-btn primary" onClick={handlePay} disabled={submitting} style={{ position: 'relative' }}>
            {submitting ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <div className="dots-loader" style={{ padding: 0, minHeight: 'auto', width: 'auto' }}>
                  <div className="dots-loader-dot" style={{ width: '6px', height: '6px', backgroundColor: '#fff' }}></div>
                  <div className="dots-loader-dot" style={{ width: '6px', height: '6px', backgroundColor: '#fff', animationDelay: '0.2s' }}></div>
                  <div className="dots-loader-dot" style={{ width: '6px', height: '6px', backgroundColor: '#fff', animationDelay: '0.4s' }}></div>
                </div>
                <span>결제 진행 중...</span>
              </div>
            ) : (
              `${finalAmount.toLocaleString()}원 결제하기`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CheckoutModal;

