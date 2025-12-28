const db = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// ✅ 서버 코드에 관리자 계정 하드코딩 (DB 없이)
const ADMIN_ACCOUNTS = {
  'admin': '1234',
  'owner': 'owner123',
  'manager01': 'manager123'
};

// 관리자 로그인
exports.adminLogin = async (req, res) => {
  try {
    const { user_id, password } = req.body;

    // 관리자 계정 확인
    if (!ADMIN_ACCOUNTS[user_id] || ADMIN_ACCOUNTS[user_id] !== password) {
      return res.status(400).json({
        success: false,
        message: '아이디 또는 비밀번호가 일치하지 않습니다.'
      });
    }

    // JWT 토큰 생성 (관리자용)
    const token = jwt.sign(
      { 
        id: user_id, 
        role: 'admin',
        isAdmin: true 
      },
      JWT_SECRET,
      { expiresIn: '24h' } // 관리자는 24시간 유효
    );

    res.status(200).json({
      success: true,
      message: '관리자 로그인 성공',
      data: {
        token: token,
        user: {
          user_id: user_id,
          role: 'admin',
          isAdmin: true
        }
      }
    });
  } catch (error) {
    console.error('관리자 로그인 실패:', error);
    res.status(500).json({
      success: false,
      message: '관리자 로그인 중 오류가 발생했습니다.'
    });
  }
};

// 대시보드 통계
exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    // 오늘 예약 건수
    const [todayReservations] = await db.query(
      `SELECT COUNT(*) as count FROM reservations WHERE DATE(res_date) = ?`,
      [today]
    );
    const todayReservationsCount = todayReservations[0].count;

    // 이번 달 예약 건수
    const [monthReservations] = await db.query(
      `SELECT COUNT(*) as count FROM reservations WHERE res_date >= ? AND res_date <= ?`,
      [thisMonthStart, thisMonthEnd]
    );
    const monthReservationsCount = monthReservations[0].count;

    // 오늘 주문 매출
    const [todayOrders] = await db.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE DATE(created_at) = ? AND status = 'PAID'`,
      [today]
    );
    const todaySalesAmount = Number(todayOrders[0].total || 0);

    // 이번 달 주문 매출
    const [monthOrders] = await db.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE DATE(created_at) >= ? AND DATE(created_at) <= ? AND status = 'PAID'`,
      [thisMonthStart, thisMonthEnd]
    );
    const monthSalesAmount = Number(monthOrders[0].total || 0);

    // 총 주문 건수
    const [totalOrders] = await db.query(
      `SELECT COUNT(*) as count FROM orders`
    );
    const totalOrdersCount = totalOrders[0].count;

    // 인기 체험 (예약이 가장 많은 프로그램)
    const [topProgram] = await db.query(
      `SELECT p.program_nm as name, COUNT(r.id) as count
       FROM programs p
       INNER JOIN reservations r ON p.id = r.program_id
       GROUP BY p.id, p.program_nm
       ORDER BY count DESC
       LIMIT 1`
    );

    // 인기 상품 (판매 수량이 가장 많은 상품)
    const [topProduct] = await db.query(
      `SELECT oi.product_title as name, SUM(oi.quantity) as qty
       FROM order_items oi
       INNER JOIN orders o ON oi.order_id = o.id
       WHERE o.status = 'PAID'
       GROUP BY oi.product_title
       ORDER BY qty DESC
       LIMIT 1`
    );

    res.status(200).json({
      success: true,
      data: {
        todayReservationsCount,
        monthReservationsCount,
        todaySalesAmount,
        monthSalesAmount,
        totalOrdersCount,
        topProgram: topProgram.length > 0 ? { name: topProgram[0].name, count: topProgram[0].count } : null,
        topProduct: topProduct.length > 0 ? { name: topProduct[0].name, qty: Number(topProduct[0].qty) } : null
      }
    });
  } catch (error) {
    console.error('대시보드 통계 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '대시보드 통계 조회 중 오류가 발생했습니다.'
    });
  }
};

// 전체 주문 목록 조회 (검색/필터링 + 페이지네이션)
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword = '', status = 'ALL' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT 
        o.id,
        o.order_id,
        o.status,
        o.total_amount,
        o.created_at,
        o.memo,
        u.name as buyer_name,
        u.email as buyer_email,
        u.phone as buyer_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // 상태 필터
    if (status && status !== 'ALL') {
      query += ` AND o.status = ?`;
      params.push(status);
    }

    // 검색어 필터 (주문번호, 구매자명, 상품명)
    if (keyword) {
      query += ` AND (
        o.order_id LIKE ? 
        OR u.name LIKE ? 
        OR EXISTS (
          SELECT 1 FROM order_items oi 
          WHERE oi.order_id = o.id 
          AND oi.product_title LIKE ?
        )
      )`;
      const searchKeyword = `%${keyword}%`;
      params.push(searchKeyword, searchKeyword, searchKeyword);
    }

    // 총 개수 조회
    let countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const [countResult] = await db.query(countQuery, params);
    const total = countResult[0].total;

    // 데이터 조회 (페이지네이션)
    query += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), offset);

    const [orders] = await db.query(query, params);

    // 각 주문의 상품 정보 조회
    const ordersWithItems = await Promise.all(orders.map(async (order) => {
      const [items] = await db.query(
        `SELECT product_title, quantity FROM order_items WHERE order_id = ?`,
        [order.id]
      );

      const buyer = order.buyer_name ? {
        name: order.buyer_name,
        email: order.buyer_email,
        phone: order.buyer_phone
      } : null;

      // 메모에서 buyer 정보 파싱 (기존 주문의 경우)
      let parsedBuyer = buyer;
      if (!buyer && order.memo) {
        try {
          const memoData = JSON.parse(order.memo);
          if (memoData.buyer) {
            parsedBuyer = memoData.buyer;
          }
        } catch (e) {
          // 파싱 실패 시 무시
        }
      }

      return {
        orderId: order.order_id,
        buyer: parsedBuyer,
        items: items.map(item => ({
          title: item.product_title,
          qty: item.quantity
        })),
        amount: Number(order.total_amount),
        status: order.status,
        createdAt: order.created_at
      };
    }));

    res.status(200).json({
      success: true,
      data: ordersWithItems,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('주문 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '주문 목록 조회 중 오류가 발생했습니다.'
    });
  }
};

// 주문 환불 처리
exports.refundOrder = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const orderId = req.params.id; // order_id (ORD-xxx 형식)
    const { reason } = req.body;

    // 주문 조회
    const [orders] = await connection.query(
      `SELECT * FROM orders WHERE order_id = ?`,
      [orderId]
    );

    if (orders.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.'
      });
    }

    const order = orders[0];

    if (order.status !== 'PAID') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: '결제 완료된 주문만 환불할 수 있습니다.'
      });
    }

    // 주문 상태 변경
    await connection.query(
      `UPDATE orders SET status = 'REFUNDED', updated_at = NOW() WHERE id = ?`,
      [order.id]
    );

    // 결제 정보 업데이트
    await connection.query(
      `UPDATE payments SET status = 'REFUNDED', refunded_at = NOW(), refund_reason = ? WHERE order_id = ?`,
      [reason || '관리자 환불 처리', order.id]
    );

    await connection.commit();

    res.status(200).json({
      success: true,
      message: '환불 처리가 완료되었습니다.'
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

// 전체 프로그램 목록 조회 (검색/필터링 + 페이지네이션)
exports.getAllPrograms = async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword = '', status = 'ALL' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // 기본 쿼리 (GROUP BY 제외)
    let baseQuery = `
      FROM programs p
      LEFT JOIN program_program_types ppt ON p.id = ppt.program_id
      LEFT JOIN program_types pt ON ppt.program_type_id = pt.id
      WHERE 1=1
    `;
    const params = [];
    const countParams = [];

    // 검색어 필터 (제목, 카테고리)
    if (keyword) {
      baseQuery += ` AND (p.program_nm LIKE ? OR p.village_nm LIKE ?)`;
      const searchKeyword = `%${keyword}%`;
      params.push(searchKeyword, searchKeyword);
      countParams.push(searchKeyword, searchKeyword);
    }

    // 총 개수 조회 (DISTINCT로 중복 제거)
    const countQuery = `SELECT COUNT(DISTINCT p.id) as total ${baseQuery}`;
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    // 데이터 조회 쿼리
    let dataQuery = `
      SELECT p.*,
        GROUP_CONCAT(DISTINCT pt.type_name) as program_types,
        (SELECT GROUP_CONCAT(pi2.image_url ORDER BY pi2.display_order)
        FROM program_images pi2
        WHERE pi2.program_id = p.id) as images
      ${baseQuery}
      GROUP BY p.id
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
    `;
    params.push(Number(limit), offset);

    const [programs] = await db.query(dataQuery, params);

    const parsePrice = (chrge) => {
      if (!chrge) return null;
      // 숫자만 추출
      const match = String(chrge).match(/\d+/);
      return match ? Number(match[0]) : null;
    };

    const formattedPrograms = programs.map(program => ({
      id: program.id,
      title: program.program_nm,
      category: program.village_nm || '',
      status: 'OPEN', // 기본값, 실제 상태 컬럼이 있으면 수정
      startDate: program.reqst_bgnde ? program.reqst_bgnde.toISOString().split('T')[0] : null,
      endDate: program.reqst_endde ? program.reqst_endde.toISOString().split('T')[0] : null,
      price: parsePrice(program.chrge) || null, // VARCHAR이므로 문자열 그대로 반환 (필요시 숫자 파싱)
      program_types: program.program_types ? program.program_types.split(',') : [],
      images: program.images ? program.images.split(',') : []
    }));

    res.status(200).json({
      success: true,
      data: formattedPrograms,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('프로그램 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '프로그램 목록 조회 중 오류가 발생했습니다.'
    });
  }
};

// 프로그램 생성
exports.createProgram = async (req, res) => {
  // TODO: 이미지 업로드 미들웨어 추가 후 구현
  res.status(501).json({
    success: false,
    message: '아직 구현되지 않았습니다.'
  });
};

// 프로그램 수정
exports.updateProgram = async (req, res) => {
  // TODO: 이미지 업로드 미들웨어 추가 후 구현
  res.status(501).json({
    success: false,
    message: '아직 구현되지 않았습니다.'
  });
};

// 프로그램 삭제
exports.deleteProgram = async (req, res) => {
  // TODO: 구현 필요
  res.status(501).json({
    success: false,
    message: '아직 구현되지 않았습니다.'
  });
};

// 전체 예약 목록 조회 (검색/필터링 + 페이지네이션)
exports.getAllReservations = async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword = '', status = 'ALL' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT 
        r.id,
        r.program_id,
        r.user_id,
        r.res_date as date,
        r.res_date_time as time,
        r.personnel as people,
        r.total_price,
        r.status,
        r.created_at,
        p.program_nm as program_title,
        u.name as user_name,
        u.phone as user_phone
      FROM reservations r
      INNER JOIN programs p ON r.program_id = p.id
      LEFT JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // 상태 필터
    if (status && status !== 'ALL') {
      query += ` AND r.status = ?`;
      params.push(status);
    }

    // 검색어 필터 (체험명, 예약자명)
    if (keyword) {
      query += ` AND (p.program_nm LIKE ? OR u.name LIKE ?)`;
      const searchKeyword = `%${keyword}%`;
      params.push(searchKeyword, searchKeyword);
    }

    // 총 개수 조회
    let countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const [countResult] = await db.query(countQuery, params);
    const total = countResult[0].total;

    // 데이터 조회 (페이지네이션)
    query += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), offset);

    const [reservations] = await db.query(query, params);

    const formatted = reservations.map(r => ({
      id: r.id,
      programTitle: r.program_title,
      userName: r.user_name || '-',
      userPhone: r.user_phone || '-',
      date: r.date,
      timeSlot: r.time,
      people: r.people,
      totalPrice: Number(r.total_price),
      status: r.status,
      createdAt: r.created_at
    }));

    res.status(200).json({
      success: true,
      data: formatted,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('예약 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '예약 목록 조회 중 오류가 발생했습니다.'
    });
  }
};

// 예약 상태 변경
exports.updateReservationStatus = async (req, res) => {
  try {
    const reservationId = req.params.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: '상태 값이 필요합니다.'
      });
    }

    const [result] = await db.query(
      `UPDATE reservations SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, reservationId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '예약을 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      message: '예약 상태가 변경되었습니다.'
    });
  } catch (error) {
    console.error('예약 상태 변경 실패:', error);
    res.status(500).json({
      success: false,
      message: '예약 상태 변경 중 오류가 발생했습니다.'
    });
  }
};

// 전체 상품 목록 조회 (검색/필터링 + 페이지네이션)
exports.getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword = '', status = 'ALL' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT 
        p.id,
        p.name,
        p.category,
        p.image_url,
        p.base_price,
        p.is_active,
        p.stock_quantity,
        p.created_at
      FROM products p
      WHERE 1=1
    `;
    const params = [];

    // 상태 필터
    if (status && status !== 'ALL') {
      if (status === 'ACTIVE') {
        query += ` AND p.is_active = TRUE AND p.stock_quantity > 0`;
      } else if (status === 'SOLD_OUT') {
        query += ` AND p.stock_quantity = 0`;
      } else if (status === 'INACTIVE') {
        query += ` AND p.is_active = FALSE`;
      }
    }

    // 검색어 필터 (상품명, 카테고리)
    if (keyword) {
      query += ` AND (p.name LIKE ? OR p.category LIKE ?)`;
      const searchKeyword = `%${keyword}%`;
      params.push(searchKeyword, searchKeyword);
    }

    // 총 개수 조회
    let countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const [countResult] = await db.query(countQuery, params);
    const total = countResult[0].total;

    // 데이터 조회 (페이지네이션)
    query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), offset);

    const [products] = await db.query(query, params);

    const formatted = products.map(p => {
      let status = 'ACTIVE';
      if (!p.is_active) {
        status = 'INACTIVE';
      } else if (p.stock_quantity === 0) {
        status = 'SOLD_OUT';
      }

      return {
        id: p.id,
        name: p.name,
        category: p.category,
        stock: p.stock_quantity,
        price: Number(p.base_price),
        status: status
      };
    });

    res.status(200).json({
      success: true,
      data: formatted,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: total,
        totalPages: Math.ceil(total / Number(limit))
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

// 상품 생성
exports.createProduct = async (req, res) => {
  // TODO: 이미지 업로드 미들웨어 추가 후 구현
  res.status(501).json({
    success: false,
    message: '아직 구현되지 않았습니다.'
  });
};

// 상품 수정
exports.updateProduct = async (req, res) => {
  // TODO: 이미지 업로드 미들웨어 추가 후 구현
  res.status(501).json({
    success: false,
    message: '아직 구현되지 않았습니다.'
  });
};

// 상품 삭제
exports.deleteProduct = async (req, res) => {
  // TODO: 구현 필요
  res.status(501).json({
    success: false,
    message: '아직 구현되지 않았습니다.'
  });
};

// 전체 사용자 목록 조회 (검색/필터링 + 페이지네이션)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword = '', role = 'ALL', status = 'ALL' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT 
        u.id,
        u.user_id,
        u.name,
        u.email,
        u.created_at as joined_at,
        u.user_id as role_check
      FROM users u
      WHERE 1=1
    `;
    const params = [];

    // 권한 필터 (관리자 목록 체크)
    const ADMIN_IDS = ['admin', 'owner', 'manager01'];
    if (role && role !== 'ALL') {
      if (role === 'ADMIN') {
        query += ` AND u.user_id IN (?)`;
        params.push(ADMIN_IDS);
      } else if (role === 'USER') {
        query += ` AND u.user_id NOT IN (?)`;
        params.push(ADMIN_IDS);
      }
    }

    // 상태 필터 (users 테이블에 status 컬럼이 있다면, 없으면 제거)
    // if (status && status !== 'ALL') {
    //   query += ` AND u.status = ?`;
    //   params.push(status);
    // }

    // 검색어 필터 (이름, 이메일, 아이디)
    if (keyword) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.user_id LIKE ?)`;
      const searchKeyword = `%${keyword}%`;
      params.push(searchKeyword, searchKeyword, searchKeyword);
    }

    // 총 개수 조회
    let countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const [countResult] = await db.query(countQuery, params);
    const total = countResult[0].total;

    // 데이터 조회 (페이지네이션)
    query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), offset);

    const [users] = await db.query(query, params);

    const formatted = users.map(u => {
      const isAdmin = ADMIN_IDS.includes(u.user_id);
      return {
        id: u.id,
        userId: u.user_id,
        name: u.name,
        email: u.email,
        joinedAt: u.joined_at,
        role: isAdmin ? 'ADMIN' : 'USER',
        status: 'ACTIVE' // 기본값, 실제 status 컬럼이 있으면 수정
      };
    });

    res.status(200).json({
      success: true,
      data: formatted,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('사용자 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '사용자 목록 조회 중 오류가 발생했습니다.'
    });
  }
};

// 사용자 상태 변경
exports.updateUserStatus = async (req, res) => {
  // TODO: users 테이블에 status 컬럼이 있다면 구현
  res.status(501).json({
    success: false,
    message: '아직 구현되지 않았습니다.'
  });
};

