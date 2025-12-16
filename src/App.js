// src/App.js
import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './App.css';

import Header from './components/layout/Header';
import SearchBar from './components/layout/SearchBar';

import Main from './components/Main';
import List from './components/lists/List';
import ListData from './components/lists/ListDetail';

import Login from './components/login/Login';
import Signup from './components/login/Signup';

import EventPage from './components/events/EventPage';
import EventDetail from './components/events/EventDetail';

import SupportPage from './components/SupportPage';
import Mypage from './components/mypage/Mypage';
import DataCheck from './components/DataCheck';

function App() {
   const [isLoggedIn, setIsLoggedIn] = useState(() => {
      return !!localStorage.getItem('token');
   });

   const navigate = useNavigate();
   const location = useLocation();

   // 로그아웃
   const handleLogout = () => {
      localStorage.removeItem('token');
      setIsLoggedIn(false);
   };

   // ✅ SearchBar 노출 조건
   const showSearchBar = location.pathname === '/' || location.pathname.startsWith('/list');

   return (
      <div className="App">
         <Header isLoggedIn={isLoggedIn} onLogout={handleLogout} />

         {showSearchBar && <SearchBar />}
         <Routes>
            <Route path="/" element={<Main />} />
            <Route path="/list" element={<List />} />
            <Route path="/list/:id" element={<ListData />} />

            <Route path="/user/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
            <Route path="/user/signup" element={<Signup />} />

            <Route path="/events" element={<EventPage />} />
            <Route path="/event/:id" element={<EventDetail />} />

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
