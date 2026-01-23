# 🚜 PlayFarm (플레이팜)

**PlayFarm**은 농촌 체험 예약부터 현지 산지 직송 상품 구매까지 한 번에 즐길 수 있는 농촌 맞춤형 서비스 플랫폼입니다.

## 🚀 Teck Stack

본 프로젝트는 서비스의 안정성과 확장성을 위해 최신 클라우드 기술을 활용하여 구축되었습니다.

- **Frontend**: React, React Router, CSS Variables
- **Backend**: Node.js, Express
- **Deployment**: [Vercel](https://vercel.com/) (Serverless Functions)
- **Database**: [TiDB Serverless](https://www.pingcap.com/tidb-serverless/) (MySQL Compatible Distributed SQL)
- **Storage**: [Cloudinary](https://cloudinary.com/) (Cloud Media Management)
- **Authentication**: JWT, Kakao/Google/Naver Social Login

## ✨ Key Features

- **농촌 체험 예약**: 전국 각지의 다양한 농촌 체험 프로그램을 검색하고 예약할 수 있습니다.
- **산지 직송 스토어**: 농가에서 직접 생산한 신선한 농산물을 믿고 구매할 수 있는 이커머스 기능을 제공합니다.
- **결제 시스템**: 포인트 연동 및 카드 결제 시뮬레이션을 통해 결제 프로세스를 체계적으로 관리합니다.
- **관리자 패널**: 체험 프로그램 및 스토어 상품의 등록, 수정, 삭제(CRUD)를 관리할 수 있는 전용 어드민 페이지를 제공합니다.
- **이미지 최적화**: Cloudinary를 통한 클라우드 기반 이미지 자동 최적화 및 관리가 적용되어 있습니다.

## 🛠️ Installation & Setup

```bash
# 레포지토리 클론
git clone https://github.com/exile175r/play-farm.git

# 의존성 설치
npm install

# 환경 변수 설정 (.env)
# DB_HOST=...
# CLOUDINARY_CLOUD_NAME=...
# 등등

# 서버 및 클라이언트 실행
npm start
```

## 🌐 Deployment Details

Vercel의 Serverless 환경에서 구동되며, 이미지 업로드 시 파일 시스템 제한을 극복하기 위해 **Cloudinary Memory Storage** 연동 방식을 채택했습니다. 데이터베이스는 고가용성 분산 데이터베이스인 **TiDB**를 사용하여 데이터의 안전성을 확보했습니다.
