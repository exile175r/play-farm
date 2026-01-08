-- play-farm 데이터베이스 스키마
-- MySQL 5.7 이상 버전 지원

-- 데이터베이스 생성
-- CREATE DATABASE IF NOT EXISTS play_farm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE play_farm;

-- 1. programs 테이블 (메인 프로그램 테이블)
CREATE TABLE IF NOT EXISTS `programs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `village_nm` VARCHAR(255) NOT NULL COMMENT '체험마을명',
  `program_nm` TEXT NOT NULL COMMENT '체험프로그램명',
  `address` VARCHAR(500) COMMENT '주소',
  `chrge` VARCHAR(100) COMMENT '이용요금',
  `cn` TEXT COMMENT '세부사항',
  `reqst_bgnde` DATE COMMENT '신청시작일',
  `reqst_endde` DATE COMMENT '신청종료일',
  `status` ENUM('OPEN', 'CLOSED') DEFAULT 'OPEN' COMMENT '체험 상태',
  `use_time` VARCHAR(100) COMMENT '이용시간',
  `hmpg_addr` VARCHAR(500) COMMENT '홈페이지주소',
  `max_personnel` INT COMMENT '최대인원',
  `min_personnel` INT COMMENT '최소인원',
  `reprsntv_nm` VARCHAR(100) COMMENT '대표자명',
  `telno` VARCHAR(50) COMMENT '대표전화번호',
  `refrnc` TEXT COMMENT '문의처',
  `atpn` TEXT COMMENT '주의사항',
  `refine_wgs84_lat` DECIMAL(10, 8) COMMENT '위도',
  `refine_wgs84_logt` DECIMAL(11, 8) COMMENT '경도',
  `program_schedule` TEXT COMMENT '프로그램 일정',
  `group_discount_info` TEXT COMMENT '단체 할인 정보',
  `cancellation_policy` TEXT COMMENT '취소 정책',
  `operating_hours` VARCHAR(200) COMMENT '운영 시간',
  `data_source` VARCHAR(255) COMMENT '데이터 출처',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  INDEX `idx_village_nm` (`village_nm`),
  INDEX `idx_reqst_bgnde` (`reqst_bgnde`),
  INDEX `idx_reqst_endde` (`reqst_endde`),
  INDEX `idx_status` (`status`),
  INDEX `idx_location` (`refine_wgs84_lat`, `refine_wgs84_logt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='체험 프로그램 메인 테이블';

-- 2. program_types 테이블 (프로그램 타입 마스터)
CREATE TABLE IF NOT EXISTS `program_types` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `type_name` VARCHAR(100) NOT NULL UNIQUE COMMENT '프로그램 타입명',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='프로그램 타입 마스터 테이블';

-- 3. program_program_types 테이블 (다대다 관계)
CREATE TABLE IF NOT EXISTS `program_program_types` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `program_id` INT NOT NULL COMMENT '프로그램 ID',
  `program_type_id` INT NOT NULL COMMENT '프로그램 타입 ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`program_type_id`) REFERENCES `program_types`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_program_type` (`program_id`, `program_type_id`),
  INDEX `idx_program_id` (`program_id`),
  INDEX `idx_program_type_id` (`program_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='프로그램-프로그램타입 다대다 관계 테이블';

-- 4. program_images 테이블 (프로그램 이미지)
CREATE TABLE IF NOT EXISTS `program_images` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `program_id` INT NOT NULL COMMENT '프로그램 ID',
  `image_url` VARCHAR(500) NOT NULL COMMENT '이미지 URL 경로',
  `display_order` INT NOT NULL DEFAULT 0 COMMENT '표시 순서',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON DELETE CASCADE,
  INDEX `idx_program_display_order` (`program_id`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='프로그램 이미지 테이블';

-- 5. users 테이블 (회원 정보)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(50) NOT NULL UNIQUE COMMENT '사용자 아이디',
  `password` VARCHAR(255) NOT NULL COMMENT '비밀번호 (해시)',
  `name` VARCHAR(100) NOT NULL COMMENT '이름',
  `email` VARCHAR(255) NOT NULL UNIQUE COMMENT '이메일',
  `phone` VARCHAR(20) COMMENT '전화번호',
  `nickname` VARCHAR(50) COMMENT '닉네임',
  `profile_image` VARCHAR(500) COMMENT '프로필 이미지 경로',
  `region` VARCHAR(100) COMMENT '지역',
  `marketing_agree` BOOLEAN DEFAULT FALSE COMMENT '마케팅 동의 여부',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '가입일시',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  `last_login_at` TIMESTAMP NULL COMMENT '마지막 로그인 일시',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT '계정 활성화 여부',
  `points` INT DEFAULT 0 COMMENT '보유 포인트',
  INDEX `idx_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='회원 정보 테이블';

-- 6. reservations 테이블 (예약 정보)
CREATE TABLE IF NOT EXISTS `reservations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT '회원 ID',
  `program_id` INT NOT NULL COMMENT '프로그램 ID',
  `res_date` DATE NOT NULL COMMENT '예약일',
  `res_date_time` TIME NOT NULL COMMENT '예약시간',
  `personnel` INT NOT NULL COMMENT '예약 인원수',
  `status` ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending' COMMENT '예약 상태',
  `total_price` DECIMAL(10, 2) COMMENT '총 결제 금액',
  `memo` TEXT COMMENT '예약 메모',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '예약 생성일시',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  `cancelled_at` TIMESTAMP NULL COMMENT '취소일시',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_user_program_date_time` (`user_id`, `program_id`, `res_date`, `res_date_time`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_program_id` (`program_id`),
  INDEX `idx_res_date` (`res_date`),
  INDEX `idx_status` (`status`),
  INDEX `idx_user_program` (`user_id`, `program_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='예약 정보 테이블';

-- 7. bookmarks 테이블 (북마크 정보)
CREATE TABLE IF NOT EXISTS `bookmarks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT '회원 ID',
  `program_id` INT NOT NULL COMMENT '프로그램 ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '북마크 생성일시',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_user_program` (`user_id`, `program_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_program_id` (`program_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='북마크 정보 테이블';

-- 8. reviews 테이블 (후기 정보)
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT '회원 ID',
  `program_id` INT NULL COMMENT '프로그램 ID',
  `product_id` INT NULL COMMENT '상품 ID',
  `rating` TINYINT NOT NULL COMMENT '별점 (1-5)',
  `content` TEXT NOT NULL COMMENT '후기 내용',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '작성일시',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_program_id` (`program_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='후기 정보 테이블';

-- 9. review_images 테이블 (후기 이미지)
CREATE TABLE IF NOT EXISTS `review_images` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `review_id` INT NOT NULL COMMENT '후기 ID',
  `image_path` VARCHAR(500) NOT NULL COMMENT '이미지 파일 경로',
  `display_order` INT NOT NULL DEFAULT 0 COMMENT '표시 순서',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  FOREIGN KEY (`review_id`) REFERENCES `reviews`(`id`) ON DELETE CASCADE,
  INDEX `idx_review_display_order` (`review_id`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='후기 이미지 테이블';

-- 10. products 테이블 (상품 정보)
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL COMMENT '상품명',
  `description` TEXT COMMENT '상품 설명',
  `category` VARCHAR(100) COMMENT '카테고리',
  `image_url` VARCHAR(500) COMMENT '대표 이미지 URL',
  `base_price` DECIMAL(10, 2) DEFAULT 0 COMMENT '기본 가격 (옵션이 없을 경우)',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT '판매 여부',
  `stock_quantity` INT DEFAULT 0 COMMENT '재고 수량',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  INDEX `idx_category` (`category`),
  INDEX `idx_is_active` (`is_active`),
  INDEX `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='상품 정보 테이블';

-- 11. product_images 테이블 (상품 이미지)
CREATE TABLE IF NOT EXISTS `product_images` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL COMMENT '상품 ID',
  `image_url` VARCHAR(500) NOT NULL COMMENT '이미지 URL 경로',
  `display_order` INT NOT NULL DEFAULT 0 COMMENT '표시 순서',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  INDEX `idx_product_display_order` (`product_id`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='상품 이미지 테이블';

-- 12. product_options 테이블 (상품 옵션)
CREATE TABLE IF NOT EXISTS `product_options` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL COMMENT '상품 ID',
  `option_id` VARCHAR(100) NOT NULL COMMENT '옵션 고유 ID',
  `label` VARCHAR(255) NOT NULL COMMENT '옵션 라벨',
  `amount` DECIMAL(10, 3) COMMENT '수량/중량',
  `unit` VARCHAR(50) COMMENT '단위 (kg, 개, 송이 등)',
  `unit_price` DECIMAL(10, 2) NOT NULL COMMENT '단가',
  `price` DECIMAL(10, 2) NOT NULL COMMENT '옵션 가격',
  `stock_quantity` INT DEFAULT 0 COMMENT '재고 수량',
  `display_order` INT DEFAULT 0 COMMENT '표시 순서',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_product_option` (`product_id`, `option_id`),
  INDEX `idx_product_id` (`product_id`),
  INDEX `idx_display_order` (`product_id`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='상품 옵션 테이블';

-- 13. cart 테이블 (장바구니)
CREATE TABLE IF NOT EXISTS `cart` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT '회원 ID',
  `product_id` INT NOT NULL COMMENT '상품 ID',
  `option_id` VARCHAR(100) COMMENT '옵션 ID (옵션이 있는 경우)',
  `quantity` INT NOT NULL DEFAULT 1 COMMENT '수량',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '담은 일시',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_user_product_option` (`user_id`, `product_id`, `option_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='장바구니 테이블';

-- 14. orders 테이블 (상품 주문 정보)
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT '회원 ID',
  `order_id` VARCHAR(100) NOT NULL UNIQUE COMMENT '주문 고유 ID',
  `status` ENUM('PENDING', 'PAID', 'CANCELLED', 'REFUNDED', 'COMPLETED') DEFAULT 'PENDING' COMMENT '주문 상태',
  `total_amount` DECIMAL(10, 2) NOT NULL COMMENT '총 주문 금액',
  `memo` TEXT COMMENT '주문 메모',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '주문 생성일시',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  `cancelled_at` TIMESTAMP NULL COMMENT '취소일시',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_order_id` (`order_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='상품 주문 정보 테이블';

-- 15. order_items 테이블 (주문 상품 상세)
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL COMMENT '주문 ID',
  `product_id` INT NOT NULL COMMENT '상품 ID',
  `product_title` VARCHAR(255) NOT NULL COMMENT '상품명',
  `product_image` VARCHAR(500) COMMENT '상품 이미지',
  `option_id` VARCHAR(100) COMMENT '옵션 ID',
  `option_name` VARCHAR(255) COMMENT '옵션명',
  `unit_price` DECIMAL(10, 2) NOT NULL COMMENT '단가',
  `quantity` INT NOT NULL COMMENT '수량',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  INDEX `idx_order_id` (`order_id`),
  INDEX `idx_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='주문 상품 상세 테이블';

-- 16. payments 테이블 (통합 결제 정보 - 예약/상품 공통)
CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `payment_type` ENUM('RESERVATION', 'ORDER') NOT NULL COMMENT '결제 유형',
  `reservation_id` INT NULL COMMENT '예약 ID (예약 결제인 경우)',
  `order_id` INT NULL COMMENT '주문 ID (상품 결제인 경우)',
  `payment_id` VARCHAR(100) NOT NULL UNIQUE COMMENT '결제 고유 ID',
  `method` ENUM('CARD', 'KAKAO_PAY', 'TRANSFER') NOT NULL DEFAULT 'CARD' COMMENT '결제 수단',
  `amount` DECIMAL(10, 2) NOT NULL COMMENT '결제 금액',
  `status` ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') DEFAULT 'PENDING' COMMENT '결제 상태',
  `buyer_name` VARCHAR(100) COMMENT '결제자 이름',
  `buyer_phone` VARCHAR(20) COMMENT '결제자 연락처',
  `buyer_email` VARCHAR(255) COMMENT '결제자 이메일',
  `paid_at` TIMESTAMP NULL COMMENT '결제 완료 일시',
  `refunded_at` TIMESTAMP NULL COMMENT '환불 일시',
  `refund_reason` TEXT COMMENT '환불 사유',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  FOREIGN KEY (`reservation_id`) REFERENCES `reservations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  INDEX `idx_reservation_id` (`reservation_id`),
  INDEX `idx_order_id` (`order_id`),
  INDEX `idx_payment_id` (`payment_id`),
  INDEX `idx_payment_type` (`payment_type`),
  INDEX `idx_status` (`status`),
  INDEX `idx_paid_at` (`paid_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='통합 결제 정보 테이블';

-- 16. point_transactions 테이블 (포인트 적립/사용 내역)
CREATE TABLE IF NOT EXISTS `point_transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT '회원 ID',
  `type` ENUM('EARNED', 'USED', 'EXPIRED', 'REFUNDED') NOT NULL COMMENT '포인트 유형',
  `amount` INT NOT NULL COMMENT '포인트 금액 (적립: +, 사용: -)',
  `balance_after` INT NOT NULL COMMENT '거래 후 잔액',
  `source_type` ENUM('RESERVATION', 'ORDER', 'MANUAL', 'REFUND') COMMENT '적립/사용 출처',
  `source_id` INT COMMENT '출처 ID (예약 ID, 주문 ID 등)',
  `description` VARCHAR(255) COMMENT '설명',
  `expires_at` TIMESTAMP NULL COMMENT '만료일시 (적립 포인트만)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_source` (`source_type`, `source_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='포인트 거래 내역 테이블';

-- 18. events 테이블 (이벤트 정보)
CREATE TABLE IF NOT EXISTS `events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL COMMENT '이벤트 제목',
  `subtitle` VARCHAR(255) COMMENT '이벤트 소제목',
  `description` TEXT COMMENT '이벤트 설명',
  `position` VARCHAR(100) COMMENT '노출 위치',
  `start_date` DATE COMMENT '시작일',
  `end_date` DATE COMMENT '종료일',
  `status` ENUM('SCHEDULED', 'ONGOING', 'ENDED') DEFAULT 'SCHEDULED' COMMENT '상태',
  `image_url` VARCHAR(500) COMMENT '이미지 URL',
  `tag` VARCHAR(50) COMMENT '태그',
  `notice` TEXT COMMENT '유의사항',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  INDEX `idx_status` (`status`),
  INDEX `idx_start_date` (`start_date`),
  INDEX `idx_end_date` (`end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='이벤트 관리 테이블';

-- 19. notices 테이블 (공지사항)
CREATE TABLE IF NOT EXISTS `notices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL COMMENT '공지 제목',
  `content` TEXT NOT NULL COMMENT '공지 내용',
  `is_important` BOOLEAN DEFAULT FALSE COMMENT '중요 공지 여부',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '작성일시',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_is_important` (`is_important`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='공지사항 테이블';

-- 20. faqs 테이블 (자주 묻는 질문)
CREATE TABLE IF NOT EXISTS `faqs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `question` VARCHAR(255) NOT NULL COMMENT '질문',
  `answer` TEXT NOT NULL COMMENT '답변',
  `category` VARCHAR(50) DEFAULT '일반' COMMENT '카테고리',
  `display_order` INT DEFAULT 0 COMMENT '표시 순서',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '작성일시',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  INDEX `idx_display_order` (`display_order`),
  INDEX `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='자주 묻는 질문 테이블';