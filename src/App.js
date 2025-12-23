// src/App.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';

import Header from './components/layout/Header';
import Main from './components/Main';

import List from './components/lists/List';
import ListDetail from './components/lists/ListDetail';

import Login from './components/login/Login';
import Signup from './components/login/Signup';

import EventPage from './components/events/EventPage';
import EventDetail from './components/events/EventDetail';
import Store from './components/shop/Store';

import SupportPage from './components/SupportPage';
import Mypage from './components/mypage/Mypage';
import DataCheck from './components/DataCheck';

import CheckoutPage from './components/checkout/CheckoutPage';
import CheckoutResult from './components/checkout/CheckoutResult';

import { setGlobalLogoutHandler } from "./utils/apiConfig";
import { setReviewApiLogoutHandler } from "./services/reviewApi";
import { setReservationApiLogoutHandler } from "./services/reservationApi";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem('token');
  });

  // ✅ List 검색 결과(배열) or null(검색 해제)
  const [searchData, setSearchData] = useState(null);

  const navigate = useNavigate();

  // 로그아웃
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/');
  };

  // 전역 로그아웃 핸들러 설정
  useEffect(() => {
    setGlobalLogoutHandler(handleLogout);
    setReviewApiLogoutHandler(handleLogout);
    setReservationApiLogoutHandler(handleLogout);
  }, []);

  return (
    <div className="App">
      <Header isLoggedIn={isLoggedIn} onLogout={handleLogout} />

      <Routes>
        <Route path="/" element={<Main />} />
        {/* ✅ List 내부(h2 아래)에 검색창을 넣을 거라 setSearchData 내려줌 */}
        <Route path="/list" element={<List searchData={searchData} setSearchData={setSearchData} />} />
        <Route path="/list/:id" element={<ListDetail />} />
        {/* ✅ 결제 시뮬레이션 */}
        <Route path="/checkout/:bookingId" element={<CheckoutPage />} />
        <Route path="/checkout/result" element={<CheckoutResult />} />

        <Route path="/user/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/login/kakao/callback" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/login/google/callback" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/login/naver/callback" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/user/signup" element={<Signup />} />
        <Route path="/events" element={<EventPage />} />
        <Route path="/event/:id" element={<EventDetail />} />
        <Route path="/shop" element={<Store />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/mypage" element={<Mypage />} />
        <Route path="/data" element={<DataCheck />} />
      </Routes>

      {/* 임시 Data Check 버튼 */}
      <button
        style={{
          padding: '5px 10px',
          width: '70px',
          backgroundColor: '#3a8e87',
          borderRadius: '10px',
          boxShadow: '2px 3px 0 0 #007c60',
          textAlign: 'center',
          color: '#f6ce44',
          fontSize: '16px',
          fontWeight: '700',
          position: 'absolute',
          top: '99px',
          right: '20px',
        }}
        onClick={() => navigate('/data?page=1&limit=20')}>
        Data Check
      </button>
    </div>
  );
}

export default App;
