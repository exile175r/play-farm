# 📝 Play Farm 개발일지 (기획 + 와이어프레임 + 개발 전체 통합)

### _(2025.12.10 ~ 진행중)_

---

## 📅 2025-12-10 — 기획 1일차

### ✔ 작업

-  프로젝트 아이디어 정리
-  서비스 목적·타깃 정의
-  페이지 구성 초안 작성
-  컬러 무드, UI 방향성 고민

---

## 📅 2025-12-11 — 기획 2일차

### ✔ 작업

-  핵심 기능 정리
-  페이지 흐름 구체화
-  메인·이벤트·검색·상세·레이아웃 구조 확정
-  기획 내용 정돈

---

## 📅 2025-12-12 — 와이어프레임 1일차

### ✔ 작업

-  Home 화면 와이어프레임 초안
-  Header·SearchBar 상단 구조 스케치
-  컨테이너 1200px 기준 설계

---

## 📅 2025-12-13 — 와이어프레임 2일차

### ✔ 작업

-  EventSection 카드 리스트 초안
-  상세페이지 기본 레이아웃 구상
-  UI 컴포넌트 분리 기준 확립

---

## 📅 2025-12-14 — 와이어프레임 3일차 (완료)

### ✔ 작업

-  전체 페이지 와이어프레임 완성
-  컴포넌트 단위 개발 계획 정리
-  개발 구조와 매칭 위한 문서화

---

## 📅 2025-12-15 — 개발 시작 / React 실행 준비

### ✔ 작업

-  프로젝트 실행 테스트
-  `npm install` 후 정상 빌드 확인
-  src 폴더 구조 재정비
-  App.js 초기 세팅 및 JSX 정리

### ✔ 트러블슈팅

-  `react-scripts` 오류 → node_modules 재설치로 해결
-  브라우저 자동실행 문제 → `localhost:3000` 접속으로 해결

---

## 📅 2025-12-16 — Header 컴포넌트 개발

### ✔ 작업

-  `layout/Header.js` 개발
-  `Header.css` 스타일 작성
-  로고/메뉴/유틸 구조 완성
-  전체 레이아웃 구조 확정

---

## 📅 2025-12-17 — SearchBar 개발

### ✔ 작업

-  SearchBar.js / SearchBar.css 제작
-  검색 UI 구현 및 Header와 정렬 조정
-  와이어프레임 반영 완료

---

## 📅 2025-12-18 — EventSection 기본 개발

### ✔ 작업

-  `EventSection.js` 기본 UI 구성
-  카드 레이아웃 및 리스트 구조 제작
-  와이어프레임 구성 완성

---

## 📅 2025-12-19 — EventSection 스타일링

### ✔ 작업

-  `.event-section`, `.event-card` 스타일 작성
-  grid, spacing, 텍스트 정리
-  디자인 시스템 필요성 인지

---

## 📅 2025-12-20 — 전체 CSS 구조 재검토

### ✔ 작업

-  Header / EventSection / SearchBar CSS 분석
-  중복 색상 및 여백 정리 시작
-  디자인 시스템 초안 구상

---

## 📅 2025-12-21 — 전역 스타일링 준비

### ✔ 작업

-  tokens.css에 넣을 공통 값 정리
-  색상, spacing, 폰트 기반 정리
-  스타일 통일 전략 수립

---

## 📅 2025-12-22 — 전역 스타일링 구조 설계

### ✔ 작업

-  global.css, tokens.css 구조 기획
-  CSS 리팩토링 방향성 확정
-  전체 스타일 시스템 구조화

---

## 📅 2025-12-23 — tokens.css 생성

### ✔ 작업

-  `tokens.css` 파일 생성 및 실제 적용
-  중복되는 색상·여백·폰트 값 통합
-  Header, EventSection 일부 토큰 적용
-  전체 디자인 시스템 구축 완료
-  개발일지 문서 정리

### ✔ 트러블슈팅

-  root 값 중복 → tokens.css에서 통합 관리
-  “값은 토큰 / 구조는 컴포넌트” 구조로 리팩토링

---

# 📌 현재 src 기준 컴포넌트 제작 흐름

### 1. layout

-  Header.js
-  Header.css

### 2. SearchBar

-  SearchBar.js
-  SearchBar.css

### 3. EventSection

-  EventSection.js
-  EventSection.css

### 4. Home

-  Home.js
-  Home.css

### 5. Main

-  Main.js
-  Main.css

### 6. 전역 스타일

-  App.css
-  index.css
-  tokens.css

---

# ⭐ 지금까지 성과

-  기획(2일) + 와이어프레임(3일) 완성
-  React 개발 환경 구축 완료
-  Header / SearchBar / EventSection 주요 컴포넌트 제작
-  디자인 시스템 기반 tokens.css 구축
-  CSS 중복 제거 및 구조 안정화
-  전체 디자인·개발 흐름 체계화

---

# ✨ Next Step (진행중)

-  MainSection 토큰화
-  SearchBar 디테일 개선
-  Footer 제작
-  React Router로 페이지 연결
-  tokens.css 확장 (폰트·radius·shadow)
-  UI 마이크로 인터랙션 및 디테일 보완
