const path = require('path');
const fs = require('fs');
const { uploadFromBuffer, deleteImage } = require('../utils/cloudinaryHelper');

// 후기 작성
exports.createReview = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.userId;
    const { program_id, product_id, rating, content } = req.body;
    const files = req.files || [];

    // 입력 검증 (둘 중 하나는 필수)
    if ((!program_id && !product_id) || !rating || !content) {
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

    // 대상 존재 확인
    if (program_id) {
      const [programs] = await connection.query('SELECT id FROM programs WHERE id = ?', [program_id]);
      if (programs.length === 0) {
        return res.status(404).json({ success: false, message: '프로그램을 찾을 수 없습니다.' });
      }
    } else {
      const [products] = await connection.query('SELECT id FROM products WHERE id = ?', [product_id]);
      if (products.length === 0) {
        return res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' });
      }
    }

    // 중복 후기 확인
    const [existingReviews] = await connection.query(
      `SELECT id FROM reviews WHERE user_id = ? AND ${program_id ? 'program_id = ?' : 'product_id = ?'}`,
      [userId, program_id || product_id]
    );

    if (existingReviews.length > 0) {
      return res.status(400).json({
        success: false,
        message: `이미 이 ${program_id ? '프로그램' : '상품'}에 대한 후기를 작성하셨습니다.`
      });
    }

    // 후기 저장
    const [result] = await connection.query(
      `INSERT INTO reviews (user_id, program_id, product_id, rating, content)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, program_id || null, product_id || null, rating, content]
    );

    const reviewId = result.insertId;

    // 이미지 Cloudinary 업로드 및 저장
    if (files.length > 0) {
      const uploadPromises = files.map(file => uploadFromBuffer(file.buffer, 'reviews'));
      const uploadResults = await Promise.all(uploadPromises);

      const imageValues = uploadResults.map((result, index) => [
        reviewId,
        result.secure_url,
        index
      ]);

      await connection.query(
        `INSERT INTO review_images (review_id, image_path, display_order)
         VALUES ?`,
        [imageValues]
      );
    }

    await connection.commit();

    // 저장된 후기 조회 (이미지는 별도로 조회하여 병합 - 호환성 및 안정성 목적)
    // 저장된 후기 조회
    const [rows] = await connection.query(
      `SELECT 
        r.id, r.user_id, r.program_id, r.product_id, r.rating, r.content, r.created_at, r.updated_at,
        u.name as user_name, u.nickname as user_nickname, u.user_id as user_user_id
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.id = ?`,
      [reviewId]
    );

    const review = rows[0];
    if (review) {
      // 이미지 별도 조회
      const [images] = await connection.query(
        'SELECT id, image_path, display_order FROM review_images WHERE review_id = ? ORDER BY display_order ASC',
        [reviewId]
      );

      review.images = images.map(img => img.image_path);
      review.user = review.user_nickname || review.user_name || review.user_user_id || '익명';
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

// 상품별 후기 목록 조회
exports.getReviewsByProduct = async (req, res) => {
  try {
    const { product_id } = req.params;

    const [reviews] = await db.query(
      `SELECT 
        r.id, r.user_id, r.product_id, r.rating, r.content, r.created_at, r.updated_at,
        u.name as user_name, u.nickname as user_nickname, u.user_id as user_user_id
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC`,
      [product_id]
    );

    if (reviews.length === 0) return res.json({ success: true, data: [] });

    const reviewIds = reviews.map(r => r.id);
    const [allImages] = await db.query(
      'SELECT review_id, image_path, display_order FROM review_images WHERE review_id IN (?) ORDER BY display_order ASC',
      [reviewIds]
    );

    const imageMap = allImages.reduce((acc, img) => {
      if (!acc[img.review_id]) acc[img.review_id] = [];
      acc[img.review_id].push(img.image_path);
      return acc;
    }, {});

    const formattedReviews = reviews.map(review => ({
      id: review.id,
      userId: review.user_id,
      productId: review.product_id,
      rating: review.rating,
      content: review.content,
      date: review.created_at,
      editedAt: review.updated_at !== review.created_at ? review.updated_at : null,
      user: review.user_nickname || review.user_name || review.user_user_id || '익명',
      images: imageMap[review.id] || []
    }));

    res.json({ success: true, data: formattedReviews });
  } catch (error) {
    console.error('상품 후기 조회 오류:', error);
    res.status(500).json({ success: false, message: '후기 조회 중 오류가 발생했습니다.' });
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
        u.nickname as user_nickname,
        u.user_id as user_user_id
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.program_id = ?
      ORDER BY r.created_at DESC`,
      [program_id]
    );

    if (reviews.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // 모든 후기 ID 추출
    const reviewIds = reviews.map(r => r.id);

    // 이미지 별도 조회 (IN 연산자 사용)
    const [allImages] = await db.query(
      'SELECT review_id, image_path, display_order FROM review_images WHERE review_id IN (?) ORDER BY display_order ASC',
      [reviewIds]
    );

    // 이미지를 후기별로 그룹화
    const imageMap = allImages.reduce((acc, img) => {
      if (!acc[img.review_id]) acc[img.review_id] = [];
      acc[img.review_id].push(img.image_path);
      return acc;
    }, {});

    const formattedReviews = reviews.map(review => {
      return {
        id: review.id,
        userId: review.user_id,
        programId: review.program_id,
        rating: review.rating,
        content: review.content,
        date: review.created_at,
        editedAt: review.updated_at !== review.created_at ? review.updated_at : null,
        user: review.user_nickname || review.user_name || review.user_user_id || '익명',
        images: imageMap[review.id] || []
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
        r.id, r.user_id, r.program_id, r.product_id, r.rating, r.content, r.created_at, r.updated_at,
        p.program_nm, p.village_nm,
        pd.name as product_name
      FROM reviews r
      LEFT JOIN programs p ON r.program_id = p.id
      LEFT JOIN products pd ON r.product_id = pd.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC`,
      [userId]
    );

    if (reviews.length === 0) return res.json({ success: true, data: [] });

    const reviewIds = reviews.map(r => r.id);
    const [allImages] = await db.query(
      'SELECT review_id, image_path, display_order FROM review_images WHERE review_id IN (?) ORDER BY display_order ASC',
      [reviewIds]
    );

    const imageMap = allImages.reduce((acc, img) => {
      if (!acc[img.review_id]) acc[img.review_id] = [];
      acc[img.review_id].push(img.image_path);
      return acc;
    }, {});

    const formattedReviews = reviews.map(review => ({
      id: review.id,
      userId: review.user_id,
      programId: review.program_id,
      productId: review.product_id,
      programName: review.program_nm,
      villageName: review.village_nm,
      productName: review.product_name,
      rating: review.rating,
      content: review.content,
      date: review.created_at,
      editedAt: review.updated_at !== review.created_at ? review.updated_at : null,
      images: imageMap[review.id] || []
    }));

    res.json({ success: true, data: formattedReviews });
  } catch (error) {
    console.error('내 후기 조회 오류:', error);
    res.status(500).json({ success: false, message: '후기 조회 중 오류가 발생했습니다.' });
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

    // 이미지 수정 로직 보강
    let existingImagesToKeep = [];
    if (req.body.existingImages) {
      if (Array.isArray(req.body.existingImages)) {
        existingImagesToKeep = req.body.existingImages;
      } else {
        try {
          // JSON 문자열인 경우 파싱 시도
          const parsed = JSON.parse(req.body.existingImages);
          existingImagesToKeep = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
          // 일반 문자열인 경우 배열로 감쌈
          existingImagesToKeep = [req.body.existingImages];
        }
      }
    }

    // 1. 현재 DB에 등록된 이미지 목록 조회
    const [currentImages] = await connection.query(
      'SELECT id, image_path FROM review_images WHERE review_id = ?',
      [id]
    );

    // 삭제할 이미지 필터링 및 실제 삭제 (로컬/Cloudinary 통합)
    const imagesToDelete = currentImages.filter(img => !existingImagesToKeep.includes(img.image_path));

    if (imagesToDelete.length > 0) {
      for (const img of imagesToDelete) {
        await deleteImage(img.image_path);
      }
      await connection.query(
        'DELETE FROM review_images WHERE id IN (?)',
        [imagesToDelete.map(img => img.id)]
      );
    }

    // 4. 새 이미지 저장 및 순서(display_order) 재정렬
    // 유지된 이미지들의 순서를 먼저 확보
    const [keptImages] = await connection.query(
      'SELECT id, image_path FROM review_images WHERE review_id = ? ORDER BY display_order ASC',
      [id]
    );

    let currentOrder = 0;
    // 기존 이미지 순서 업데이트
    for (const img of keptImages) {
      await connection.query(
        'UPDATE review_images SET display_order = ? WHERE id = ?',
        [currentOrder++, img.id]
      );
    }

    // 새 이미지 Cloudinary 업로드 및 추가
    if (files.length > 0) {
      const uploadPromises = files.map(file => uploadFromBuffer(file.buffer, 'reviews'));
      const uploadResults = await Promise.all(uploadPromises);

      const imageValues = uploadResults.map((result) => [
        id,
        result.secure_url,
        currentOrder++
      ]);

      await connection.query(
        `INSERT INTO review_images (review_id, image_path, display_order)
         VALUES ?`,
        [imageValues]
      );
    }

    await connection.commit();

    // 수정된 후기 조회
    const [rows] = await connection.query(
      `SELECT 
        r.id,
        r.user_id,
        r.program_id,
        r.rating,
        r.content,
        r.created_at,
        r.updated_at,
        u.name as user_name,
        u.nickname as user_nickname,
        u.user_id as user_user_id
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.id = ?`,
      [id]
    );

    const review = rows[0];
    if (review) {
      const [images] = await connection.query(
        'SELECT id, image_path, display_order FROM review_images WHERE review_id = ? ORDER BY display_order ASC',
        [id]
      );

      review.images = images.map(img => img.image_path);
      review.user = review.user_nickname || review.user_name || review.user_user_id || '익명';
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

    // 이미지 파일 삭제 (로컬 또는 Cloudinary)
    for (const img of images) {
      await deleteImage(img.image_path);
    }

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