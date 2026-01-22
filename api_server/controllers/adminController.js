const db = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { addressToCoordinates } = require('../utils/geocoding');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// 로컬 타임존을 유지하는 날짜 포맷팅 함수 (UTC 변환 없이)
const formatLocalDate = (date) => {
  if (!date) return null;
  if (date instanceof Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  // 이미 문자열인 경우 그대로 반환 (ISO 문자열인 경우 날짜 부분만 추출)
  if (typeof date === 'string') {
    return date.split('T')[0];
  }
  return date;
};

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
    const today = formatLocalDate(now);
    const thisMonthStart = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const thisMonthEnd = formatLocalDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));

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

// 관리자용 주문 상세 조회 (user_id 필터 없음)
exports.getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id; // order_id (ORD-xxx 형식)

    const [orders] = await db.query(
      `SELECT * FROM orders WHERE order_id = ?`,
      [orderId]
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

    // 구매자 정보 조회
    const [users] = await db.query(
      `SELECT id, name, email, phone FROM users WHERE id = ?`,
      [order.user_id]
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
      buyer: users.length > 0 ? {
        id: users[0].id,
        name: users[0].name,
        email: users[0].email,
        phone: users[0].phone
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

    // 상태 필터
    if (status && status !== 'ALL') {
      baseQuery += ` AND p.status = ?`;
      params.push(status);
      countParams.push(status);
    }

    // 총 개수 조회 (DISTINCT로 중복 제거)
    const countQuery = `SELECT COUNT(DISTINCT p.id) as total ${baseQuery}`;
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    // 데이터 조회 쿼리
    let dataQuery = `
      SELECT 
        p.id,
        p.program_nm,
        p.village_nm,
        p.chrge,
        p.reqst_bgnde,
        p.reqst_endde,
        p.status,
        p.address,
        p.min_personnel,
        p.max_personnel,
        p.use_time,
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

    const formattedPrograms = programs.map(program => {
      // 첫 번째 이미지를 대표 이미지로 사용
      const images = program.images ? program.images.split(',') : [];
      const imageUrl = images.length > 0 ? images[0] : null;

      return {
        id: program.id,
        title: program.program_nm,
        category: program.village_nm || '',
        status: program.status || 'OPEN', // DB의 status 컬럼 사용
        startDate: formatLocalDate(program.reqst_bgnde),
        endDate: formatLocalDate(program.reqst_endde),
        price: parsePrice(program.chrge) || null,
        imageUrl: imageUrl, // 대표 이미지 URL
        address: program.address || null,
        minPersonnel: program.min_personnel || null,
        maxPersonnel: program.max_personnel || null,
        useTime: program.use_time || null,
        program_types: program.program_types ? program.program_types.split(',') : [],
        images: images
      };
    });

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
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { title, category, price, startDate, endDate, status, address, minPersonnel, maxPersonnel, useTime } = req.body;

    // FormData에서 programTypes 배열 추출
    // multer는 같은 이름의 필드가 여러 개일 때 배열로 처리하지 않을 수 있으므로
    // req.body.programTypes가 문자열이거나 배열일 수 있음
    let programTypes = [];
    if (req.body.programTypes) {
      if (Array.isArray(req.body.programTypes)) {
        programTypes = req.body.programTypes;
      } else {
        // 문자열인 경우 (단일 값 또는 쉼표로 구분된 값)
        programTypes = String(req.body.programTypes).split(',').map(t => t.trim()).filter(t => t);
      }
    }

    // fields 방식: 대표 이미지와 상세 이미지 구분
    const mainImage = req.files?.image?.[0]; // 대표 이미지
    const detailImages = req.files?.detailImages || []; // 상세 이미지들

    // 필수 필드 검증
    if (!title || !title.trim()) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: '체험명을 입력해 주세요.'
      });
    }

    // 주소가 있으면 좌표 변환
    let latitude = null;
    let longitude = null;
    if (address && address.trim()) {
      console.log('[createProgram] 주소 좌표 변환 시작:', address.trim());
      const coordinates = await addressToCoordinates(address.trim());
      if (coordinates) {
        latitude = coordinates.lat;
        longitude = coordinates.lng;
        console.log('[createProgram] 좌표 변환 완료 - 위도:', latitude, '경도:', longitude);
      } else {
        console.warn('[createProgram] 좌표 변환 실패, 주소만 저장합니다.');
      }
    } else {
      console.log('[createProgram] 주소가 없어 좌표 변환을 건너뜁니다.');
    }

    // 프로그램 데이터 삽입
    const [result] = await connection.query(
      `INSERT INTO programs (
        program_nm, village_nm, chrge, reqst_bgnde, reqst_endde, status, address, min_personnel, max_personnel, use_time, refine_wgs84_lat, refine_wgs84_logt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        category ? category.trim() : null,
        price ? String(price) : null,
        startDate || null,
        endDate || null,
        status || 'OPEN',
        address ? address.trim() : null,
        minPersonnel ? Number(minPersonnel) : null,
        maxPersonnel ? Number(maxPersonnel) : null,
        useTime ? useTime.trim() : null,
        latitude,
        longitude
      ]
    );

    const programId = result.insertId;
    console.log('[createProgram] 프로그램 생성 완료 - ID:', programId);

    // 프로그램 타입 관계 저장
    if (programTypes && programTypes.length > 0) {
      for (const typeId of programTypes) {
        const typeIdNum = Number(typeId);
        if (!Number.isNaN(typeIdNum)) {
          await connection.query(
            `INSERT INTO program_program_types (program_id, program_type_id) VALUES (?, ?)`,
            [programId, typeIdNum]
          );
        }
      }
    }

    // 이미지 파일 이동 및 저장 (경로: public/images/item/item_{programId}/img_{index}.jpg)
    const itemDir = path.join(__dirname, `../../public/images/item/item_${programId}`);

    // 대표 이미지 저장 (display_order = 0)

    // 대표 이미지 저장 (display_order = 0)
    if (mainImage) {
      try {
        const oldPath = mainImage.path;
        console.log('[createProgram] 대표 이미지 파일 정보:', {
          path: oldPath,
          filename: mainImage.filename,
          originalname: mainImage.originalname
        });

        if (!fs.existsSync(oldPath)) {
          console.error('[createProgram] 파일이 존재하지 않습니다:', oldPath);
          throw new Error(`대표 이미지 파일을 찾을 수 없습니다: ${oldPath}`);
        }

        const ext = path.extname(mainImage.originalname);
        const newFilename = `img_0${ext}`;
        const newPath = path.join(itemDir, newFilename);

        // 파일 이동
        fs.renameSync(oldPath, newPath);
        console.log('[createProgram] 파일 이동 완료:', oldPath, '->', newPath);

        const imageUrl = `/images/item/item_${programId}/${newFilename}`;
        console.log('[createProgram] 대표 이미지 저장:', imageUrl);
        await connection.query(
          `INSERT INTO program_images (program_id, image_url, display_order) VALUES (?, ?, ?)`,
          [programId, imageUrl, 0]
        );
      } catch (fileError) {
        console.error('[createProgram] 대표 이미지 저장 실패:', fileError);
        throw fileError;
      }
    }

    // 상세 이미지들 저장 (display_order = 1, 2, 3, ...)
    if (detailImages && detailImages.length > 0) {
      for (let index = 0; index < detailImages.length; index++) {
        const file = detailImages[index];
        try {
          const oldPath = file.path;
          console.log(`[createProgram] 상세 이미지 ${index + 1} 파일 정보:`, {
            path: oldPath,
            filename: file.filename,
            originalname: file.originalname
          });

          if (!fs.existsSync(oldPath)) {
            console.error('[createProgram] 파일이 존재하지 않습니다:', oldPath);
            throw new Error(`상세 이미지 파일을 찾을 수 없습니다: ${oldPath}`);
          }

          const ext = path.extname(file.originalname);
          const newFilename = `img_${index + 1}${ext}`;
          const newPath = path.join(itemDir, newFilename);

          // 파일 이동
          fs.renameSync(oldPath, newPath);
          console.log(`[createProgram] 파일 이동 완료:`, oldPath, '->', newPath);

          const imageUrl = `/images/item/item_${programId}/${newFilename}`;
          console.log('[createProgram] 상세 이미지 저장:', imageUrl);
          await connection.query(
            `INSERT INTO program_images (program_id, image_url, display_order) VALUES (?, ?, ?)`,
            [programId, imageUrl, index + 1]
          );
        } catch (fileError) {
          console.error(`[createProgram] 상세 이미지 ${index + 1} 저장 실패:`, fileError);
          throw fileError;
        }
      }
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: '체험이 등록되었습니다.',
      data: { id: programId }
    });
  } catch (error) {
    await connection.rollback();
    console.error('프로그램 생성 실패:', error);
    res.status(500).json({
      success: false,
      message: '프로그램 생성 중 오류가 발생했습니다.'
    });
  } finally {
    connection.release();
  }
};

// 프로그램 수정
exports.updateProgram = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const programId = req.params.id;
    const { title, category, price, startDate, endDate, status, address, minPersonnel, maxPersonnel, useTime } = req.body;

    // FormData에서 programTypes 배열 추출
    // multer는 같은 이름의 필드가 여러 개일 때 배열로 처리하지 않을 수 있으므로
    // req.body.programTypes가 문자열이거나 배열일 수 있음
    let programTypes = [];
    if (req.body.programTypes) {
      if (Array.isArray(req.body.programTypes)) {
        programTypes = req.body.programTypes;
      } else {
        // 문자열인 경우 (단일 값 또는 쉼표로 구분된 값)
        programTypes = String(req.body.programTypes).split(',').map(t => t.trim()).filter(t => t);
      }
    }

    // fields 방식: 대표 이미지와 상세 이미지 구분
    const mainImage = req.files?.image?.[0]; // 대표 이미지
    const detailImages = req.files?.detailImages || []; // 상세 이미지들

    // 프로그램 존재 확인 및 기존 주소/좌표 조회
    const [existing] = await connection.query(
      `SELECT id, address, refine_wgs84_lat, refine_wgs84_logt FROM programs WHERE id = ?`,
      [programId]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: '체험을 찾을 수 없습니다.'
      });
    }

    // 필수 필드 검증
    if (!title || !title.trim()) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: '체험명을 입력해 주세요.'
      });
    }

    // 주소 좌표 변환 (기존 주소와 다르거나 좌표가 없는 경우에만)
    let latitude = null;
    let longitude = null;
    const existingAddress = existing[0].address || '';
    const existingLat = existing[0].refine_wgs84_lat;
    const existingLng = existing[0].refine_wgs84_logt;
    const newAddress = address ? address.trim() : '';

    // 주소가 변경되었거나 좌표가 없는 경우에만 변환
    if (newAddress && (newAddress !== existingAddress || !existingLat || !existingLng)) {
      console.log('[updateProgram] 주소 변경 또는 좌표 없음 감지');
      console.log('[updateProgram] 기존 주소:', existingAddress);
      console.log('[updateProgram] 새 주소:', newAddress);
      console.log('[updateProgram] 기존 좌표:', existingLat, existingLng);

      console.log('[updateProgram] 주소 좌표 변환 시작:', newAddress);
      const coordinates = await addressToCoordinates(newAddress);
      if (coordinates) {
        latitude = coordinates.lat;
        longitude = coordinates.lng;
        console.log('[updateProgram] 좌표 변환 완료 - 위도:', latitude, '경도:', longitude);
      } else {
        console.warn('[updateProgram] 좌표 변환 실패, 기존 좌표 유지 또는 주소만 업데이트합니다.');
        // 변환 실패 시 기존 좌표 유지
        latitude = existingLat;
        longitude = existingLng;
      }
    } else if (newAddress && newAddress === existingAddress && existingLat && existingLng) {
      // 주소가 변경되지 않았고 좌표가 있으면 기존 좌표 유지
      latitude = existingLat;
      longitude = existingLng;
      console.log('[updateProgram] 주소 변경 없음, 기존 좌표 유지 - 위도:', latitude, '경도:', longitude);
    } else {
      console.log('[updateProgram] 주소가 없어 좌표 변환을 건너뜁니다.');
    }

    // 프로그램 정보 업데이트
    await connection.query(
      `UPDATE programs SET 
        program_nm = ?, 
        village_nm = ?, 
        chrge = ?, 
        reqst_bgnde = ?, 
        reqst_endde = ?, 
        status = ?,
        address = ?,
        min_personnel = ?,
        max_personnel = ?,
        use_time = ?,
        refine_wgs84_lat = ?,
        refine_wgs84_logt = ?,
        updated_at = NOW()
      WHERE id = ?`,
      [
        title.trim(),
        category ? category.trim() : null,
        price ? String(price) : null,
        startDate || null,
        endDate || null,
        status || 'OPEN',
        address ? address.trim() : null,
        minPersonnel ? Number(minPersonnel) : null,
        maxPersonnel ? Number(maxPersonnel) : null,
        useTime ? useTime.trim() : null,
        latitude,
        longitude,
        programId
      ]
    );
    console.log('[updateProgram] 프로그램 정보 업데이트 완료 - ID:', programId);

    // 프로그램 타입 관계 업데이트 (기존 관계 삭제 후 새로 추가)
    await connection.query(
      `DELETE FROM program_program_types WHERE program_id = ?`,
      [programId]
    );

    if (programTypes && programTypes.length > 0) {
      for (const typeId of programTypes) {
        const typeIdNum = Number(typeId);
        if (!Number.isNaN(typeIdNum)) {
          await connection.query(
            `INSERT INTO program_program_types (program_id, program_type_id) VALUES (?, ?)`,
            [programId, typeIdNum]
          );
        }
      }
    }

    // 새 이미지가 있으면 기존 이미지 삭제 후 새 이미지 추가
    if (mainImage || (detailImages && detailImages.length > 0)) {
      // 기존 이미지 파일 삭제
      const [existingImages] = await connection.query(
        `SELECT image_url FROM program_images WHERE program_id = ?`,
        [programId]
      );

      // 기존 이미지 파일 삭제
      for (const img of existingImages) {
        if (img.image_url) {
          const imagePath = path.join(__dirname, `../../public${img.image_url}`);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            console.log('[updateProgram] 기존 이미지 삭제:', imagePath);
          }
        }
      }

      // 기존 이미지 디렉토리 삭제 (비어있으면)
      const itemDir = path.join(__dirname, `../../public/images/item/item_${programId}`);
      if (fs.existsSync(itemDir)) {
        try {
          const files = fs.readdirSync(itemDir);
          if (files.length === 0) {
            fs.rmdirSync(itemDir);
          }
        } catch (err) {
          console.warn('[updateProgram] 디렉토리 삭제 실패:', err);
        }
      }

      // DB에서 기존 이미지 레코드 삭제
      await connection.query(
        `DELETE FROM program_images WHERE program_id = ?`,
        [programId]
      );

      // 새 이미지 디렉토리 생성
      if (!fs.existsSync(itemDir)) {
        fs.mkdirSync(itemDir, { recursive: true });
      }

      // 대표 이미지 저장 (display_order = 0)
      if (mainImage) {
        try {
          const oldPath = mainImage.path;
          console.log('[updateProgram] 대표 이미지 파일 정보:', {
            path: oldPath,
            filename: mainImage.filename,
            originalname: mainImage.originalname
          });

          if (!fs.existsSync(oldPath)) {
            console.error('[updateProgram] 파일이 존재하지 않습니다:', oldPath);
            throw new Error(`대표 이미지 파일을 찾을 수 없습니다: ${oldPath}`);
          }

          const ext = path.extname(mainImage.originalname);
          const newFilename = `img_0${ext}`;
          const newPath = path.join(itemDir, newFilename);

          // 파일 이동
          fs.renameSync(oldPath, newPath);
          console.log('[updateProgram] 파일 이동 완료:', oldPath, '->', newPath);

          const imageUrl = `/images/item/item_${programId}/${newFilename}`;
          console.log('[updateProgram] 대표 이미지 저장:', imageUrl);
          await connection.query(
            `INSERT INTO program_images (program_id, image_url, display_order) VALUES (?, ?, ?)`,
            [programId, imageUrl, 0]
          );
        } catch (fileError) {
          console.error('[updateProgram] 대표 이미지 저장 실패:', fileError);
          throw fileError;
        }
      }

      // 상세 이미지들 저장 (display_order = 1, 2, 3, ...)
      if (detailImages && detailImages.length > 0) {
        for (let index = 0; index < detailImages.length; index++) {
          const file = detailImages[index];
          try {
            const oldPath = file.path;
            console.log(`[updateProgram] 상세 이미지 ${index + 1} 파일 정보:`, {
              path: oldPath,
              filename: file.filename,
              originalname: file.originalname
            });

            if (!fs.existsSync(oldPath)) {
              console.error('[updateProgram] 파일이 존재하지 않습니다:', oldPath);
              throw new Error(`상세 이미지 파일을 찾을 수 없습니다: ${oldPath}`);
            }

            const ext = path.extname(file.originalname);
            const newFilename = `img_${index + 1}${ext}`;
            const newPath = path.join(itemDir, newFilename);

            // 파일 이동
            fs.renameSync(oldPath, newPath);
            console.log(`[updateProgram] 파일 이동 완료:`, oldPath, '->', newPath);

            const imageUrl = `/images/item/item_${programId}/${newFilename}`;
            console.log('[updateProgram] 상세 이미지 저장:', imageUrl);
            await connection.query(
              `INSERT INTO program_images (program_id, image_url, display_order) VALUES (?, ?, ?)`,
              [programId, imageUrl, index + 1]
            );
          } catch (fileError) {
            console.error(`[updateProgram] 상세 이미지 ${index + 1} 저장 실패:`, fileError);
            throw fileError;
          }
        }
      }
    }

    await connection.commit();

    res.status(200).json({
      success: true,
      message: '체험이 수정되었습니다.',
      data: { id: programId }
    });
  } catch (error) {
    await connection.rollback();
    console.error('프로그램 수정 실패:', error);
    res.status(500).json({
      success: false,
      message: '프로그램 수정 중 오류가 발생했습니다.'
    });
  } finally {
    connection.release();
  }
};

// 프로그램 삭제
exports.deleteProgram = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const programId = req.params.id;

    // 프로그램 존재 확인
    const [existing] = await connection.query(
      `SELECT id FROM programs WHERE id = ?`,
      [programId]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: '체험을 찾을 수 없습니다.'
      });
    }

    // 예약이 있는지 확인 (선택사항: 예약이 있으면 삭제 방지)
    const [reservations] = await connection.query(
      `SELECT COUNT(*) as count FROM reservations WHERE program_id = ?`,
      [programId]
    );

    if (reservations[0].count > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `예약이 ${reservations[0].count}건 있어 삭제할 수 없습니다.`
      });
    }

    // 프로그램 삭제 (CASCADE로 program_images, program_program_types도 자동 삭제됨)
    await connection.query(
      `DELETE FROM programs WHERE id = ?`,
      [programId]
    );

    await connection.commit();

    res.status(200).json({
      success: true,
      message: '체험이 삭제되었습니다.'
    });
  } catch (error) {
    await connection.rollback();
    console.error('프로그램 삭제 실패:', error);
    res.status(500).json({
      success: false,
      message: '프로그램 삭제 중 오류가 발생했습니다.'
    });
  } finally {
    connection.release();
  }
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

// 예약 삭제
exports.deleteReservation = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const reservationId = req.params.id;

    // 예약 존재 확인
    const [reservations] = await connection.query(
      `SELECT id, status FROM reservations WHERE id = ?`,
      [reservationId]
    );

    if (reservations.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: '예약을 찾을 수 없습니다.'
      });
    }

    // 예약 삭제
    await connection.query(
      `DELETE FROM reservations WHERE id = ?`,
      [reservationId]
    );

    await connection.commit();

    res.status(200).json({
      success: true,
      message: '예약이 삭제되었습니다.'
    });
  } catch (error) {
    await connection.rollback();
    console.error('예약 삭제 실패:', error);
    res.status(500).json({
      success: false,
      message: '예약 삭제 중 오류가 발생했습니다.'
    });
  } finally {
    connection.release();
  }
};

// 전체 상품 목록 조회 (검색/필터링 + 페이지네이션)
exports.getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword = '', status = 'ALL' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let baseQuery = `
      FROM products p
      WHERE 1=1
    `;
    const params = [];
    const countParams = [];

    // 상태 필터
    if (status && status !== 'ALL') {
      if (status === 'ACTIVE') {
        baseQuery += ` AND p.is_active = TRUE AND p.stock_quantity > 0`;
      } else if (status === 'SOLD_OUT') {
        baseQuery += ` AND p.stock_quantity = 0`;
      } else if (status === 'INACTIVE') {
        baseQuery += ` AND p.is_active = FALSE`;
      }
    }

    // 검색어 필터 (상품명, 카테고리)
    if (keyword) {
      baseQuery += ` AND (p.name LIKE ? OR p.category LIKE ?)`;
      const searchKeyword = `%${keyword}%`;
      params.push(searchKeyword, searchKeyword);
      countParams.push(searchKeyword, searchKeyword);
    }

    // 총 개수 조회
    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    // 데이터 조회 쿼리 (이미지 포함)
    let dataQuery = `
      SELECT 
        p.id,
        p.name,
        p.category,
        p.description,
        p.base_price,
        p.is_active,
        p.stock_quantity,
        p.image_url,
        p.created_at,
        (SELECT GROUP_CONCAT(pi2.image_url ORDER BY pi2.display_order)
        FROM product_images pi2
        WHERE pi2.product_id = p.id ORDER BY pi2.display_order) as images
      ${baseQuery}
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
    `;
    params.push(Number(limit), offset);

    const [products] = await db.query(dataQuery, params);

    const formatted = products.map(p => {
      // product_images 테이블에서 이미지 가져오기
      const images = p.images ? p.images.split(',') : [];

      // 이미지 URL 우선순위: product_images > products.image_url
      let imageUrl = null;
      if (images.length > 0) {
        imageUrl = images[0];
      } else if (p.image_url) {
        // product_images에 없으면 products.image_url 사용
        imageUrl = p.image_url;
        // 단일 이미지를 배열로 변환
        images.push(p.image_url);
      }

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
        description: p.description, // description 추가
        stock: p.stock_quantity,
        price: Number(p.base_price),
        status: status,
        imageUrl: imageUrl,
        images: images // 모든 이미지 URL 배열로 반환
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
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { name, stock, price, status, category, description } = req.body; // description 추가

    // fields 방식: 대표 이미지와 상세 이미지 구분
    const mainImage = req.files?.image?.[0]; // 대표 이미지
    const detailImages = req.files?.detailImages || []; // 상세 이미지들

    // 필수 필드 검증
    if (!name || !name.trim()) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: '상품명을 입력해 주세요.'
      });
    }

    const stockNumber = stock ? Number(stock) : 0;
    const priceNumber = price ? Number(price) : 0;
    const isActive = status === 'ACTIVE';

    // 상품 데이터 삽입
    const [result] = await connection.query(
      `INSERT INTO products (name, category, description, stock_quantity, base_price, is_active) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        category ? category.trim() : null,
        description ? description.trim() : null,
        stockNumber,
        priceNumber,
        isActive
      ]
    );

    const productId = result.insertId;
    console.log('[createProduct] 상품 생성 완료 - ID:', productId);

    // 이미지 저장
    if (mainImage) {
      const imageUrl = `/images/store/${mainImage.filename}`;
      // product_images 테이블에 저장
      await connection.query(
        `INSERT INTO product_images (product_id, image_url, display_order) VALUES (?, ?, ?)`,
        [productId, imageUrl, 0]
      );
      // products 테이블의 image_url 컬럼도 업데이트 (호환성 및 간편 조회를 위해)
      await connection.query(
        `UPDATE products SET image_url = ? WHERE id = ?`,
        [imageUrl, productId]
      );
    }

    // 상세 이미지들 저장 (display_order = 1, 2, 3, ...)
    if (detailImages && detailImages.length > 0) {
      for (let index = 0; index < detailImages.length; index++) {
        const file = detailImages[index];
        const imageUrl = `/images/store/${file.filename}`;
        await connection.query(
          `INSERT INTO product_images (product_id, image_url, display_order) VALUES (?, ?, ?)`,
          [productId, imageUrl, index + 1]
        );
      }
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: '상품이 등록되었습니다.',
      data: { id: productId }
    });
  } catch (error) {
    await connection.rollback();
    console.error('상품 생성 실패:', error);
    res.status(500).json({
      success: false,
      message: '상품 생성 중 오류가 발생했습니다.'
    });
  } finally {
    connection.release();
  }
};

// 상품 수정
exports.updateProduct = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const productId = req.params.id;
    const { name, stock, price, status, description } = req.body; // description 추가

    // fields 방식: 대표 이미지와 상세 이미지 구분
    const mainImage = req.files?.image?.[0]; // 대표 이미지
    const detailImages = req.files?.detailImages || []; // 상세 이미지들

    // 상품 존재 확인
    const [existing] = await connection.query(
      `SELECT id FROM products WHERE id = ?`,
      [productId]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.'
      });
    }

    // 필수 필드 검증
    if (!name || !name.trim()) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: '상품명을 입력해 주세요.'
      });
    }

    const stockNumber = stock ? Number(stock) : 0;
    const priceNumber = price ? Number(price) : 0;
    const isActive = status === 'ACTIVE';

    // 상품 정보 업데이트 (description 추가)
    await connection.query(
      `UPDATE products SET 
        name = ?, 
        description = ?,
        stock_quantity = ?, 
        base_price = ?, 
        is_active = ?,
        updated_at = NOW()
      WHERE id = ?`,
      [
        name.trim(),
        description ? description.trim() : null,
        stockNumber,
        priceNumber,
        isActive,
        productId
      ]
    );

    // ✅ 가격 동기화: 옵션이 있는 경우 옵션 가격도 상품 기본 가격으로 일괄 업데이트
    // (사용자가 상품 수정 모달에서 가격을 바꾸면 옵션 가격도 바뀌길 기대함)
    await connection.query(
      `UPDATE product_options SET price = ?, unit_price = ? WHERE product_id = ?`,
      [priceNumber, priceNumber, productId]
    );

    // 새 이미지가 있으면 기존 이미지 삭제 후 새 이미지 추가
    if (mainImage || (detailImages && detailImages.length > 0)) {
      // 기존 이미지 삭제
      await connection.query(
        `DELETE FROM product_images WHERE product_id = ?`,
        [productId]
      );

      // 대표 이미지 저장 (display_order = 0)
      if (mainImage) {
        const imageUrl = `/images/store/${mainImage.filename}`;
        await connection.query(
          `INSERT INTO product_images (product_id, image_url, display_order) VALUES (?, ?, ?)`,
          [productId, imageUrl, 0]
        );
        // products 테이블의 image_url 컬럼 업데이트
        await connection.query(
          `UPDATE products SET image_url = ? WHERE id = ?`,
          [imageUrl, productId]
        );
      }

      // 상세 이미지들 저장 (display_order = 1, 2, 3, ...)
      if (detailImages && detailImages.length > 0) {
        for (let index = 0; index < detailImages.length; index++) {
          const file = detailImages[index];
          const imageUrl = `/images/store/${file.filename}`;
          await connection.query(
            `INSERT INTO product_images (product_id, image_url, display_order) VALUES (?, ?, ?)`,
            [productId, imageUrl, index + 1]
          );
        }
      }
    }

    await connection.commit();

    res.status(200).json({
      success: true,
      message: '상품이 수정되었습니다.',
      data: { id: productId }
    });
  } catch (error) {
    await connection.rollback();
    console.error('상품 수정 실패:', error);
    res.status(500).json({
      success: false,
      message: '상품 수정 중 오류가 발생했습니다.'
    });
  } finally {
    connection.release();
  }
};

// 상품 삭제
exports.deleteProduct = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const productId = req.params.id;

    // 상품 존재 확인
    const [existing] = await connection.query(
      `SELECT id FROM products WHERE id = ?`,
      [productId]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.'
      });
    }

    // 상품 이미지 파일 삭제 (선택사항)
    const [images] = await connection.query(
      `SELECT image_url FROM product_images WHERE product_id = ?`,
      [productId]
    );

    // 이미지 파일 삭제
    for (const img of images) {
      if (img.image_url) {
        const imagePath = path.join(__dirname, `../../public${img.image_url}`);
        if (fs.existsSync(imagePath)) {
          try {
            fs.unlinkSync(imagePath);
            console.log('[deleteProduct] 이미지 파일 삭제:', imagePath);
          } catch (fileError) {
            console.warn('[deleteProduct] 이미지 파일 삭제 실패:', fileError);
            // 파일 삭제 실패해도 계속 진행
          }
        }
      }
    }

    // 상품 삭제 (CASCADE로 product_images도 자동 삭제됨)
    await connection.query(
      `DELETE FROM products WHERE id = ?`,
      [productId]
    );

    await connection.commit();

    res.status(200).json({
      success: true,
      message: '상품이 삭제되었습니다.'
    });
  } catch (error) {
    await connection.rollback();
    console.error('상품 삭제 실패:', error);
    res.status(500).json({
      success: false,
      message: '상품 삭제 중 오류가 발생했습니다.'
    });
  } finally {
    connection.release();
  }
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

// 프로그램 타입 목록 조회
exports.getAllProgramTypes = async (req, res) => {
  try {
    const [types] = await db.query(
      `SELECT id, type_name FROM program_types ORDER BY type_name ASC`
    );

    res.status(200).json({
      success: true,
      data: types.map(t => ({
        id: t.id,
        name: t.type_name
      }))
    });
  } catch (error) {
    console.error('프로그램 타입 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '프로그램 타입 목록 조회 중 오류가 발생했습니다.'
    });
  }
};

