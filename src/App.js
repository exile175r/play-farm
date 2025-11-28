// src/App.js
import React from "react";
import farmDataJson from "./data.json";
import { Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Header from "./components/layout/Header";
import Main from "./components/Main.js";
import SearchBar from "./components/layout/SearchBar";
import List from "./components/list";
import "./App.css";

function App() {
  console.log(farmDataJson);

  return (
    <div className="App">
      <Header />
      <SearchBar />
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/home" element={<Home farmData={farmDataJson} />} />
        <Route path="/list" element={<List />} />
      </Routes>
    </div>
  );
}

export default App;
