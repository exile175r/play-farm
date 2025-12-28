const db = require('../config/db');

// 통합 결제 처리 (예약 또는 주문)
exports.processPayment = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.userId;
    const { paymentType, reservationId, orderId, method = 'CARD', buyerName, buyerPhone, buyerEmail } = req.body;

    // 결제 타입 검증
    if (paymentType !== 'RESERVATION' && paymentType !== 'ORDER') {
      return res.status(400).json({
        success: false,
        message: '결제 유형이 올바르지 않습니다.'
      });
    }

    let targetId;
    let amount;

    // 예약 결제인 경우
    if (paymentType === 'RESERVATION') {
      if (!reservationId) {
        return res.status(400).json({
          success: false,
          message: '예약 ID가 필요합니다.'
        });
      }

      // 예약 조회 및 권한 확인
      const [reservations] = await connection.query(
        `SELECT r.*, p.program_nm 
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

      if (reservation.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `결제 가능한 상태가 아닙니다. (현재 상태: ${reservation.status})`
        });
      }

      // 이미 결제 완료 확인
      const [existingPayments] = await connection.query(
        `SELECT id FROM payments WHERE reservation_id = ? AND status = 'PAID'`,
        [reservationId]
      );

      if (existingPayments.length > 0) {
        return res.status(400).json({
          success: false,
          message: '이미 결제가 완료된 예약입니다.'
        });
      }

      targetId = reservationId;
      amount = Number(reservation.total_price);

      // 예약 상태를 confirmed로 변경
      await connection.query(
        `UPDATE reservations SET status = 'confirmed' WHERE id = ?`,
        [reservationId]
      );
    }
    // 주문 결제인 경우
    else if (paymentType === 'ORDER') {
      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: '주문 ID가 필요합니다.'
        });
      }

      // 주문 조회 및 권한 확인
      const [orders] = await connection.query(
        `SELECT * FROM orders WHERE order_id = ? AND user_id = ?`,
        [orderId, userId]
      );

      if (orders.length === 0) {
        return res.status(404).json({
          success: false,
          message: '주문을 찾을 수 없습니다.'
        });
      }

      const order = orders[0];

      if (order.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          message: `결제 가능한 상태가 아닙니다. (현재 상태: ${order.status})`
        });
      }

      // 이미 결제 완료 확인
      const [existingPayments] = await connection.query(
        `SELECT id FROM payments WHERE order_id = ? AND status = 'PAID'`,
        [order.id]
      );

      if (existingPayments.length > 0) {
        return res.status(400).json({
          success: false,
          message: '이미 결제가 완료된 주문입니다.'
        });
      }

      targetId = order.id;
      amount = Number(order.total_amount);

      // 주문 상태를 PAID로 변경
      await connection.query(
        `UPDATE orders SET status = 'PAID' WHERE id = ?`,
        [order.id]
      );
    }

    // 결제 정보 저장
    const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const [paymentResult] = await connection.query(
      `INSERT INTO payments (
        payment_type, reservation_id, order_id, payment_id,
        method, amount, status, buyer_name, buyer_phone, buyer_email, paid_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'PAID', ?, ?, ?, NOW())`,
      [
        paymentType,
        paymentType === 'RESERVATION' ? targetId : null,
        paymentType === 'ORDER' ? targetId : null,
        paymentId,
        method,
        amount,
        buyerName || null,
        buyerPhone || null,
        buyerEmail || null
      ]
    );

    // 포인트 적립 (결제 금액의 5%)
    const earnedPoints = Math.floor(amount * 0.05); // 5% 적립
    
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
      const sourceId = paymentType === 'RESERVATION' ? reservationId : orderId;
      await connection.query(
        `INSERT INTO point_transactions (
          user_id, type, amount, balance_after, source_type, source_id, description, expires_at
        ) VALUES (?, 'EARNED', ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 YEAR))`,
        [
          userId,
          earnedPoints,
          balanceAfter,
          paymentType,
          sourceId,
          `${paymentType === 'RESERVATION' ? '예약' : '주문'} 결제 포인트 적립 (${amount.toLocaleString()}원의 5%)`
        ]
      );
    }

    await connection.commit();

    // 결제 정보 조회
    const [payments] = await connection.query(
      `SELECT * FROM payments WHERE id = ?`,
      [paymentResult.insertId]
    );

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

    res.status(200).json({
      success: true,
      message: '결제가 완료되었습니다.',
      data: {
        payment: paymentInfo,
        paymentType: paymentType
      }
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

