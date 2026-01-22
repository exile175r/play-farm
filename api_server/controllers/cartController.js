const db = require('../config/db');

// 장바구니 담기
exports.addToCart = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.userId;
    const { productId, optionId, quantity = 1 } = req.body;

    // 입력 검증
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: '상품 ID가 필요합니다.'
      });
    }

    // 상품 존재 확인
    const [products] = await connection.query(
      `SELECT id, name, is_active FROM products WHERE id = ?`,
      [productId]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.'
      });
    }

    if (!products[0].is_active) {
      return res.status(400).json({
        success: false,
        message: '판매 중지된 상품입니다.'
      });
    }

    // 옵션이 있는 경우 옵션 확인
    if (optionId) {
      const [options] = await connection.query(
        `SELECT id, option_id, price FROM product_options 
         WHERE product_id = ? AND option_id = ?`,
        [productId, optionId]
      );

      if (options.length === 0) {
        return res.status(404).json({
          success: false,
          message: '옵션을 찾을 수 없습니다.'
        });
      }
    }

    // 기존 장바구니 항목 확인
    const [existing] = await connection.query(
      `SELECT id, quantity FROM cart 
       WHERE user_id = ? AND product_id = ? AND (option_id = ? OR (option_id IS NULL AND ? IS NULL))`,
      [userId, productId, optionId || null, optionId || null]
    );

    if (existing.length > 0) {
      // 기존 항목 수량 업데이트
      const newQuantity = Math.min(999, Number(existing[0].quantity) + Number(quantity));
      await connection.query(
        `UPDATE cart SET quantity = ?, updated_at = NOW() WHERE id = ?`,
        [newQuantity, existing[0].id]
      );
    } else {
      // 새 항목 추가
      await connection.query(
        `INSERT INTO cart (user_id, product_id, option_id, quantity)
         VALUES (?, ?, ?, ?)`,
        [userId, productId, optionId || null, Math.max(1, Number(quantity))]
      );
    }

    await connection.commit();

    res.status(200).json({
      success: true,
      message: '장바구니에 담겼습니다.'
    });

  } catch (error) {
    await connection.rollback();
    console.error('장바구니 담기 실패:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 담기 중 오류가 발생했습니다.'
    });
  } finally {
    connection.release();
  }
};

// 내 장바구니 조회
exports.getMyCart = async (req, res) => {
  try {
    const userId = req.userId;

    const [cartItems] = await db.query(
      `SELECT 
        c.id,
        c.product_id,
        c.option_id,
        c.quantity,
        c.created_at,
        c.updated_at,
        p.name,
        p.description,
        p.category,
        p.image_url,
        p.base_price,
        po.label as option_label,
        po.price as option_price,
        po.amount as option_amount,
        po.unit as option_unit
       FROM cart c
       INNER JOIN products p ON c.product_id = p.id
       LEFT JOIN product_options po ON c.product_id = po.product_id AND c.option_id = po.option_id
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC`,
      [userId]
    );

    const formatted = cartItems.map(item => {
      const price = item.option_price ? Number(item.option_price) : Number(item.base_price);
      
      return {
        id: String(item.product_id),
        cartItemId: String(item.id),
        name: item.name,
        image: item.image_url,
        optionId: item.option_id || null,
        optionName: item.option_label || null,
        price: price,
        qty: item.quantity
      };
    });

    res.status(200).json({
      success: true,
      data: formatted
    });

  } catch (error) {
    console.error('장바구니 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 조회 중 오류가 발생했습니다.'
    });
  }
};

// 장바구니 수량 수정
exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.userId;
    const cartItemId = req.params.id;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: '수량은 1개 이상이어야 합니다.'
      });
    }

    // 권한 확인
    const [cartItems] = await db.query(
      `SELECT id FROM cart WHERE id = ? AND user_id = ?`,
      [cartItemId, userId]
    );

    if (cartItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: '장바구니 항목을 찾을 수 없습니다.'
      });
    }

    await db.query(
      `UPDATE cart SET quantity = ?, updated_at = NOW() WHERE id = ?`,
      [Math.min(999, Number(quantity)), cartItemId]
    );

    res.status(200).json({
      success: true,
      message: '수량이 수정되었습니다.'
    });

  } catch (error) {
    console.error('장바구니 수정 실패:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 수정 중 오류가 발생했습니다.'
    });
  }
};

// 장바구니 항목 삭제
exports.removeCartItem = async (req, res) => {
  try {
    const userId = req.userId;
    const cartItemId = req.params.id;

    // 권한 확인
    const [cartItems] = await db.query(
      `SELECT id FROM cart WHERE id = ? AND user_id = ?`,
      [cartItemId, userId]
    );

    if (cartItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: '장바구니 항목을 찾을 수 없습니다.'
      });
    }

    await db.query(
      `DELETE FROM cart WHERE id = ?`,
      [cartItemId]
    );

    res.status(200).json({
      success: true,
      message: '장바구니에서 삭제되었습니다.'
    });

  } catch (error) {
    console.error('장바구니 삭제 실패:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 삭제 중 오류가 발생했습니다.'
    });
  }
};

// 장바구니 비우기
exports.clearCart = async (req, res) => {
  try {
    const userId = req.userId;

    await db.query(
      `DELETE FROM cart WHERE user_id = ?`,
      [userId]
    );

    res.status(200).json({
      success: true,
      message: '장바구니가 비워졌습니다.'
    });

  } catch (error) {
    console.error('장바구니 비우기 실패:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 비우기 중 오류가 발생했습니다.'
    });
  }
};

