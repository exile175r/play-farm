import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Signup.css";

const Signup = () => {
  const navigate = useNavigate();

  // 폼 데이터 상태
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    id: "",
    password: "",
    passwordConfirm: "",
    phone: "",
    region: "",
  });

  // 전화번호 인증 상태
  const [phoneVerification, setPhoneVerification] = useState({
    code: "", // 발송된 인증번호
    inputCode: "", // 사용자가 입력한 인증번호
    isVerified: false, // 인증 완료 여부
    isCodeSent: false, // 인증번호 발송 여부
  });

  // 약관 동의 상태
  const [agreements, setAgreements] = useState({
    all: false,
    service: false, // 필수
    privacy: false, // 필수
    marketing: false, // 선택
  });

  // 에러 메시지 상태
  const [errors, setErrors] = useState({});

  // 커스텀 드롭다운 상태
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 입력값 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // 에러 초기화
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // 약관 동의 변경 핸들러
  const handleAgreementChange = (type) => {
    if (type === "all") {
      const newValue = !agreements.all;
      setAgreements({
        all: newValue,
        service: newValue,
        privacy: newValue,
        marketing: newValue,
      });
    } else {
      const newAgreements = { ...agreements, [type]: !agreements[type] };

      // 개별 약관이 모두 체크되면 전체 동의도 체크
      newAgreements.all = newAgreements.service && newAgreements.privacy && newAgreements.marketing;

      setAgreements(newAgreements);
    }
  };

  // 유효성 검사
  const validate = () => {
    const newErrors = {};

    // 이름 검사
    if (!formData.name.trim()) {
      newErrors.name = "이름을 입력해주세요.";
    } else if (formData.name.length < 2) {
      newErrors.name = "이름은 2자 이상 입력해주세요.";
    }

    // 이메일 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "이메일을 입력해주세요.";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "올바른 이메일 형식이 아닙니다.";
    }

    // 아이디 검사
    const idRegex = /^[a-zA-Z0-9]{4,20}$/;
    if (!formData.id.trim()) {
      newErrors.id = "아이디를 입력해주세요.";
    } else if (!idRegex.test(formData.id)) {
      newErrors.id = "아이디는 4-20자의 영문, 숫자만 사용 가능합니다.";
    }

    // 비밀번호 검사
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
    if (!formData.password) {
      newErrors.password = "비밀번호를 입력해주세요.";
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password = "비밀번호는 8자 이상, 영문/숫자/특수문자를 포함해야 합니다.";
    }

    // 비밀번호 확인 검사
    if (!formData.passwordConfirm) {
      newErrors.passwordConfirm = "비밀번호 확인을 입력해주세요.";
    } else if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = "비밀번호가 일치하지 않습니다.";
    }

    // 전화번호 검사
    if (!formData.phone.trim()) {
      newErrors.phone = "전화번호를 입력해주세요.";
    } else if (!validatePhoneNumber(formData.phone)) {
      newErrors.phone = "올바른 전화번호 형식이 아닙니다.";
    }

    // 전화번호 인증 검사 추가
    if (!phoneVerification.isVerified) {
      newErrors.phoneVerification = "전화번호 인증을 완료해주세요.";
    }

    // 필수 약관 동의 검사
    if (!agreements.service) {
      newErrors.agreements = "서비스 이용약관에 동의해주세요.";
    }
    if (!agreements.privacy) {
      newErrors.agreements = "개인정보 처리방침에 동의해주세요.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 전화번호 유효성 검사 함수
  const validatePhoneNumber = (phone) => {
    const cleanPhone = phone.replace(/-/g, "");
    return cleanPhone.length >= 10 && cleanPhone.length <= 11 && /^01[0-9]/.test(cleanPhone);
  };

  // 랜덤 인증번호 생성 (6자리)
  const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // 인증번호 발송 핸들러
  const handleSendVerification = () => {
    if (!validatePhoneNumber(formData.phone)) {
      setErrors((prev) => ({ ...prev, phone: "올바른 전화번호 형식이 아닙니다." }));
      return;
    }

    // 랜덤 인증번호 생성
    const verificationCode = generateVerificationCode();

    // 상태 업데이트
    setPhoneVerification({
      code: verificationCode,
      inputCode: "",
      isVerified: false,
      isCodeSent: true,
    });

    // Alert로 인증번호 표시
    alert(`인증번호: ${verificationCode}`);

    // 에러 초기화
    setErrors((prev) => ({ ...prev, phone: "" }));
  };

  // 인증번호 확인 핸들러
  const handleVerifyCode = () => {
    if (!phoneVerification.isCodeSent) {
      setErrors((prev) => ({ ...prev, phoneVerification: "먼저 인증번호를 발송해주세요." }));
      return;
    }

    if (phoneVerification.inputCode === "") {
      setErrors((prev) => ({ ...prev, phoneVerification: "인증번호를 입력해주세요." }));
      return;
    }

    if (phoneVerification.inputCode === phoneVerification.code) {
      setPhoneVerification((prev) => ({ ...prev, isVerified: true }));
      setErrors((prev) => ({ ...prev, phoneVerification: "" }));
      alert("인증이 완료되었습니다.");
    } else {
      setErrors((prev) => ({ ...prev, phoneVerification: "인증번호가 일치하지 않습니다." }));
    }
  };

  // 인증번호 입력 핸들러
  const handleVerificationCodeChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, ""); // 숫자만 입력
    setPhoneVerification((prev) => ({ ...prev, inputCode: value }));

    // 에러 초기화
    if (errors.phoneVerification) {
      setErrors((prev) => ({ ...prev, phoneVerification: "" }));
    }
  };

  // 지역 옵션
  const regionOptions = [
    { value: "", label: "지역 선택" },
    { value: "서울", label: "서울" },
    { value: "경기", label: "경기" },
    { value: "강원", label: "강원" },
    { value: "충청", label: "충청" },
    { value: "전라", label: "전라" },
    { value: "경상", label: "경상" },
    { value: "제주", label: "제주" },
  ];

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 지역 선택 핸들러
  const handleRegionSelect = (value) => {
    setFormData((prev) => ({ ...prev, region: value }));
    setIsDropdownOpen(false);
    // 에러 초기화
    if (errors.region) {
      setErrors((prev) => ({ ...prev, region: "" }));
    }
  };

  // 현재 선택된 지역 라벨 가져오기
  const getSelectedLabel = () => {
    const selected = regionOptions.find((opt) => opt.value === formData.region);
    return selected ? selected.label : "지역 선택";
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      // 회원가입 API 호출 (예시)
      const signupData = {
        name: formData.name,
        email: formData.email,
        id: formData.id,
        password: formData.password,
        phone: formData.phone,
        region: formData.region,
        marketingAgree: agreements.marketing,
      };

      // 실제 API 호출 부분
      // const response = await fetch('/api/signup', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(signupData)
      // });

      console.log("회원가입 데이터:", signupData);

      // 성공 시 로그인 페이지로 이동
      alert("회원가입이 완료되었습니다!");
      navigate("/user/login");
    } catch (error) {
      console.error("회원가입 실패:", error);
      setErrors({ submit: "회원가입 중 오류가 발생했습니다. 다시 시도해주세요." });
    }
  };

  return (
    <div className="signup-container">
      <h2>회원가입</h2>
      <p>한 번의 회원가입으로 모든 서비스 이용 할 수있습니다.</p>
      <form className="signup-form" onSubmit={handleSubmit}>
        <div className="input-container">
          <div>
            <label htmlFor="name">이름</label>
            <input
              type="text"
              id="name"
              placeholder="이름"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? "error" : ""}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>
          <div>
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              placeholder="이메일"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? "error" : ""}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>
          <div>
            <label htmlFor="id">아이디</label>
            <input
              type="text"
              id="id"
              placeholder="4-20자의 영문, 숫자"
              name="id"
              value={formData.id}
              onChange={handleChange}
              className={errors.id ? "error" : ""}
            />
            {errors.id && <span className="error-message">{errors.id}</span>}
          </div>
          <div>
            <label htmlFor="phone">전화번호</label>
            <div className="phone-input-wrapper">
              <input
                type="tel"
                id="phone"
                placeholder="010-1234-5678"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={errors.phone ? "error" : ""}
                disabled={phoneVerification.isVerified} // 인증 완료 시 비활성화
              />
              <button
                type="button"
                className="verify-send-btn"
                onClick={handleSendVerification}
                disabled={!validatePhoneNumber(formData.phone) || phoneVerification.isVerified}
              >
                {phoneVerification.isCodeSent && !phoneVerification.isVerified ? "재발송" : "인증번호 발송"}
              </button>
            </div>
            {errors.phone && <span className="error-message">{errors.phone}</span>}

            {/* 인증번호 입력 필드 */}
            {phoneVerification.isCodeSent && !phoneVerification.isVerified && (
              <div className="verification-code-wrapper">
                <input
                  type="text"
                  placeholder="인증번호 6자리 입력"
                  value={phoneVerification.inputCode}
                  onChange={handleVerificationCodeChange}
                  maxLength={6}
                  className={errors.phoneVerification ? "error" : ""}
                />
                <button type="button" className="verify-check-btn" onClick={handleVerifyCode}>
                  인증 확인
                </button>
              </div>
            )}

            {/* 인증 완료 표시 */}
            {phoneVerification.isVerified && <div className="verification-success">✓ 인증이 완료되었습니다.</div>}

            {errors.phoneVerification && <span className="error-message">{errors.phoneVerification}</span>}
          </div>
          <div>
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              placeholder="8자 이상, 영문/숫자/특수문자를 포함"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? "error" : ""}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>
          <div>
            <label htmlFor="password-confirm">비밀번호 확인</label>
            <input
              type="password"
              id="password-confirm"
              placeholder="비밀번호 확인"
              name="passwordConfirm"
              value={formData.passwordConfirm}
              onChange={handleChange}
              className={errors.passwordConfirm ? "error" : ""}
            />
            {errors.passwordConfirm && <span className="error-message">{errors.passwordConfirm}</span>}
          </div>

          <div className="region-container">
            <label htmlFor="region">지역 (선택)</label>
            <div className="custom-select-box" ref={dropdownRef}>
              <div
                className={`custom-select ${isDropdownOpen ? "open" : ""}`}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span className="custom-select-value">{getSelectedLabel()}</span>
                <span className={`custom-select-arrow ${isDropdownOpen ? "open" : ""}`}>▼</span>
              </div>
              {isDropdownOpen && (
                <div className="custom-select-options">
                  {regionOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`custom-select-option ${formData.region === option.value ? "selected" : ""}`}
                      onClick={() => handleRegionSelect(option.value)}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="agreement-container">
          <h3>약관 동의</h3>
          <div className="agreement-item">
            <input
              type="checkbox"
              id="agree-all"
              checked={agreements.all}
              onChange={() => handleAgreementChange("all")}
            />
            <label htmlFor="agree-all">전체 동의</label>
          </div>
          <div className="agreement-item">
            <input
              type="checkbox"
              id="agree-service"
              name="agree"
              checked={agreements.service}
              onChange={() => handleAgreementChange("service")}
            />
            <label htmlFor="agree-service">[필수] 서비스 이용약관</label>
          </div>
          <div className="agreement-item">
            <input
              type="checkbox"
              id="agree-privacy"
              name="agree"
              checked={agreements.privacy}
              onChange={() => handleAgreementChange("privacy")}
            />
            <label htmlFor="agree-privacy">[필수] 개인정보 처리방침</label>
          </div>
          <div className="agreement-item">
            <input
              type="checkbox"
              id="agree-marketing"
              name="agree"
              checked={agreements.marketing}
              onChange={() => handleAgreementChange("marketing")}
            />
            <label htmlFor="agree-marketing">[선택] 마케팅 수신 동의</label>
          </div>

          {errors.agreements && <span className="error-message">{errors.agreements}</span>}
        </div>

        {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}
        <button type="submit" className="submit-btn">
          회원가입
        </button>
      </form>
      <div className="login-link">
        이미 가입하셨나요? <Link to="/user/login">로그인</Link>
      </div>
    </div>
  );
};

export default Signup;
