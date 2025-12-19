const db = require('../config/db');

// 북마크 추가/삭제 (토글)
exports.toggleBookmark = async (req, res) => {
  try {
    const userId = req.userId; // authenticateToken 미들웨어에서 설정
    const { program_id } = req.body;

    if (!program_id) {
      return res.status(400).json({
        success: false,
        message: '프로그램 ID가 필요합니다.'
      });
    }

    // 프로그램 존재 확인
    const [programs] = await db.query(
      'SELECT id FROM programs WHERE id = ?',
      [program_id]
    );

    if (programs.length === 0) {
      return res.status(404).json({
        success: false,
        message: '프로그램을 찾을 수 없습니다.'
      });
    }

    // 북마크 존재 확인
    const [existing] = await db.query(
      'SELECT id FROM bookmarks WHERE user_id = ? AND program_id = ?',
      [userId, program_id]
    );

    if (existing.length > 0) {
      // 북마크 삭제
      await db.query(
        'DELETE FROM bookmarks WHERE user_id = ? AND program_id = ?',
        [userId, program_id]
      );

      return res.status(200).json({
        success: true,
        message: '북마크가 해제되었습니다.',
        data: { isBookmarked: false }
      });
    } else {
      // 북마크 추가
      await db.query(
        'INSERT INTO bookmarks (user_id, program_id) VALUES (?, ?)',
        [userId, program_id]
      );

      return res.status(200).json({
        success: true,
        message: '북마크가 추가되었습니다.',
        data: { isBookmarked: true }
      });
    }
  } catch (error) {
    console.error('북마크 토글 실패:', error);
    return res.status(500).json({
      success: false,
      message: '북마크 처리 중 오류가 발생했습니다.'
    });
  }
};

// 사용자의 북마크 목록 조회
exports.getMyBookmarks = async (req, res) => {
  try {
    const userId = req.userId;

    const [bookmarks] = await db.query(
      `SELECT 
        b.id,
        b.program_id,
        b.created_at,
        p.program_nm,
        p.village_nm,
        p.address,
        p.reqst_endde,
        (SELECT image_url FROM program_images WHERE program_id = p.id ORDER BY display_order LIMIT 1) as image_url
      FROM bookmarks b
      INNER JOIN programs p ON b.program_id = p.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      data: {
        bookmarks: bookmarks
      }
    });
  } catch (error) {
    console.error('북마크 목록 조회 실패:', error);
    return res.status(500).json({
      success: false,
      message: '북마크 목록 조회 중 오류가 발생했습니다.'
    });
  }
};

// 특정 프로그램의 북마크 여부 확인
exports.checkBookmark = async (req, res) => {
  try {
    const userId = req.userId;
    const { program_id } = req.params;

    const [bookmarks] = await db.query(
      'SELECT id FROM bookmarks WHERE user_id = ? AND program_id = ?',
      [userId, program_id]
    );

    res.status(200).json({
      success: true,
      data: {
        isBookmarked: bookmarks.length > 0
      }
    });
  } catch (error) {
    console.error('북마크 확인 실패:', error);
    return res.status(500).json({
      success: false,
      message: '북마크 확인 중 오류가 발생했습니다.'
    });
  }
};

// 여러 프로그램의 북마크 여부 일괄 확인
exports.checkBookmarks = async (req, res) => {
  try {
    const userId = req.userId;
    const { program_ids } = req.body; // [1, 2, 3] 형식의 배열

    if (!Array.isArray(program_ids) || program_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '프로그램 ID 배열이 필요합니다.'
      });
    }

    const placeholders = program_ids.map(() => '?').join(',');
    const [bookmarks] = await db.query(
      `SELECT program_id FROM bookmarks 
       WHERE user_id = ? AND program_id IN (${placeholders})`,
      [userId, ...program_ids]
    );

    const bookmarkedIds = bookmarks.map(b => b.program_id);

    res.status(200).json({
      success: true,
      data: {
        bookmarkedIds: bookmarkedIds
      }
    });
  } catch (error) {
    console.error('북마크 일괄 확인 실패:', error);
    return res.status(500).json({
      success: false,
      message: '북마크 확인 중 오류가 발생했습니다.'
    });
  }
};