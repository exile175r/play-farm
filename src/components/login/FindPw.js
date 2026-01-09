import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiBaseUrl } from '../../utils/apiConfig';
import './Login.css';

const FindPw = () => {
    const [step, setStep] = useState(1); // 1: 본인확인, 2: 비밀번호 재설정, 3: 완료
    const [userIdPk, setUserIdPk] = useState(null);
    const [formData, setFormData] = useState({
        user_id: '',
        phone: '',
        email: '',
    });
    const [pwData, setPwData] = useState({
        newPassword: '',
        confirmPassword: '',
    });
    const [error, setError] = useState(null);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePwChange = (e) => {
        const { name, value } = e.target;
        setPwData(prev => ({ ...prev, [name]: value }));
    };

    const handleVerifySubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            const response = await fetch(`${getApiBaseUrl()}/users/find-pw`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await response.json();

            if (!response.ok) {
                setError(data.message || '정보가 일치하지 않습니다.');
                return;
            }

            setUserIdPk(data.data.id);
            setStep(2);
        } catch (err) {
            console.error('비밀번호 찾기 오류:', err);
            setError('서버 오류가 발생했습니다.');
        }
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (pwData.newPassword !== pwData.confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            const response = await fetch(`${getApiBaseUrl()}/users/reset-pw`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: userIdPk,
                    newPassword: pwData.newPassword
                }),
            });
            const data = await response.json();

            if (!response.ok) {
                setError(data.message || '비밀번호 재설정에 실패했습니다.');
                return;
            }

            setStep(3);
        } catch (err) {
            console.error('비밀번호 재설정 오류:', err);
            setError('서버 오류가 발생했습니다.');
        }
    };

    return (
        <div className="login-container">
            <h2>비밀번호 찾기</h2>

            {step === 1 && (
                <form className="login-form" onSubmit={handleVerifySubmit}>
                    <p className="find-desc">아이디와 가입 시 등록한 정보를 입력해주세요.</p>
                    <input
                        type="text"
                        name="user_id"
                        placeholder="아이디"
                        value={formData.user_id}
                        onChange={handleFormChange}
                        required
                    />
                    <input
                        type="text"
                        name="phone"
                        placeholder="전화번호"
                        value={formData.phone}
                        onChange={handleFormChange}
                        required
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder="이메일"
                        value={formData.email}
                        onChange={handleFormChange}
                        required
                    />
                    {error && <p className="error-msg">{error}</p>}
                    <button type="submit">확인</button>
                    <div className="find-footer">
                        <Link to="/user/login">로그인으로 돌아가기</Link>
                    </div>
                </form>
            )}

            {step === 2 && (
                <form className="login-form" onSubmit={handleResetSubmit}>
                    <p className="find-desc">새로운 비밀번호를 설정해주세요.</p>
                    <input
                        type="password"
                        name="newPassword"
                        placeholder="새 비밀번호"
                        value={pwData.newPassword}
                        onChange={handlePwChange}
                        required
                    />
                    <input
                        type="password"
                        name="confirmPassword"
                        placeholder="새 비밀번호 확인"
                        value={pwData.confirmPassword}
                        onChange={handlePwChange}
                        required
                    />
                    {error && <p className="error-msg">{error}</p>}
                    <button type="submit">비밀번호 변경</button>
                </form>
            )}

            {step === 3 && (
                <div className="find-result">
                    <p>비밀번호가 성공적으로 변경되었습니다.</p>
                    <div className="find-result-btns">
                        <Link to="/user/login" className="login-link-btn">로그인 페이지로</Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FindPw;
