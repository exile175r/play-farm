// src/App.js
import React, { useState } from "react";
// import farmDataJson from "./data_final.json";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import DataCheck from "./components/DataCheck";
import "./App.css";
import Header from "./components/layout/Header";
import Main from "./components/Main.js";
import SearchBar from "./components/layout/SearchBar";
import List from "./components/lists/List.js";
import ListData from "./components/lists/ListDetail.js";
import Login from "./components/login/Login";
import Signup from "./components/login/Signup";
import EventPage from "./components/events/EventPage.js";
import EventDetail from "./components/events/EventDetail.js";
import SupportPage from "./components/SupportPage";
import Mypage from "./components/mypage/Mypage"; // ✅ 추가

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    // 페이지 로드 시 토큰 확인
    return !!localStorage.getItem("token");
  });

  // 로그아웃 함수
  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    // 로그인 페이지로 이동 (선택사항)
    // navigate('/user/login');
  };
  // console.log(farmDataJson);
  const navigate = useNavigate();
  const location = useLocation();
  const showDetailNav = location.pathname.startsWith("/user/");
  return (
    <div className="App">
      <Header isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      {!showDetailNav && <SearchBar />}
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/list" element={<List />} />
        <Route path="/list/:id" element={<ListData />} />
        <Route path="/user/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/user/signup" element={<Signup />} />
        <Route path="/events" element={<EventPage />} />
        <Route path="/event/:id" element={<EventDetail />} /> {/* ✅ 원래대로 유지 */}
        <Route path="/support" element={<SupportPage />} />
        <Route path="/mypage" element={<Mypage />} /> {/* ✅ 추가 */}
        <Route path="/data" element={<DataCheck />} />
      </Routes>
      {/* 임시 버튼(데이터 체크 페이지로 이동) 추후 삭제 */}
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
