/**
 * eventData.js에서 MySQL 데이터베이스로 이벤트 데이터 마이그레이션 스크립트
 *
 * 사용법:
 * 1. MySQL 데이터베이스 연결 정보를 설정하세요 (.env 파일)
 * 2. npm install mysql2 (필요시)
 * 3. node database/migrateEvents.js
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mysql = require("mysql2/promise");

// 데이터베이스 연결 설정
const config = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "play_farm",
  charset: "utf8mb4",
};

// 프론트엔드 eventData.js의 데이터
const eventsData = [
  {
    id: 1,
    status: '진행중',
    image: '/images/events/event (1).png',
  },
  {
    id: 2,
    status: '종료',
    image: '/images/events/event (2).png',
  },
  {
    id: 3,
    status: '진행중',
    image: '/images/events/event (3).png',
  },
  {
    id: 4,
    status: '진행중',
    image: '/images/events/event (4).png',
  },
  {
    id: 5,
    status: '진행중',
    image: '/images/events/event (5).png',
  },
];

async function migrateEvents() {
  let connection;
  try {
    console.log('데이터베이스 연결 중...');
    connection = await mysql.createConnection(config);
    console.log('데이터베이스 연결 성공\n');

    console.log('이벤트 데이터 마이그레이션 시작...');

    for (const event of eventsData) {
      // 상태 변환: '진행중' -> 'ONGOING', '종료' -> 'ENDED'
      let dbStatus = 'ONGOING';
      if (event.status === '종료') {
        dbStatus = 'ENDED';
      }

      // 기본값 설정
      const title = `이벤트 ${event.id}`;
      const position = '메인 배너';
      const startDate = '2025-01-01'; // 기본 시작일
      const endDate = '2025-12-31'; // 기본 종료일

      await connection.query(
        `INSERT INTO events (id, title, position, start_date, end_date, status, image_url, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           title = VALUES(title),
           position = VALUES(position),
           start_date = VALUES(start_date),
           end_date = VALUES(end_date),
           status = VALUES(status),
           image_url = VALUES(image_url)`,
        [event.id, title, position, startDate, endDate, dbStatus, event.image]
      );

      console.log(`이벤트 ID ${event.id} 마이그레이션 완료`);
    }

    console.log('\n이벤트 데이터 마이그레이션 완료!');
  } catch (error) {
    console.error('마이그레이션 실패:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('데이터베이스 연결 종료');
    }
  }
}

migrateEvents();