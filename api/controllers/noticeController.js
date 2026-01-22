const db = require('../config/db');

// 전체 공지사항 목록 조회 (페이지네이션)
exports.getAllNotices = async (req, res) => {
    try {
        const { page = 1, limit = 10, keyword = '' } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = `SELECT * FROM notices WHERE 1=1`;
        const params = [];

        if (keyword) {
            query += ` AND (title LIKE ? OR content LIKE ?)`;
            params.push(`%${keyword}%`, `%${keyword}%`);
        }

        // 중요 공지 먼저, 그 다음 날짜순
        query += ` ORDER BY is_important DESC, created_at DESC LIMIT ? OFFSET ?`;
        params.push(Number(limit), offset);

        const [notices] = await db.query(query, params);

        // 총 개수
        let countQuery = `SELECT COUNT(*) as total FROM notices WHERE 1=1`;
        const countParams = [];
        if (keyword) {
            countQuery += ` AND (title LIKE ? OR content LIKE ?)`;
            countParams.push(`%${keyword}%`, `%${keyword}%`);
        }
        const [countResult] = await db.query(countQuery, countParams);
        const total = countResult[0].total;

        res.status(200).json({
            success: true,
            data: notices,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit))
            }
        });

    } catch (error) {
        console.error('공지사항 목록 조회 실패:', error);
        res.status(500).json({ success: false, message: '공지사항 목록 조회 중 오류가 발생했습니다.' });
    }
};

// 공지사항 생성
exports.createNotice = async (req, res) => {
    try {
        const { title, content, is_important } = req.body;

        if (!title || !content) {
            return res.status(400).json({ success: false, message: '제목과 내용을 입력해 주세요.' });
        }

        const [result] = await db.query(
            `INSERT INTO notices (title, content, is_important) VALUES (?, ?, ?)`,
            [title, content, is_important ? 1 : 0]
        );

        res.status(201).json({ success: true, message: '공지사항이 등록되었습니다.', data: { id: result.insertId } });

    } catch (error) {
        console.error('공지사항 생성 실패:', error);
        res.status(500).json({ success: false, message: '공지사항 등록 중 오류가 발생했습니다.' });
    }
};

// 공지사항 수정
exports.updateNotice = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, is_important } = req.body;

        const [result] = await db.query(
            `UPDATE notices SET title = ?, content = ?, is_important = ?, updated_at = NOW() WHERE id = ?`,
            [title, content, is_important ? 1 : 0, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: '공지사항을 찾을 수 없습니다.' });
        }

        res.status(200).json({ success: true, message: '공지사항이 수정되었습니다.' });

    } catch (error) {
        console.error('공지사항 수정 실패:', error);
        res.status(500).json({ success: false, message: '공지사항 수정 중 오류가 발생했습니다.' });
    }
};

// 공지사항 삭제
exports.deleteNotice = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(`DELETE FROM notices WHERE id = ?`, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: '공지사항을 찾을 수 없습니다.' });
        }

        res.status(200).json({ success: true, message: '공지사항이 삭제되었습니다.' });

    } catch (error) {
        console.error('공지사항 삭제 실패:', error);
        res.status(500).json({ success: false, message: '공지사항 삭제 중 오류가 발생했습니다.' });
    }
};
