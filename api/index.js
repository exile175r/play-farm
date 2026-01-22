const express = require('express');
const cors = require('cors');
const path = require('path');
// Vercel 환경에서는 .env가 아닌 Dashboard에서 환경변수를 가져오므로 조건부 로드
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
}

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어
app.use(cors());

// body 파서 설정 (multipart는 제외)
app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';

  // multipart/form-data 요청은 body 파서 건너뛰기
  if (contentType.includes('multipart/form-data')) {
    return next();
  }

  // JSON 요청 처리
  if (contentType.includes('application/json')) {
    return express.json()(req, res, next);
  }

  // 기타 요청은 urlencoded 처리
  return express.urlencoded({ extended: true })(req, res, next);
});

// 정적 파일 서빙 (이미지 파일)
app.use('/images', express.static(path.join(__dirname, '../public/images')));

// 라우트 (api_server 폴더로 경로 변경)
const serverPath = '../api_server';
const programRouter = require(`${serverPath}/routes/programs`);
const userRouter = require(`${serverPath}/routes/users`);
const socialAuthRouter = require(`${serverPath}/routes/socialAuth`);
const bookmarksRouter = require(`${serverPath}/routes/bookmarks`);
const reviewsRouter = require(`${serverPath}/routes/reviews`);
const reservationRouter = require(`${serverPath}/routes/reservations`);
const productRouter = require(`${serverPath}/routes/products`);
const cartRouter = require(`${serverPath}/routes/cart`);
const orderRouter = require(`${serverPath}/routes/orders`);
const pointRouter = require(`${serverPath}/routes/points`);
const adminRouter = require(`${serverPath}/routes/admin`);
const eventRouter = require(`${serverPath}/routes/events`);
const noticeRouter = require(`${serverPath}/routes/notices`);
const faqRouter = require(`${serverPath}/routes/faqs`);

app.use('/api/programs', programRouter);
app.use('/api/users', userRouter);
app.use('/api/social-auth', socialAuthRouter);
app.use('/api/bookmarks', bookmarksRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/reservations', reservationRouter);
app.use('/api/products', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', orderRouter);
app.use('/api/points', pointRouter);
app.use('/api/admin', adminRouter);
app.use('/api/events', eventRouter);
app.use('/api/notices', noticeRouter);
app.use('/api/faqs', faqRouter);

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ message: 'API server is running' });
});

// 에러 핸들링
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '서버 오류가 발생했습니다.' });
});

// 서버 시작 - Vercel(production) 환경이 아닐 때만 listen 실행
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  });
}

module.exports = app;
