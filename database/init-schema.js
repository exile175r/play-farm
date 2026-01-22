const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function initSchema() {
  const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 4000,
    ssl: {
      rejectUnauthorized: true,
    },
  };

  let connection;
  try {
    console.log('TiDB Cloud 연결 시도 중...');
    connection = await mysql.createConnection(config);
    console.log('연결 성공. 스키마 초기화 시작...');

    const schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`schema.sql 파일을 찾을 수 없습니다: ${schemaPath}`);
    }
    const sqlContent = fs.readFileSync(schemaPath, 'utf8');

    // 1. 주석 제거 (줄 단위)
    const cleanedSql = sqlContent
      .split('\n')
      .map(line => line.split('--')[0].trim()) // 주석 뒤 내용 제거
      .join(' ');

    // 2. 세미콜론(;)으로 분리
    const statements = cleanedSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`총 ${statements.length}개의 SQL 문장을 각각 실행합니다...`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await connection.execute(stmt);
        // 테이블 이름 추출 (로그용)
        const match = stmt.match(/create table if not exists `([^`]+)`/i);
        const tableName = match ? match[1] : 'SQL statement';
        console.log(`[${i + 1}/${statements.length}] 성공: ${tableName}`);
      } catch (err) {
        console.error(`[${i + 1}/${statements.length}] 실패:`, err.message);
        console.error('실패한 SQL:', stmt);
        throw err; // 하나라도 실패하면 중단
      }
    }

    console.log('\n모든 테이블이 성공적으로 생성되었습니다! 🎉');

  } catch (error) {
    console.error('\n초기화 프로세스 오류:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('연결 종료');
    }
  }
}

initSchema();
