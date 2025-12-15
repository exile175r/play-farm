/**
 * data_final.json에서 MySQL 데이터베이스로 데이터 마이그레이션 스크립트
 *
 * 사용법:
 * 1. MySQL 데이터베이스 연결 정보를 설정하세요 (아래 config 객체)
 * 2. npm install mysql2 (필요시)
 * 3. node database/migrate.js
 */

require("dotenv").config();
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

// 데이터베이스 연결 설정
const config = {
  host: process.env.DB_HOST || "playfram",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "play_farm",
  charset: "utf8mb4",
};

// data_final.json 파일 경로
const dataFilePath = path.join(__dirname, "../src/data_final.json");

/**
 * 날짜 문자열을 DATE 형식으로 변환 (YYYYMMDD -> YYYY-MM-DD)
 */
function formatDate(dateStr) {
  if (!dateStr || dateStr === "null" || dateStr === null) return null;
  const str = String(dateStr);
  if (str.length === 8) {
    return `${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(6, 8)}`;
  }
  return null;
}

/**
 * PROGRAM_NM을 JSON 문자열로 변환 (배열인 경우)
 */
function formatProgramNm(programNm) {
  if (Array.isArray(programNm)) {
    return JSON.stringify(programNm);
  }
  return String(programNm);
}

/**
 * PROGRAM_TYPE을 배열로 정규화
 */
function normalizeProgramType(programType) {
  if (Array.isArray(programType)) {
    return programType;
  }
  if (programType && typeof programType === "string") {
    return [programType];
  }
  return [];
}

/**
 * 데이터 마이그레이션 실행
 */
async function migrate() {
  let connection;

  try {
    // 데이터베이스 연결
    console.log("데이터베이스 연결 중...");
    connection = await mysql.createConnection(config);
    console.log("데이터베이스 연결 성공");

    // data_final.json 파일 읽기
    console.log("데이터 파일 읽기 중...");
    const dataFile = fs.readFileSync(dataFilePath, "utf8");
    const data = JSON.parse(dataFile);

    if (!data.DATA || !Array.isArray(data.DATA)) {
      throw new Error("데이터 형식이 올바르지 않습니다.");
    }

    // 48개만 사용
    const programsData = data.DATA.slice(0, 48);
    console.log(`총 ${programsData.length}개의 프로그램 데이터를 마이그레이션합니다.`);

    // 1단계: 프로그램 타입 추출 및 삽입
    console.log("\n1단계: 프로그램 타입 추출 및 삽입 중...");
    const programTypesSet = new Set();

    programsData.forEach((item) => {
      const types = normalizeProgramType(item.PROGRAM_TYPE);
      types.forEach((type) => {
        if (type && type.trim()) {
          programTypesSet.add(type.trim());
        }
      });
    });

    const programTypesMap = new Map();
    for (const typeName of programTypesSet) {
      const [result] = await connection.execute(
        "INSERT INTO program_types (type_name) VALUES (?) ON DUPLICATE KEY UPDATE type_name = type_name",
        [typeName]
      );

      // 타입 ID 조회
      const [rows] = await connection.execute("SELECT id FROM program_types WHERE type_name = ?", [typeName]);

      if (rows.length > 0) {
        programTypesMap.set(typeName, rows[0].id);
      }
    }

    console.log(`프로그램 타입 ${programTypesMap.size}개 삽입 완료`);

    // 2단계: 프로그램 데이터 삽입
    console.log("\n2단계: 프로그램 데이터 삽입 중...");
    let insertedCount = 0;

    for (const item of programsData) {
      try {
        const [result] = await connection.execute(
          `INSERT INTO programs (
            village_nm, program_nm, address, chrge, cn,
            reqst_bgnde, reqst_endde, use_time,
            hmpg_addr, max_personnel, min_personnel, reprsntv_nm, telno,
            refrnc, atpn, refine_wgs84_lat, refine_wgs84_logt,
            program_schedule, group_discount_info, cancellation_policy,
            operating_hours, data_source
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.VILLAGE_NM || null,
            formatProgramNm(item.PROGRAM_NM),
            item.ADDRESS || null,
            item.CHRGE || null,
            item.CN || null,
            formatDate(item.REQST_BGNDE),
            formatDate(item.REQST_ENDDE),
            item.USE_TIME || null,
            item.HMPG_ADDR || null,
            item.MAX_PERSONNEL ? parseInt(item.MAX_PERSONNEL) : null,
            item.MIN_PERSONNEL ? parseInt(item.MIN_PERSONNEL) : null,
            item.REPRSNTV_NM || null,
            item.TELNO || null,
            item.REFRNC || null,
            item.ATPN || null,
            item.REFINE_WGS84_LAT || null,
            item.REFINE_WGS84_LOGT || null,
            item.PROGRAM_SCHEDULE || null,
            item.GROUP_DISCOUNT_INFO || null,
            item.CANCELLATION_POLICY || null,
            item.OPERATING_HOURS || null,
            item.DATA || null,
          ]
        );

        const programId = result.insertId;

        // 3단계: 프로그램-타입 관계 삽입
        const types = normalizeProgramType(item.PROGRAM_TYPE);
        for (const typeName of types) {
          if (typeName && typeName.trim()) {
            const typeId = programTypesMap.get(typeName.trim());
            if (typeId) {
              await connection.execute(
                "INSERT IGNORE INTO program_program_types (program_id, program_type_id) VALUES (?, ?)",
                [programId, typeId]
              );
            }
          }
        }

        // 4단계: 이미지 데이터 삽입
        if (item.IMAGES && Array.isArray(item.IMAGES)) {
          for (let i = 0; i < item.IMAGES.length; i++) {
            await connection.execute(
              "INSERT INTO program_images (program_id, image_url, display_order) VALUES (?, ?, ?)",
              [programId, item.IMAGES[i], i]
            );
          }
        }

        insertedCount++;
        if (insertedCount % 10 === 0) {
          console.log(`  ${insertedCount}/${programsData.length} 진행 중...`);
        }
      } catch (error) {
        console.error(`프로그램 삽입 실패:`);
        console.error(`  프로그램명: ${formatProgramNm(item.PROGRAM_NM)}`);
        console.error(`  마을명: ${item.VILLAGE_NM}`);
        console.error(`  에러 메시지: ${error.message}`);
        console.error(`  전체 에러:`, error);
      }
    }

    console.log(`\n총 ${insertedCount}개의 프로그램 데이터 삽입 완료`);

    // 통계 출력
    const [programCount] = await connection.execute("SELECT COUNT(*) as count FROM programs");
    const [typeCount] = await connection.execute("SELECT COUNT(*) as count FROM program_types");
    const [imageCount] = await connection.execute("SELECT COUNT(*) as count FROM program_images");
    const [relationCount] = await connection.execute("SELECT COUNT(*) as count FROM program_program_types");

    console.log("\n=== 마이그레이션 완료 ===");
    console.log(`프로그램: ${programCount[0].count}개`);
    console.log(`프로그램 타입: ${typeCount[0].count}개`);
    console.log(`프로그램-타입 관계: ${relationCount[0].count}개`);
    console.log(`이미지: ${imageCount[0].count}개`);
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
  migrate().catch(console.error);
}

module.exports = { migrate };
