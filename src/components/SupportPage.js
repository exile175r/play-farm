// src/components/SupportPage.js
import React, { useState, useEffect } from 'react';
import './SupportPage.css';

import { getAllFaqs } from '../services/faqApi';

const SupportPage = () => {
   const [activeIndex, setActiveIndex] = useState(null);
   const [activeTab, setActiveTab] = useState('faq'); // 'faq' | 'notice' | 'contact'
   const [faqs, setFaqs] = useState([]);
   const [loading, setLoading] = useState(false);

   useEffect(() => {
      const fetchData = async () => {
         setLoading(true);
         try {
            const faqRes = await getAllFaqs();

            if (faqRes.success) setFaqs(faqRes.data || []);

         } catch (err) {
            console.error("데이터 로드 실패:", err);
         } finally {
            setLoading(false);
         }
      };
      fetchData();
   }, []);

   const handleToggle = (index) => {
      setActiveIndex((prev) => (prev === index ? null : index));
   };

   const handleSubmit = (e) => {
      e.preventDefault();
      alert('현재 페이지는 데모 환경이며 실제 문의 접수 기능은 제공되지 않습니다.');
   };

   return (
      <main className="pf-page support-page">
         <div className="pf-container support-inner">
            {/* 헤더 */}
            <header className="pf-head support-header">
               <h1 className="pf-title-lg support-title">고객지원</h1>
               <div className="pf-divider" />
            </header>

            {/* 상단 탭 메뉴 */}
            <div className="support-tabs">
               <div className="support-tab-left">
                  <button
                     type="button"
                     className={`support-tab-btn ${activeTab === 'faq' ? 'is-active' : ''}`}
                     onClick={() => setActiveTab('faq')}
                  >
                     자주 묻는 질문
                  </button>
                  <button
                     type="button"
                     className={`support-tab-btn ${activeTab === 'contact' ? 'is-active' : ''}`}
                     onClick={() => setActiveTab('contact')}
                  >
                     1:1 문의
                  </button>
               </div>
            </div>

            {/* 탭별 컨텐츠 영역 */}
            <div className="support-tab-panel">
               {/* FAQ 탭 */}
               {activeTab === 'faq' && (
                  <section className="support-faq">
                     <h2 className="support-section-title">자주 묻는 질문</h2>

                     <div className="faq-list">
                        {loading ? (
                           <p>불러오는 중...</p>
                        ) : faqs.length === 0 ? (
                           <p>등록된 질문이 없습니다.</p>
                        ) : (
                           faqs.map((item, index) => (
                              <div key={item.id} className={`faq-item ${activeIndex === index ? 'faq-item-active' : ''}`}>
                                 <button type="button" className="faq-question" onClick={() => handleToggle(index)}>
                                    <span className="faq-cate">[{item.category}]</span>
                                    <span>{item.question}</span>
                                    <span className={`faq-arrow ${activeIndex === index ? 'open' : ''}`}>▼</span>
                                 </button>

                                 {activeIndex === index && (
                                    <div className="faq-answer">
                                       <p>{item.answer}</p>
                                    </div>
                                 )}
                              </div>
                           )))}
                     </div>

                     {/* FAQ 하단 연락처 안내 블록 */}
                     <div className="support-info-inline">
                        <h3 className="support-info-inline-title">고객센터 안내</h3>
                        <div className="support-info-card">
                           <p className="support-info-text">Play Farm 관련 문의는 아래 연락처로도 문의하실 수 있습니다.</p>
                           <ul className="support-info-list">
                              <li>
                                 <span className="support-info-label">고객센터</span>
                                 <span className="support-info-value">031 - 123 - 4567</span>
                              </li>
                              <li>
                                 <span className="support-info-label">이메일</span>
                                 <span className="support-info-value">support@playfarm.com</span>
                              </li>

                              <li>
                                 <span className="support-info-label">운영시간</span>
                                 <span className="support-info-value">평일 10:00 ~ 18:00 (주말 및 공휴일 휴무)</span>
                              </li>
                           </ul>
                           <p className="support-info-notice">본 페이지는 포트폴리오 데모용으로 실제 문의 응대는 제공되지 않습니다.</p>
                        </div>
                     </div>
                  </section>
               )}



               {/* 1:1 문의 탭 */}
               {activeTab === 'contact' && (
                  <section className="support-contact">
                     <h2 className="support-section-title">1:1 문의 남기기</h2>
                     <p className="support-contact-desc">서비스 이용 중 불편하셨던 점이나 개선 의견이 있으시다면 아래 양식을 통해 문의를 남겨 주세요.</p>

                     <form className="support-form" onSubmit={handleSubmit}>
                        <div className="support-form-row">
                           <div className="support-field">
                              <label htmlFor="name">이름</label>
                              <input type="text" id="name" name="name" placeholder="이름을 입력해 주세요" required />
                           </div>

                           <div className="support-field">
                              <label htmlFor="email">이메일</label>
                              <input type="email" id="email" name="email" placeholder="답변을 받을 이메일 주소" required />
                           </div>
                        </div>

                        <div className="support-field">
                           <label htmlFor="type">문의 유형</label>
                           <select id="type" name="type" defaultValue="일반 문의">
                              <option value="일반 문의">일반 문의</option>
                              <option value="버그 제보">버그 제보</option>
                              <option value="개선 제안">개선 제안</option>
                              <option value="기타">기타</option>
                           </select>
                        </div>

                        <div className="support-field">
                           <label htmlFor="message">문의 내용</label>
                           <textarea id="message" name="message" rows="5" placeholder="내용을 상세하게 작성해 주세요." required></textarea>
                        </div>

                        <button type="submit" className="support-submit-btn">
                           문의 보내기
                        </button>
                     </form>
                  </section>
               )}
            </div>
         </div>
      </main>
   );
};

export default SupportPage;
