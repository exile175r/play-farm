/**
 * MySQL 데이터베이스로 FAQ(자주 묻는 질문) 데이터 마이그레이션 스크립트
 *
 * 사용법:
 * 1. MySQL 데이터베이스 연결 정보를 설정하세요 (.env 파일)
 * 2. node database/migrateFaqs.js
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

// FAQ 샘플 데이터
const faqsData = [
  {
    category: "예약",
    question: "예약은 어떻게 하나요?",
    answer: "체험 프로그램 상세 페이지에서 원하시는 날짜와 인원을 선택하신 후 '예약하기' 버튼을 클릭해 주세요. 결제가 완료되면 예약 확정 문자가 발송됩니다.",
    display_order: 1
  },
  {
    category: "예약",
    question: "단체 예약도 가능한가요?",
    answer: "10인 이상의 단체 예약은 별도의 상담이 필요할 수 있습니다. 각 체험 마을 상세 페이지의 연락처로 직접 문의하시거나, 고객센터로 연락 주시면 상세히 안내해 드리겠습니다.",
    display_order: 2
  },
  {
    category: "결제",
    question: "어떤 결제 수단을 사용할 수 있나요?",
    answer: "신용카드(앱카드 포함), 카카오페이, 네이버페이, 실시간 계좌이체 등 다양한 결제 수단을 이용하실 수 있습니다.",
    display_order: 3
  },
  {
    category: "취소/환불",
    question: "예약 취소 및 환불 규정은 어떻게 되나요?",
    answer: "체험일 3일 전까지 취소 시 100% 환불, 2일 전 70%, 1일 전 50% 환불이 가능합니다. 체험 당일 취소는 환불이 어려운 점 양해 부탁드립니다.",
    display_order: 4
  },
  {
    category: "회원정보",
    question: "비밀번호를 잊어버렸습니다.",
    answer: "로그인 페이지 하단의 '비밀번호 찾기' 기능을 이용해 주세요. 가입 시 등록하신 이메일 또는 휴대폰 번호 인증을 통해 임시 비밀번호를 발급받으실 수 있습니다.",
    display_order: 5
  },
  {
    category: "이용안내",
    question: "비회원도 예약할 수 있나요?",
    answer: "플레이팜은 회원제로 운영되고 있어 로그인이 필요합니다. 간편한 소셜 로그인(카카오, 네이버)을 이용하시면 1초 만에 가입하고 예약하실 수 있습니다.",
    display_order: 6
  }
];

async function migrateFaqs() {
  let connection;
  try {
    console.log('데이터베이스 연결 중...');
    connection = await mysql.createConnection(config);
    console.log('데이터베이스 연결 성공\n');

    console.log('FAQ 데이터 마이그레이션 시작...');

    // 기존 데이터 삭제 (선택 사항)
    // await connection.query("DELETE FROM faqs");

    for (const faq of faqsData) {
      await connection.query(
        `INSERT INTO faqs (category, question, answer, display_order, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [faq.category, faq.question, faq.answer, faq.display_order]
      );
      console.log(`FAQ [${faq.question.substring(0, 20)}...] 업로드 완료`);
    }

    console.log('\nFAQ 데이터 마이그레이션 완료!');
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

migrateFaqs();
