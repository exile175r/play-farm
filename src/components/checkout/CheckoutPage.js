// src/components/checkout/CheckoutPage.js
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import './Checkout.css';
import { listMyReservations, markReservationPaid, markReservationPaymentFailed } from '../../services/reservationApi';

// ✅ NEW: 스토어 결제용
import { readCart, writeCart } from '../../utils/cartStorage';
import { addOrder } from '../../utils/orderStorage';

function CheckoutPage() {
   const navigate = useNavigate();
   const location = useLocation();
   const params = useParams();

   const sp = useMemo(() => new URLSearchParams(location.search), [location.search]);
   const type = sp.get('type') || location.state?.type || 'program'; // program | shop

   const user = useMemo(() => {
      try {
         const raw = localStorage.getItem('user');
         return raw ? JSON.parse(raw) : null;
      } catch {
         return null;
      }
   }, []);

   const userId = user?.user_id || user?.id || user?.email || '';

   // ✅ 라우트 파라미터(/checkout/:bookingId) 우선, 없으면 state 호환
   const bookingId = params.bookingId || location.state?.bookingId || null;

   const [loading, setLoading] = useState(true);

   // ===== program 결제 대상 =====
   const [reservation, setReservation] = useState(null);

   // ===== shop 결제 대상 =====
   const [cartItems, setCartItems] = useState([]);

   // ===== 결제 UI 상태 =====
   const [payMethod, setPayMethod] = useState('CARD'); // CARD | KAKAO_PAY | TRANSFER
   const [agree, setAgree] = useState(false);

   // 카드 결제 입력(시뮬레이션용)
   const [cardCompany, setCardCompany] = useState('현대');
   const [cardNumber, setCardNumber] = useState('');
   const [cardExp, setCardExp] = useState('');
   const [cardCvc, setCardCvc] = useState('');

   // 결제자 정보(시뮬레이션용)
   const [buyerName, setBuyerName] = useState(user?.nickname || user?.name || user?.user_id || '');
   const [buyerPhone, setBuyerPhone] = useState(user?.phone || '');
   const [buyerEmail, setBuyerEmail] = useState(user?.email || '');

   // 실제같은 느낌: 결제 진행 로딩 + 실패 강제 토글(포트폴리오용)
   const [submitting, setSubmitting] = useState(false);
   const [forceFail, setForceFail] = useState(false);

   // ===== program 대상 불러오기 =====
   const fetchReservation = async () => {
      setLoading(true);
      try {
         const res = await listMyReservations({ userId });
         if (!res?.success) {
            setReservation(null);
            return;
         }
         const list = Array.isArray(res.data) ? res.data : [];
         const found = list.find((r) => String(r.bookingId) === String(bookingId));
         setReservation(found || null);
      } finally {
         setLoading(false);
      }
   };

   // ===== shop 대상 불러오기 =====
   const fetchCart = async () => {
      setLoading(true);
      try {
         const list = readCart();
         setCartItems(Array.isArray(list) ? list : []);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      // ✅ shop 결제: /checkout/cart?type=shop
      if (type === 'shop') {
         fetchCart();
         return;
      }

      // ✅ program 결제: 기존 로직 유지
      if (!bookingId) {
         navigate('/mypage', { state: { openTab: 'reservations' } });
         return;
      }
      fetchReservation();
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [bookingId, type]);

   // ===== 입력 포맷 helpers =====
   const formatCardNumber = (v) =>
      v
         .replace(/\D/g, '')
         .slice(0, 16)
         .replace(/(\d{4})(?=\d)/g, '$1 ');

   const formatExp = (v) => {
      const digits = v.replace(/\D/g, '').slice(0, 4);
      if (digits.length <= 2) return digits;
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
   };

   const onlyDigits = (v, max) => v.replace(/\D/g, '').slice(0, max);

   // ===== 금액 계산 =====
   // ✅ cartStorage(StoreDetail) 기준: it.price * it.qty
   const shopSubtotal = useMemo(() => {
      return (cartItems || []).reduce((acc, it) => acc + Number(it.price || 0) * Number(it.qty || 0), 0);
   }, [cartItems]);

   const shopShippingFee = shopSubtotal >= 30000 || shopSubtotal === 0 ? 0 : 3000;
   const shopTotal = shopSubtotal + shopShippingFee;

   // ===== 검증 =====
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

      if (type === 'shop') {
         if (!cartItems || cartItems.length === 0) return '장바구니가 비어 있습니다.';
         return null;
      }

      // program 검증(기존)
      if (!reservation) return '예약 정보를 불러오지 못했습니다.';
      if (reservation.status !== 'BOOKED') return '진행 중(BOOKED) 예약만 결제가 가능합니다.';
      if (reservation.paymentStatus === 'PAID') return '이미 결제가 완료된 예약입니다.';

      return null;
   };

   // ===== 결제 시뮬레이션 =====
   const handlePay = async () => {
      const msg = validate();
      if (msg) {
         alert(msg);
         return;
      }

      setSubmitting(true);

      // ✅ 실제 결제처럼 보이도록 약간의 딜레이
      await new Promise((r) => setTimeout(r, 900));

      // 기본 실패 확률(포트폴리오용) + 강제 실패 토글
      const isFail = forceFail || Math.random() < 0.12;

      try {
         // =========================
         // ✅ SHOP 결제
         // =========================
         if (type === 'shop') {
            if (isFail) {
               alert('결제가 실패했습니다. 결제 정보를 확인하신 뒤 다시 시도해 주세요.');
               return;
            }

            // ✅ 주문 저장 (orderStorage.js 구조: orderId, status, createdAt 유지)
            addOrder({
               type: 'shop',
               buyer: { name: buyerName, phone: buyerPhone, email: buyerEmail },
               amount: shopTotal,
               payMethod,
               items: cartItems.map((it) => ({
                  productId: String(it.id), // ✅ StoreDetail addToCart 기준
                  title: it.name || it.title || `상품 #${it.id}`,
                  image: it.image || '',
                  optionId: it.optionId || null,
                  optionName: it.optionName || null,
                  unitPrice: Number(it.price || 0), // ✅ cartStorage는 price가 단가
                  qty: Number(it.qty || 0),
               })),
            });

            // ✅ 장바구니 비우기 (cartStorage exports: readCart, writeCart 기준)
            writeCart([]);

            alert('결제가 정상적으로 완료되었습니다.');
            navigate('/mypage', { state: { openTab: 'store_orders' } });
            return;
         }

         // =========================
         // ✅ PROGRAM 결제 (기존)
         // =========================
         if (isFail) {
            const res = await markReservationPaymentFailed({ bookingId });
            if (!res?.success) {
               alert('결제 실패 상태 반영에 실패했습니다. 잠시 후 다시 시도해 주세요.');
               return;
            }
            alert('결제가 실패했습니다. 결제 정보를 확인하신 뒤 다시 시도해 주세요.');
            // 실패 후 마이페이지로 보내지 않고, 현재 화면 유지(재시도 UX)
            await fetchReservation();
            return;
         }

         const res = await markReservationPaid({ bookingId, method: payMethod });
         if (!res?.success) {
            alert('결제 완료 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.');
            return;
         }

         alert('결제가 정상적으로 완료되었습니다.');
         navigate('/mypage', { state: { openTab: 'reservations' } });
      } finally {
         setSubmitting(false);
      }
   };

   const goBack = () => {
      if (type === 'shop') {
         navigate('/mypage', { state: { openTab: 'cart' } });
         return;
      }
      navigate('/mypage', { state: { openTab: 'reservations' } });
   };

   if (loading) {
      return (
         <main className="pf-page pf-checkout">
            <div className="pf-checkout-inner">
               <div className="pf-checkout-head">
                  <h2 className="pf-checkout-title">결제 정보를 불러오는 중입니다</h2>
                  <p className="pf-checkout-desc">잠시만 기다려 주세요.</p>
               </div>
               <div className="pf-checkout-skeleton">
                  <div className="sk-title" />
                  <div className="sk-line" />
                  <div className="sk-card" />
                  <div className="sk-card" />
               </div>
            </div>
         </main>
      );
   }

   // ===== 결제 대상 없음 처리 =====
   if (type === 'shop' && (!cartItems || cartItems.length === 0)) {
      return (
         <main className="pf-page pf-checkout">
            <div className="pf-checkout-inner">
               <div className="pf-checkout-head">
                  <h2 className="pf-checkout-title">장바구니가 비어 있습니다</h2>
                  <p className="pf-checkout-desc">스토어에서 상품을 담아 주세요.</p>
               </div>
               <div className="pf-checkout-actions">
                  <button type="button" className="pf-btn" onClick={() => navigate('/shop')}>
                     스토어로 이동
                  </button>
               </div>
            </div>
         </main>
      );
   }

   if (type !== 'shop' && !reservation) {
      return (
         <main className="pf-page pf-checkout">
            <div className="pf-checkout-inner">
               <div className="pf-checkout-head">
                  <h2 className="pf-checkout-title">결제 대상 예약을 찾을 수 없습니다</h2>
                  <p className="pf-checkout-desc">마이페이지에서 예약 내역을 다시 확인해 주세요.</p>
               </div>
               <div className="pf-checkout-actions">
                  <button type="button" className="pf-btn" onClick={goBack}>
                     마이페이지로 이동
                  </button>
               </div>
            </div>
         </main>
      );
   }

   const amount = type === 'shop' ? Number(shopTotal || 0) : Number(reservation?.price || 0);

   const isPaid = type === 'shop' ? false : reservation?.paymentStatus === 'PAID';

   const isBooked = type === 'shop' ? true : reservation?.status === 'BOOKED';

   const payDisabled = submitting || isPaid || !isBooked;

   return (
      <main className="pf-page pf-checkout">
         <div className="pf-checkout-inner">
            <header className="pf-checkout-head">
               <h2 className="pf-checkout-title">결제하기</h2>
               <p className="pf-checkout-desc">본 화면은 포트폴리오용 결제 시뮬레이션입니다. 실제 결제는 진행되지 않으며, 결제 상태만 변경됩니다.</p>
            </header>

            {/* 예약/주문 요약 */}
            <section className="pf-checkout-card">
               <h4 className="pf-checkout-card-h4">{type === 'shop' ? '주문 정보' : '예약 정보'}</h4>

               {type === 'shop' ? (
                  <>
                     <div className="pf-checkout-row total">
                        <span className="k">상품 소계</span>
                        <span className="v">{shopSubtotal.toLocaleString()}원</span>
                     </div>
                     <div className="pf-checkout-row">
                        <span className="k">배송비</span>
                        <span className="v">{shopShippingFee.toLocaleString()}원</span>
                     </div>
                     <div className="pf-checkout-row total">
                        <span className="k">결제 금액</span>
                        <span className="v">{shopTotal.toLocaleString()}원</span>
                     </div>
                     <div className="pf-checkout-row">
                        <span className="k">상품</span>
                        <span className="v">
                           {cartItems[0]?.name || cartItems[0]?.title || '상품'}
                           {cartItems.length > 1 ? ` 외 ${cartItems.length - 1}개` : ''}
                        </span>
                     </div>
                  </>
               ) : (
                  <>
                     <div className="pf-checkout-row">
                        <span className="k">체험명</span>
                        <span className="v">{reservation.title}</span>
                     </div>
                     <div className="pf-checkout-row">
                        <span className="k">체험일</span>
                        <span className="v">
                           {reservation.date ? dayjs(reservation.date).format('YYYY.MM.DD') : '-'}
                           {reservation.time ? ` · ${reservation.time}` : ''}
                        </span>
                     </div>
                     <div className="pf-checkout-row">
                        <span className="k">인원</span>
                        <span className="v">{reservation.people}명</span>
                     </div>
                     <div className="pf-checkout-row total">
                        <span className="k">결제 금액</span>
                        <span className="v">{amount.toLocaleString()}원</span>
                     </div>
                  </>
               )}
            </section>

            {/* 결제수단 선택 */}
            <section className="pf-checkout-card">
               <h4 className="pf-checkout-card-h4">결제 수단</h4>

               <div className="pf-pay-methods">
                  <label className={`pf-radio ${payMethod === 'CARD' ? 'is-active' : ''}`}>
                     <input type="radio" name="payMethod" value="CARD" checked={payMethod === 'CARD'} onChange={() => setPayMethod('CARD')} />
                     카드 결제
                  </label>

                  <label className={`pf-radio ${payMethod === 'KAKAO_PAY' ? 'is-active' : ''}`}>
                     <input type="radio" name="payMethod" value="KAKAO_PAY" checked={payMethod === 'KAKAO_PAY'} onChange={() => setPayMethod('KAKAO_PAY')} />
                     카카오페이
                  </label>

                  <label className={`pf-radio ${payMethod === 'TRANSFER' ? 'is-active' : ''}`}>
                     <input type="radio" name="payMethod" value="TRANSFER" checked={payMethod === 'TRANSFER'} onChange={() => setPayMethod('TRANSFER')} />
                     계좌이체
                  </label>
               </div>

               {/* 카드 입력폼(시뮬레이션) */}
               {payMethod === 'CARD' && (
                  <div className="pf-form">
                     <div className="pf-grid2">
                        <div>
                           <label className="pf-label">카드사</label>
                           <select className="pf-input" value={cardCompany} onChange={(e) => setCardCompany(e.target.value)}>
                              <option value="현대">현대</option>
                              <option value="신한">신한</option>
                              <option value="국민">국민</option>
                              <option value="삼성">삼성</option>
                              <option value="롯데">롯데</option>
                              <option value="하나">하나</option>
                              <option value="하나">케이뱅크</option>
                              <option value="하나">토스</option>
                           </select>
                        </div>

                        <div>
                           <label className="pf-label">카드번호</label>
                           <input
                              className="pf-input"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                              placeholder="0000 0000 0000 0000"
                              inputMode="numeric"
                           />
                        </div>
                     </div>

                     <div className="pf-grid2">
                        <div>
                           <label className="pf-label">유효기간(MM/YY)</label>
                           <input className="pf-input" value={cardExp} onChange={(e) => setCardExp(formatExp(e.target.value))} placeholder="MM/YY" inputMode="numeric" />
                        </div>

                        <div>
                           <label className="pf-label">CVC</label>
                           <input className="pf-input" value={cardCvc} onChange={(e) => setCardCvc(onlyDigits(e.target.value, 3))} placeholder="000" inputMode="numeric" />
                        </div>
                     </div>

                     <p className="pf-hint">카드 입력 정보는 실제 결제에 사용되지 않으며, 시뮬레이션용으로만 입력됩니다.</p>
                  </div>
               )}

               {/* 카카오페이/계좌이체 안내(시뮬레이션) */}
               {payMethod !== 'CARD' && <p className="pf-hint">선택하신 결제 수단은 실제 연동되지 않습니다. “결제하기” 버튼을 통해 결제 상태만 시뮬레이션됩니다.</p>}
            </section>

            {/* 결제자 정보 + 약관 */}
            <section className="pf-checkout-card">
               <h4 className="pf-checkout-card-h4">결제자 정보</h4>

               <div className="pf-form">
                  <div className="pf-grid2">
                     <div>
                        <label className="pf-label">성함</label>
                        <input className="pf-input" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="예) 홍길동" />
                     </div>

                     <div>
                        <label className="pf-label">연락처</label>
                        <input className="pf-input" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} placeholder="예) 010-0000-0000" />
                     </div>
                  </div>

                  <div>
                     <label className="pf-label">이메일</label>
                     <input className="pf-input" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} placeholder="예) user@email.com" />
                  </div>

                  <label className="pf-agree">
                     <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                     <span>결제 및 환불 규정에 동의합니다.</span>
                  </label>

                  {/* 포트폴리오 데모용: 실패 강제 */}
                  <label className="pf-agree pf-agree-sub">
                     <input type="checkbox" checked={forceFail} onChange={(e) => setForceFail(e.target.checked)} />
                     <span>데모: "결제 실패" 강제로 발생</span>
                  </label>
               </div>
            </section>

            {/* 액션 */}
            <div className="pf-checkout-actions">
               <button
                  type="button"
                  className="pf-pay-btn"
                  onClick={handlePay}
                  disabled={payDisabled}
                  title={!isBooked ? '진행 중 예약만 결제가 가능합니다.' : isPaid ? '이미 결제가 완료된 예약입니다.' : ''}>
                  {submitting ? '결제 진행 중입니다…' : `${amount.toLocaleString()}원 결제하기`}
               </button>
            </div>
            <button type="button" className="pf-btn ghost" onClick={goBack} disabled={submitting}>
               이전으로
            </button>
         </div>
      </main>
   );
}

export default CheckoutPage;
