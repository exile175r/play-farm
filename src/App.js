// src/App.js
import React from 'react';
import farmDataJson from './data_final.json';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import DataCheck from './components/DataCheck';
import Header from './components/layout/Header';
import Main from './components/Main.js';
import SearchBar from './components/layout/SearchBar';
import List from './components/List.js';
import './App.css';
import ListData from './components/ListDetail.js';
import Login from './components/login/Login';
import Signup from './components/login/Signup';
import EventPage from './components/EventPage';

function App() {
  console.log(farmDataJson);
  const navigate = useNavigate();
  const location = useLocation();
  const showDetailNav = location.pathname.startsWith('/user/');
  return (
    <div className="App">
      <Header />
      {!showDetailNav && <SearchBar />}
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/list" element={<List farmData={farmDataJson} />} />
        <Route path="/list/:id" element={<ListData farmData={farmDataJson} />} />
        <Route path="/user/login" element={<Login />} />
        <Route path="/user/signup" element={<Signup />} />
        <Route path="/events" element={<EventPage />} />
        <Route path="/data" element={<DataCheck farmData={farmDataJson} />} />
      </Routes>
      {/* 임시 버튼(데이터 체크 페이지로 이동) 추후 삭제 */}
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
        onClick={() => navigate('/data')}>
        Data Check
      </button>
    </div>
  );
}

export default App;
