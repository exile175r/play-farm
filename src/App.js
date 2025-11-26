import React from 'react';
import farmDataJson from './data.json';
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Header from "./components/layout/Header";
import Main from "./components/Main.js";
import './App.css';

function App() {

  console.log(farmDataJson);

  return (
    <div className="App">
      <Header />
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/home" element={<Home farmData={farmDataJson} />} />
      </Routes>
    </div>
  );
}

export default App;
