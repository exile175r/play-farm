const db = require('../config/db');

// 예약 생성
exports.createReservation = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.userId;
    const { programId, date, time, people, price, memo } = req.body;

    // 입력 검증
    if (!programId || !date || !time || !people || !price) {
      return res.status(400).json({
        success: false,
        message: '필수 항목이 누락되었습니다.'
      });
    }

    // 프로그램 존재 확인
    const [programs] = await connection.query(
      'SELECT id, program_nm, max_personnel, min_personnel FROM programs WHERE id = ?',
      [programId]
    );

    if (programs.length === 0) {
      return res.status(404).json({
        success: false,
        message: '프로그램을 찾을 수 없습니다.'
      });
    }

    const program = programs[0];

    // 최소/최대 인원 확인
    if (program.min_personnel && Number(people) < Number(program.min_personnel)) {
      return res.status(400).json({
        success: false,
        message: `최소 인원은 ${program.min_personnel}명입니다.`
      });
    }

    if (program.max_personnel && Number(people) > Number(program.max_personnel)) {
      return res.status(400).json({
        success: false,
        message: `최대 인원은 ${program.max_personnel}명입니다.`
      });
    }

    // 중복 예약 확인 (같은 사용자, 같은 프로그램, 같은 날짜/시간)
    const [existing] = await connection.query(
      `SELECT id FROM reservations 
       WHERE user_id = ? AND program_id = ? AND res_date = ? AND res_date_time = ? AND status != 'cancelled'`,
      [userId, programId, date, time]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: '이미 예약된 시간입니다.'
      });
    }

    // 예약 생성
    const [result] = await connection.query(
      `INSERT INTO reservations (user_id, program_id, res_date, res_date_time, personnel, total_price, status, memo)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [userId, programId, date, time, people, price, memo || null]
    );

    const reservationId = result.insertId;

    // 생성된 예약 조회
    const [reservations] = await connection.query(
      `SELECT 
        r.id,
        r.user_id,
        r.program_id,
        r.res_date as date,
        r.res_date_time as time,
        r.personnel as people,
        r.total_price as price,
        r.status,
        r.memo,
        r.created_at as createdAt,
        r.cancelled_at as cancelledAt,
        p.program_nm as title
       FROM reservations r
       INNER JOIN programs p ON r.program_id = p.id
       WHERE r.id = ?`,
      [reservationId]
    );

    await connection.commit();

    if (reservations.length === 0) {
      return res.status(500).json({
        success: false,
        message: '예약 생성 후 조회에 실패했습니다.'
      });
    }

    const reservation = reservations[0];

    // 프론트엔드 형식에 맞게 변환
    const response = {
      bookingId: String(reservation.id),
      programId: String(reservation.program_id),
      userId: String(reservation.user_id),
      title: reservation.title,
      date: reservation.date,
      time: reservation.time,
      people: reservation.people,
      price: Number(reservation.price),
      status: mapStatusToFrontend(reservation.status), // 'pending' -> 'BOOKED' (예약 대기)
      paymentStatus: 'UNPAID',
      payment: null,
      createdAt: reservation.createdAt,
      cancelledAt: reservation.cancelledAt,
      memo: reservation.memo
    };

    res.status(201).json({
      success: true,
      data: response
    });

  } catch (error) {
    await connection.rollback();
    console.error('예약 생성 실패:', error);
    res.status(500).json({
      success: false,
      message: '예약 생성 중 오류가 발생했습니다.'
    });
  } finally {
    connection.release();
  }
};

// 내 예약 목록 조회
exports.getMyReservations = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const userId = req.userId;

    const [reservations] = await connection.query(
      `SELECT 
        r.id,
        r.user_id,
        r.program_id,
        r.res_date as date,
        r.res_date_time as time,
        r.personnel as people,
        r.total_price as price,
        r.status,
        r.memo,
        r.created_at as createdAt,
        r.cancelled_at as cancelledAt,
        r.updated_at as updatedAt,
        p.program_nm as title
       FROM reservations r
       INNER JOIN programs p ON r.program_id = p.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [userId]
    );

    // 프론트엔드 형식에 맞게 변환
    const formatted = await Promise.all(reservations.map(async r => {
      const paymentStatus = await getPaymentStatus(connection, r.id, r.status);
      const payment = await getPaymentInfo(connection, r.id);
      
      return {
        bookingId: String(r.id),
        programId: String(r.program_id),
        userId: String(r.user_id),
        title: r.title,
        date: r.date,
        time: r.time,
        people: r.people,
        price: Number(r.price),
        status: mapStatusToFrontend(r.status),
        paymentStatus: paymentStatus,
        payment: payment,
        createdAt: r.createdAt,
        cancelledAt: r.cancelledAt,
        updatedAt: r.updatedAt,
        memo: r.memo,
        cancelReason: getCancelReason(r.memo)
      };
    }));

    res.status(200).json({
      success: true,
      data: formatted
    });

  } catch (error) {
    console.error('예약 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '예약 목록 조회 중 오류가 발생했습니다.'
    });
  } finally {
    connection.release();
  }
};

// 예약 상세 조회
exports.getReservationById = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const userId = req.userId;
    const reservationId = req.params.id;

    const [reservations] = await connection.query(
      `SELECT 
        r.id,
        r.user_id,
        r.program_id,
        r.res_date as date,
        r.res_date_time as time,
        r.personnel as people,
        r.total_price as price,
        r.status,
        r.memo,
        r.created_at as createdAt,
        r.cancelled_at as cancelledAt,
        p.program_nm as title
       FROM reservations r
       INNER JOIN programs p ON r.program_id = p.id
       WHERE r.id = ? AND r.user_id = ?`,
      [reservationId, userId]
    );

    if (reservations.length === 0) {
      return res.status(404).json({
        success: false,
        message: '예약을 찾을 수 없습니다.'
      });
    }

    const reservation = reservations[0];
    const paymentStatus = await getPaymentStatus(connection, reservationId, reservation.status);
    const payment = await getPaymentInfo(connection, reservationId);

    const response = {
      bookingId: String(reservation.id),
      programId: String(reservation.program_id),
      userId: String(reservation.user_id),
      title: reservation.title,
      date: reservation.date,
      time: reservation.time,
      people: reservation.people,
      price: Number(reservation.price),
      status: mapStatusToFrontend(reservation.status),
      paymentStatus: paymentStatus,
      payment: payment,
      createdAt: reservation.createdAt,
      cancelledAt: reservation.cancelledAt,
      memo: reservation.memo,
      cancelReason: getCancelReason(reservation.memo)
    };

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('예약 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '예약 조회 중 오류가 발생했습니다.'
    });
  } finally {
    connection.release();
  }
};

// 예약 취소
exports.cancelReservation = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.userId;
    const reservationId = req.params.id;

    // 예약 조회 및 권한 확인
    const [reservations] = await connection.query(
      'SELECT * FROM reservations WHERE id = ? AND user_id = ?',
      [reservationId, userId]
    );

    if (reservations.length === 0) {
      return res.status(404).json({
        success: false,
        message: '예약을 찾을 수 없습니다.'
      });
    }

    const reservation = reservations[0];

    // 취소 가능한 상태 확인 (pending 또는 confirmed만 취소 가능)
    if (reservation.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: '이미 취소된 예약입니다.'
      });
    }

    if (reservation.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: '완료된 예약은 취소할 수 없습니다.'
      });
    }

    // 예약 취소 처리
    const cancelReason = '[사용자 취소] 사용자가 예약을 취소했습니다.';
    await connection.query(
      `UPDATE reservations 
       SET status = 'cancelled', 
           cancelled_at = NOW(),
           memo = COALESCE(CONCAT(memo, '\n', ?), ?)
       WHERE id = ?`,
      [cancelReason, cancelReason, reservationId]
    );

    // 취소된 예약 조회
    const [updated] = await connection.query(
      `SELECT 
        r.id,
        r.user_id,
        r.program_id,
        r.res_date as date,
        r.res_date_time as time,
        r.personnel as people,
        r.total_price as price,
        r.status,
        r.memo,
        r.created_at as createdAt,
        r.cancelled_at as cancelledAt,
        p.program_nm as title
       FROM reservations r
       INNER JOIN programs p ON r.program_id = p.id
       WHERE r.id = ?`,
      [reservationId]
    );

    await connection.commit();

    const cancelledReservation = updated[0];

    // 라인 346 수정
    const response = {
      bookingId: String(cancelledReservation.id),
      programId: String(cancelledReservation.program_id),
      userId: String(cancelledReservation.user_id), // 수정: reservation -> cancelledReservation
      title: cancelledReservation.title,
      date: cancelledReservation.date,
      time: cancelledReservation.time,
      people: cancelledReservation.people,
      price: Number(cancelledReservation.price),
      status: mapStatusToFrontend(cancelledReservation.status),
      paymentStatus: 'UNPAID',
      payment: null,
      createdAt: cancelledReservation.createdAt,
      cancelledAt: cancelledReservation.cancelledAt,
      memo: cancelledReservation.memo,
      cancelReason: getCancelReason(cancelledReservation.memo)
    };

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    await connection.rollback();
    console.error('예약 취소 실패:', error);
    res.status(500).json({
      success: false,
      message: '예약 취소 중 오류가 발생했습니다.'
    });
  } finally {
    connection.release();
  }
};

// 결제 처리 (payments 테이블 사용)
exports.markPayment = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.userId;
    const reservationId = req.params.id;
    const { method = 'CARD', buyerName, buyerPhone, buyerEmail } = req.body;

    // 예약 조회 및 권한 확인
    const [reservations] = await connection.query(
      `SELECT 
        r.*,
        p.program_nm,
        p.max_personnel,
        p.min_personnel
       FROM reservations r
       INNER JOIN programs p ON r.program_id = p.id
       WHERE r.id = ? AND r.user_id = ?`,
      [reservationId, userId]
    );

    if (reservations.length === 0) {
      return res.status(404).json({
        success: false,
        message: '예약을 찾을 수 없습니다.'
      });
    }

    const confirmedReservation = reservations[0];

    // 예약 상태 확인
    if (confirmedReservation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `결제 가능한 상태가 아닙니다. (현재 상태: ${confirmedReservation.status})`
      });
    }

    // 이미 결제 완료 확인
    const [existingPayments] = await connection.query(
      `SELECT id FROM payments 
       WHERE reservation_id = ? AND status = 'PAID'`,
      [reservationId]
    );

    if (existingPayments.length > 0) {
      return res.status(400).json({
        success: false,
        message: '이미 결제가 완료된 예약입니다.'
      });
    }

    // ===== 예약 정보 검토 =====
    const validationResult = await validateReservation(connection, confirmedReservation);

    if (!validationResult.valid) {
      // 검증 실패: 예약 취소 처리
      const cancelReason = `[시스템 취소] ${validationResult.reason}`;
      await connection.query(
        `UPDATE reservations 
         SET status = 'cancelled', 
             cancelled_at = NOW(),
             memo = COALESCE(CONCAT(COALESCE(memo, ''), '\n', ?), ?)
         WHERE id = ?`,
        [cancelReason, cancelReason, reservationId]
      );

      await connection.commit();

      // 취소된 예약 조회
      const [cancelled] = await connection.query(
        `SELECT 
          r.id,
          r.user_id,
          r.program_id,
          r.res_date as date,
          r.res_date_time as time,
          r.personnel as people,
          r.total_price as price,
          r.status,
          r.memo,
          r.created_at as createdAt,
          r.cancelled_at as cancelledAt,
          p.program_nm as title
         FROM reservations r
         INNER JOIN programs p ON r.program_id = p.id
         WHERE r.id = ?`,
        [reservationId]
      );

      const cancelledReservation = cancelled[0];

      return res.status(400).json({
        success: false,
        message: validationResult.reason,
        data: {
          bookingId: String(cancelledReservation.id),
          programId: String(cancelledReservation.program_id),
          userId: String(cancelledReservation.user_id),
          title: cancelledReservation.title,
          date: cancelledReservation.date,
          time: cancelledReservation.time,
          people: cancelledReservation.people,
          price: Number(cancelledReservation.price),
          status: mapStatusToFrontend(cancelledReservation.status), // 'CANCELLED'
          paymentStatus: 'UNPAID',
          payment: null,
          createdAt: cancelledReservation.createdAt,
          cancelledAt: cancelledReservation.cancelledAt,
          memo: cancelledReservation.memo,
          cancelReason: validationResult.reason
        }
      });
    }

    // 검증 성공: 예약 확정 및 결제 처리
    await connection.query(
      `UPDATE reservations SET status = 'confirmed' WHERE id = ?`,
      [reservationId]
    );

    // 결제 정보를 payments 테이블에 저장
    const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const [paymentResult] = await connection.query(
      `INSERT INTO payments (
        payment_type, reservation_id, order_id, payment_id,
        method, amount, status, buyer_name, buyer_phone, buyer_email, paid_at
      ) VALUES ('RESERVATION', ?, NULL, ?, ?, ?, 'PAID', ?, ?, ?, NOW())`,
      [
        reservationId,
        paymentId,
        method,
        Number(confirmedReservation.total_price),
        buyerName || null,
        buyerPhone || null,
        buyerEmail || null
      ]
    );

    // 포인트 적립 (결제 금액의 5%)
    const paymentAmount = Number(confirmedReservation.total_price);
    const earnedPoints = Math.floor(paymentAmount * 0.05); // 5% 적립
    
    if (earnedPoints > 0) {
      // 사용자 포인트 업데이트
      await connection.query(
        `UPDATE users SET points = points + ? WHERE id = ?`,
        [earnedPoints, userId]
      );

      // 현재 포인트 잔액 조회
      const [userResult] = await connection.query(
        `SELECT points FROM users WHERE id = ?`,
        [userId]
      );
      const balanceAfter = userResult[0].points;

      // 포인트 거래 내역 저장
      await connection.query(
        `INSERT INTO point_transactions (
          user_id, type, amount, balance_after, source_type, source_id, description, expires_at
        ) VALUES (?, 'EARNED', ?, ?, 'RESERVATION', ?, ?, DATE_ADD(NOW(), INTERVAL 1 YEAR))`,
        [
          userId,
          earnedPoints,
          balanceAfter,
          reservationId,
          `예약 결제 포인트 적립 (${paymentAmount.toLocaleString()}원의 5%)`
        ]
      );
    }

    await connection.commit();

    // 업데이트된 예약 및 결제 정보 조회
    const [updated] = await connection.query(
      `SELECT 
        r.id,
        r.user_id,
        r.program_id,
        r.res_date as date,
        r.res_date_time as time,
        r.personnel as people,
        r.total_price as price,
        r.status,
        r.memo,
        r.created_at as createdAt,
        r.cancelled_at as cancelledAt,
        p.program_nm as title
       FROM reservations r
       INNER JOIN programs p ON r.program_id = p.id
       WHERE r.id = ?`,
      [reservationId]
    );

    const [payments] = await connection.query(
      `SELECT * FROM payments WHERE id = ?`,
      [paymentResult.insertId]
    );

    const reservation = updated[0];
    const payment = payments[0];

    const paymentInfo = {
      id: payment.id,
      paymentId: payment.payment_id,
      method: payment.method,
      amount: Number(payment.amount),
      status: payment.status,
      paidAt: payment.paid_at,
      buyerName: payment.buyer_name,
      buyerPhone: payment.buyer_phone,
      buyerEmail: payment.buyer_email
    };

    const response = {
      bookingId: String(reservation.id),
      programId: String(reservation.program_id),
      userId: String(reservation.user_id),
      title: reservation.title,
      date: reservation.date,
      time: reservation.time,
      people: reservation.people,
      price: Number(reservation.price),
      status: mapStatusToFrontend(reservation.status),
      paymentStatus: 'PAID',
      payment: paymentInfo,
      createdAt: reservation.createdAt,
      cancelledAt: reservation.cancelledAt,
      memo: reservation.memo
    };

    res.status(200).json({
      success: true,
      message: '예약이 확정되었고 결제가 완료되었습니다.',
      data: response
    });

  } catch (error) {
    await connection.rollback();
    console.error('결제 처리 실패:', error);
    res.status(500).json({
      success: false,
      message: '결제 처리 중 오류가 발생했습니다.'
    });
  } finally {
    connection.release();
  }
};

// 라인 565-624 전체 수정: markPaymentFailed 함수
// 결제 실패 처리 (시뮬레이션)
exports.markPaymentFailed = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.userId;
    const reservationId = req.params.id;

    // 예약 조회 및 권한 확인
    const [reservations] = await connection.query(
      `SELECT 
        r.*,
        p.program_nm as title
       FROM reservations r
       INNER JOIN programs p ON r.program_id = p.id
       WHERE r.id = ? AND r.user_id = ?`,
      [reservationId, userId]
    );

    if (reservations.length === 0) {
      return res.status(404).json({
        success: false,
        message: '예약을 찾을 수 없습니다.'
      });
    }

    const reservation = reservations[0];

    // 결제 실패 정보를 메모에 저장
    const failureInfo = {
      failedAt: new Date().toISOString(),
      reason: '결제 시뮬레이션 실패'
    };
    const failureMemo = `[결제실패] ${JSON.stringify(failureInfo)}`;

    await connection.query(
      `UPDATE reservations 
       SET memo = COALESCE(CONCAT(COALESCE(memo, ''), '\n', ?), ?) 
       WHERE id = ?`,
      [failureMemo, failureMemo, reservationId]
    );

    await connection.commit();

    // 업데이트된 예약 조회
    const [updated] = await connection.query(
      `SELECT 
        r.id,
        r.user_id,
        r.program_id,
        r.res_date as date,
        r.res_date_time as time,
        r.personnel as people,
        r.total_price as price,
        r.status,
        r.memo,
        r.created_at as createdAt,
        r.cancelled_at as cancelledAt,
        p.program_nm as title
       FROM reservations r
       INNER JOIN programs p ON r.program_id = p.id
       WHERE r.id = ?`,
      [reservationId]
    );

    const updatedReservation = updated[0];

    const response = {
      bookingId: String(updatedReservation.id),
      programId: String(updatedReservation.program_id),
      userId: String(updatedReservation.user_id),
      title: updatedReservation.title,
      date: updatedReservation.date,
      time: updatedReservation.time,
      people: updatedReservation.people,
      price: Number(updatedReservation.price),
      status: mapStatusToFrontend(updatedReservation.status),
      paymentStatus: 'FAILED',
      payment: null,
      createdAt: updatedReservation.createdAt,
      cancelledAt: updatedReservation.cancelledAt,
      memo: updatedReservation.memo
    };

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    await connection.rollback();
    console.error('결제 실패 처리 실패:', error);
    res.status(500).json({
      success: false,
      message: '결제 실패 처리 중 오류가 발생했습니다.'
    });
  } finally {
    connection.release();
  }
};

// ===== 헬퍼 함수 =====

// 예약 정보 검토 함수
async function validateReservation(connection, reservation) {
  try {
    // 1. 프로그램 존재 확인
    const [programs] = await connection.query(
      'SELECT id, program_nm, max_personnel, min_personnel FROM programs WHERE id = ?',
      [reservation.program_id]
    );

    if (programs.length === 0) {
      return {
        valid: false,
        reason: '예약하신 프로그램이 존재하지 않습니다.'
      };
    }

    const program = programs[0];

    // 2. 예약 날짜가 과거인지 확인
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const resDate = new Date(reservation.res_date);
    resDate.setHours(0, 0, 0, 0);

    if (resDate < today) {
      return {
        valid: false,
        reason: '과거 날짜는 예약할 수 없습니다.'
      };
    }

    // 3. 최소/최대 인원 확인
    if (program.min_personnel && Number(reservation.personnel) < Number(program.min_personnel)) {
      return {
        valid: false,
        reason: `최소 인원은 ${program.min_personnel}명입니다. (현재: ${reservation.personnel}명)`
      };
    }

    if (program.max_personnel && Number(reservation.personnel) > Number(program.max_personnel)) {
      return {
        valid: false,
        reason: `최대 인원은 ${program.max_personnel}명입니다. (현재: ${reservation.personnel}명)`
      };
    }

    // 4. 해당 날짜/시간에 이미 예약된 총 인원 수 확인
    const [existingReservations] = await connection.query(
      `SELECT SUM(personnel) as total_personnel 
       FROM reservations 
       WHERE program_id = ? 
         AND res_date = ? 
         AND res_date_time = ? 
         AND status IN ('pending', 'confirmed')
         AND id != ?`,
      [reservation.program_id, reservation.res_date, reservation.res_date_time, reservation.id]
    );

    const existingPersonnel = Number(existingReservations[0]?.total_personnel || 0);
    const requestedPersonnel = Number(reservation.personnel);
    const maxPersonnel = Number(program.max_personnel || 999);

    if (existingPersonnel + requestedPersonnel > maxPersonnel) {
      return {
        valid: false,
        reason: `해당 시간대에 예약 가능한 인원을 초과했습니다. (예약 가능: ${maxPersonnel - existingPersonnel}명, 요청: ${requestedPersonnel}명)`
      };
    }

    // 5. 중복 예약 확인 (같은 사용자가 같은 프로그램/날짜/시간에 다른 예약이 있는지)
    const [duplicate] = await connection.query(
      `SELECT id FROM reservations 
       WHERE user_id = ? 
         AND program_id = ? 
         AND res_date = ? 
         AND res_date_time = ? 
         AND status != 'cancelled'
         AND id != ?`,
      [reservation.user_id, reservation.program_id, reservation.res_date, reservation.res_date_time, reservation.id]
    );

    if (duplicate.length > 0) {
      return {
        valid: false,
        reason: '이미 동일한 시간에 예약이 있습니다.'
      };
    }

    // 모든 검증 통과
    return {
      valid: true,
      reason: null
    };

  } catch (error) {
    console.error('예약 검증 중 오류:', error);
    return {
      valid: false,
      reason: '예약 검증 중 오류가 발생했습니다.'
    };
  }
}

// 상태 매핑 함수 (DB -> 프론트엔드)
function mapStatusToFrontend(dbStatus) {
  const statusMap = {
    'pending': 'BOOKED',      // 예약 대기
    'confirmed': 'BOOKED',    // 예약 확정 (프론트에서는 BOOKED로 표시)
    'cancelled': 'CANCELLED', // 예약 취소
    'completed': 'COMPLETED'  // 체험 완료
  };
  return statusMap[dbStatus] || 'BOOKED';
}

// 결제 상태 확인 함수 (payments 테이블 기준)
async function getPaymentStatus(connection, reservationId, status) {
  if (status === 'cancelled') {
    const [refundedPayments] = await connection.query(
      `SELECT status FROM payments 
       WHERE reservation_id = ? AND status = 'REFUNDED'`,
      [reservationId]
    );
    if (refundedPayments.length > 0) {
      return 'REFUNDED';
    }
    return 'UNPAID';
  }

  const [payments] = await connection.query(
    `SELECT status FROM payments 
     WHERE reservation_id = ? 
     ORDER BY created_at DESC 
     LIMIT 1`,
    [reservationId]
  );

  if (payments.length === 0) {
    return 'UNPAID';
  }

  const paymentStatus = payments[0].status;
  if (paymentStatus === 'PAID') return 'PAID';
  if (paymentStatus === 'FAILED') return 'FAILED';
  if (paymentStatus === 'REFUNDED') return 'REFUNDED';
  
  return 'UNPAID';
}

// 결제 정보 파싱 함수 (payments 테이블 기준)
async function getPaymentInfo(connection, reservationId) {
  const [payments] = await connection.query(
    `SELECT 
      id, payment_id, method, amount, status,
      buyer_name, buyer_phone, buyer_email,
      paid_at, refunded_at, refund_reason
     FROM payments 
     WHERE reservation_id = ? 
     ORDER BY created_at DESC 
     LIMIT 1`,
    [reservationId]
  );

  if (payments.length === 0) {
    return null;
  }

  const payment = payments[0];
  return {
    id: payment.id,
    paymentId: payment.payment_id,
    method: payment.method,
    amount: Number(payment.amount),
    status: payment.status,
    buyerName: payment.buyer_name,
    buyerPhone: payment.buyer_phone,
    buyerEmail: payment.buyer_email,
    paidAt: payment.paid_at,
    refundedAt: payment.refunded_at,
    refundReason: payment.refund_reason
  };
}

// 취소 사유 추출 함수
function getCancelReason(memo) {
  if (!memo) return null;

  const match = memo.match(/\[(시스템 취소|사용자 취소)\]\s*(.+?)(?:\n|$)/);
  if (match) {
    return match[2];
  }

  return null;
}

// 결제 취소(환불) 처리
exports.refundReservation = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.userId;
    const reservationId = req.params.id;
    const { reason } = req.body;

    // 예약 조회 및 권한 확인
    const [reservations] = await connection.query(
      `SELECT 
        r.*,
        p.program_nm as title
       FROM reservations r
       INNER JOIN programs p ON r.program_id = p.id
       WHERE r.id = ? AND r.user_id = ?`,
      [reservationId, userId]
    );

    if (reservations.length === 0) {
      return res.status(404).json({
        success: false,
        message: '예약을 찾을 수 없습니다.'
      });
    }

    const reservation = reservations[0];

    // 환불 가능한 상태 확인 (confirmed 상태이고 결제 완료된 예약만 환불 가능)
    if (reservation.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: '이미 취소된 예약입니다.'
      });
    }

    if (reservation.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: '완료된 예약은 환불할 수 없습니다.'
      });
    }

    // 결제 완료 여부 확인 (메모에 결제 정보가 있어야 환불 가능)
    const hasPayment = reservation.memo && reservation.memo.includes('[결제정보]');
    if (!hasPayment) {
      return res.status(400).json({
        success: false,
        message: '결제가 완료되지 않은 예약은 환불할 수 없습니다.'
      });
    }

    // 환불 처리 (예약 취소 + 환불 정보 추가)
    const refundInfo = {
      reason: reason || '사용자 요청',
      refundedAt: new Date().toISOString(),
      amount: Number(reservation.total_price)
    };

    const refundMemo = `[환불정보] ${JSON.stringify(refundInfo)}`;
    const cancelReason = `[사용자 환불 요청] ${reason || '사용자가 환불을 요청했습니다.'}`;

    // 메모에 환불 정보와 취소 사유를 모두 저장
    const combinedMemo = `${refundMemo}\n${cancelReason}`;

    await connection.query(
      `UPDATE reservations 
       SET status = 'cancelled', 
           cancelled_at = NOW(),
           memo = COALESCE(CONCAT(COALESCE(memo, ''), '\n', ?), ?)
       WHERE id = ?`,
      [combinedMemo, combinedMemo, reservationId]
    );

    // 환불된 예약 조회
    const [updated] = await connection.query(
      `SELECT 
        r.id,
        r.user_id,
        r.program_id,
        r.res_date as date,
        r.res_date_time as time,
        r.personnel as people,
        r.total_price as price,
        r.status,
        r.memo,
        r.created_at as createdAt,
        r.cancelled_at as cancelledAt,
        p.program_nm as title
       FROM reservations r
       INNER JOIN programs p ON r.program_id = p.id
       WHERE r.id = ?`,
      [reservationId]
    );

    await connection.commit();

    const refundedReservation = updated[0];

    const response = {
      bookingId: String(refundedReservation.id),
      programId: String(refundedReservation.program_id),
      userId: String(refundedReservation.user_id),
      title: refundedReservation.title,
      date: refundedReservation.date,
      time: refundedReservation.time,
      people: refundedReservation.people,
      price: Number(refundedReservation.price),
      status: mapStatusToFrontend(refundedReservation.status), // 'CANCELLED'
      paymentStatus: getPaymentStatus(refundedReservation.status, refundedReservation.memo), // 'REFUNDED'
      payment: getPaymentInfo(refundedReservation.memo),
      createdAt: refundedReservation.createdAt,
      cancelledAt: refundedReservation.cancelledAt,
      memo: refundedReservation.memo,
      cancelReason: getCancelReason(refundedReservation.memo)
    };

    res.status(200).json({
      success: true,
      message: '환불이 정상적으로 처리되었습니다.',
      data: response
    });

  } catch (error) {
    await connection.rollback();
    console.error('환불 처리 실패:', error);
    res.status(500).json({
      success: false,
      message: '환불 처리 중 오류가 발생했습니다.'
    });
  } finally {
    connection.release();
  }
};