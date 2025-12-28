const db = require('../config/db');

// 상품 목록 조회
exports.getProducts = async (req, res) => {
  try {
    const { category, keyword, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.category,
        p.image_url,
        p.base_price,
        p.is_active,
        p.stock_quantity,
        p.created_at
      FROM products p
      WHERE p.is_active = TRUE
    `;
    const params = [];

    if (category && category !== '전체') {
      query += ` AND p.category = ?`;
      params.push(category);
    }

    if (keyword) {
      query += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
      const searchKeyword = `%${keyword}%`;
      params.push(searchKeyword, searchKeyword);
    }

    query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const [products] = await db.query(query, params);

    // 각 상품의 옵션 정보 조회
    const productsWithOptions = await Promise.all(products.map(async (product) => {
      const [options] = await db.query(
        `SELECT 
          id, option_id, label, amount, unit, unit_price, price, stock_quantity, display_order
         FROM product_options
         WHERE product_id = ?
         ORDER BY display_order ASC, id ASC`,
        [product.id]
      );

      return {
        id: product.id,
        name: product.name,
        desc: product.description,
        category: product.category,
        image: product.image_url,
        price: Number(product.base_price),
        options: options.map(opt => ({
          id: opt.option_id,
          label: opt.label,
          amount: Number(opt.amount),
          unit: opt.unit,
          unitPrice: Number(opt.unit_price),
          price: Number(opt.price)
        }))
      };
    }));

    // 전체 개수 조회
    let countQuery = `SELECT COUNT(*) as total FROM products WHERE is_active = TRUE`;
    const countParams = [];
    
    if (category && category !== '전체') {
      countQuery += ` AND category = ?`;
      countParams.push(category);
    }

    if (keyword) {
      countQuery += ` AND (name LIKE ? OR description LIKE ?)`;
      const searchKeyword = `%${keyword}%`;
      countParams.push(searchKeyword, searchKeyword);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    res.status(200).json({
      success: true,
      data: productsWithOptions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('상품 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '상품 목록 조회 중 오류가 발생했습니다.'
    });
  }
};

// 상품 상세 조회
exports.getProductById = async (req, res) => {
  try {
    const productId = req.params.id;

    const [products] = await db.query(
      `SELECT 
        id, name, description, category, image_url, base_price, is_active, stock_quantity, created_at
       FROM products
       WHERE id = ? AND is_active = TRUE`,
      [productId]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.'
      });
    }

    const product = products[0];

    // 옵션 정보 조회
    const [options] = await db.query(
      `SELECT 
        id, option_id, label, amount, unit, unit_price, price, stock_quantity, display_order
       FROM product_options
       WHERE product_id = ?
       ORDER BY display_order ASC, id ASC`,
      [productId]
    );

    const response = {
      id: product.id,
      name: product.name,
      desc: product.description,
      category: product.category,
      image: product.image_url,
      price: Number(product.base_price),
      options: options.map(opt => ({
        id: opt.option_id,
        label: opt.label,
        amount: Number(opt.amount),
        unit: opt.unit,
        unitPrice: Number(opt.unit_price),
        price: Number(opt.price)
      }))
    };

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('상품 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '상품 조회 중 오류가 발생했습니다.'
    });
  }
};

