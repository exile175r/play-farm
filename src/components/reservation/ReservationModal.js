import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import './ReservationModal.css';
import { createReservation } from '../../services/reservationApi';

/**
 * props:
 * open, onClose, program, isLoggedIn, user, onSuccess
 */
function ReservationModal({ open, onClose, program, isLoggedIn, user, onSuccess }) {
   const myUserId = useMemo(() => user?.user_id || user?.id || user?.email || null, [user]);
   const displayName = useMemo(() => user?.nickname || user?.name || user?.user_id || '익명', [user]);

   const [date, setDate] = useState(() => dayjs().add(1, 'day').format('YYYY-MM-DD'));
   const [people, setPeople] = useState(1);

   // ✅ 시간 선택 3개(니가 말한 B안)
   const timeOptions = useMemo(() => ['10:00', '13:00', '16:00'], []);
   const [time, setTime] = useState(timeOptions[0]);

   const unitPrice = useMemo(() => {
      const raw = program?.chrge ?? '';
      const num = Number(String(raw).replace(/[^\d]/g, ''));
      return Number.isFinite(num) && num > 0 ? num : 0;
   }, [program]);

   const totalPrice = useMemo(() => unitPrice * Number(people || 0), [unitPrice, people]);

   useEffect(() => {
      if (!open) return;
      setPeople(1);
      setDate(dayjs().add(1, 'day').format('YYYY-MM-DD'));
      setTime(timeOptions[0]);
   }, [open, timeOptions]);

   if (!open) return null;

   const close = () => onClose?.();

   const handleConfirm = async () => {
      if (!isLoggedIn) {
         alert('로그인 후 예약할 수 있어.');
         return;
      }
      if (!program) return;

      if (!date) {
         alert('체험일을 선택해.');
         return;
      }

      const nPeople = Number(people);
      if (!Number.isFinite(nPeople) || nPeople < 1) {
         alert('인원은 1명 이상이어야 해.');
         return;
      }

      const max = Number(program?.max_personnel || 0);
      if (max > 0 && nPeople > max) {
         alert(`최대 인원은 ${max}명이야.`);
         return;
      }

      const payload = {
         programId: String(program?.program_id || program?.id || program?.programId || ''),
         title: program?.program_nm || '체험',
         date, // YYYY-MM-DD
         time, // ✅ "10:00" 같은 값
         people: nPeople,
         price: totalPrice,
         userId: myUserId,
         userName: displayName,
      };

      const result = await createReservation(payload);
      if (!result?.success) {
         alert('예약 저장 실패');
         return;
      }

      onSuccess?.(result.data);
      close();
   };

   return (
      <div className="pf-modal-overlay" onMouseDown={close} role="dialog" aria-modal="true">
         <div className="pf-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="pf-modal-head">
               <h3 className="pf-modal-title">예약하기</h3>
               <button type="button" className="pf-modal-x" onClick={close} aria-label="닫기">
                  ✕
               </button>
            </div>

            <div className="pf-modal-body">
               <div className="pf-modal-row">
                  <span className="pf-modal-label">체험명</span>
                  <span className="pf-modal-value">{program?.program_nm || '-'}</span>
               </div>

               <div className="pf-modal-row">
                  <span className="pf-modal-label">체험일</span>
                  <input className="pf-modal-input" type="date" value={date} min={dayjs().format('YYYY-MM-DD')} onChange={(e) => setDate(e.target.value)} />
               </div>

               <div className="pf-modal-row">
                  <span className="pf-modal-label">체험시간</span>
                  <select className="pf-modal-input" value={time} onChange={(e) => setTime(e.target.value)}>
                     {timeOptions.map((t) => (
                        <option key={t} value={t}>
                           {t}
                        </option>
                     ))}
                  </select>
               </div>

               <div className="pf-modal-row">
                  <span className="pf-modal-label">인원</span>
                  <div className="pf-modal-people">
                     <button type="button" className="pf-modal-people-btn" onClick={() => setPeople((p) => Math.max(1, p - 1))}>
                        -
                     </button>
                     <input
                        className="pf-modal-people-input"
                        value={people}
                        onChange={(e) => setPeople(Math.max(1, Number(String(e.target.value).replace(/[^\d]/g, '')) || 1))}
                        inputMode="numeric"
                     />
                     <button type="button" className="pf-modal-people-btn" onClick={() => setPeople((p) => p + 1)}>
                        +
                     </button>
                  </div>
               </div>

               <div className="pf-modal-row">
                  <span className="pf-modal-label">요금</span>
                  <span className="pf-modal-value">{unitPrice ? `${unitPrice.toLocaleString()}원 / 1명` : '정보 없음'}</span>
               </div>

               <div className="pf-modal-total">
                  <span>총 결제금액</span>
                  <strong>{totalPrice ? `${totalPrice.toLocaleString()}원` : '0원'}</strong>
               </div>
            </div>

            <div className="pf-modal-foot">
               <button type="button" className="pf-modal-btn ghost" onClick={close}>
                  취소
               </button>
               <button type="button" className="pf-modal-btn primary" onClick={handleConfirm}>
                  예약 확정
               </button>
            </div>
         </div>
      </div>
   );
}

export default ReservationModal;
