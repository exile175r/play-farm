import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

// 개발 환경에서는 basename을 사용하지 않고, 프로덕션(GitHub Pages)에서만 사용
const basename = process.env.NODE_ENV === 'production' ? '/play-farm' : '';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
