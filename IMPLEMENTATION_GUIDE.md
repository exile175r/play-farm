# Play-Farm 예약 및 결제 시스템 구현 가이드

## 목차
1. [데이터베이스 스키마](#1-데이터베이스-스키마)
2. [예약 시스템](#2-예약-시스템)
3. [상품 관리 시스템](#3-상품-관리-시스템)
4. [장바구니 시스템](#4-장바구니-시스템)
5. [주문 시스템](#5-주문-시스템)
6. [통합 결제 시스템](#6-통합-결제-시스템)
7. [포인트 시스템](#7-포인트-시스템)
8. [프론트엔드 연결](#8-프론트엔드-연결)
9. [API 엔드포인트 목록](#9-api-엔드포인트-목록)

---

## 1. 데이터베이스 스키마

### 1.1 스키마 파일 수정

**파일**: `play-farm/database/schema.sql`

기존 `payments` 테이블을 삭제하고 다음 테이블들을 추가하세요:

```sql
-- 10. products 테이블 (상품 정보)
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL COMMENT '상품명',
  `description` TEXT COMMENT '상품 설명',
  `category` VARCHAR(100) COMMENT '카테고리',
  `image_url` VARCHAR(500) COMMENT '대표 이미지 URL',
  `base_price` DECIMAL(10, 2) DEFAULT 0 COMMENT '기본 가격 (옵션이 없을 경우)',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT '판매 여부',
  `stock_quantity` INT DEFAULT 0 COMMENT '재고 수량',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  INDEX `idx_category` (`category`),
  INDEX `idx_is_active` (`is_active`),
  INDEX `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='상품 정보 테이블';

-- 11. product_options 테이블 (상품 옵션)
CREATE TABLE IF NOT EXISTS `product_options` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL COMMENT '상품 ID',
  `option_id` VARCHAR(100) NOT NULL COMMENT '옵션 고유 ID',
  `label` VARCHAR(255) NOT NULL COMMENT '옵션 라벨',
  `amount` DECIMAL(10, 3) COMMENT '수량/중량',
  `unit` VARCHAR(50) COMMENT '단위 (kg, 개, 송이 등)',
  `unit_price` DECIMAL(10, 2) NOT NULL COMMENT '단가',
  `price` DECIMAL(10, 2) NOT NULL COMMENT '옵션 가격',
  `stock_quantity` INT DEFAULT 0 COMMENT '재고 수량',
  `display_order` INT DEFAULT 0 COMMENT '표시 순서',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_product_option` (`product_id`, `option_id`),
  INDEX `idx_product_id` (`product_id`),
  INDEX `idx_display_order` (`product_id`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='상품 옵션 테이블';

-- 12. cart 테이블 (장바구니)
CREATE TABLE IF NOT EXISTS `cart` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT '회원 ID',
  `product_id` INT NOT NULL COMMENT '상품 ID',
  `option_id` VARCHAR(100) COMMENT '옵션 ID (옵션이 있는 경우)',
  `quantity` INT NOT NULL DEFAULT 1 COMMENT '수량',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '담은 일시',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_user_product_option` (`user_id`, `product_id`, `option_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='장바구니 테이블';

-- 13. orders 테이블 (상품 주문 정보)
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT '회원 ID',
  `order_id` VARCHAR(100) NOT NULL UNIQUE COMMENT '주문 고유 ID',
  `status` ENUM('PENDING', 'PAID', 'CANCELLED', 'REFUNDED', 'COMPLETED') DEFAULT 'PENDING' COMMENT '주문 상태',
  `total_amount` DECIMAL(10, 2) NOT NULL COMMENT '총 주문 금액',
  `memo` TEXT COMMENT '주문 메모',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '주문 생성일시',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  `cancelled_at` TIMESTAMP NULL COMMENT '취소일시',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_order_id` (`order_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='상품 주문 정보 테이블';

-- 14. order_items 테이블 (주문 상품 상세)
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL COMMENT '주문 ID',
  `product_id` INT NOT NULL COMMENT '상품 ID',
  `product_title` VARCHAR(255) NOT NULL COMMENT '상품명',
  `product_image` VARCHAR(500) COMMENT '상품 이미지',
  `option_id` VARCHAR(100) COMMENT '옵션 ID',
  `option_name` VARCHAR(255) COMMENT '옵션명',
  `unit_price` DECIMAL(10, 2) NOT NULL COMMENT '단가',
  `quantity` INT NOT NULL COMMENT '수량',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  INDEX `idx_order_id` (`order_id`),
  INDEX `idx_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='주문 상품 상세 테이블';

-- 15. payments 테이블 (통합 결제 정보 - 예약/상품 공통)
CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `payment_type` ENUM('RESERVATION', 'ORDER') NOT NULL COMMENT '결제 유형',
  `reservation_id` INT NULL COMMENT '예약 ID (예약 결제인 경우)',
  `order_id` INT NULL COMMENT '주문 ID (상품 결제인 경우)',
  `payment_id` VARCHAR(100) NOT NULL UNIQUE COMMENT '결제 고유 ID',
  `method` ENUM('CARD', 'KAKAO_PAY', 'TRANSFER') NOT NULL DEFAULT 'CARD' COMMENT '결제 수단',
  `amount` DECIMAL(10, 2) NOT NULL COMMENT '결제 금액',
  `status` ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') DEFAULT 'PENDING' COMMENT '결제 상태',
  `buyer_name` VARCHAR(100) COMMENT '결제자 이름',
  `buyer_phone` VARCHAR(20) COMMENT '결제자 연락처',
  `buyer_email` VARCHAR(255) COMMENT '결제자 이메일',
  `paid_at` TIMESTAMP NULL COMMENT '결제 완료 일시',
  `refunded_at` TIMESTAMP NULL COMMENT '환불 일시',
  `refund_reason` TEXT COMMENT '환불 사유',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  FOREIGN KEY (`reservation_id`) REFERENCES `reservations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  INDEX `idx_reservation_id` (`reservation_id`),
  INDEX `idx_order_id` (`order_id`),
  INDEX `idx_payment_id` (`payment_id`),
  INDEX `idx_payment_type` (`payment_type`),
  INDEX `idx_status` (`status`),
  INDEX `idx_paid_at` (`paid_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='통합 결제 정보 테이블';

-- 참고: MySQL 8.0.16 이상에서 CHECK 제약조건 지원
-- 이전 버전이면 애플리케이션 레벨에서 검증 필요

-- 16. users 테이블에 포인트 컬럼 추가 (ALTER TABLE)
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `points` INT DEFAULT 0 COMMENT '보유 포인트' AFTER `is_active`;

-- 17. point_transactions 테이블 (포인트 적립/사용 내역)
CREATE TABLE IF NOT EXISTS `point_transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT '회원 ID',
  `type` ENUM('EARNED', 'USED', 'EXPIRED', 'REFUNDED') NOT NULL COMMENT '포인트 유형',
  `amount` INT NOT NULL COMMENT '포인트 금액 (적립: +, 사용: -)',
  `balance_after` INT NOT NULL COMMENT '거래 후 잔액',
  `source_type` ENUM('RESERVATION', 'ORDER', 'MANUAL', 'REFUND') COMMENT '적립/사용 출처',
  `source_id` INT COMMENT '출처 ID (예약 ID, 주문 ID 등)',
  `description` VARCHAR(255) COMMENT '설명',
  `expires_at` TIMESTAMP NULL COMMENT '만료일시 (적립 포인트만)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_source` (`source_type`, `source_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='포인트 거래 내역 테이블';
```

---

## 2. 예약 시스템

### 2.1 예약 컨트롤러 수정

**파일**: `play-farm/server/controllers/reservationController.js`

#### 2.1.1 결제 처리 함수 수정

`markPayment` 함수를 `payments` 테이블을 사용하도록 수정:

```javascript
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

    // 예약 정보 검토
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

      // 취소된 예약 반환
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
          status: mapStatusToFrontend(cancelledReservation.status),
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
```

#### 2.1.2 결제 상태 조회 함수 수정

```javascript
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
```

#### 2.1.3 내 예약 목록 조회 수정

```javascript
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
```

---

## 3. 상품 관리 시스템

### 3.1 상품 컨트롤러 생성

**파일**: `play-farm/server/controllers/productController.js`

```javascript
const db = require('../config/db');

// 상품 목록 조회
exports.getProducts = async (req, res) => {
  try {
    const { category, keyword, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.category,
        p.image_url,
        p.base_price,
        p.is_active,
        p.stock_quantity,
        p.created_at
      FROM products p
      WHERE p.is_active = TRUE
    `;
    const params = [];

    if (category && category !== '전체') {
      query += ` AND p.category = ?`;
      params.push(category);
    }

    if (keyword) {
      query += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
      const searchKeyword = `%${keyword}%`;
      params.push(searchKeyword, searchKeyword);
    }

    query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const [products] = await db.query(query, params);

    // 각 상품의 옵션 정보 조회
    const productsWithOptions = await Promise.all(products.map(async (product) => {
      const [options] = await db.query(
        `SELECT 
          id, option_id, label, amount, unit, unit_price, price, stock_quantity, display_order
         FROM product_options
         WHERE product_id = ?
         ORDER BY display_order ASC, id ASC`,
        [product.id]
      );

      return {
        id: product.id,
        name: product.name,
        desc: product.description,
        category: product.category,
        image: product.image_url,
        price: Number(product.base_price),
        options: options.map(opt => ({
          id: opt.option_id,
          label: opt.label,
          amount: Number(opt.amount),
          unit: opt.unit,
          unitPrice: Number(opt.unit_price),
          price: Number(opt.price)
        }))
      };
    }));

    // 전체 개수 조회
    let countQuery = `SELECT COUNT(*) as total FROM products WHERE is_active = TRUE`;
    const countParams = [];
    
    if (category && category !== '전체') {
      countQuery += ` AND category = ?`;
      countParams.push(category);
    }

    if (keyword) {
      countQuery += ` AND (name LIKE ? OR description LIKE ?)`;
      const searchKeyword = `%${keyword}%`;
      countParams.push(searchKeyword, searchKeyword);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    res.status(200).json({
      success: true,
      data: productsWithOptions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('상품 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '상품 목록 조회 중 오류가 발생했습니다.'
    });
  }
};

// 상품 상세 조회
exports.getProductById = async (req, res) => {
  try {
    const productId = req.params.id;

    const [products] = await db.query(
      `SELECT 
        id, name, description, category, image_url, base_price, is_active, stock_quantity, created_at
       FROM products
       WHERE id = ? AND is_active = TRUE`,
      [productId]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.'
      });
    }

    const product = products[0];

    // 옵션 정보 조회
    const [options] = await db.query(
      `SELECT 
        id, option_id, label, amount, unit, unit_price, price, stock_quantity, display_order
       FROM product_options
       WHERE product_id = ?
       ORDER BY display_order ASC, id ASC`,
      [productId]
    );

    const response = {
      id: product.id,
      name: product.name,
      desc: product.description,
      category: product.category,
      image: product.image_url,
      price: Number(product.base_price),
      options: options.map(opt => ({
        id: opt.option_id,
        label: opt.label,
        amount: Number(opt.amount),
        unit: opt.unit,
        unitPrice: Number(opt.unit_price),
        price: Number(opt.price)
      }))
    };

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('상품 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '상품 조회 중 오류가 발생했습니다.'
    });
  }
};
```

### 3.2 상품 라우트 생성

**파일**: `play-farm/server/routes/products.js`

```javascript
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// 상품 목록 조회 (인증 불필요)
router.get('/', productController.getProducts);

// 상품 상세 조회 (인증 불필요)
router.get('/:id', productController.getProductById);

module.exports = router;
```

### 3.3 서버에 라우트 등록

**파일**: `play-farm/server/server.js`

```javascript
// ... 기존 코드 ...

const productRouter = require('./routes/products');

app.use('/api/products', productRouter);

// ... 기존 코드 ...
```

---

## 4. 장바구니 시스템

### 4.1 장바구니 컨트롤러 생성

**파일**: `play-farm/server/controllers/cartController.js`

```javascript
const db = require('../config/db');

// 장바구니 담기
exports.addToCart = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.userId;
    const { productId, optionId, quantity = 1 } = req.body;

    // 입력 검증
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: '상품 ID가 필요합니다.'
      });
    }

    // 상품 존재 확인
    const [products] = await connection.query(
      `SELECT id, name, is_active FROM products WHERE id = ?`,
      [productId]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.'
      });
    }

    if (!products[0].is_active) {
      return res.status(400).json({
        success: false,
        message: '판매 중지된 상품입니다.'
      });
    }

    // 옵션이 있는 경우 옵션 확인
    if (optionId) {
      const [options] = await connection.query(
        `SELECT id, option_id, price FROM product_options 
         WHERE product_id = ? AND option_id = ?`,
        [productId, optionId]
      );

      if (options.length === 0) {
        return res.status(404).json({
          success: false,
          message: '옵션을 찾을 수 없습니다.'
        });
      }
    }

    // 기존 장바구니 항목 확인
    const [existing] = await connection.query(
      `SELECT id, quantity FROM cart 
       WHERE user_id = ? AND product_id = ? AND (option_id = ? OR (option_id IS NULL AND ? IS NULL))`,
      [userId, productId, optionId || null, optionId || null]
    );

    if (existing.length > 0) {
      // 기존 항목 수량 업데이트
      const newQuantity = Math.min(999, Number(existing[0].quantity) + Number(quantity));
      await connection.query(
        `UPDATE cart SET quantity = ?, updated_at = NOW() WHERE id = ?`,
        [newQuantity, existing[0].id]
      );
    } else {
      // 새 항목 추가
      await connection.query(
        `INSERT INTO cart (user_id, product_id, option_id, quantity)
         VALUES (?, ?, ?, ?)`,
        [userId, productId, optionId || null, Math.max(1, Number(quantity))]
      );
    }

    await connection.commit();

    res.status(200).json({
      success: true,
      message: '장바구니에 담겼습니다.'
    });

  } catch (error) {
    await connection.rollback();
    console.error('장바구니 담기 실패:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 담기 중 오류가 발생했습니다.'
    });
  } finally {
    connection.release();
  }
};

// 내 장바구니 조회
exports.getMyCart = async (req, res) => {
  try {
    const userId = req.userId;

    const [cartItems] = await db.query(
      `SELECT 
        c.id,
        c.product_id,
        c.option_id,
        c.quantity,
        c.created_at,
        c.updated_at,
        p.name,
        p.description,
        p.category,
        p.image_url,
        p.base_price,
        po.label as option_label,
        po.price as option_price,
        po.amount as option_amount,
        po.unit as option_unit
       FROM cart c
       INNER JOIN products p ON c.product_id = p.id
       LEFT JOIN product_options po ON c.product_id = po.product_id AND c.option_id = po.option_id
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC`,
      [userId]
    );

    const formatted = cartItems.map(item => {
      const price = item.option_price ? Number(item.option_price) : Number(item.base_price);
      
      return {
        id: String(item.product_id),
        cartItemId: String(item.id),
        name: item.name,
        image: item.image_url,
        optionId: item.option_id || null,
        optionName: item.option_label || null,
        price: price,
        qty: item.quantity
      };
    });

    res.status(200).json({
      success: true,
      data: formatted
    });

  } catch (error) {
    console.error('장바구니 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 조회 중 오류가 발생했습니다.'
    });
  }
};

// 장바구니 수량 수정
exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.userId;
    const cartItemId = req.params.id;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: '수량은 1개 이상이어야 합니다.'
      });
    }

    // 권한 확인
    const [cartItems] = await db.query(
      `SELECT id FROM cart WHERE id = ? AND user_id = ?`,
      [cartItemId, userId]
    );

    if (cartItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: '장바구니 항목을 찾을 수 없습니다.'
      });
    }

    await db.query(
      `UPDATE cart SET quantity = ?, updated_at = NOW() WHERE id = ?`,
      [Math.min(999, Number(quantity)), cartItemId]
    );

    res.status(200).json({
      success: true,
      message: '수량이 수정되었습니다.'
    });

  } catch (error) {
    console.error('장바구니 수정 실패:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 수정 중 오류가 발생했습니다.'
    });
  }
};

// 장바구니 항목 삭제
exports.removeCartItem = async (req, res) => {
  try {
    const userId = req.userId;
    const cartItemId = req.params.id;

    // 권한 확인
    const [cartItems] = await db.query(
      `SELECT id FROM cart WHERE id = ? AND user_id = ?`,
      [cartItemId, userId]
    );

    if (cartItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: '장바구니 항목을 찾을 수 없습니다.'
      });
    }

    await db.query(
      `DELETE FROM cart WHERE id = ?`,
      [cartItemId]
    );

    res.status(200).json({
      success: true,
      message: '장바구니에서 삭제되었습니다.'
    });

  } catch (error) {
    console.error('장바구니 삭제 실패:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 삭제 중 오류가 발생했습니다.'
    });
  }
};

// 장바구니 비우기
exports.clearCart = async (req, res) => {
  try {
    const userId = req.userId;

    await db.query(
      `DELETE FROM cart WHERE user_id = ?`,
      [userId]
    );

    res.status(200).json({
      success: true,
      message: '장바구니가 비워졌습니다.'
    });

  } catch (error) {
    console.error('장바구니 비우기 실패:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 비우기 중 오류가 발생했습니다.'
    });
  }
};
```

### 4.2 장바구니 라우트 생성

**파일**: `play-farm/server/routes/cart.js`

```javascript
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticateToken } = require('../middleware/auth');

// 장바구니 담기 (인증 필요)
router.post('/', authenticateToken, cartController.addToCart);

// 내 장바구니 조회 (인증 필요)
router.get('/my', authenticateToken, cartController.getMyCart);

// 장바구니 수량 수정 (인증 필요)
router.put('/:id', authenticateToken, cartController.updateCartItem);

// 장바구니 항목 삭제 (인증 필요)
router.delete('/:id', authenticateToken, cartController.removeCartItem);

// 장바구니 비우기 (인증 필요)
router.delete('/', authenticateToken, cartController.clearCart);

module.exports = router;
```

### 4.3 서버에 라우트 등록

**파일**: `play-farm/server/server.js`

```javascript
// ... 기존 코드 ...

const cartRouter = require('./routes/cart');

app.use('/api/cart', cartRouter);

// ... 기존 코드 ...
```

---

## 5. 주문 시스템

### 5.1 주문 컨트롤러 생성

**파일**: `play-farm/server/controllers/orderController.js`

```javascript
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
```

### 5.2 주문 라우트 생성

**파일**: `play-farm/server/routes/orders.js`

```javascript
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/auth');

// 주문 생성 (인증 필요)
router.post('/', authenticateToken, orderController.createOrder);

// 내 주문 목록 조회 (인증 필요)
router.get('/my', authenticateToken, orderController.getMyOrders);

// 주문 상세 조회 (인증 필요)
router.get('/:id', authenticateToken, orderController.getOrderById);

module.exports = router;
```

### 5.3 서버에 라우트 등록

**파일**: `play-farm/server/server.js`

```javascript
// ... 기존 코드 ...

const orderRouter = require('./routes/orders');

app.use('/api/orders', orderRouter);

// ... 기존 코드 ...
```

---

## 6. 통합 결제 시스템

### 6.1 결제 컨트롤러 생성

**파일**: `play-farm/server/controllers/paymentController.js`

```javascript
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
```

### 6.2 결제 라우트 생성 (선택사항)

**파일**: `play-farm/server/routes/payments.js`

```javascript
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');

// 통합 결제 처리 (인증 필요)
router.post('/', authenticateToken, paymentController.processPayment);

module.exports = router;
```

---

## 7. 포인트 시스템

### 7.1 포인트 적립 로직

결제 완료 시 자동으로 결제 금액의 5%를 포인트로 적립합니다.

#### 7.1.1 주문 결제 처리에 포인트 적립 추가

**파일**: `play-farm/server/controllers/orderController.js`

주문 결제 처리 함수에 포인트 적립 로직을 추가하세요. (별도 API 엔드포인트가 있는 경우)

또는 **파일**: `play-farm/server/controllers/paymentController.js`의 `processPayment` 함수에 포인트 적립 로직 추가:

```javascript
// 결제 정보 저장 후 포인트 적립
const paymentAmount = Number(amount);
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
      `${paymentType === 'RESERVATION' ? '예약' : '주문'} 결제 포인트 적립 (${paymentAmount.toLocaleString()}원의 5%)`
    ]
  );
}
```

### 7.2 포인트 컨트롤러 생성

**파일**: `play-farm/server/controllers/pointController.js`

```javascript
const db = require('../config/db');

// 내 포인트 조회
exports.getMyPoints = async (req, res) => {
  try {
    const userId = req.userId;

    const [users] = await db.query(
      `SELECT points FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        points: Number(users[0].points || 0)
      }
    });

  } catch (error) {
    console.error('포인트 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '포인트 조회 중 오류가 발생했습니다.'
    });
  }
};

// 포인트 사용 내역 조회
exports.getMyPointHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const [transactions] = await db.query(
      `SELECT 
        id,
        type,
        amount,
        balance_after,
        source_type,
        source_id,
        description,
        expires_at,
        created_at
       FROM point_transactions
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, Number(limit), Number(offset)]
    );

    // 전체 개수 조회
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM point_transactions WHERE user_id = ?`,
      [userId]
    );
    const total = countResult[0].total;

    const formatted = transactions.map(t => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount),
      balanceAfter: Number(t.balance_after),
      sourceType: t.source_type,
      sourceId: t.source_id,
      description: t.description,
      expiresAt: t.expires_at,
      createdAt: t.created_at
    }));

    res.status(200).json({
      success: true,
      data: formatted,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('포인트 내역 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '포인트 내역 조회 중 오류가 발생했습니다.'
    });
  }
};
```

### 7.3 포인트 라우트 생성

**파일**: `play-farm/server/routes/points.js`

```javascript
const express = require('express');
const router = express.Router();
const pointController = require('../controllers/pointController');
const { authenticateToken } = require('../middleware/auth');

// 내 포인트 조회 (인증 필요)
router.get('/my', authenticateToken, pointController.getMyPoints);

// 포인트 사용 내역 조회 (인증 필요)
router.get('/my/history', authenticateToken, pointController.getMyPointHistory);

module.exports = router;
```

### 7.4 서버에 라우트 등록

**파일**: `play-farm/server/server.js`

```javascript
// ... 기존 코드 ...

const pointRouter = require('./routes/points');

app.use('/api/points', pointRouter);

// ... 기존 코드 ...
```

### 7.5 주문 결제 처리에 포인트 적립 추가

주문 결제는 `paymentController.js`의 `processPayment` 함수를 사용하거나, 별도 엔드포인트가 있다면 해당 함수에도 포인트 적립 로직을 추가하세요.

**참고**: `paymentController.js`의 `processPayment` 함수에는 이미 포인트 적립 로직이 포함되어 있습니다. 

만약 별도의 주문 결제 엔드포인트(`/api/orders/:id/payment`)가 있다면, 해당 함수에도 동일한 포인트 적립 로직을 추가하세요:

```javascript
// 주문 결제 처리 함수 내부 (결제 완료 후)
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
      orderDbId,
      `주문 결제 포인트 적립 (${paymentAmount.toLocaleString()}원의 5%)`
    ]
  );
}
```

---

## 8. 프론트엔드 연결

### 7.1 상품 API 서비스 생성

**파일**: `play-farm/src/services/productApi.js`

```javascript
import { fetchWithAuthAndRetry } from "../utils/apiConfig";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// 전역 로그아웃 핸들러
let onLogout = null;

export const setProductApiLogoutHandler = (handler) => {
  onLogout = handler;
};

// 상품 목록 조회
export async function getProducts({ category, keyword, page = 1, limit = 20 } = {}) {
  try {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (keyword) params.append('keyword', keyword);
    params.append('page', page);
    params.append('limit', limit);

    const res = await fetch(`${API_BASE}/products?${params.toString()}`);

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "상품 목록 조회 실패");
    }

    const data = await res.json();
    return { success: true, data: data.data, pagination: data.pagination };
  } catch (e) {
    return { success: false, error: e, data: [] };
  }
}

// 상품 상세 조회
export async function getProductById(productId) {
  try {
    const res = await fetch(`${API_BASE}/products/${productId}`);

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "상품 조회 실패");
    }

    const data = await res.json();
    return { success: true, data: data.data };
  } catch (e) {
    return { success: false, error: e };
  }
}
```

### 7.2 장바구니 API 서비스 생성

**파일**: `play-farm/src/services/cartApi.js`

```javascript
import { fetchWithAuthAndRetry } from "../utils/apiConfig";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

let onLogout = null;

export const setCartApiLogoutHandler = (handler) => {
  onLogout = handler;
};

// 장바구니 담기
export async function addToCart({ productId, optionId, quantity = 1 }) {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/cart`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId, optionId, quantity }),
      },
      onLogout
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "장바구니 담기 실패");
    }

    const data = await res.json();
    return { success: true, message: data.message };
  } catch (e) {
    return { success: false, error: e };
  }
}

// 내 장바구니 조회
export async function getMyCart() {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/cart/my`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
      onLogout
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "장바구니 조회 실패");
    }

    const data = await res.json();
    return { success: true, data: data.data || [] };
  } catch (e) {
    return { success: false, error: e, data: [] };
  }
}

// 장바구니 수량 수정
export async function updateCartItem(cartItemId, quantity) {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/cart/${cartItemId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity }),
      },
      onLogout
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "장바구니 수정 실패");
    }

    const data = await res.json();
    return { success: true, message: data.message };
  } catch (e) {
    return { success: false, error: e };
  }
}

// 장바구니 항목 삭제
export async function removeCartItem(cartItemId) {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/cart/${cartItemId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      },
      onLogout
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "장바구니 삭제 실패");
    }

    const data = await res.json();
    return { success: true, message: data.message };
  } catch (e) {
    return { success: false, error: e };
  }
}

// 장바구니 비우기
export async function clearCart() {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/cart`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      },
      onLogout
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "장바구니 비우기 실패");
    }

    const data = await res.json();
    return { success: true, message: data.message };
  } catch (e) {
    return { success: false, error: e };
  }
}
```

### 7.3 주문 API 서비스 생성

**파일**: `play-farm/src/services/orderApi.js`

```javascript
import { fetchWithAuthAndRetry } from "../utils/apiConfig";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

let onLogout = null;

export const setOrderApiLogoutHandler = (handler) => {
  onLogout = handler;
};

// 주문 생성
export async function createOrder({ items, buyer, amount, payMethod }) {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/orders`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items, buyer, amount, payMethod }),
      },
      onLogout
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "주문 생성 실패");
    }

    const data = await res.json();
    return { success: true, data: data.data };
  } catch (e) {
    return { success: false, error: e };
  }
}

// 내 주문 목록 조회
export async function getMyOrders() {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/orders/my`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
      onLogout
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "주문 목록 조회 실패");
    }

    const data = await res.json();
    return { success: true, data: data.data || [] };
  } catch (e) {
    return { success: false, error: e, data: [] };
  }
}

// 주문 상세 조회
export async function getOrderById(orderId) {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/orders/${orderId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
      onLogout
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "주문 조회 실패");
    }

    const data = await res.json();
    return { success: true, data: data.data };
  } catch (e) {
    return { success: false, error: e };
  }
}

// 주문 결제 처리
export async function payOrder({ orderId, method = "CARD", buyerName, buyerPhone, buyerEmail }) {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/orders/${orderId}/payment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ method, buyerName, buyerPhone, buyerEmail }),
      },
      onLogout
    );

    const data = await res.json();

    if (!res.ok || !data.success) {
      return {
        success: false,
        error: new Error(data.message || "결제 처리 실패"),
        data: data.data || null,
      };
    }

    return { success: true, data: data.data };
  } catch (e) {
    return { success: false, error: e };
  }
}
```

### 7.4 예약 API 서비스 수정

**파일**: `play-farm/src/services/reservationApi.js`

`markReservationPaid` 함수에 결제자 정보 추가:

```javascript
/**
 * 결제 성공 처리 (서버에서 예약 검토 후 승인/취소 결정)
 */
export async function markReservationPaid({ bookingId, method = "CARD", buyerName, buyerPhone, buyerEmail }) {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/reservations/${bookingId}/payment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          method,
          buyerName,
          buyerPhone,
          buyerEmail
        }),
      },
      onLogout
    );

    const data = await res.json();

    // 검증 실패로 취소된 경우
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: new Error(data.message || "결제 처리 실패"),
        data: data.data || null,
        cancelled: true,
      };
    }

    return { success: true, data: data.data };
  } catch (e) {
    return { success: false, error: e };
  }
}
```

### 7.5 CheckoutPage 수정

**파일**: `play-farm/src/components/checkout/CheckoutPage.js`

주문 결제 시 API 호출 추가:

```javascript
// ... 기존 import ...
import { createOrder, payOrder } from "../../services/orderApi";

// ... 기존 코드 ...

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
    if (type === "shop") {
      // 1. 주문 생성
      const orderResult = await createOrder({
        items: cartItems.map((it) => ({
          productId: String(it.id),
          title: it.name || it.title || `상품 #${it.id}`,
          image: it.image || "",
          optionId: it.optionId || null,
          optionName: it.optionName || null,
          unitPrice: Number(it.price || 0),
          qty: Number(it.qty || 0),
        })),
        buyer: { name: buyerName, phone: buyerPhone, email: buyerEmail },
        amount: shopTotal,
        payMethod,
      });

      if (!orderResult?.success) {
        alert("주문 생성에 실패했습니다. 다시 시도해 주세요.");
        setSubmitting(false);
        return;
      }

      if (isFail) {
        alert("결제가 실패했습니다. 결제 정보를 확인하신 뒤 다시 시도해 주세요.");
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
      });

      if (!paymentResult?.success) {
        alert("결제 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        setSubmitting(false);
        return;
      }

      // 3. 장바구니 비우기
      writeCart([]);

      alert("결제가 정상적으로 완료되었습니다.");
      navigate("/mypage", { state: { openTab: "store_orders" } });
      return;
    }

    // =========================
    // ✅ PROGRAM 결제 (기존)
    // =========================
    if (type === "program") {
      // ... 기존 예약 결제 로직 ...
    }
  } catch (error) {
    console.error("결제 처리 오류:", error);
    alert("결제 처리 중 오류가 발생했습니다.");
    setSubmitting(false);
  }
};
```

---

### 7.6 포인트 API 서비스 생성

**파일**: `play-farm/src/services/pointApi.js`

```javascript
import { fetchWithAuthAndRetry } from "../utils/apiConfig";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

let onLogout = null;

export const setPointApiLogoutHandler = (handler) => {
  onLogout = handler;
};

// 내 포인트 조회
export async function getMyPoints() {
  try {
    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/points/my`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
      onLogout
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "포인트 조회 실패");
    }

    const data = await res.json();
    return { success: true, data: data.data };
  } catch (e) {
    return { success: false, error: e };
  }
}

// 포인트 사용 내역 조회
export async function getMyPointHistory({ page = 1, limit = 20 } = {}) {
  try {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);

    const res = await fetchWithAuthAndRetry(
      `${API_BASE}/points/my/history?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
      onLogout
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "포인트 내역 조회 실패");
    }

    const data = await res.json();
    return { success: true, data: data.data, pagination: data.pagination };
  } catch (e) {
    return { success: false, error: e, data: [] };
  }
}
```

---

## 9. API 엔드포인트 목록

### 8.1 예약 API

- `POST /api/reservations` - 예약 생성
- `GET /api/reservations/my` - 내 예약 목록 조회
- `GET /api/reservations/:id` - 예약 상세 조회
- `POST /api/reservations/:id/cancel` - 예약 취소
- `POST /api/reservations/:id/payment` - 예약 결제 처리
- `POST /api/reservations/:id/payment-failed` - 결제 실패 처리
- `POST /api/reservations/:id/refund` - 환불 처리

### 8.2 상품 API

- `GET /api/products` - 상품 목록 조회 (쿼리: category, keyword, page, limit)
- `GET /api/products/:id` - 상품 상세 조회

### 8.3 장바구니 API

- `POST /api/cart` - 장바구니 담기
- `GET /api/cart/my` - 내 장바구니 조회
- `PUT /api/cart/:id` - 장바구니 수량 수정
- `DELETE /api/cart/:id` - 장바구니 항목 삭제
- `DELETE /api/cart` - 장바구니 비우기

### 8.4 주문 API

- `POST /api/orders` - 주문 생성
- `GET /api/orders/my` - 내 주문 목록 조회
- `GET /api/orders/:id` - 주문 상세 조회
- `POST /api/orders/:id/payment` - 주문 결제 처리

### 9.5 포인트 API

- `GET /api/points/my` - 내 포인트 조회
- `GET /api/points/my/history` - 포인트 사용 내역 조회 (쿼리: page, limit)

### 9.6 결제 API (선택사항)

- `POST /api/payments` - 통합 결제 처리

---

## 10. 작업 체크리스트

### 10.1 데이터베이스
- [ ] `products` 테이블 생성
- [ ] `product_options` 테이블 생성
- [ ] `cart` 테이블 생성
- [ ] `orders` 테이블 생성
- [ ] `order_items` 테이블 생성
- [ ] `payments` 테이블 수정 (통합 결제 테이블)
- [ ] `users` 테이블에 `points` 컬럼 추가
- [ ] `point_transactions` 테이블 생성

### 10.2 서버 (백엔드)
- [ ] `productController.js` 생성
- [ ] `cartController.js` 생성
- [ ] `orderController.js` 생성
- [ ] `paymentController.js` 생성 (선택)
- [ ] `pointController.js` 생성
- [ ] `reservationController.js` 수정 (payments 테이블 사용, 포인트 적립 추가)
- [ ] `orderController.js` 또는 `paymentController.js`에 포인트 적립 로직 추가
- [ ] `products.js` 라우트 생성
- [ ] `cart.js` 라우트 생성
- [ ] `orders.js` 라우트 생성
- [ ] `points.js` 라우트 생성
- [ ] `payments.js` 라우트 생성 (선택)
- [ ] `server.js`에 라우트 등록

### 10.3 클라이언트 (프론트엔드)
- [ ] `productApi.js` 생성
- [ ] `cartApi.js` 생성
- [ ] `orderApi.js` 생성
- [ ] `pointApi.js` 생성
- [ ] `reservationApi.js` 수정 (결제자 정보 추가)
- [ ] `CheckoutPage.js` 수정 (주문 API 연결)
- [ ] `StoreDetail.js` 수정 (상품 API 연결)
- [ ] `Store.js` 수정 (상품 API 연결)
- [ ] `CartView.js` 수정 (장바구니 API 연결)
- [ ] `Mypage.js` 수정 (주문 API 연결, 포인트 표시)

---

## 11. 주의사항

1. **MySQL 버전**: CHECK 제약조건은 MySQL 8.0.16 이상에서만 지원됩니다. 이전 버전이면 애플리케이션 레벨에서 검증하세요.

2. **트랜잭션**: 결제 처리 시 반드시 트랜잭션을 사용하여 데이터 일관성을 보장하세요.

3. **에러 처리**: 모든 API에서 적절한 에러 처리를 구현하세요.

4. **인증**: 장바구니, 주문, 결제 관련 API는 모두 인증이 필요합니다.

5. **데이터 마이그레이션**: 기존 localStorage 데이터를 DB로 마이그레이션하는 스크립트가 필요할 수 있습니다.

---

## 12. 다음 단계

1. 데이터베이스 마이그레이션 실행
2. 서버 코드 구현 및 테스트
3. 프론트엔드 API 연결 및 테스트
4. 통합 테스트
5. 기존 localStorage 데이터 마이그레이션 (필요시)

---

**작성일**: 2024년
**버전**: 1.0

