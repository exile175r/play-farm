const db = require('../config/db');

// 전체 프로그램 목록 조회
exports.getAllPrograms = async (req, res) => {
  try {
    // URL의 쿼리 문자열(? 뒤의 부분)을 자동으로 파싱하여 20개씩 불러옴
    // page: 페이지 번호 (기본값: 1), limit: 페이지당 항목 수 (기본값: 20)
    // 예: /api/programs?page=2&limit=10
    // 프론트 개발 기획에 따라 변경 여지 있음
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const limitValue = Math.max(1, Math.min(100, parseInt(limit) || 20)); // 1~100 사이로 제한
    const offsetValue = Math.max(0, parseInt(offset) || 0); // 0 이상으로 제한

    const [programs] = await db.execute(
      `SELECT p.*, 
       GROUP_CONCAT(DISTINCT pt.type_name) as program_types,
       (SELECT GROUP_CONCAT(pi2.image_url ORDER BY pi2.display_order)
        FROM program_images pi2
        WHERE pi2.program_id = p.id) as images
       FROM programs p
       LEFT JOIN program_program_types ppt ON p.id = ppt.program_id
       LEFT JOIN program_types pt ON ppt.program_type_id = pt.id
       GROUP BY p.id
       LIMIT ${limitValue} OFFSET ${offsetValue}`,
      []
    );

    // 총 개수 조회
    const [countResult] = await db.execute('SELECT COUNT(*) as total FROM programs');
    const total = countResult[0].total;

    // 데이터 포맷팅
    const formattedPrograms = programs.map(program => ({
      ...program,
      program_types: program.program_types ? program.program_types.split(',') : [],
      images: program.images ? program.images.split(',') : []
    }));

    res.json({
      success: true,
      data: formattedPrograms,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('프로그램 목록 조회 오류:', error);
    res.status(500).json({ success: false, error: '프로그램 목록을 불러오는데 실패했습니다.' });
  }
};

// 프로그램 상세 조회
exports.getProgramById = async (req, res) => {
  try {
    const { id } = req.params;
    const programId = parseInt(id);

    // id가 유효한 숫자인지 확인
    if (isNaN(programId)) {
      return res.status(400).json({ success: false, error: '유효하지 않은 프로그램 ID입니다.' });
    }

    console.log('프로그램 상세 조회 요청:', programId);

    const [programs] = await db.execute(
      `SELECT p.*, 
       GROUP_CONCAT(DISTINCT pt.type_name) as program_types,
       (SELECT GROUP_CONCAT(pi2.image_url ORDER BY pi2.display_order)
        FROM program_images pi2
        WHERE pi2.program_id = p.id) as images
       FROM programs p
       LEFT JOIN program_program_types ppt ON p.id = ppt.program_id
       LEFT JOIN program_types pt ON ppt.program_type_id = pt.id
       WHERE p.id = ?
       GROUP BY p.id`,
      [programId]
    );

    console.log('조회된 프로그램 개수:', programs.length);

    if (programs.length === 0) {
      return res.status(404).json({ success: false, error: '프로그램을 찾을 수 없습니다.' });
    }

    // 컬럼 COMMENT 조회
    const [columnComments] = await db.execute(
      `SELECT COLUMN_NAME, COLUMN_COMMENT 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'programs'`,
      []
    );

    // COMMENT를 객체로 변환
    const comments = {};
    columnComments.forEach(col => {
      if (col.COLUMN_NAME !== "id" &&
        col.COLUMN_NAME !== "created_at" &&
        col.COLUMN_NAME !== "updated_at")
        comments[col.COLUMN_NAME] = col.COLUMN_COMMENT;
    });

    if (!Object.keys(comments).includes("program_types"))
      comments.program_types = programs[0].program_types;

    const program = {
      ...programs[0],
      program_types: programs[0].program_types ? programs[0].program_types.split(',') : [],
      images: programs[0].images ? programs[0].images.split(',') : [],
      column_comments: comments  // 컬럼 COMMENT 추가
    };

    res.json({ success: true, data: program });
  } catch (error) {
    console.error('프로그램 상세 조회 오류:', error);
    res.status(500).json({ success: false, error: '프로그램 정보를 불러오는데 실패했습니다.' });
  }
};

// 프로그램 검색
exports.searchPrograms = async (req, res) => {
  try {
    const { keyword, type, village, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // LIMIT와 OFFSET 값을 숫자로 변환
    const limitValue = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const offsetValue = Math.max(0, parseInt(offset) || 0);

    let query = `
      SELECT DISTINCT p.*, 
      GROUP_CONCAT(DISTINCT pt.type_name) as program_types,
      (SELECT GROUP_CONCAT(pi2.image_url ORDER BY pi2.display_order)
       FROM program_images pi2
       WHERE pi2.program_id = p.id) as images
      FROM programs p
      LEFT JOIN program_program_types ppt ON p.id = ppt.program_id
      LEFT JOIN program_types pt ON ppt.program_type_id = pt.id
      WHERE 1=1
    `;
    const params = [];

    if (keyword) {
      query += ` AND (p.program_nm LIKE ? OR p.village_nm LIKE ? OR p.cn LIKE ?)`;
      const keywordParam = `%${keyword}%`;
      params.push(keywordParam, keywordParam, keywordParam);
    }

    if (type) {
      query += ` AND pt.type_name = ?`;
      params.push(type);
    }

    if (village) {
      query += ` AND p.village_nm LIKE ?`;
      params.push(`%${village}%`);
    }

    query += ` GROUP BY p.id LIMIT ${limitValue} OFFSET ${offsetValue}`;

    const [programs] = await db.execute(query, params);

    const formattedPrograms = programs.map(program => ({
      ...program,
      program_types: program.program_types ? program.program_types.split(',') : [],
      images: program.images ? program.images.split(',') : []
    }));

    res.json({ success: true, data: formattedPrograms });
  } catch (error) {
    console.error('프로그램 검색 오류:', error);
    res.status(500).json({ success: false, error: '검색에 실패했습니다.' });
  }
};