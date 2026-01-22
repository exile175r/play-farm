/**
 * play-farm 데이터 마이그레이션 통합 스크립트
 * 
 * 포함된 데이터:
 * 1. 프로그램 (공공 데이터 기반)
 * 2. 이벤트
 * 3. FAQ
 * 4. 공지사항
 * 5. 상품 및 옵션
 *
 * 사용법:
 * node database/migrate.js
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mysql = require("mysql2/promise");
const fs = require("fs");

// 데이터베이스 연결 설정
const config = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "play_farm",
  port: process.env.DB_PORT || 4000,
  ssl: {
    rejectUnauthorized: true,
  },
  charset: "utf8mb4",
};

// 파일 경로 설정
const dataFilePath = path.join(__dirname, "../src/data_final.json");
const storeDataPath = path.join(__dirname, "../src/components/data/StoreData.js");

// --- 유틸리티 함수 ---

function formatDate(dateStr) {
  if (!dateStr || dateStr === "null" || dateStr === null) return null;
  const str = String(dateStr);
  if (str.length === 8) {
    return `${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(6, 8)}`;
  }
  return null;
}

function formatProgramNm(programNm) {
  if (Array.isArray(programNm)) {
    return JSON.stringify(programNm);
  }
  return String(programNm);
}

function normalizeProgramType(programType) {
  if (Array.isArray(programType)) return programType;
  if (programType && typeof programType === "string") return [programType];
  return [];
}

function normalizeImagePath(imagePath) {
  if (!imagePath) return null;
  return imagePath;
}

function extractStoreData() {
  if (!fs.existsSync(storeDataPath)) {
    console.warn(`경고: ${storeDataPath} 파일을 찾을 수 없습니다.`);
    return [];
  }
  const fileContent = fs.readFileSync(storeDataPath, "utf8");
  const processedContent = fileContent.replace(/getImagePath\(["']([^"']+)["']\)/g, '"$1"');
  const shopDataMatch = processedContent.match(/const shopData = (\[[\s\S]*?\]);/);
  if (!shopDataMatch) return [];
  try {
    return eval(shopDataMatch[1]);
  } catch (e) {
    console.error("StoreData 파싱 실패:", e);
    return [];
  }
}

// --- 마이그레이션 초기화 로직 ---

/**
 * 0. 기존 데이터 초기화
 */
async function resetDatabase(connection) {
  console.log("\n--- 기존 데이터 초기화 시작 ---");
  await connection.query("SET FOREIGN_KEY_CHECKS = 0");

  const tables = [
    "program_program_types",
    "program_images",
    "program_types",
    "programs",
    "events",
    "faqs",
    "notices",
    "product_options",
    "products"
  ];

  for (const table of tables) {
    await connection.query(`TRUNCATE TABLE ${table}`);
  }

  await connection.query("SET FOREIGN_KEY_CHECKS = 1");
  console.log("기존 데이터 초기화 완료");
}

// --- 각 마이그레이션 로직 ---

/**
 * 1. 프로그램 데이터 마이그레이션
 */
async function migratePrograms(connection) {
  console.log("\n--- 프로그램 데이터 마이그레이션 시작 ---");

  if (!fs.existsSync(dataFilePath)) {
    console.warn("데이터 파일을 찾을 수 없어 프로그램을 건너뜁니다.");
    return;
  }

  const dataFile = fs.readFileSync(dataFilePath, "utf8");
  const data = JSON.parse(dataFile);

  if (!data.DATA || !Array.isArray(data.DATA)) {
    throw new Error("프로그램 데이터 형식이 올바르지 않습니다.");
  }

  const programsData = data.DATA.slice(0, 48);
  console.log(`총 ${programsData.length}개의 프로그램 데이터 처리 중...`);

  // 프로그램 타입 처리
  const programTypesSet = new Set();
  programsData.forEach((item) => {
    const types = normalizeProgramType(item.PROGRAM_TYPE);
    types.forEach((type) => {
      if (type && type.trim()) programTypesSet.add(type.trim());
    });
  });

  const programTypesMap = new Map();
  for (const typeName of programTypesSet) {
    await connection.execute(
      "INSERT INTO program_types (type_name) VALUES (?) ON DUPLICATE KEY UPDATE type_name = type_name",
      [typeName]
    );
    const [rows] = await connection.execute("SELECT id FROM program_types WHERE type_name = ?", [typeName]);
    if (rows.length > 0) programTypesMap.set(typeName, rows[0].id);
  }

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

      // 관계 삽입
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

      // 이미지 삽입
      if (item.IMAGES && Array.isArray(item.IMAGES)) {
        for (let i = 0; i < item.IMAGES.length; i++) {
          await connection.execute(
            "INSERT INTO program_images (program_id, image_url, display_order) VALUES (?, ?, ?)",
            [programId, item.IMAGES[i], i]
          );
        }
      }

      insertedCount++;
    } catch (error) {
      console.error(`프로그램 삽입 실패 (${item.VILLAGE_NM}):`, error.message);
    }
  }
  console.log(`프로그램 마이그레이션 완료: ${insertedCount}개 삽입`);
}

/**
 * 2. 이벤트 데이터 마이그레이션
 */
async function migrateEvents(connection) {
  console.log("\n--- 이벤트 데이터 마이그레이션 시작 ---");
  const eventsData = [
    { id: 1, status: '진행중', image: '/images/events/event (1).png', title: '겨울바람, 따뜻한 추억', subtitle: '겨울 시즌 특별 이벤트', description: '겨울 시즌을 맞아 플레이팜에서 특별한 이벤트를 준비했습니다.\n가족과 함께 따뜻한 추억을 만들어보세요.', startDate: '2025-12-01', endDate: '2025-12-31' },
    { id: 2, status: '종료', image: '/images/events/event (2).png', title: '가을 수확 체험', subtitle: '가을 수확 체험 종료', description: '지난 시즌 많은 사랑을 받았던 체험 프로그램이 종료되었습니다.\n다음 시즌에 더 좋은 모습으로 찾아뵙겠습니다.', startDate: '2025-09-01', endDate: '2025-11-30' },
    { id: 3, status: '진행중', image: '/images/events/event (3).png', title: '신규 가입 혜택', subtitle: '신규 가입 웰컴 이벤트', description: '신규 회원가입 시 2,000 포인트를 즉시 지급해 드립니다.\n지금 바로 가입하고 혜택을 받아보세요!', startDate: '2025-01-01', endDate: '2025-12-31' },
    { id: 4, status: '진행중', image: '/images/events/event (4).png', title: '리뷰 이벤트', subtitle: '베스트 리뷰어 도전', description: '리뷰를 작성해주신 분들 중 추첨을 통해 선물을 드립니다.\n정성스러운 후기를 남겨주세요.', startDate: '2025-01-01', endDate: '2025-12-31' },
    { id: 5, status: '진행중', image: '/images/events/event (5).png', title: '겨울방학 특강', subtitle: '주말 반짝 할인', description: '주말 한정 특별 할인 이벤트가 진행됩니다.\n최대 30% 할인된 가격으로 체험을 즐겨보세요.', startDate: '2025-12-01', endDate: '2025-12-31' },
  ];

  for (const event of eventsData) {
    let dbStatus = event.status === '종료' ? 'ENDED' : 'ONGOING';
    await connection.query(
      `INSERT INTO events (id, title, subtitle, description, position, start_date, end_date, status, image_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE title = VALUES(title), subtitle = VALUES(subtitle), description = VALUES(description), 
       position = VALUES(position), start_date = VALUES(start_date), end_date = VALUES(end_date), status = VALUES(status), image_url = VALUES(image_url)`,
      [event.id, event.title, event.subtitle, event.description, '메인 배너', event.startDate, event.endDate, dbStatus, event.image]
    );
  }
  console.log(`이벤트 마이그레이션 완료: ${eventsData.length}개 처리`);
}

/**
 * 3. FAQ 데이터 마이그레이션
 */
async function migrateFaqs(connection) {
  console.log("\n--- FAQ 데이터 마이그레이션 시작 ---");
  const faqsData = [
    { category: "예약", question: "예약은 어떻게 하나요?", answer: "체험 프로그램 상세 페이지에서 원하시는 날짜와 인원을 선택하신 후 '예약하기' 버튼을 클릭해 주세요. 결제가 완료되면 예약 확정 문자가 발송됩니다.", display_order: 1 },
    { category: "예약", question: "단체 예약도 가능한가요?", answer: "10인 이상의 단체 예약은 별도의 상담이 필요할 수 있습니다. 각 체험 마을 상세 페이지의 연락처로 직접 문의하시거나, 고객센터로 연락 주시면 상세히 안내해 드리겠습니다.", display_order: 2 },
    { category: "결제", question: "어떤 결제 수단을 사용할 수 있나요?", answer: "신용카드(앱카드 포함), 카카오페이, 네이버페이, 실시간 계좌이체 등 다양한 결제 수단을 이용하실 수 있습니다.", display_order: 3 },
    { category: "취소/환불", question: "예약 취소 및 환불 규정은 어떻게 되나요?", answer: "체험일 3일 전까지 취소 시 100% 환불, 2일 전 70%, 1일 전 50% 환불이 가능합니다. 체험 당일 취소는 환불이 어려운 점 양해 부탁드립니다.", display_order: 4 },
    { category: "회원정보", question: "비밀번호를 잊어버렸습니다.", answer: "로그인 페이지 하단의 '비밀번호 찾기' 기능을 이용해 주세요. 가입 시 등록하신 이메일 또는 휴대폰 번호 인증을 통해 임시 비밀번호를 발급받으실 수 있습니다.", display_order: 5 },
    { category: "이용안내", question: "비회원도 예약할 수 있나요?", answer: "플레이팜은 회원제로 운영되고 있어 로그인이 필요합니다. 간편한 소셜 로그인(카카오, 네이버)을 이용하시면 1초 만에 가입하고 예약하실 수 있습니다.", display_order: 6 }
  ];

  for (const faq of faqsData) {
    await connection.query(
      `INSERT INTO faqs (category, question, answer, display_order, created_at) VALUES (?, ?, ?, ?, NOW())`,
      [faq.category, faq.question, faq.answer, faq.display_order]
    );
  }
  console.log(`FAQ 마이그레이션 완료: ${faqsData.length}개 처리`);
}

/**
 * 4. 공지사항 데이터 마이그레이션
 */
async function migrateNotices(connection) {
  console.log("\n--- 공지사항 데이터 마이그레이션 시작 ---");
  const noticesData = [
    {
      title: "[안내] 플레이팜 시스템 정기 점검 안내",
      content: "안녕하세요, 플레이팜입니다.\n보다 안정적인 서비스 제공을 위해 시스템 정기 점검이 진행될 예정입니다.\n\n점검 시간 동안에는 서비스 이용이 일시 중단되오니 이용에 참고하시기 바랍니다.\n\n■ 점검 일시: 2026년 1월 15일(목) 02:00 ~ 06:00 (약 4시간)\n■ 점검 영향: 플레이팜 모바일 앱 및 웹 서비스 전체 이용 불가\n\n더 나은 서비스를 제공하기 위해 최선을 다하겠습니다.\n감사합니다.",
      is_important: 1
    },
    {
      title: "신규 체험 마을 '해피팜' 오픈 기념 이벤트 안내",
      content: "새로운 체험 마을 '해피팜'이 플레이팜에 합류하게 되었습니다!\n\n오픈을 기념하여 해피팜의 모든 체험 프로그램을 20% 할인된 가격으로 만나보실 수 있는 특별 이벤트를 진행합니다.\n\n■ 이벤트 기간: 2026년 1월 10일 ~ 2월 9일\n■ 대상: 해피팜 예약 고객 전체\n■ 혜택: 체험 비용 20% 즉시 할인\n\n푸른 자연 속 꿈같은 휴식을 제공하는 해피팜에서 즐거운 추억을 만들어보세요.\n많은 관심과 참여 부탁드립니다.",
      is_important: 0
    },
    {
      title: "동절기 체험 시 주의사항 및 운영 시간 변경 안내",
      content: "겨울철 기온 하강에 따른 체험 프로그램 운영 시간 변경 및 주의사항을 안내해 드립니다.\n\n일부 야외 체험의 경우 안전을 위해 운영 시간이 단축되거나 실내 프로그램으로 대체될 수 있습니다.\n\n■ 변경 기간: 2025년 12월 ~ 2026년 2월\n■ 주의사항:\n- 체험 전 방한복 및 장갑을 꼭 착용해 주세요.\n- 야외 이동 시 빙판길에 주의하시기 바랍니다.\n- 체험 마을별 상세 운영 시간은 상세 페이지를 확인해 주세요.\n\n건강하고 안전한 겨울 체험 되시길 바랍니다.",
      is_important: 1
    },
    {
      title: "[공지] 개인정보처리방침 개정 안내",
      content: "플레이팜을 이용해 주시는 회원 여러분께 감사드립니다.\n회원님의 소중한 개인정보를 보호하기 위해 개인정보처리방침이 다음과 같이 개정될 예정입니다.\n\n■ 개정 사유: 신규 서비스 추가에 따른 수입/이용 항목 변경\n■ 시행 일자: 2026년 2월 1일\n■ 주요 변경 내용:\n- 위치 기반 서비스 제공을 위한 수집 항목 추가\n- 제3자 제공 업체 정보 최신화\n\n개정된 내용은 시행일부터 효력이 발생하며, 거부 의사를 표시하지 않으실 경우 승인하신 것으로 간주됩니다.\n궁금하신 사항은 고객센터로 문의해 주세요.",
      is_important: 0
    },
    {
      title: "플레이팜 앱(APP) 출시 안내",
      content: "드디어 플레이팜 공식 모바일 앱이 출시되었습니다!\n\n이제 언제 어디서나 편리하게 전국의 체험 마을을 예약하고 관리하세요.\n\n■ 주요 기능:\n- 위치 기반 내 주변 체험 마을 추천\n- 실시간 예약 확정 및 알림 알림\n- 앱 전용 특가 및 쿠폰 혜택\n\n지금 구글 플레이스토어와 애플 앱스토어에서 '플레이팜'을 검색해 다운로드 받으실 수 있습니다.\n\n앱 출시 기념 3,000원 할인 쿠폰 증정 이벤트도 진행 중이니 놓치지 마세요!",
      is_important: 0
    },
    {
      title: "이용안내",
      content: "이용안내 개요\n\nPlayFarm은 농촌 체험 프로그램 예약 및 상품 구매 서비스를 제공하는 웹 플랫폼입니다.\n사용자는 회원가입 후 다양한 체험 프로그램을 탐색하고, 예약 및 상품 구매 기능을 이용할 수 있습니다.\n\n본 이용안내는 PlayFarm 서비스의 주요 기능과 이용 절차를 안내하여,\n사용자가 서비스를 보다 원활하게 이용할 수 있도록 돕기 위해 작성되었습니다.\n\n회원가입 및 로그인 안내\n\nPlayFarm 서비스 이용을 위해 회원가입이 필요합니다.\n이메일과 비밀번호를 입력하여 계정을 생성할 수 있으며,\n회원가입 완료 후 로그인 시 모든 서비스 기능을 이용하실 수 있습니다.\n\n비회원의 경우 체험 예약 및 상품 구매 기능 이용에 제한이 있습니다.\n\n체험 프로그램 이용 안내\n사용자는 체험 프로그램 목록 페이지에서 다양한 농촌 체험 프로그램을 확인하실 수 있습니다.\n카테고리 및 필터 기능을 활용하여 원하는 프로그램을 쉽게 탐색할 수 있으며,\n프로그램 카드를 클릭하면 상세 페이지로 이동합니다.\n\n상세 페이지에서는 체험 일정, 가격, 참여 가능 인원 등의 정보를 확인하실 수 있습니다.\n\n체험 예약 진행 방법\n\n체험 프로그램 상세 페이지에서 원하는 일정과 인원을 선택한 후 예약을 진행하실 수 있습니다.\n예약 버튼 클릭 시 예약이 생성되며, 예약 완료 후 마이페이지에서 예약 내역을 확인하실 수 있습니다.\n\n예약 상태는 서비스 운영 정책에 따라 변경될 수 있습니다.\n\n상품 구매 및 장바구니 이용 안내\n\nPlayFarm에서는 농촌 체험과 연계된 상품을 구매하실 수 있습니다.\n상품은 장바구니에 담아 수량을 조절하실 수 있으며,\n장바구니에서 총 결제 금액을 확인한 후 결제를 진행하실 수 있습니다.\n\n마이페이지 이용 안내\n\n마이페이지에서는 사용자의 체험 예약 내역과 상품 구매 내역을 확인하실 수 있습니다.\n예약 상태 확인을 통해 체험 진행 여부를 쉽게 파악하실 수 있으며,\n개인 정보 확인 기능을 제공합니다.\n\n관리자 페이지 이용 안내\n\n관리자 페이지는 PlayFarm 서비스 운영을 위한 전용 관리 화면입니다.\n관리자는 체험 프로그램, 상품, 예약, 사용자 정보를 관리할 수 있으며,\n등록·수정·삭제(CRUD) 기능을 통해 서비스 운영 전반을 관리합니다.\n\n이용 시 유의사항\n\n체험 프로그램 예약은 일정 및 인원 제한에 따라 제한될 수 있습니다.\n예약 내역은 마이페이지에서 반드시 확인하시기 바랍니다.\n관리자 승인 또는 상태 변경에 따라 예약 상태가 변경될 수 있습니다.\n서비스 이용 중 오류가 발생할 경우 관리자에게 문의해 주시기 바랍니다.\n\n이용안내 요약\n\nPlayFarm은 간단한 절차를 통해 농촌 체험 프로그램 예약과 상품 구매가 가능한 서비스입니다.\n본 이용안내를 통해 서비스 이용 흐름을 이해하시고,\n보다 편리하고 안정적인 서비스 이용을 기대하실 수 있습니다.",
      is_important: 0
    }
  ];

  for (const notice of noticesData) {
    await connection.query(
      `INSERT INTO notices (title, content, is_important, created_at) VALUES (?, ?, ?, NOW())`,
      [notice.title, notice.content, notice.is_important]
    );
  }
  console.log(`공지사항 마이그레이션 완료: ${noticesData.length}개 처리`);
}

/**
 * 5. 상품 데이터 마이그레이션
 */
async function migrateProducts(connection) {
  console.log("\n--- 상품 데이터 마이그레이션 시작 ---");
  const shopData = extractStoreData();
  if (shopData.length === 0) {
    console.warn("상품 데이터가 없어 상품 마이그레이션을 건너뜁니다.");
    return;
  }

  let insertedCount = 0;
  for (const product of shopData) {
    try {
      let basePrice = 0;
      if (product.options && product.options.length > 0) {
        basePrice = Math.min(...product.options.map(opt => Number(opt.price || 0)));
      } else if (product.price) {
        basePrice = Number(product.price);
      }

      const [result] = await connection.execute(
        `INSERT INTO products (name, description, category, image_url, base_price, is_active, stock_quantity)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [product.name || "", product.desc || product.description || null, product.category || null, normalizeImagePath(product.image), basePrice, true, 100]
      );

      const productId = result.insertId;

      if (product.options && Array.isArray(product.options)) {
        for (let i = 0; i < product.options.length; i++) {
          const option = product.options[i];
          await connection.execute(
            `INSERT INTO product_options (product_id, option_id, label, amount, unit, unit_price, price, stock_quantity, display_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [productId, option.id || `option_${i}`, option.label || "", option.amount || null, option.unit || null, Number(option.unitPrice || 0), Number(option.price || 0), 100, i]
          );
        }
      }
      insertedCount++;
    } catch (error) {
      console.error(`상품 삽입 실패 (${product.name}):`, error.message);
    }
  }
  console.log(`상품 마이그레이션 완료: ${insertedCount}개 처리`);
}

// --- 메인 실행 함수 ---

async function runAllMigrations() {
  let connection;
  try {
    console.log("=== 플레이팜 통합 마이그레이션 시작 ===");
    connection = await mysql.createConnection(config);
    console.log("데이터베이스 연결 성공");

    // 초기화 실행
    await resetDatabase(connection);

    // 순차적으로 마이그레이션 실행
    await migratePrograms(connection);
    await migrateEvents(connection);
    await migrateFaqs(connection);
    await migrateNotices(connection);
    await migrateProducts(connection);

    console.log("\n=== 모든 마이그레이션이 완료되었습니다 ===");

    // 통계 출력 (선택사항)
    const [counts] = await connection.execute(`
      SELECT 'programs' as table_name, COUNT(*) as count FROM programs
      UNION SELECT 'events', COUNT(*) FROM events
      UNION SELECT 'faqs', COUNT(*) FROM faqs
      UNION SELECT 'notices', COUNT(*) FROM notices
      UNION SELECT 'products', COUNT(*) FROM products
    `);
    console.table(counts);

  } catch (error) {
    console.error("\n마이그레이션 중 오류 발생:", error);
  } finally {
    if (connection) {
      await connection.end();
      console.log("데이터베이스 연결 종료");
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  runAllMigrations().catch(console.error);
}

module.exports = { runAllMigrations };
