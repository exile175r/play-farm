// ✅ 지금은 localStorage fallback
// ✅ 나중에 백엔드 붙으면 createReservation / listMyReservations / cancelReservation / markReservationPaid 등 내부만 서버 호출로 바꾸면 됨

import dayjs from 'dayjs';

const RESV_KEY = 'reservations_program';

const safeJsonParse = (raw, fallback) => {
   try {
      const parsed = JSON.parse(raw);
      return parsed ?? fallback;
   } catch {
      return fallback;
   }
};

// (선택) 서버 베이스 URL. CRA 기준
const API_BASE = process.env.REACT_APP_API_BASE_URL || '';

const getAuthHeaders = () => {
   const token = localStorage.getItem('token');
   return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * payload 예시:
 * {
 *  programId, title, date, time, people, price,
 *  userId, userName
 * }
 */
export async function createReservation(payload) {
   // -----------------------------
   // ✅ 1) 백엔드 붙으면 여기로 이동
   // -----------------------------
   // try {
   //   const res = await fetch(`${API_BASE}/api/reservations`, {
   //     method: 'POST',
   //     headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
   //     body: JSON.stringify(payload),
   //   });
   //   const data = await res.json();
   //   return data;
   // } catch (e) {
   //   return { success: false, error: { message: e?.message || '예약 생성 실패' } };
   // }

   // -----------------------------
   // ✅ 2) localStorage 시뮬레이션
   // -----------------------------
   try {
      const list = safeJsonParse(localStorage.getItem(RESV_KEY), []);

      const now = new Date().toISOString();
      const bookingId = `${Date.now()}_${Math.random().toString(16).slice(2)}`;

      const nextItem = {
         bookingId,
         programId: payload.programId,
         title: payload.title,
         date: payload.date,
         time: payload.time,
         people: payload.people,
         price: payload.price,

         userId: payload.userId,
         userName: payload.userName,

         // ✅ 상태
         status: 'BOOKED', // BOOKED | COMPLETED | CANCELLED
         paymentStatus: 'UNPAID', // UNPAID | PAID | FAILED | REFUNDED
         method: null,

         createdAt: now,
         updatedAt: now,
      };

      const next = [nextItem, ...list];
      localStorage.setItem(RESV_KEY, JSON.stringify(next));

      return { success: true, data: nextItem };
   } catch (e) {
      return { success: false, error: { message: e?.message || '예약 생성 실패' } };
   }
}

export async function listMyReservations({ userId } = {}) {
   // -----------------------------
   // ✅ 1) 백엔드 붙으면 여기로 이동
   // -----------------------------
   // try {
   //   const res = await fetch(`${API_BASE}/api/reservations/me?userId=${encodeURIComponent(userId || '')}`, {
   //     headers: { ...getAuthHeaders() },
   //   });
   //   const data = await res.json();
   //   return data;
   // } catch (e) {
   //   return { success: false, error: { message: e?.message || '예약 조회 실패' } };
   // }

   // -----------------------------
   // ✅ 2) localStorage 시뮬레이션
   // -----------------------------
   try {
      const list = safeJsonParse(localStorage.getItem(RESV_KEY), []);
      const filtered = userId ? list.filter((r) => String(r.userId) === String(userId)) : list;
      return { success: true, data: filtered };
   } catch (e) {
      return { success: false, error: { message: e?.message || '예약 조회 실패' } };
   }
}

/**
 * ✅ 예약 취소(미결제 전용)
 * - BOOKED + (UNPAID/FAILED) 만 취소 가능하도록 유지
 * - 결제 완료(PAID)는 refundReservation()로 처리(환불)
 */
export async function cancelReservation({ bookingId, userId } = {}) {
   // -----------------------------
   // ✅ 1) 백엔드 붙으면 여기로 이동
   // -----------------------------
   // try {
   //   const res = await fetch(`${API_BASE}/api/reservations/${bookingId}/cancel`, {
   //     method: 'POST',
   //     headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
   //     body: JSON.stringify({ userId }),
   //   });
   //   const data = await res.json();
   //   return data;
   // } catch (e) {
   //   return { success: false, error: { message: e?.message || '예약 취소 실패' } };
   // }

   // -----------------------------
   // ✅ 2) localStorage 시뮬레이션
   // -----------------------------
   try {
      const list = safeJsonParse(localStorage.getItem(RESV_KEY), []);
      const now = new Date().toISOString();

      let changed = false;

      const next = list.map((r) => {
         if (String(r.bookingId) !== String(bookingId)) return r;
         if (userId && String(r.userId) !== String(userId)) return r;

         // ✅ 결제 완료는 여기서 취소하지 않음(환불로 처리)
         if (r.status !== 'BOOKED') return r;
         if (r.paymentStatus === 'PAID') return r;

         changed = true;
         return {
            ...r,
            status: 'CANCELLED',
            updatedAt: now,
            cancelledAt: now,
         };
      });

      if (!changed) {
         return { success: false, error: { message: '취소할 수 없는 예약 상태입니다.' } };
      }

      localStorage.setItem(RESV_KEY, JSON.stringify(next));
      return { success: true, data: next };
   } catch (e) {
      return { success: false, error: { message: e?.message || '예약 취소 실패' } };
   }
}

/**
 * ✅ 결제 완료 처리(시뮬레이션)
 * - 결제 완료 시 status는 BOOKED 유지(체험일 지나면 COMPLETED로 전이)
 * - paymentStatus: PAID
 * - paidAt 기록
 */
export async function markReservationPaid({ bookingId, method = 'CARD' } = {}) {
   // -----------------------------
   // ✅ 1) 백엔드 붙으면 여기로 이동
   // -----------------------------
   // try {
   //   const res = await fetch(`${API_BASE}/api/reservations/${bookingId}/paid`, {
   //     method: 'POST',
   //     headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
   //     body: JSON.stringify({ method }),
   //   });
   //   const data = await res.json();
   //   return data;
   // } catch (e) {
   //   return { success: false, error: { message: e?.message || '결제 완료 처리 실패' } };
   // }

   // -----------------------------
   // ✅ 2) localStorage 시뮬레이션
   // -----------------------------
   try {
      const list = safeJsonParse(localStorage.getItem(RESV_KEY), []);
      const now = new Date().toISOString();

      let changed = false;

      const next = list.map((r) => {
         if (String(r.bookingId) !== String(bookingId)) return r;

         if (r.status !== 'BOOKED') return r;

         changed = true;
         return {
            ...r,
            paymentStatus: 'PAID',
            method,
            paidAt: now,
            updatedAt: now,
         };
      });

      if (!changed) {
         return { success: false, error: { message: '결제 완료로 변경할 수 없는 예약 상태입니다.' } };
      }

      localStorage.setItem(RESV_KEY, JSON.stringify(next));
      return { success: true, data: next };
   } catch (e) {
      return { success: false, error: { message: e?.message || '결제 완료 처리 실패' } };
   }
}

/**
 * ✅ 결제 실패 처리(시뮬레이션)
 * - paymentStatus: FAILED
 * - failedAt 기록
 */
export async function markReservationPaymentFailed({ bookingId } = {}) {
   // -----------------------------
   // ✅ 1) 백엔드 붙으면 여기로 이동
   // -----------------------------
   // try {
   //   const res = await fetch(`${API_BASE}/api/reservations/${bookingId}/fail`, {
   //     method: 'POST',
   //     headers: { ...getAuthHeaders() },
   //   });
   //   const data = await res.json();
   //   return data;
   // } catch (e) {
   //   return { success: false, error: { message: e?.message || '결제 실패 처리 실패' } };
   // }

   // -----------------------------
   // ✅ 2) localStorage 시뮬레이션
   // -----------------------------
   try {
      const list = safeJsonParse(localStorage.getItem(RESV_KEY), []);
      const now = new Date().toISOString();

      let changed = false;

      const next = list.map((r) => {
         if (String(r.bookingId) !== String(bookingId)) return r;

         if (r.status !== 'BOOKED') return r;

         changed = true;
         return {
            ...r,
            paymentStatus: 'FAILED',
            failedAt: now,
            updatedAt: now,
         };
      });

      if (!changed) {
         return { success: false, error: { message: '결제 실패로 변경할 수 없는 예약 상태입니다.' } };
      }

      localStorage.setItem(RESV_KEY, JSON.stringify(next));
      return { success: true, data: next };
   } catch (e) {
      return { success: false, error: { message: e?.message || '결제 실패 처리 실패' } };
   }
}

/**
 * ✅ 결제 취소(환불) 처리(시뮬레이션)
 * - BOOKED + PAID 만 환불 가능(일반적인 케이스)
 * - status: CANCELLED
 * - paymentStatus: REFUNDED
 * - refundedAt / refundReason 기록
 */
export async function refundReservation({ bookingId, userId, reason = '' } = {}) {
   // -----------------------------
   // ✅ 1) 백엔드 붙으면 여기로 이동
   // -----------------------------
   // try {
   //   const res = await fetch(`${API_BASE}/api/reservations/${bookingId}/refund`, {
   //     method: 'POST',
   //     headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
   //     body: JSON.stringify({ userId, reason }),
   //   });
   //   const data = await res.json();
   //   return data;
   // } catch (e) {
   //   return { success: false, error: { message: e?.message || '환불 처리 실패' } };
   // }

   // -----------------------------
   // ✅ 2) localStorage 시뮬레이션
   // -----------------------------
   try {
      const list = safeJsonParse(localStorage.getItem(RESV_KEY), []);
      const now = new Date().toISOString();

      let changed = false;

      const next = list.map((r) => {
         if (String(r.bookingId) !== String(bookingId)) return r;
         if (userId && String(r.userId) !== String(userId)) return r;

         if (r.status !== 'BOOKED') return r;
         if (r.paymentStatus !== 'PAID') return r;

         changed = true;
         return {
            ...r,
            status: 'CANCELLED',
            paymentStatus: 'REFUNDED',
            refundedAt: now,
            refundReason: reason,
            updatedAt: now,
         };
      });

      if (!changed) {
         return { success: false, error: { message: '환불할 수 없는 예약 상태입니다.' } };
      }

      localStorage.setItem(RESV_KEY, JSON.stringify(next));
      return { success: true, data: next };
   } catch (e) {
      return { success: false, error: { message: e?.message || '환불 처리 실패' } };
   }
}

/**
 * ✅ (선택) 예약일이 "당일 및 이후(=오늘 포함 과거)"면 BOOKED+PAID를 COMPLETED로 전환하는 정규화
 * - 프론트에서 마이페이지 진입 시 실행 용도로 사용 가능
 * - paidAt 우선 정렬/표시 등과 같이 쓰면 자연스럽습니다.
 *
 * ✅ 요구사항 반영:
 * - 예약일 "이전"이면: BOOKED + PAID 유지(= 결제 완료)
 * - 예약일 "당일/이후(오늘 포함 과거)"이면: COMPLETED(= 체험 완료)
 */
export function normalizeReservationStatus(list = []) {
   const today = dayjs().startOf('day');

   let changed = false;

   const next = list.map((r) => {
      const d = r?.date ? dayjs(r.date).startOf('day') : null;

      // ✅ 예약일이 오늘이거나 과거면 true (당일 포함)
      const isTodayOrPast = d ? d.isSame(today) || d.isBefore(today) : false;

      if (r?.status === 'BOOKED' && r?.paymentStatus === 'PAID' && isTodayOrPast) {
         changed = true;
         return {
            ...r,
            status: 'COMPLETED',
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
         };
      }
      return r;
   });

   return { next, changed };
}
