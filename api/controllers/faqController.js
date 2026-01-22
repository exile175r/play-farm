const db = require('../config/db');

// FAQ 목록 조회
exports.getAllFaqs = async (req, res) => {
    try {
        const { category } = req.query;

        let query = `SELECT * FROM faqs`;
        const params = [];

        if (category && category !== 'ALL') {
            query += ` WHERE category = ?`;
            params.push(category);
        }

        query += ` ORDER BY id DESC`;

        const [faqs] = await db.query(query, params);

        res.status(200).json({ success: true, data: faqs });

    } catch (error) {
        console.error('FAQ 조회 실패:', error);
        res.status(500).json({ success: false, message: 'FAQ 조회 중 오류가 발생했습니다.' });
    }
};

// FAQ 생성
exports.createFaq = async (req, res) => {
    try {
        const { question, answer, category, display_order } = req.body;

        if (!question || !answer) {
            return res.status(400).json({ success: false, message: '질문과 답변을 입력해 주세요.' });
        }

        const [result] = await db.query(
            `INSERT INTO faqs (question, answer, category, display_order) VALUES (?, ?, ?, ?)`,
            [question, answer, category || '일반', display_order || 0]
        );

        res.status(201).json({ success: true, message: 'FAQ가 등록되었습니다.', data: { id: result.insertId } });

    } catch (error) {
        console.error('FAQ 생성 실패:', error);
        res.status(500).json({ success: false, message: 'FAQ 등록 중 오류가 발생했습니다.' });
    }
};

// FAQ 수정
exports.updateFaq = async (req, res) => {
    try {
        const { id } = req.params;
        const { question, answer, category, display_order } = req.body;

        const [result] = await db.query(
            `UPDATE faqs SET question = ?, answer = ?, category = ?, display_order = ?, updated_at = NOW() WHERE id = ?`,
            [question, answer, category, display_order, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'FAQ를 찾을 수 없습니다.' });
        }

        res.status(200).json({ success: true, message: 'FAQ가 수정되었습니다.' });

    } catch (error) {
        console.error('FAQ 수정 실패:', error);
        res.status(500).json({ success: false, message: 'FAQ 수정 중 오류가 발생했습니다.' });
    }
};

// FAQ 삭제
exports.deleteFaq = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(`DELETE FROM faqs WHERE id = ?`, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'FAQ를 찾을 수 없습니다.' });
        }

        res.status(200).json({ success: true, message: 'FAQ가 삭제되었습니다.' });

    } catch (error) {
        console.error('FAQ 삭제 실패:', error);
        res.status(500).json({ success: false, message: 'FAQ 삭제 중 오류가 발생했습니다.' });
    }
};
