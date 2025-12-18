const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 라우트
const programRouter = require('./routes/programs');
const userRouter = require('./routes/users');
const socialAuthRouter = require('./routes/socialAuth');
// const reservationRouter = require('./routes/reservations');

app.use('/api/programs', programRouter);
app.use('/api/users', userRouter);
app.use('/api/social-auth', socialAuthRouter);
// app.use('/api/reservations', reservationRouter);

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ message: 'API server is running' });
});

// 에러 핸들링
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '서버 오류가 발생했습니다.' });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});

module.exports = app;