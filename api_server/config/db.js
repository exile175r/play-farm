const mysql = require('mysql2/promise');

// 환경 변수 필수 값 체크
const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingEnv = requiredEnv.filter(env => !process.env[env]);

if (missingEnv.length > 0) {
  console.error(`[DB 설정 오류] 필수 환경 변수가 누락되었습니다: ${missingEnv.join(', ')}`);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || '',
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || '',
  port: parseInt(process.env.DB_PORT) || 4000,
  ssl: {
    rejectUnauthorized: true // TiDB Cloud 연결을 위해 필수입니다!
  },
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 3,
  queueLimit: 0
});

// 연결 풀 테스트
pool.getConnection()
  .then(connection => {
    console.log('✅ 데이터베이스 연결 성공');
    connection.release();
  })
  .catch(err => {
    console.error('❌ 데이터베이스 연결 실패 상세 정보:');
    console.error('Code:', err.code);
    console.error('Message:', err.message);
  });

module.exports = pool;