import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";
import { getImagePath } from "../../utils/imagePath";
import { getApiBaseUrl } from "../../utils/apiConfig";
import KakaoLogin from "./KakaoLogin";
import GoogleLogin from "./GoogleLogin";
import NaverLogin from "./NaverLogin";

const Login = ({ setIsLoggedIn }) => {
  const [formData, setFormData] = useState({
    user_id: "",
    password: "",
  });
  const [isInput, setIsInput] = useState(true);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    const inputVal = {};
    inputVal[name] = value;
    Object.values(inputVal).every(val => val.trim() !== "") ?
      setIsInput(false) : setIsInput(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${getApiBaseUrl()}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || '로그인 실패');
        return;
      }
      alert(data.message || '로그인 성공');
      localStorage.setItem('token', data.data.token);
      setIsLoggedIn(true);
      navigate('/');
    } catch (error) {
      console.error('로그인 실패:', error);
      alert('로그인 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="login-container">
      <h2>로그인</h2>
      <form className="login-form" onSubmit={handleSubmit}>
        <input type="text" placeholder="ID" name="user_id" value={formData.user_id} onChange={handleChange} />
        <input type="password" placeholder="Password" name="password" value={formData.password} onChange={handleChange} />
        <button type="submit" disabled={isInput}>로그인</button>
      </form>

      <div className="login-find-btns">
        <button type="button" className="find-id-btn">
          <Link to="/find-id">아이디 찾기</Link>
        </button>
        /
        <button type="button" className="find-pw-btn">
          <Link to="/find-pw">비밀번호 찾기</Link>
        </button>
      </div>

      <h3>간편 로그인</h3>
      <div className="login-async-btns">
        <KakaoLogin setIsLoggedIn={setIsLoggedIn} />
        <GoogleLogin setIsLoggedIn={setIsLoggedIn} />
        <NaverLogin setIsLoggedIn={setIsLoggedIn} />
      </div>

      <div className="login-signup">
        <p>아직 회원이 아니신가요?</p>
        <button type="button" className="signup-btn">
          <Link to="/user/signup">회원가입</Link>
        </button>
      </div>
    </div>
  );
};

export default Login;
