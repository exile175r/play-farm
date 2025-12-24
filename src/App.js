// src/App.js
import React, { useState, useEffect, useCallback } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import "./App.css";

import Header from "./components/layout/Header";
import Main from "./components/Main";

import List from "./components/lists/List";
import ListDetail from "./components/lists/ListDetail";

import Login from "./components/login/Login";
import Signup from "./components/login/Signup";

import EventPage from "./components/events/EventPage";
import EventDetail from "./components/events/EventDetail";

import Store from "./components/shop/Store";
import StoreDetail from "./components/shop/StoreDetail"; // ✅ 추가

import SupportPage from "./components/SupportPage";
import Mypage from "./components/mypage/Mypage";
import DataCheck from "./components/DataCheck";

import CheckoutPage from "./components/checkout/CheckoutPage";
import CheckoutResult from "./components/checkout/CheckoutResult";

// ✅ NEW: 스토어 주문 상세
import StoreOrderDetail from "./components/orders/StoreOrderDetail";

import { setGlobalLogoutHandler } from "./utils/apiConfig";
import { setReviewApiLogoutHandler } from "./services/reviewApi";
import { setReservationApiLogoutHandler } from "./services/reservationApi";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem("token");
  });

  // ✅ List 검색 결과(배열) or null(검색 해제)
  const [searchData, setSearchData] = useState(null);

  const navigate = useNavigate();

  // 로그아웃
  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/");
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
        <Route path="/data" element={<DataCheck />} />
      </Routes>

      {/* 임시 Data Check 버튼 */}
      <button
        style={{
          padding: "5px 10px",
          width: "70px",
          backgroundColor: "#3a8e87",
          borderRadius: "10px",
          boxShadow: "2px 3px 0 0 #007c60",
          textAlign: "center",
          color: "#f6ce44",
          fontSize: "16px",
          fontWeight: "700",
          position: "absolute",
          top: "99px",
          right: "20px",
        }}
        onClick={() => navigate("/data?page=1&limit=20")}
      >
        Data Check
      </button>
    </div>
  );
}

export default App;
