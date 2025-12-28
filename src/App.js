// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
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
import StoreDetail from './components/shop/StoreDetail'; // ✅ 추가

import SupportPage from './components/SupportPage';
import Mypage from './components/mypage/Mypage';

import CheckoutPage from './components/checkout/CheckoutPage';
import CheckoutResult from './components/checkout/CheckoutResult';

// ✅ NEW: 스토어 주문 상세
import StoreOrderDetail from './components/orders/StoreOrderDetail';

import { setGlobalLogoutHandler } from './utils/apiConfig';
import { setReviewApiLogoutHandler } from './services/reviewApi';
import { setReservationApiLogoutHandler } from './services/reservationApi';

// ✅ NEW: 관리자 페이지
import AdminHome from './adim/components/AdminHome';
import AdminLogin from './adim/components/AdminLogin';

// ✅ Footer
import Footer from './components/layout/Footer';

function App() {
   const [isLoggedIn, setIsLoggedIn] = useState(() => {
      return !!localStorage.getItem('token');
   });

   // ✅ List 검색 결과(배열) or null(검색 해제)
   const [searchData, setSearchData] = useState(null);

   const navigate = useNavigate();
   const location = useLocation(); // ✅ 현재 경로 확인용

   // 로그아웃
   const handleLogout = useCallback(() => {
      localStorage.removeItem('token');
      setIsLoggedIn(false);
      navigate('/');
   }, [navigate]);

   // 전역 로그아웃 핸들러 설정
   useEffect(() => {
      setGlobalLogoutHandler(handleLogout);
      setReviewApiLogoutHandler(handleLogout);
      setReservationApiLogoutHandler(handleLogout);
   }, [handleLogout]);

   return (
      <div className="App">
         <Header isLoggedIn={isLoggedIn} onLogout={handleLogout} />

         <Routes>
            <Route path="/" element={<Main />} />
            {/* List */}
            <Route path="/list" element={<List searchData={searchData} setSearchData={setSearchData} />} />
            <Route path="/list/:id" element={<ListDetail />} />

            {/* 결제 */}
            <Route path="/checkout/:bookingId" element={<CheckoutPage />} />
            <Route path="/checkout/result" element={<CheckoutResult />} />

            {/* ✅ NEW: 스토어 주문 상세 */}
            <Route path="/orders/:orderId" element={<StoreOrderDetail />} />

            {/* auth */}
            <Route path="/user/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
            <Route path="/login/kakao/callback" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
            <Route path="/login/google/callback" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
            <Route path="/login/naver/callback" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
            <Route path="/user/signup" element={<Signup />} />

            {/* event */}
            <Route path="/events" element={<EventPage />} />
            <Route path="/event/:id" element={<EventDetail />} />

            {/* shop */}
            <Route path="/shop" element={<Store />} />
            <Route path="/shop/:id" element={<StoreDetail />} />

            {/* etc */}
            <Route path="/support" element={<SupportPage />} />
            <Route path="/mypage" element={<Mypage />} />

            {/* ✅ NEW: 관리자 */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminHome />} />
         </Routes>

         {/* ✅ 메인(/)에서만 푸터 노출 */}
         {location.pathname === '/' && <Footer />}
      </div>
   );
}

export default App;
