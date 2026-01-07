/**
 * MySQL 데이터베이스로 공지사항 데이터 마이그레이션 스크립트
 *
 * 사용법:
 * 1. MySQL 데이터베이스 연결 정보를 설정하세요 (.env 파일)
 * 2. node database/migrateNotices.js
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

// 공지사항 샘플 데이터
const noticesData = [
  {
    title: "[안내] 플레이팜 시스템 정기 점검 안내",
    content: "안녕하세요, 플레이팜입니다.\n\n더 안정적인 서비스 제공을 위해 다음과 같이 시스템 점검이 진행될 예정입니다.\n\n■ 점검 일시: 2026년 2월 1일(일) 02:00 ~ 06:00 (약 4시간)\n■ 점검 내용: 데이터베이스 보안 업데이트 및 시스템 안정화 작업\n■ 이용 영향: 점검 시간 내 홈페이지 및 예약 서비스 이용 불가\n\n이용에 불편을 드려 죄송합니다. 더욱 노력하는 플레이팜이 되겠습니다.\n감사합니다.",
    is_important: 1
  },
  {
    title: "신규 체험 마을 '해피팜' 오픈 기념 이벤트 안내",
    content: "새로운 가족, '해피팜'이 플레이팜과 함께하게 되었습니다!\n\n오픈을 기념하여 해피팜 체험 프로그램 예약 시 포인트 2배 적립 이벤트를 진행하오니 많은 참여 부탁드립니다.\n\n자세한 내용은 이벤트 페이지를 확인해 주세요.",
    is_important: 0
  },
  {
    title: "동절기 체험 시 주의사항 및 운영 시간 변경 안내",
    content: "겨울철 기온 저하에 따른 체험객 여러분의 안전을 위해 동절기 운영 시간이 다음과 같이 변경됩니다.\n\n■ 변경 기간: 12월 ~ 2월 말\n■ 운영 시간: 10:00 ~ 16:00 (기존 18:00에서 2시간 단축)\n\n또한, 체험 시 따뜻한 복장을 준비해 주시기 바랍니다.\n감사합니다.",
    is_important: 1
  },
  {
    title: "[공지] 개인정보처리방침 개정 안내",
    content: "플레이팜 개인정보처리방침이 2026년 1월 15일부로 개정될 예정입니다.\n\n주요 개정 내용 및 상세 사항은 본 공지사항 하단의 링크를 통해 확인하실 수 있습니다.\n\n본 개정에 동의하지 않으시는 경우 회원 탈퇴를 요청하실 수 있으며, 별도의 의사표시가 없는 경우 개정된 방침에 동의하신 것으로 간주됩니다.",
    is_important: 0
  },
  {
    title: "플레이팜 앱(APP) 출시 안내",
    content: "언제 어디서나 간편하게! 플레이팜 공식 앱이 출시되었습니다.\n\n구글 플레이스토어 및 앱스토어에서 '플레이팜'을 검색하여 다운로드해 보세요.\n앱 출시 기념 1,000 포인트 적립 이벤트도 놓치지 마세요!",
    is_important: 0
  }
];

async function migrateNotices() {
  let connection;
  try {
    console.log('데이터베이스 연결 중...');
    connection = await mysql.createConnection(config);
    console.log('데이터베이스 연결 성공\n');

    console.log('공지사항 데이터 마이그레이션 시작...');

    // 기존 데이터 삭제 (선택 사항, 필요에 따라 주석 처리 가능)
    // await connection.query("DELETE FROM notices");

    for (const notice of noticesData) {
      await connection.query(
        `INSERT INTO notices (title, content, is_important, created_at)
         VALUES (?, ?, ?, NOW())`,
        [notice.title, notice.content, notice.is_important]
      );
      console.log(`공지사항 [${notice.title.substring(0, 20)}...] 업로드 완료`);
    }

    console.log('\n공지사항 데이터 마이그레이션 완료!');
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

migrateNotices();
