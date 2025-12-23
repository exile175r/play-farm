const db = require('../config/db');
const path = require('path');
const fs = require('fs');

// 후기 작성
exports.createReview = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.userId;
    const { program_id, rating, content } = req.body;
    const files = req.files || [];

    // 입력 검증
    if (!program_id || !rating || !content) {
      return res.status(400).json({
        success: false,
        message: '필수 항목이 누락되었습니다.'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: '별점은 1-5 사이여야 합니다.'
      });
    }

    // 프로그램 존재 확인
    const [programs] = await connection.query(
      'SELECT id FROM programs WHERE id = ?',
      [program_id]
    );

    if (programs.length === 0) {
      return res.status(404).json({
        success: false,
        message: '프로그램을 찾을 수 없습니다.'
      });
    }

    // 후기 저장
    const [result] = await connection.query(
      `INSERT INTO reviews (user_id, program_id, rating, content)
       VALUES (?, ?, ?, ?)`,
      [userId, program_id, rating, content]
    );

    const reviewId = result.insertId;

    // 이미지 저장
    if (files.length > 0) {
      const imageValues = files.map((file, index) => [
        reviewId,
        `/images/reviews/${file.filename}`,
        index
      ]);

      await connection.query(
        `INSERT INTO review_images (review_id, image_path, display_order)
         VALUES ?`,
        [imageValues]
      );
    }

    await connection.commit();

    // 저장된 후기 조회
    const [reviews] = await connection.query(
      `SELECT 
        r.id,
        r.user_id,
        r.program_id,
        r.rating,
        r.content,
        r.created_at,
        r.updated_at,
        u.name as user_name,
        u.user_id as user_user_id,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', ri.id,
            'image_path', ri.image_path,
            'display_order', ri.display_order
          )
        ) as images
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN review_images ri ON r.id = ri.review_id
      WHERE r.id = ?
      GROUP BY r.id`,
      [reviewId]
    );

    const review = reviews[0];
    if (review && review.images && review.images[0] && review.images[0].id === null) {
      review.images = [];
    } else if (review && review.images) {
      review.images = JSON.parse(review.images).sort((a, b) => a.display_order - b.display_order);
    }

    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error) {
    await connection.rollback();
    console.error('후기 작성 오류:', error);
    res.status(500).json({
      success: false,
      message: '후기 작성 중 오류가 발생했습니다.'
    });
  } finally {
    connection.release();
  }
};

// 프로그램별 후기 목록 조회
exports.getReviewsByProgram = async (req, res) => {
  try {
    const { program_id } = req.params;

    const [reviews] = await db.query(
      `SELECT 
        r.id,
        r.user_id,
        r.program_id,
        r.rating,
        r.content,
        r.created_at,
        r.updated_at,
        u.name as user_name,
        u.user_id as user_user_id,
        COALESCE(
          JSON_ARRAYAGG(
            CASE 
              WHEN ri.id IS NOT NULL THEN
                JSON_OBJECT(
                  'id', ri.id,
                  'image_path', ri.image_path,
                  'display_order', ri.display_order
                )
              ELSE NULL
            END
          ),
          JSON_ARRAY()
        ) as images
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN review_images ri ON r.id = ri.review_id
      WHERE r.program_id = ?
      GROUP BY r.id
      ORDER BY r.created_at DESC`,
      [program_id]
    );

    const formattedReviews = reviews.map(review => {
      const images = review.images && review.images[0] && review.images[0].id !== null
        ? JSON.parse(review.images).filter(img => img.id !== null).sort((a, b) => a.display_order - b.display_order)
        : [];

      return {
        id: review.id,
        userId: review.user_id,
        programId: review.program_id,
        rating: review.rating,
        content: review.content,
        date: review.created_at,
        editedAt: review.updated_at !== review.created_at ? review.updated_at : null,
        user: review.user_name || review.user_user_id || '익명',
        images: images.map(img => img.image_path)
      };
    });

    res.json({
      success: true,
      data: formattedReviews
    });
  } catch (error) {
    console.error('후기 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '후기 조회 중 오류가 발생했습니다.'
    });
  }
};

// 내 후기 목록 조회
exports.getMyReviews = async (req, res) => {
  try {
    const userId = req.userId;

    const [reviews] = await db.query(
      `SELECT 
        r.id,
        r.user_id,
        r.program_id,
        r.rating,
        r.content,
        r.created_at,
        r.updated_at,
        p.program_nm,
        p.village_nm,
        COALESCE(
          JSON_ARRAYAGG(
            CASE 
              WHEN ri.id IS NOT NULL THEN
                JSON_OBJECT(
                  'id', ri.id,
                  'image_path', ri.image_path,
                  'display_order', ri.display_order
                )
              ELSE NULL
            END
          ),
          JSON_ARRAY()
        ) as images
      FROM reviews r
      LEFT JOIN programs p ON r.program_id = p.id
      LEFT JOIN review_images ri ON r.id = ri.review_id
      WHERE r.user_id = ?
      GROUP BY r.id
      ORDER BY r.created_at DESC`,
      [userId]
    );

    const formattedReviews = reviews.map(review => {
      const images = review.images && review.images[0] && review.images[0].id !== null
        ? JSON.parse(review.images).filter(img => img.id !== null).sort((a, b) => a.display_order - b.display_order)
        : [];

      return {
        id: review.id,
        userId: review.user_id,
        programId: review.program_id,
        programName: review.program_nm,
        villageName: review.village_nm,
        rating: review.rating,
        content: review.content,
        date: review.created_at,
        editedAt: review.updated_at !== review.created_at ? review.updated_at : null,
        images: images.map(img => img.image_path)
      };
    });

    res.json({
      success: true,
      data: formattedReviews
    });
  } catch (error) {
    console.error('내 후기 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '후기 조회 중 오류가 발생했습니다.'
    });
  }
};

// 후기 수정
exports.updateReview = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.userId;
    const { id } = req.params;
    const { rating, content } = req.body;
    const files = req.files || [];

    // 입력 검증
    if (!rating || !content) {
      return res.status(400).json({
        success: false,
        message: '필수 항목이 누락되었습니다.'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: '별점은 1-5 사이여야 합니다.'
      });
    }

    // 후기 소유권 확인
    const [reviews] = await connection.query(
      'SELECT id FROM reviews WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (reviews.length === 0) {
      return res.status(404).json({
        success: false,
        message: '후기를 찾을 수 없거나 수정 권한이 없습니다.'
      });
    }

    // 후기 내용 수정
    await connection.query(
      'UPDATE reviews SET rating = ?, content = ? WHERE id = ?',
      [rating, content, id]
    );

    // 기존 이미지 삭제 (새 이미지가 있는 경우)
    if (files.length > 0) {
      const [existingImages] = await connection.query(
        'SELECT image_path FROM review_images WHERE review_id = ?',
        [id]
      );

      // 파일 시스템에서 이미지 삭제
      existingImages.forEach(img => {
        const filePath = path.join(__dirname, '../../public', img.image_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });

      // DB에서 이미지 삭제
      await connection.query(
        'DELETE FROM review_images WHERE review_id = ?',
        [id]
      );

      // 새 이미지 저장
      const imageValues = files.map((file, index) => [
        id,
        `/images/reviews/${file.filename}`,
        index
      ]);

      await connection.query(
        `INSERT INTO review_images (review_id, image_path, display_order)
         VALUES ?`,
        [imageValues]
      );
    }

    await connection.commit();

    // 수정된 후기 조회
    const [updatedReviews] = await connection.query(
      `SELECT 
        r.id,
        r.user_id,
        r.program_id,
        r.rating,
        r.content,
        r.created_at,
        r.updated_at,
        u.name as user_name,
        u.user_id as user_user_id,
        COALESCE(
          JSON_ARRAYAGG(
            CASE 
              WHEN ri.id IS NOT NULL THEN
                JSON_OBJECT(
                  'id', ri.id,
                  'image_path', ri.image_path,
                  'display_order', ri.display_order
                )
              ELSE NULL
            END
          ),
          JSON_ARRAY()
        ) as images
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN review_images ri ON r.id = ri.review_id
      WHERE r.id = ?
      GROUP BY r.id`,
      [id]
    );

    const review = updatedReviews[0];
    if (review && review.images && review.images[0] && review.images[0].id === null) {
      review.images = [];
    } else if (review && review.images) {
      review.images = JSON.parse(review.images).sort((a, b) => a.display_order - b.display_order);
    }

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    await connection.rollback();
    console.error('후기 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '후기 수정 중 오류가 발생했습니다.'
    });
  } finally {
    connection.release();
  }
};

// 후기 삭제
exports.deleteReview = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.userId;
    const { id } = req.params;

    // 후기 소유권 확인
    const [reviews] = await connection.query(
      'SELECT id FROM reviews WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (reviews.length === 0) {
      return res.status(404).json({
        success: false,
        message: '후기를 찾을 수 없거나 삭제 권한이 없습니다.'
      });
    }

    // 이미지 파일 삭제
    const [images] = await connection.query(
      'SELECT image_path FROM review_images WHERE review_id = ?',
      [id]
    );

    images.forEach(img => {
      const filePath = path.join(__dirname, '../../public', img.image_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    // DB에서 삭제 (CASCADE로 자동 삭제되지만 명시적으로)
    await connection.query('DELETE FROM review_images WHERE review_id = ?', [id]);
    await connection.query('DELETE FROM reviews WHERE id = ?', [id]);

    await connection.commit();

    res.json({
      success: true,
      message: '후기가 삭제되었습니다.'
    });
  } catch (error) {
    await connection.rollback();
    console.error('후기 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '후기 삭제 중 오류가 발생했습니다.'
    });
  } finally {
    connection.release();
  }
};