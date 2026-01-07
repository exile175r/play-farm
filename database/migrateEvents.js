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
    title: '겨울바람, 따뜻한 추억', // Internal title or main title
    subtitle: '겨울 시즌 특별 이벤트', // Subtitle
    description: '겨울 시즌을 맞아 플레이팜에서 특별한 이벤트를 준비했습니다.\n가족과 함께 따뜻한 추억을 만들어보세요.',
    startDate: '2025-12-01',
    endDate: '2025-12-31'
  },
  {
    id: 2,
    status: '종료',
    image: '/images/events/event (2).png',
    title: '가을 수확 체험',
    subtitle: '가을 수확 체험 종료',
    description: '지난 시즌 많은 사랑을 받았던 체험 프로그램이 종료되었습니다.\n다음 시즌에 더 좋은 모습으로 찾아뵙겠습니다.',
    startDate: '2025-09-01',
    endDate: '2025-11-30'
  },
  {
    id: 3,
    status: '진행중',
    image: '/images/events/event (3).png',
    title: '신규 가입 혜택',
    subtitle: '신규 가입 웰컴 이벤트',
    description: '신규 회원가입 시 2,000 포인트를 즉시 지급해 드립니다.\n지금 바로 가입하고 혜택을 받아보세요!',
    startDate: '2025-01-01',
    endDate: '2025-12-31'
  },
  {
    id: 4,
    status: '진행중',
    image: '/images/events/event (4).png',
    title: '리뷰 이벤트',
    subtitle: '베스트 리뷰어 도전',
    description: '리뷰를 작성해주신 분들 중 추첨을 통해 선물을 드립니다.\n정성스러운 후기를 남겨주세요.',
    startDate: '2025-01-01',
    endDate: '2025-12-31'
  },
  {
    id: 5,
    status: '진행중',
    image: '/images/events/event (5).png',
    title: '겨울방학 특강',
    subtitle: '주말 반짝 할인', // User requested "Top title is subtitle" -> "주말 반짝 할인"
    description: '주말 한정 특별 할인 이벤트가 진행됩니다.\n최대 30% 할인된 가격으로 체험을 즐겨보세요.',
    startDate: '2025-12-01',
    endDate: '2025-12-31'
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

      // 기본값 설정 (데이터가 없으면 기본값 사용)
      const title = event.title || `이벤트 ${event.id}`;
      const subtitle = event.subtitle || '';
      const description = event.description || '';
      const position = '메인 배너';
      const startDate = event.startDate || '2025-01-01';
      const endDate = event.endDate || '2025-12-31';

      await connection.query(
        `INSERT INTO events (id, title, subtitle, description, position, start_date, end_date, status, image_url, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           title = VALUES(title),
           subtitle = VALUES(subtitle),
           description = VALUES(description),
           position = VALUES(position),
           start_date = VALUES(start_date),
           end_date = VALUES(end_date),
           status = VALUES(status),
           image_url = VALUES(image_url)`,
        [event.id, title, subtitle, description, position, startDate, endDate, dbStatus, event.image]
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