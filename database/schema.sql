-- play-farm 데이터베이스 스키마
-- MySQL 5.7 이상 버전 지원

-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS play_farm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE play_farm;

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
  `region` VARCHAR(100) COMMENT '지역',
  `marketing_agree` BOOLEAN DEFAULT FALSE COMMENT '마케팅 동의 여부',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '가입일시',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  `last_login_at` TIMESTAMP NULL COMMENT '마지막 로그인 일시',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT '계정 활성화 여부',
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

