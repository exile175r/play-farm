const path = require('path');
const fs = require('fs');
const { uploadFromBuffer, deleteImage } = require('../utils/cloudinaryHelper');

// 전체 이벤트 목록 조회 (검색/필터링 + 페이지네이션)
exports.getAllEvents = async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword = '', status = 'ALL' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT 
        id,
        title,
        subtitle,
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
      // 기간 포맷팅 (YYYY-MM-DD ~ YYYY-MM-DD) - 로컬 타임존 유지
      const formatDate = (date) => {
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
        subtitle: e.subtitle || '',
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


// 이벤트 상세 조회
exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    // 조회수 증가 등 로직이 필요하면 여기에 추가

    const [rows] = await db.query(
      `SELECT 
        id,
        title,
        subtitle,
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
       WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '이벤트를 찾을 수 없습니다.'
      });
    }

    const e = rows[0];

    // 날짜 포맷팅 및 데이터 가공
    const formatDate = (date) => {
      if (!date) return null;
      if (date instanceof Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      if (typeof date === 'string') {
        return date.split('T')[0];
      }
      return date;
    };

    const startDate = formatDate(e.start_date);
    const endDate = formatDate(e.end_date);
    const period = startDate && endDate ? `${startDate} ~ ${endDate}` : (startDate || endDate || '');

    // 상태 변환
    let frontendStatus = '진행중';
    if (e.status === 'ENDED') {
      frontendStatus = '종료';
    } else if (e.status === 'SCHEDULED') {
      frontendStatus = '진행중';
    }

    const data = {
      id: e.id,
      title: e.title || '',
      subtitle: e.subtitle || '', // 소제목
      description: e.description || '', // 설명
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

    res.status(200).json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('이벤트 상세 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '이벤트 상세 조회 중 오류가 발생했습니다.'
    });
  }
};

// 이벤트 생성
exports.createEvent = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { title, subtitle, startDate, endDate, status, description, position, tag, notice } = req.body;
    const imageFile = req.file; // uploadEventImage.single("image")로 업로드된 파일

    // 필수 필드 검증
    if (!title || !title.trim()) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: '이벤트 제목을 입력해 주세요.'
      });
    }

    // 날짜 검증 (빈 문자열 체크)
    const validStartDate = startDate && startDate.trim() ? startDate.trim() : null;
    const validEndDate = endDate && endDate.trim() ? endDate.trim() : null;

    if (!validStartDate || !validEndDate) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: '이벤트 기간(시작일/종료일)을 입력해 주세요.'
      });
    }

    // 상태 값 검증
    let validStatus = status && status.trim() ? status.trim() : 'SCHEDULED';
    if (!['SCHEDULED', 'ONGOING', 'ENDED'].includes(validStatus)) {
      validStatus = 'SCHEDULED';
    }

    // 이미지 URL 설정 (Cloudinary 업로드)
    let imageUrl = null;
    if (imageFile) {
      console.log('[createEvent] 이미지 Cloudinary 업로드 시작');
      const uploadResult = await uploadFromBuffer(imageFile.buffer, 'events');
      imageUrl = uploadResult.secure_url;
      console.log('[createEvent] 이미지 업로드 완료:', imageUrl);
    }

    // 이벤트 데이터 삽입
    const [result] = await connection.query(
      `INSERT INTO events (title, subtitle, description, position, start_date, end_date, status, image_url, tag, notice) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        subtitle ? subtitle.trim() : null,
        description ? description.trim() : null,
        position ? position.trim() : null,
        validStartDate,
        validEndDate,
        validStatus,
        imageUrl,
        tag ? tag.trim() : null,
        notice ? notice.trim() : null
      ]
    );

    const eventId = result.insertId;

    await connection.commit();

    res.status(201).json({
      success: true,
      message: '이벤트가 등록되었습니다.',
      data: { id: eventId }
    });
  } catch (error) {
    await connection.rollback();
    console.error('이벤트 생성 실패:', error);
    res.status(500).json({
      success: false,
      message: '이벤트 생성 중 오류가 발생했습니다.'
    });
  } finally {
    connection.release();
  }
};

// 이벤트 수정
exports.updateEvent = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const eventId = req.params.id;
    const { title, subtitle, startDate, endDate, status, description, position, tag, notice } = req.body;
    const imageFile = req.file; // uploadEventImage.single("image")로 업로드된 파일

    // 이벤트 존재 확인 및 기존 데이터 조회
    const [existing] = await connection.query(
      `SELECT id, title, subtitle, description, position, start_date, end_date, status, image_url, tag, notice 
       FROM events WHERE id = ?`,
      [eventId]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: '이벤트를 찾을 수 없습니다.'
      });
    }

    const existingEvent = existing[0];

    // 필수 필드 검증
    if (!title || !title.trim()) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: '이벤트 제목을 입력해 주세요.'
      });
    }

    // 날짜 검증 (빈 문자열 체크)
    const validStartDate = startDate && startDate.trim() ? startDate.trim() : null;
    const validEndDate = endDate && endDate.trim() ? endDate.trim() : null;

    if (!validStartDate || !validEndDate) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: '이벤트 기간(시작일/종료일)을 입력해 주세요.'
      });
    }

    // 이미지 처리 (Cloudinary)
    let imageUrl = existing[0].image_url; // 기존 이미지 유지
    if (imageFile) {
      // 새 이미지가 업로드된 경우 Cloudinary 업로드
      console.log('[updateEvent] 새 이미지 Cloudinary 업로드 시작');
      const uploadResult = await uploadFromBuffer(imageFile.buffer, 'events');
      const newImageUrl = uploadResult.secure_url;

      // 기존 이미지 파일 삭제 (로컬 또는 Cloudinary)
      if (existing[0].image_url) {
        await deleteImage(existing[0].image_url);
      }

      imageUrl = newImageUrl;
      console.log('[updateEvent] 이미지 교체 완료:', imageUrl);
    }

    // 상태 값 검증 및 변환
    let validStatus = status && status.trim() ? status.trim() : existingEvent.status || 'SCHEDULED';
    // 유효한 상태값인지 확인
    if (!['SCHEDULED', 'ONGOING', 'ENDED'].includes(validStatus)) {
      validStatus = existingEvent.status || 'SCHEDULED';
    }

    // 이벤트 정보 업데이트 (프론트엔드에서 보내지 않는 필드는 기존 값 유지)
    await connection.query(
      `UPDATE events SET 
        title = ?, 
        subtitle = ?,
        description = ?,
        position = ?,
        start_date = ?, 
        end_date = ?, 
        status = ?,
        image_url = ?,
        tag = ?,
        notice = ?,
        updated_at = NOW()
      WHERE id = ?`,
      [
        title.trim(),
        subtitle ? subtitle.trim() : (existingEvent.subtitle || null),
        description ? description.trim() : (existingEvent.description || null),
        position ? position.trim() : (existingEvent.position || null),
        validStartDate,
        validEndDate,
        validStatus,
        imageUrl,
        tag ? tag.trim() : (existingEvent.tag || null),
        notice ? notice.trim() : (existingEvent.notice || null),
        eventId
      ]
    );

    await connection.commit();

    res.status(200).json({
      success: true,
      message: '이벤트가 수정되었습니다.',
      data: { id: eventId }
    });
  } catch (error) {
    await connection.rollback();
    console.error('이벤트 수정 실패:', error);
    res.status(500).json({
      success: false,
      message: '이벤트 수정 중 오류가 발생했습니다.'
    });
  } finally {
    connection.release();
  }
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

