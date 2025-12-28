const db = require('../config/db');

// 상품 주문 생성
exports.createOrder = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.userId;
    const { items, buyer, amount, payMethod } = req.body;

    // 입력 검증
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: '주문할 상품이 없습니다.'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: '주문 금액이 올바르지 않습니다.'
      });
    }

    // 주문 ID 생성
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 주문 생성
    const [orderResult] = await connection.query(
      `INSERT INTO orders (user_id, order_id, status, total_amount, memo)
       VALUES (?, ?, 'PENDING', ?, ?)`,
      [userId, orderId, Number(amount), JSON.stringify({ buyer, payMethod }) || null]
    );

    const orderDbId = orderResult.insertId;

    // 주문 상품 저장
    for (const item of items) {
      await connection.query(
        `INSERT INTO order_items (
          order_id, product_id, product_title, product_image,
          option_id, option_name, unit_price, quantity
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderDbId,
          String(item.productId || item.id || ''),
          String(item.title || item.name || ''),
          String(item.image || ''),
          item.optionId || null,
          item.optionName || null,
          Number(item.unitPrice || item.price || 0),
          Number(item.qty || item.quantity || 1)
        ]
      );
    }

    await connection.commit();

    // 생성된 주문 조회
    const [orders] = await connection.query(
      `SELECT * FROM orders WHERE id = ?`,
      [orderDbId]
    );

    const [orderItems] = await connection.query(
      `SELECT * FROM order_items WHERE order_id = ?`,
      [orderDbId]
    );

    const order = orders[0];

    const response = {
      orderId: order.order_id,
      status: order.status,
      totalAmount: Number(order.total_amount),
      items: orderItems.map(item => ({
        productId: item.product_id,
        title: item.product_title,
        image: item.product_image,
        optionId: item.option_id,
        optionName: item.option_name,
        unitPrice: Number(item.unit_price),
        quantity: item.quantity
      })),
      createdAt: order.created_at
    };

    res.status(201).json({
      success: true,
      data: response
    });

  } catch (error) {
    await connection.rollback();
    console.error('주문 생성 실패:', error);
    res.status(500).json({
      success: false,
      message: '주문 생성 중 오류가 발생했습니다.'
    });
  } finally {
    connection.release();
  }
};

// 내 주문 목록 조회
exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.userId;

    const [orders] = await db.query(
      `SELECT 
        o.id,
        o.order_id,
        o.status,
        o.total_amount,
        o.created_at,
        o.updated_at,
        o.cancelled_at
       FROM orders o
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [userId]
    );

    const formatted = await Promise.all(orders.map(async order => {
      const [items] = await db.query(
        `SELECT * FROM order_items WHERE order_id = ?`,
        [order.id]
      );

      const [payments] = await db.query(
        `SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1`,
        [order.id]
      );

      return {
        orderId: order.order_id,
        status: order.status,
        totalAmount: Number(order.total_amount),
        items: items.map(item => ({
          productId: item.product_id,
          title: item.product_title,
          image: item.product_image,
          optionId: item.option_id,
          optionName: item.option_name,
          unitPrice: Number(item.unit_price),
          quantity: item.quantity
        })),
        payment: payments.length > 0 ? {
          paymentId: payments[0].payment_id,
          method: payments[0].method,
          status: payments[0].status,
          paidAt: payments[0].paid_at
        } : null,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        cancelledAt: order.cancelled_at
      };
    }));

    res.status(200).json({
      success: true,
      data: formatted
    });

  } catch (error) {
    console.error('주문 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '주문 목록 조회 중 오류가 발생했습니다.'
    });
  }
};

// 주문 상세 조회
exports.getOrderById = async (req, res) => {
  try {
    const userId = req.userId;
    const orderId = req.params.id; // order_id (ORD-xxx 형식)

    const [orders] = await db.query(
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

    const [items] = await db.query(
      `SELECT * FROM order_items WHERE order_id = ?`,
      [order.id]
    );

    const [payments] = await db.query(
      `SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1`,
      [order.id]
    );

    const response = {
      orderId: order.order_id,
      status: order.status,
      totalAmount: Number(order.total_amount),
      items: items.map(item => ({
        productId: item.product_id,
        title: item.product_title,
        image: item.product_image,
        optionId: item.option_id,
        optionName: item.option_name,
        unitPrice: Number(item.unit_price),
        quantity: item.quantity
      })),
      payment: payments.length > 0 ? {
        id: payments[0].id,
        paymentId: payments[0].payment_id,
        method: payments[0].method,
        status: payments[0].status,
        buyerName: payments[0].buyer_name,
        buyerPhone: payments[0].buyer_phone,
        buyerEmail: payments[0].buyer_email,
        paidAt: payments[0].paid_at,
        refundedAt: payments[0].refunded_at,
        refundReason: payments[0].refund_reason
      } : null,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      cancelledAt: order.cancelled_at
    };

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('주문 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '주문 조회 중 오류가 발생했습니다.'
    });
  }
};

// 주문 결제 처리
exports.payOrder = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.userId;
    const orderId = req.params.id; // order_id (ORD-xxx 형식)
    const { method = 'CARD', buyerName, buyerPhone, buyerEmail } = req.body;

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

    // 주문 상태를 PAID로 변경
    await connection.query(
      `UPDATE orders SET status = 'PAID' WHERE id = ?`,
      [order.id]
    );

    // 결제 정보 저장
    const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const [paymentResult] = await connection.query(
      `INSERT INTO payments (
        payment_type, reservation_id, order_id, payment_id,
        method, amount, status, buyer_name, buyer_phone, buyer_email, paid_at
      ) VALUES ('ORDER', NULL, ?, ?, ?, ?, 'PAID', ?, ?, ?, NOW())`,
      [
        order.id,
        paymentId,
        method,
        Number(order.total_amount),
        buyerName || null,
        buyerPhone || null,
        buyerEmail || null
      ]
    );

    // 포인트 적립 (결제 금액의 5%)
    const paymentAmount = Number(order.total_amount);
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
        ) VALUES (?, 'EARNED', ?, ?, 'ORDER', ?, ?, DATE_ADD(NOW(), INTERVAL 1 YEAR))`,
        [
          userId,
          earnedPoints,
          balanceAfter,
          order.id,
          `주문 결제 포인트 적립 (${paymentAmount.toLocaleString()}원의 5%)`
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
        orderId: order.order_id
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('주문 결제 처리 실패:', error);
    res.status(500).json({
      success: false,
      message: '결제 처리 중 오류가 발생했습니다.'
    });
  } finally {
    connection.release();
  }
};

// 주문 취소
exports.cancelOrder = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.userId;
    const orderId = req.params.id; // order_id (ORD-xxx 형식)
    const { reason = '사용자 요청' } = req.body;

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

    // PAID 상태인 경우만 취소 가능
    if (order.status !== 'PAID') {
      return res.status(400).json({
        success: false,
        message: `취소 가능한 상태가 아닙니다. (현재 상태: ${order.status})`
      });
    }

    // 주문 상태를 CANCELLED로 변경
    await connection.query(
      `UPDATE orders SET status = 'CANCELLED', cancelled_at = NOW() WHERE id = ?`,
      [order.id]
    );

    await connection.commit();

    res.status(200).json({
      success: true,
      message: '주문이 취소되었습니다.',
      data: {
        orderId: order.order_id,
        status: 'CANCELLED',
        cancelledAt: new Date().toISOString()
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('주문 취소 실패:', error);
    res.status(500).json({
      success: false,
      message: '주문 취소 중 오류가 발생했습니다.'
    });
  } finally {
    connection.release();
  }
};

// 주문 환불 (포인트 환불 포함)
exports.refundOrder = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.userId;
    const orderId = req.params.id; // order_id (ORD-xxx 형식)
    const { reason = '사용자 요청' } = req.body;

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

    // PAID 또는 CANCELLED 상태인 경우만 환불 가능
    if (order.status !== 'PAID' && order.status !== 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: `환불 가능한 상태가 아닙니다. (현재 상태: ${order.status})`
      });
    }

    // 이미 환불된 주문인지 확인
    if (order.status === 'REFUNDED') {
      return res.status(400).json({
        success: false,
        message: '이미 환불 처리된 주문입니다.'
      });
    }

    // 주문 상태를 REFUNDED로 변경
    await connection.query(
      `UPDATE orders SET status = 'REFUNDED' WHERE id = ?`,
      [order.id]
    );

    // 결제 정보 업데이트
    const [payments] = await connection.query(
      `SELECT * FROM payments WHERE order_id = ? AND status = 'PAID' ORDER BY created_at DESC LIMIT 1`,
      [order.id]
    );

    let refundedPoints = 0;

    if (payments.length > 0) {
      const payment = payments[0];

      // 결제 정보를 REFUNDED로 업데이트
      await connection.query(
        `UPDATE payments SET status = 'REFUNDED', refunded_at = NOW(), refund_reason = ? WHERE id = ?`,
        [reason, payment.id]
      );

      // 해당 주문으로 적립된 포인트 찾기
      const [pointTransactions] = await connection.query(
        `SELECT * FROM point_transactions 
         WHERE source_type = 'ORDER' 
           AND source_id = ? 
           AND type = 'EARNED'
         ORDER BY created_at DESC LIMIT 1`,
        [order.id]
      );

      // 포인트 환불 처리
      if (pointTransactions.length > 0) {
        const pointTransaction = pointTransactions[0];
        refundedPoints = Number(pointTransaction.amount);

        if (refundedPoints > 0) {
          // 사용자 포인트에서 차감
          await connection.query(
            `UPDATE users SET points = GREATEST(0, points - ?) WHERE id = ?`,
            [refundedPoints, userId]
          );

          // 현재 포인트 잔액 조회
          const [userResult] = await connection.query(
            `SELECT points FROM users WHERE id = ?`,
            [userId]
          );
          const balanceAfter = userResult[0].points;

          // 포인트 환불 거래 내역 저장
          await connection.query(
            `INSERT INTO point_transactions (
              user_id, type, amount, balance_after, source_type, source_id, description
            ) VALUES (?, 'REFUNDED', ?, ?, 'ORDER', ?, ?)`,
            [
              userId,
              -refundedPoints, // 음수로 저장 (차감)
              balanceAfter,
              order.id,
              `주문 환불 포인트 차감 (${refundedPoints.toLocaleString()}P)`
            ]
          );
        }
      }
    }

    await connection.commit();

    res.status(200).json({
      success: true,
      message: '환불 처리가 완료되었습니다.',
      data: {
        orderId: order.order_id,
        status: 'REFUNDED',
        refundedAt: new Date().toISOString(),
        refundedPoints: refundedPoints
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('주문 환불 실패:', error);
    res.status(500).json({
      success: false,
      message: '주문 환불 중 오류가 발생했습니다.'
    });
  } finally {
    connection.release();
  }
};

