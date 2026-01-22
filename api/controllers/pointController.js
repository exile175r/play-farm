const db = require('../config/db');

// 내 포인트 조회
exports.getMyPoints = async (req, res) => {
  try {
    const userId = req.userId;

    const [users] = await db.query(
      `SELECT points FROM users WHERE id = ?`,
      [userId]
    );

    // 사용자가 없을 때 기본값(0) 반환 (404 오류 대신)
    if (users.length === 0) {
      console.warn(`[getMyPoints] 사용자를 찾을 수 없습니다. userId: ${userId}`);
      return res.status(200).json({
        success: true,
        data: {
          points: 0
        }
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

