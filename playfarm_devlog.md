
# 📝 Play Farm 개발일지 (기획 + 와이어프레임 + 개발 전체 통합)
### *(2025.11.14 ~ 2025.11.27 — 실제 진행 흐름 기반)*

---

## 📅 **2025-11-14 — 기획 1일차**
### ✔ 작업
- 프로젝트 아이디어 정리
- 서비스 목적·타깃 정의
- 페이지 구성 초안 작성
- 컬러 무드, UI 방향성 고민

---

## 📅 **2025-11-15 — 기획 2일차**
### ✔ 작업
- 핵심 기능 정리
- 페이지 흐름 구체화
- 메인·이벤트·검색·상세·레이아웃 구조 확정
- 기획 내용 정돈

---

## 📅 **2025-11-16 — 와이어프레임 1일차**
### ✔ 작업
- Home 화면 와이어프레임 초안
- Header·SearchBar 상단 구조 스케치
- 컨테이너 1200px 기준 잡기

---

## 📅 **2025-11-17 — 와이어프레임 2일차**
### ✔ 작업
- EventSection 카드 리스트 초안
- 상세페이지 구조 기본 레이아웃
- UI 컴포넌트 나누는 기준 확립

---

## 📅 **2025-11-18 — 와이어프레임 3일차 (완료)**
### ✔ 작업
- 전체 페이지 와이어프레임 완성
- 컴포넌트 단위 작업 계획 정리
- 개발 구조와 매칭 위한 문서화

---

## 📅 **2025-11-19 — 개발 시작 / React 실행 준비**
### ✔ 작업
- 프로젝트 실행 테스트
- `npm install` → 정상 빌드 성공
- src 구조 살피고 필요한 폴더 재정비
- App.js JSX 구조 점검 및 초기화

### ✔ 트러블슈팅
- `react-scripts` 오류 → node_modules 설치로 해결  
- 브라우저 자동 실행 안됨 → `localhost:3000` 접속으로 해결

---

## 📅 **2025-11-20 — Header 컴포넌트 개발**
### ✔ 작업
- `src/components/layout/Header.js` 제작
- `Header.css` 스타일 작성
- 로고/메뉴/유틸 구성 완성
- layout 구조 확정

---

## 📅 **2025-11-21 — SearchBar 개발**
### ✔ 작업
- `SearchBar.js` / `SearchBar.css` 제작
- 검색 바 UI 구성 및 Header와의 조화 조정
- 와이어프레임 반영 완료

---

## 📅 **2025-11-22 — EventSection 기본 개발**
### ✔ 작업
- `EventSection.js` 기본 구조 구현
- 리스트/카드 배치 구조 제작
- 와이어프레임 기반 UI 배치 구성

---

## 📅 **2025-11-23 — EventSection 스타일링**
### ✔ 작업
- `.event-section`, `.event-card` 등 스타일 작성
- grid / spacing / text 스타일 구성
- 색/여백이 중복되는 걸 인식 → 전역 토큰 필요성 자각

---

## 📅 **2025-11-24 — 전체 CSS 구조 재검토**
### ✔ 작업
- Header / EventSection / SearchBar CSS 분석
- 중복되는 root 값·색상 값 정리 시작
- 디자인 시스템 초안 구상

---

## 📅 **2025-11-25 — 전역 스타일링 준비**
### ✔ 작업
- tokens.css에 넣을 값 정리
- block 기반 spacing, 컬러 값 추출
- 파일 간 스타일 통일 기본 작업

---

## 📅 **2025-11-26 — 전역 스타일링 구조 설계**
### ✔ 작업
- 전역 스타일 파일(tokken.css) 계획 정리만 수행
- global.css 구성 고민
- 전체 CSS 구조 리팩토링 전략 수립

---

## 📅 **2025-11-27 — tokens.css 생성 (오늘)**
### ✔ 작업
- **tokens.css 실제 생성**
- 기존 CSS에서 중복 색상·여백·폰트 값이 전부 이곳으로 이동
- Header / EventSection 일부 토큰적용 시작
- 전체 스타일 시스템 구축
- 개발일지 문서화 진행

### ✔ 트러블슈팅
- root 값 중복 → tokens.css로 통합  
- CSS 구조를 “값은 토큰, 구조는 컴포넌트” 방식으로 개선

---

# 📌 현재 src 기준 컴포넌트 제작 흐름
### 1️⃣ layout  
- Header.js  
- Header.css  

### 2️⃣ SearchBar  
- SearchBar.js  
- SearchBar.css  

### 3️⃣ EventSection  
- EventSection.js  
- EventSection.css  

### 4️⃣ Home  
- Home.js  
- Home.css  

### 5️⃣ Main  
- Main.js  
- Main.css  

### 6️⃣ 전역 스타일  
- App.css  
- index.css  
- tokens.css (2025.11.27 생성)

---

# ⭐ 지금까지 성과
- 기획(2일) + 와이어프레임(3일) 완벽히 완료  
- React 환경 정상화  
- 주요 컴포넌트(Header/SearchBar/EventSection) 개발  
- tokens.css 기반 디자인 시스템 구축  
- CSS 중복 제거 및 구조 정돈  
- 프로젝트 전체 디자인 · 개발 흐름 안정화

---

# ✨ Next Step
- MainSection 토큰화  
- SearchBar 개선  
- Footer 제작  
- React Router로 페이지 연결  
- tokens.css 값 확장(폰트·radius·shadow)  
- UI 디테일 보완  

