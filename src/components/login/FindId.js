import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiBaseUrl } from '../../utils/apiConfig';
import './Login.css';

const FindId = () => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
    });
    const [foundId, setFoundId] = useState(null);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setFoundId(null);

        try {
            const response = await fetch(`${getApiBaseUrl()}/users/find-id`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await response.json();

            if (!response.ok) {
                setError(data.message || '아이디 찾기에 실패했습니다.');
                return;
            }

            setFoundId(data.data.user_id);
        } catch (err) {
            console.error('아이디 찾기 오류:', err);
            setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        }
    };

    return (
        <div className="login-container">
            <h2>아이디 찾기</h2>
            {!foundId ? (
                <form className="login-form" onSubmit={handleSubmit}>
                    <p className="find-desc">가입 시 등록한 이름, 전화번호, 이메일을 입력해주세요.</p>
                    <input
                        type="text"
                        name="name"
                        placeholder="이름"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="text"
                        name="phone"
                        placeholder="전화번호 (숫자만 입력)"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder="이메일"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                    {error && <p className="error-msg">{error}</p>}
                    <button type="submit">아이디 찾기</button>
                    <div className="find-footer">
                        <Link to="/user/login">로그인으로 돌아가기</Link>
                    </div>
                </form>
            ) : (
                <div className="find-result">
                    <p>입력하신 정보와 일치하는 아이디입니다.</p>
                    <div className="result-box">
                        <strong>{foundId}</strong>
                    </div>
                    <div className="find-result-btns">
                        <Link to="/user/login" className="login-link-btn">로그인</Link>
                        <Link to="/find-pw" className="pw-link-btn">비밀번호 찾기</Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FindId;
