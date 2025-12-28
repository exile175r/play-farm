/**
 * StoreData.js에서 MySQL 데이터베이스로 상품 데이터 마이그레이션 스크립트
 *
 * 사용법:
 * 1. MySQL 데이터베이스 연결 정보를 설정하세요 (.env 파일)
 * 2. npm install mysql2 (필요시)
 * 3. node database/migrateProducts.js
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mysql = require("mysql2/promise");

// StoreData.js 파일을 읽기 위해 동적으로 import
// Node.js에서는 ES6 모듈을 직접 import할 수 없으므로 파일을 읽어서 파싱
const fs = require("fs");

// 데이터베이스 연결 설정
const config = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "play_farm",
  charset: "utf8mb4",
};

// StoreData.js 파일 경로
const storeDataPath = path.join(__dirname, "../src/components/data/StoreData.js");

/**
 * StoreData.js 파일에서 데이터 추출
 * ES6 모듈 형식을 파싱하여 데이터 추출
 */
function extractStoreData() {
  const fileContent = fs.readFileSync(storeDataPath, "utf8");
  
  // getImagePath 함수 호출 부분을 실제 경로로 변환
  // 예: getImagePath("/images/store/potato.png") -> "/images/store/potato.png"
  const processedContent = fileContent.replace(/getImagePath\(["']([^"']+)["']\)/g, '"$1"');
  
  // shopData 배열 부분만 추출
  const shopDataMatch = processedContent.match(/const shopData = (\[[\s\S]*?\]);/);
  if (!shopDataMatch) {
    throw new Error("StoreData.js에서 shopData 배열을 찾을 수 없습니다.");
  }
  
  // eval을 사용하여 배열 파싱 (주의: 프로덕션에서는 더 안전한 방법 사용 권장)
  // 여기서는 마이그레이션 스크립트이므로 사용
  const shopData = eval(shopDataMatch[1]);
  
  return shopData;
}

/**
 * 이미지 경로를 실제 URL 경로로 변환
 */
function normalizeImagePath(imagePath) {
  if (!imagePath) return null;
  
  // 이미 절대 경로인 경우 그대로 반환
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  
  // 상대 경로인 경우 그대로 반환 (프론트엔드에서 처리)
  return imagePath;
}

/**
 * 상품 데이터 마이그레이션 실행
 */
async function migrateProducts() {
  let connection;

  try {
    // 데이터베이스 연결
    console.log("데이터베이스 연결 중...");
    console.log(`연결 정보: host=${config.host}, user=${config.user}, database=${config.database}`);
    connection = await mysql.createConnection(config);
    console.log("데이터베이스 연결 성공");

    // StoreData.js에서 데이터 추출
    console.log("StoreData.js 파일 읽기 중...");
    const shopData = extractStoreData();
    console.log(`총 ${shopData.length}개의 상품 데이터를 마이그레이션합니다.`);

    // 기존 데이터 확인 (선택사항: 중복 방지)
    const [existingProducts] = await connection.execute("SELECT COUNT(*) as count FROM products");
    if (existingProducts[0].count > 0) {
      console.log(`\n경고: 이미 ${existingProducts[0].count}개의 상품이 존재합니다.`);
      console.log("기존 데이터를 삭제하고 새로 삽입하시겠습니까? (y/n)");
      // 자동으로 진행하려면 아래 주석을 해제하고 기존 데이터 삭제
      // await connection.execute("DELETE FROM product_options");
      // await connection.execute("DELETE FROM products");
    }

    let insertedCount = 0;
    let optionCount = 0;

    // 상품 데이터 삽입
    console.log("\n상품 데이터 삽입 중...");
    for (const product of shopData) {
      try {
        // base_price 계산 (옵션이 있으면 최저가, 없으면 0)
        let basePrice = 0;
        if (product.options && product.options.length > 0) {
          basePrice = Math.min(...product.options.map(opt => Number(opt.price || 0)));
        } else if (product.price) {
          basePrice = Number(product.price);
        }

        // 상품 삽입
        const [result] = await connection.execute(
          `INSERT INTO products (
            name, description, category, image_url, base_price, is_active, stock_quantity
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            product.name || "",
            product.desc || product.description || null,
            product.category || null,
            normalizeImagePath(product.image),
            basePrice,
            true, // is_active
            100, // stock_quantity (기본값)
          ]
        );

        const productId = result.insertId;

        // 옵션 삽입
        if (product.options && Array.isArray(product.options) && product.options.length > 0) {
          for (let i = 0; i < product.options.length; i++) {
            const option = product.options[i];
            await connection.execute(
              `INSERT INTO product_options (
                product_id, option_id, label, amount, unit, unit_price, price, stock_quantity, display_order
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                productId,
                option.id || `option_${i}`,
                option.label || "",
                option.amount || null,
                option.unit || null,
                Number(option.unitPrice || 0),
                Number(option.price || 0),
                100, // stock_quantity (기본값)
                i, // display_order
              ]
            );
            optionCount++;
          }
        }

        insertedCount++;
        if (insertedCount % 5 === 0) {
          console.log(`  ${insertedCount}/${shopData.length} 진행 중...`);
        }
      } catch (error) {
        console.error(`상품 삽입 실패:`);
        console.error(`  상품명: ${product.name}`);
        console.error(`  에러 메시지: ${error.message}`);
      }
    }

    console.log(`\n총 ${insertedCount}개의 상품 데이터 삽입 완료`);
    console.log(`총 ${optionCount}개의 상품 옵션 삽입 완료`);

    // 통계 출력
    const [productCount] = await connection.execute("SELECT COUNT(*) as count FROM products");
    const [optionCountResult] = await connection.execute("SELECT COUNT(*) as count FROM product_options");

    console.log("\n=== 마이그레이션 완료 ===");
    console.log(`상품: ${productCount[0].count}개`);
    console.log(`상품 옵션: ${optionCountResult[0].count}개`);
  } catch (error) {
    console.error("마이그레이션 중 오류 발생:", error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("\n데이터베이스 연결 종료");
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  migrateProducts().catch(console.error);
}

module.exports = { migrateProducts };

