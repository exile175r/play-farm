# play-farm 데이터베이스 설정 가이드

## 개요

이 디렉토리는 play-farm 프로젝트의 데이터베이스 스키마와 마이그레이션 스크립트를 포함합니다.

## 파일 구조

- `schema.sql`: MySQL 데이터베이스 테이블 생성 스크립트
- `migrate.js`: data_final.json에서 데이터베이스로 데이터를 마이그레이션하는 스크립트
- `README.md`: 이 파일

## 데이터베이스 설정

### 1. MySQL 데이터베이스 생성

```sql
CREATE DATABASE IF NOT EXISTS play_farm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. 테이블 생성

```bash
mysql -u root -p play_farm < database/schema.sql
```

또는 MySQL 클라이언트에서:

```sql
USE play_farm;
SOURCE database/schema.sql;
```

## 데이터 마이그레이션

### 1. 필요한 패키지 설치

```bash
npm install mysql2
```

### 2. 환경 변수 설정 (선택사항)

환경 변수를 설정하지 않으면 기본값이 사용됩니다:

```bash
export DB_HOST=localhost
export DB_USER=root
export DB_PASSWORD=your_password
export DB_NAME=play_farm
```

### 3. 마이그레이션 실행

```bash
node database/migrate.js
```

또는 `migrate.js` 파일에서 직접 설정:

```javascript
const config = {
  host: 'localhost',
  user: 'root',
  password: 'your_password',
  database: 'play_farm',
  charset: 'utf8mb4'
};
```

## 테이블 구조

### 1. programs (메인 프로그램 테이블)
체험 프로그램의 기본 정보를 저장합니다.

### 2. program_types (프로그램 타입 마스터)
프로그램 타입을 관리하는 마스터 테이블입니다.

### 3. program_program_types (다대다 관계)
프로그램과 프로그램 타입의 다대다 관계를 저장합니다.

### 4. program_images (프로그램 이미지)
프로그램별 이미지 URL을 저장합니다.

### 5. users (회원 정보)
회원가입 정보를 저장하는 테이블입니다.
- `user_id`: 사용자 아이디 (UNIQUE)
- `email`: 이메일 (UNIQUE)
- `password`: 비밀번호 (해시화하여 저장)
- `name`: 이름
- `phone`: 전화번호
- `region`: 지역
- `marketing_agree`: 마케팅 동의 여부

### 6. reservations (예약 정보)
회원이 프로그램을 예약할 때 생성되는 예약 정보 테이블입니다.
- `user_id`: 회원 ID (외래키)
- `program_id`: 프로그램 ID (외래키)
- `res_date`: 예약일
- `res_date_time`: 예약시간
- `personnel`: 예약 인원수
- `status`: 예약 상태 (pending, confirmed, cancelled, completed)
- `total_price`: 총 결제 금액
- `memo`: 예약 메모

## 주의사항

- 초기 마이그레이션은 `data_final.json`의 처음 48개 데이터만 사용합니다.
- 나머지 데이터는 추후 추가 예정입니다.
- `PROGRAM_NM`이 배열인 경우 JSON 문자열로 저장됩니다.
- `PROGRAM_TYPE`은 정규화되어 별도 테이블에 저장됩니다.
- **회원가입 시 비밀번호는 반드시 해시화하여 저장해야 합니다** (bcrypt 등 사용 권장).
- **예약 시 인원수는 프로그램의 MIN_PERSONNEL과 MAX_PERSONNEL 범위를 검증해야 합니다**.
- 동일 사용자가 동일 프로그램의 동일 시간에 중복 예약할 수 없습니다 (UNIQUE 제약조건).

## 데이터 확인

마이그레이션 후 데이터 확인:

```sql
-- 프로그램 개수 확인
SELECT COUNT(*) FROM programs;

-- 프로그램 타입 확인
SELECT * FROM program_types;

-- 특정 프로그램의 타입 확인
SELECT p.program_nm, pt.type_name
FROM programs p
JOIN program_program_types ppt ON p.id = ppt.program_id
JOIN program_types pt ON ppt.program_type_id = pt.id
WHERE p.id = 1;

-- 특정 프로그램의 이미지 확인
SELECT image_url, display_order
FROM program_images
WHERE program_id = 1
ORDER BY display_order;

-- 회원 정보 확인
SELECT * FROM users;

-- 특정 회원의 예약 목록 확인
SELECT r.*, p.program_nm, p.village_nm
FROM reservations r
JOIN programs p ON r.program_id = p.id
WHERE r.user_id = 1
ORDER BY r.res_date DESC, r.res_date_time DESC;

-- 특정 프로그램의 예약 현황 확인
SELECT r.*, u.name, u.email, u.phone
FROM reservations r
JOIN users u ON r.user_id = u.id
WHERE r.program_id = 1
AND r.status IN ('pending', 'confirmed')
ORDER BY r.res_date, r.res_date_time;
```

