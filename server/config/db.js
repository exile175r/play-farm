const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '',
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || '',
  charset: 'utf8mb4',
  waitForConnections: true, // 연결 풀에 사용 가능한 연결이 없을 때 대기 여부
  connectionLimit: 10, // 풀에서 동시에 유지할 최대 연결 수
  queueLimit: 0 // 대기 큐에 허용할 최대 요청 수 (0: 무제한, 양수: 해당 수만큼만 대기, 초과 시 에러)
});

// 연결 풀 테스트
pool.getConnection()
  .then(connection => {
    console.log('데이터베이스 연결 성공');
    connection.release();
  })
  .catch(err => {
    console.error('데이터베이스 연결 실패:', err);
  });

module.exports = pool;