const db = require('../config/db');

// 전체 이벤트 목록 조회 (검색/필터링 + 페이지네이션)
exports.getAllEvents = async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword = '', status = 'ALL' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT 
        id,
        title,
        description,
        position,
        start_date,
        end_date,
        status,
        image_url,
        tag,
        notice,
        created_at
      FROM events
      WHERE 1=1
    `;
    const params = [];

    // 상태 필터 (프론트엔드: '진행중', '종료' / 서버: 'ONGOING', 'ENDED', 'SCHEDULED')
    if (status && status !== 'ALL') {
      // 프론트에서 '진행중'/'종료'로 보내면 서버 상태로 변환
      let serverStatus = status;
      if (status === '진행중') serverStatus = 'ONGOING';
      if (status === '종료') serverStatus = 'ENDED';
      
      query += ` AND status = ?`;
      params.push(serverStatus);
    }

    // 검색어 필터 (이벤트명, 노출 위치)
    if (keyword) {
      query += ` AND (title LIKE ? OR position LIKE ? OR description LIKE ?)`;
      const searchKeyword = `%${keyword}%`;
      params.push(searchKeyword, searchKeyword, searchKeyword);
    }

    // 총 개수 조회
    let countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const [countResult] = await db.query(countQuery, params);
    const total = countResult[0].total;

    // 데이터 조회 (페이지네이션)
    query += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), offset);

    const [events] = await db.query(query, params);

    // 프론트엔드 구조에 맞게 변환
    const formatted = events.map(e => {
      // 기간 포맷팅 (YYYY-MM-DD ~ YYYY-MM-DD)
      const formatDate = (date) => {
        if (!date) return null;
        if (date instanceof Date) {
          return date.toISOString().split('T')[0];
        }
        return date;
      };
      
      const startDate = formatDate(e.start_date);
      const endDate = formatDate(e.end_date);
      const period = startDate && endDate ? `${startDate} ~ ${endDate}` : (startDate || endDate || '');
      
      // 상태 변환 (서버: ONGOING/ENDED/SCHEDULED → 프론트: 진행중/종료)
      let frontendStatus = '진행중';
      if (e.status === 'ENDED') {
        frontendStatus = '종료';
      } else if (e.status === 'SCHEDULED') {
        frontendStatus = '진행중'; // 또는 '예정'
      }

      return {
        id: e.id,
        title: e.title || '',
        description: e.description || '',
        period: period,
        status: frontendStatus,
        image: e.image_url || '',
        tag: e.tag || null,
        notice: e.notice || null,
        position: e.position || '',
        startDate: startDate,
        endDate: endDate,
        createdAt: e.created_at
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
    console.error('이벤트 목록 조회 실패:', error);
    // 테이블이 없는 경우 빈 배열 반환
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: 0,
          totalPages: 0
        }
      });
    }
    res.status(500).json({
      success: false,
      message: '이벤트 목록 조회 중 오류가 발생했습니다.'
    });
  }
};

// 이벤트 생성
exports.createEvent = async (req, res) => {
  // TODO: 이미지 업로드 미들웨어 추가 후 구현
  res.status(501).json({
    success: false,
    message: '아직 구현되지 않았습니다.'
  });
};

// 이벤트 수정
exports.updateEvent = async (req, res) => {
  // TODO: 이미지 업로드 미들웨어 추가 후 구현
  res.status(501).json({
    success: false,
    message: '아직 구현되지 않았습니다.'
  });
};

// 이벤트 삭제
exports.deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;

    const [result] = await db.query(
      `DELETE FROM events WHERE id = ?`,
      [eventId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '이벤트를 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      message: '이벤트가 삭제되었습니다.'
    });
  } catch (error) {
    console.error('이벤트 삭제 실패:', error);
    res.status(500).json({
      success: false,
      message: '이벤트 삭제 중 오류가 발생했습니다.'
    });
  }
};

