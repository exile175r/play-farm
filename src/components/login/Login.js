import React from 'react';
import { Link } from 'react-router-dom';
import './Login.css';
import { getImagePath } from '../../utils/imagePath';

const Login = () => {
  return (
    <div className="login-container">
      <h2>로그인</h2>
      <form className="login-form">
        <input type="text" placeholder="ID" />
        <input type="password" placeholder="Password" />
        <button type="submit">로그인</button>
      </form>

      <div className="login-find-btns">
        <button type="button" className="find-id-btn"><Link to="/find-id">아이디 찾기</Link></button>
        /
        <button type="button" className="find-pw-btn"><Link to="/find-pw">비밀번호 찾기</Link></button>
      </div>

      <h3>간편 로그인</h3>
      <div className="login-async-btns">
        <button type="button" className="login-btn"><img src={getImagePath('/icons/Kakao.png')} alt="kakao" /></button>
        <button type="button" className="login-btn"><img src={getImagePath('/icons/Google.png')} alt="google" /></button>
        <button type="button" className="login-btn"><img src={getImagePath('/icons/Naver.png')} alt="naver" /></button>
      </div>

      <div className="login-signup">
        <p>아직 회원이 아니신가요?</p>
        <button type="button" className="signup-btn"><Link to="/signup">회원가입</Link></button>
      </div>
    </div>
  )
}

export default Login;