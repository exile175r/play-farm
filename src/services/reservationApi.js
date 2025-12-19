// src/services/reservationApi.js
// ✅ 지금은 localStorage fallback
// ✅ 나중에 백엔드 붙으면 createReservation / listMyReservations / cancelReservation 내부만 서버 호출로 바꾸면 됨

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
   //   const res = await fetch(`${API_BASE}/reservations`, {
   //     method: 'POST',
   //     headers: {
   //       'Content-Type': 'application/json',
   //       ...getAuthHeaders(),
   //     },
   //     body: JSON.stringify(payload),
   //   });
   //   if (!res.ok) throw new Error('예약 생성 실패');
   //   const data = await res.json();
   //   return { success: true, data };
   // } catch (e) {
   //   return { success: false, error: e };
   // }

   const reservation = {
      bookingId: `${Date.now()}`,
      status: 'BOOKED',
      createdAt: new Date().toISOString(),
      ...payload,
   };

   const prev = safeJsonParse(localStorage.getItem(RESV_KEY) || '[]', []);
   const next = Array.isArray(prev) ? [reservation, ...prev] : [reservation];
   localStorage.setItem(RESV_KEY, JSON.stringify(next));

   return { success: true, data: reservation };
}

/**
 * 내 예약 불러오기 (마이페이지에서 사용)
 */
export async function listMyReservations({ userId } = {}) {
   // 백엔드 붙으면: GET /reservations?me=true 이런 식으로 변경
   const all = safeJsonParse(localStorage.getItem(RESV_KEY) || '[]', []);
   const list = Array.isArray(all) ? all : [];

   if (!userId) return { success: true, data: list };
   return {
      success: true,
      data: list.filter((r) => String(r.userId) === String(userId)),
   };
}

/**
 * ✅ 예약 취소 (소프트 취소: status만 CANCELLED로 변경)
 * - bookingId로 찾아서 status 변경
 * - 본인 예약만 취소되게 userId 체크
 * - BOOKED만 취소 가능
 */
export async function cancelReservation({ bookingId, userId }) {
   // -----------------------------
   // ✅ 백엔드 붙으면 여기로 이동
   // -----------------------------
   // try {
   //   const res = await fetch(`${API_BASE}/reservations/${bookingId}/cancel`, {
   //     method: 'POST',
   //     headers: {
   //       'Content-Type': 'application/json',
   //       ...getAuthHeaders(),
   //     },
   //     body: JSON.stringify({ userId }),
   //   });
   //   if (!res.ok) throw new Error('예약 취소 실패');
   //   const data = await res.json();
   //   return { success: true, data };
   // } catch (e) {
   //   return { success: false, error: e };
   // }

   if (!bookingId) return { success: false, error: new Error('bookingId가 필요합니다.') };

   const all = safeJsonParse(localStorage.getItem(RESV_KEY) || '[]', []);
   const list = Array.isArray(all) ? all : [];

   const idx = list.findIndex((r) => String(r.bookingId) === String(bookingId));
   if (idx < 0) return { success: false, error: new Error('예약을 찾을 수 없습니다.') };

   const target = list[idx];

   // 본인 체크
   if (userId && target?.userId && String(target.userId) !== String(userId)) {
      return { success: false, error: new Error('본인 예약만 취소할 수 있습니다.') };
   }

   // BOOKED만 취소
   if (target?.status !== 'BOOKED') {
      return { success: false, error: new Error('진행중(BOOKED) 예약만 취소할 수 있습니다.') };
   }

   const nextTarget = {
      ...target,
      status: 'CANCELLED',
      cancelledAt: new Date().toISOString(),
   };

   const next = [...list];
   next[idx] = nextTarget;

   localStorage.setItem(RESV_KEY, JSON.stringify(next));
   return { success: true, data: nextTarget };
}
