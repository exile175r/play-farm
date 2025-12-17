import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import './Mypage.css';

function Mypage() {
   const navigate = useNavigate();

   // ===== auth =====
   const isLoggedIn = !!localStorage.getItem('token');

   const user = useMemo(() => {
      try {
         const raw = localStorage.getItem('user');
         return raw ? JSON.parse(raw) : null;
      } catch {
         return null;
      }
   }, []);

   const baseDisplayName = user?.nickname || user?.name || user?.user_id || '회원';
   const displayId = user?.user_id || '';
   const userId = user?.user_id || user?.id || '';

   // ===== tabs =====
   const [tab, setTab] = useState('account'); // account | reservations | reviews | bookmarks | security

   // ===== mock data =====
   const reservations = [
      { bookingId: 1, programId: 3, title: '겨울 딸기 수확 체험', date: '2025-12-20', status: 'COMPLETED', people: 2, price: 38000 },
      { bookingId: 2, programId: 5, title: '쿠키 만들기 패키지', date: '2025-12-28', status: 'BOOKED', people: 1, price: 29000 },
   ];

   const [myReviews, setMyReviews] = useState(() => {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith('reviews_program_'));
      let merged = [];
      keys.forEach((k) => {
         try {
            const list = JSON.parse(localStorage.getItem(k) || '[]');
            if (Array.isArray(list)) merged = merged.concat(list);
         } catch {}
      });
      // 임시: displayName 기준으로 내 리뷰
      return merged.filter((r) => (r?.user || '').trim() === baseDisplayName).sort((a, b) => (b?.date || '').localeCompare(a?.date || ''));
   });

   const [bookmarks, setBookmarks] = useState(() => {
      try {
         return JSON.parse(localStorage.getItem('bookmarks_program') || '[]');
      } catch {
         return [];
      }
   });

   // ===== reservation filter =====
   const [resvFilter, setResvFilter] = useState('ALL'); // ALL | UPCOMING | COMPLETED
   const filteredReservations = useMemo(() => {
      if (resvFilter === 'COMPLETED') return reservations.filter((r) => r.status === 'COMPLETED');
      if (resvFilter === 'UPCOMING') return reservations.filter((r) => r.status !== 'COMPLETED');
      return reservations;
   }, [reservations, resvFilter]);

   // ===== account =====
   const [isEditingAccount, setIsEditingAccount] = useState(false);

   const [accountForm, setAccountForm] = useState(() => ({
      photo: user?.photo || '',
      nickname: user?.nickname || user?.name || user?.user_id || '',
      phone: user?.phone || '',
      email: user?.email || '',
      loginProvider: user?.loginProvider || 'LOCAL',
      lastLoginAt: user?.lastLoginAt || '',
   }));

   const onChangeAccount = (e) => {
      const { name, value } = e.target;
      setAccountForm((prev) => ({ ...prev, [name]: value }));
   };

   const onChangePhoto = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
         alert('2MB 이하 이미지만 업로드 가능합니다.');
         return;
      }

      const reader = new FileReader();
      reader.onload = () => {
         setAccountForm((prev) => ({ ...prev, photo: String(reader.result) }));
      };
      reader.readAsDataURL(file);
   };

   const saveAccount = () => {
      const nextUser = {
         ...(user || {}),
         photo: accountForm.photo,
         nickname: accountForm.nickname.trim(),
         phone: accountForm.phone.trim(),
         email: accountForm.email.trim(),
         loginProvider: accountForm.loginProvider,
         lastLoginAt: accountForm.lastLoginAt,
      };

      localStorage.setItem('user', JSON.stringify(nextUser));
      setIsEditingAccount(false);
      window.location.reload();
   };

   // ===== review edit =====
   const [editingReviewId, setEditingReviewId] = useState(null);
   const [editingContent, setEditingContent] = useState('');

   const startEditReview = (review) => {
      setEditingReviewId(review.id);
      setEditingContent(review.content || '');
   };

   const cancelEditReview = () => {
      setEditingReviewId(null);
      setEditingContent('');
   };

   const saveEditReview = (reviewId) => {
      const nextContent = editingContent.trim();
      if (!nextContent) {
         alert('리뷰 내용을 입력해 주세요.');
         return;
      }

      // localStorage 모든 reviews_program_*에서 해당 id 찾아 업데이트
      const keys = Object.keys(localStorage).filter((k) => k.startsWith('reviews_program_'));
      keys.forEach((k) => {
         try {
            const list = JSON.parse(localStorage.getItem(k) || '[]');
            if (!Array.isArray(list)) return;

            const next = list.map((r) => {
               if (r.id !== reviewId) return r;
               return {
                  ...r,
                  content: nextContent,
                  editedAt: new Date().toISOString(),
               };
            });

            // 변경이 있었을 때만 set
            localStorage.setItem(k, JSON.stringify(next));
         } catch {}
      });

      // 화면 상태도 갱신
      setMyReviews((prev) =>
         prev.map((r) =>
            r.id === reviewId
               ? {
                    ...r,
                    content: nextContent,
                    editedAt: new Date().toISOString(),
                 }
               : r
         )
      );

      cancelEditReview();
   };

   const deleteMyReview = (reviewId) => {
      if (!window.confirm('리뷰를 삭제하시겠습니까?')) return;

      const keys = Object.keys(localStorage).filter((k) => k.startsWith('reviews_program_'));
      keys.forEach((k) => {
         try {
            const list = JSON.parse(localStorage.getItem(k) || '[]');
            if (!Array.isArray(list)) return;
            const next = list.filter((r) => r.id !== reviewId);
            localStorage.setItem(k, JSON.stringify(next));
         } catch {}
      });

      setMyReviews((prev) => prev.filter((r) => r.id !== reviewId));
      if (editingReviewId === reviewId) cancelEditReview();
   };

   // ===== bookmarks =====
   const removeBookmark = (programId) => {
      const next = bookmarks.filter((b) => b.programId !== programId);
      setBookmarks(next);
      localStorage.setItem('bookmarks_program', JSON.stringify(next));
   };

   // ===== helpers =====
   const logout = () => {
      localStorage.removeItem('token');
      navigate('/');
   };

   const goWriteReview = (programId) => {
      navigate(`/list/${programId}`, { state: { openTab: 'review', openComposer: true } });
   };

   const statusLabel = (status) => {
      if (status === 'COMPLETED') return '체험 완료';
      if (status === 'BOOKED') return '예약 진행중';
      if (status === 'CANCELLED') return '취소됨';
      return '진행중';
   };

   const statusClass = (status) => {
      if (status === 'COMPLETED') return 'is-ok';
      if (status === 'BOOKED') return 'is-wait';
      if (status === 'CANCELLED') return 'is-cancel';
      return 'is-wait';
   };

   // ===== not logged in =====
   if (!isLoggedIn) {
      return (
         <main className="pf-mypage">
            <div className="pf-mypage-inner">
               <header className="pf-head">
                  <h2 className="pf-title">마이페이지</h2>
               </header>

               <div className="pf-panel">
                  <div className="pf-empty">
                     <p className="pf-empty-title">로그인이 필요합니다</p>
                     <p className="pf-empty-desc">내 정보, 예약 내역, 찜 목록을 확인하려면 로그인해 주세요.</p>
                     <button type="button" className="pf-cta" onClick={() => navigate('/user/login')}>
                        로그인
                     </button>
                  </div>
               </div>
            </div>
         </main>
      );
   }

   return (
      <main className="pf-mypage">
         <div className="pf-mypage-inner">
            {/* header: '마이페이지' 아래 닉네임/ID 제거 */}
            <header className="pf-head">
               <div className="pf-head-row">
                  <h2 className="pf-title">마이페이지</h2>
                  <button type="button" className="pf-ghost" onClick={logout}>
                     로그아웃
                  </button>
               </div>
            </header>

            <div className="pf-grid">
               {/* left nav */}
               <aside className="pf-left">
                  <div className="pf-profile">
                     <div className="pf-avatar">{accountForm.photo ? <img src={accountForm.photo} alt="profile" /> : <span>{String(baseDisplayName).slice(0, 1)}</span>}</div>
                     <div className="pf-profile-meta">
                        <p className="pf-profile-name">{baseDisplayName}</p>
                        <p className="pf-profile-id">{displayId ? `ID: ${displayId}` : `회원번호: ${userId || '-'}`}</p>
                     </div>
                  </div>

                  <nav className="pf-tabs">
                     <button type="button" className={`pf-tab ${tab === 'account' ? 'is-active' : ''}`} onClick={() => setTab('account')}>
                        프로필/계정
                     </button>
                     <button type="button" className={`pf-tab ${tab === 'reservations' ? 'is-active' : ''}`} onClick={() => setTab('reservations')}>
                        예약/체험관리
                     </button>
                     <button type="button" className={`pf-tab ${tab === 'reviews' ? 'is-active' : ''}`} onClick={() => setTab('reviews')}>
                        리뷰
                     </button>
                     <button type="button" className={`pf-tab ${tab === 'bookmarks' ? 'is-active' : ''}`} onClick={() => setTab('bookmarks')}>
                        찜(북마크)
                     </button>
                     <button type="button" className={`pf-tab ${tab === 'security' ? 'is-active' : ''}`} onClick={() => setTab('security')}>
                        설정/보안
                     </button>
                  </nav>
               </aside>

               {/* right */}
               <section className="pf-right">
                  {/* account */}
                  {tab === 'account' && (
                     <div className="pf-panel">
                        <div className="pf-panel-head">
                           <h3 className="pf-panel-title">프로필/계정</h3>
                           <button type="button" className="pf-ghost" onClick={() => setIsEditingAccount((v) => !v)}>
                              {isEditingAccount ? '취소' : '수정'}
                           </button>
                        </div>

                        <div className="pf-account">
                           <div className="pf-photo">
                              <div className="pf-photo-box">
                                 {accountForm.photo ? (
                                    <img src={accountForm.photo} alt="profile" />
                                 ) : (
                                    <span className="pf-photo-placeholder">{String(baseDisplayName).slice(0, 1)}</span>
                                 )}
                              </div>

                              {isEditingAccount && (
                                 <label className="pf-photo-btn">
                                    사진 변경
                                    <input type="file" accept="image/*" onChange={onChangePhoto} />
                                 </label>
                              )}
                           </div>

                           <div className="pf-fields">
                              <div className="pf-field">
                                 <label className="pf-label">별명</label>
                                 <input
                                    name="nickname"
                                    className="pf-input"
                                    value={accountForm.nickname}
                                    onChange={onChangeAccount}
                                    disabled={!isEditingAccount}
                                    placeholder="별명을 입력해 주세요"
                                 />
                              </div>

                              <div className="pf-field">
                                 <label className="pf-label">연락처(휴대폰)</label>
                                 <input
                                    name="phone"
                                    className="pf-input"
                                    value={accountForm.phone}
                                    onChange={onChangeAccount}
                                    disabled={!isEditingAccount}
                                    placeholder="예) 010-0000-0000"
                                 />
                              </div>

                              <div className="pf-field">
                                 <label className="pf-label">연락처(이메일)</label>
                                 <input
                                    name="email"
                                    className="pf-input"
                                    value={accountForm.email}
                                    onChange={onChangeAccount}
                                    disabled={!isEditingAccount}
                                    placeholder="예) user@email.com"
                                 />
                              </div>

                              <div className="pf-kv">
                                 <div className="pf-kv-row">
                                    <span className="pf-kv-key">로그인 방식</span>
                                    <span className="pf-kv-val">{accountForm.loginProvider}</span>
                                 </div>
                                 <div className="pf-kv-row">
                                    <span className="pf-kv-key">마지막 로그인</span>
                                    <span className="pf-kv-val">{accountForm.lastLoginAt || '-'}</span>
                                 </div>
                              </div>

                              {isEditingAccount && (
                                 <div className="pf-field-actions">
                                    <button type="button" className="pf-cta" onClick={saveAccount}>
                                       저장
                                    </button>
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>
                  )}

                  {/* reservations */}
                  {tab === 'reservations' && (
                     <div className="pf-panel">
                        <div className="pf-panel-head">
                           <h3 className="pf-panel-title">예약/체험관리</h3>
                           <div className="pf-seg">
                              <button type="button" className={`pf-seg-btn ${resvFilter === 'ALL' ? 'is-active' : ''}`} onClick={() => setResvFilter('ALL')}>
                                 전체
                              </button>
                              <button type="button" className={`pf-seg-btn ${resvFilter === 'UPCOMING' ? 'is-active' : ''}`} onClick={() => setResvFilter('UPCOMING')}>
                                 진행중
                              </button>
                              <button type="button" className={`pf-seg-btn ${resvFilter === 'COMPLETED' ? 'is-active' : ''}`} onClick={() => setResvFilter('COMPLETED')}>
                                 완료
                              </button>
                           </div>
                        </div>

                        {filteredReservations.length === 0 ? (
                           <div className="pf-empty">
                              <p className="pf-empty-title">예약 내역이 없습니다</p>
                              <p className="pf-empty-desc">체험을 둘러보고 예약해 보세요.</p>
                              <button type="button" className="pf-ghost" onClick={() => navigate('/list')}>
                                 체험 보러가기
                              </button>
                           </div>
                        ) : (
                           <div className="pf-list">
                              {filteredReservations.map((it) => {
                                 const canWrite = it.status === 'COMPLETED';

                                 // ✅ 완료된 체험은 변경/취소 불가
                                 const canChange = it.status === 'BOOKED';

                                 return (
                                    <div className="pf-item" key={it.bookingId}>
                                       <div className="pf-item-main">
                                          <p className="pf-item-title">{it.title}</p>
                                          <p className="pf-item-sub">
                                             체험일: {dayjs(it.date).format('YYYY.MM.DD')} · 인원 {it.people}명 · {it.price.toLocaleString()}원
                                          </p>

                                          <div className="pf-item-actions">
                                             <button type="button" className="pf-linkbtn" onClick={() => navigate(`/list/${it.programId}`)}>
                                                상세
                                             </button>

                                             <button
                                                type="button"
                                                className={`pf-linkbtn ${canWrite ? '' : 'is-disabled'}`}
                                                onClick={() => goWriteReview(it.programId)}
                                                disabled={!canWrite}
                                                title={!canWrite ? '체험 완료 후 리뷰 작성이 가능합니다.' : ''}>
                                                리뷰 작성
                                             </button>

                                             <button
                                                type="button"
                                                className={`pf-linkbtn ${canChange ? '' : 'is-disabled'}`}
                                                onClick={() => {
                                                   if (!canChange) return;
                                                   alert('준비중입니다');
                                                }}
                                                disabled={!canChange}
                                                title={!canChange ? '체험 완료된 예약은 변경/취소할 수 없습니다.' : ''}>
                                                예약 변경/취소
                                             </button>
                                          </div>
                                       </div>

                                       <span className={`pf-chip ${statusClass(it.status)}`}>{statusLabel(it.status)}</span>
                                    </div>
                                 );
                              })}
                           </div>
                        )}
                     </div>
                  )}

                  {/* reviews */}
                  {tab === 'reviews' && (
                     <div className="pf-panel">
                        <div className="pf-panel-head">
                           <h3 className="pf-panel-title">리뷰</h3>
                        </div>

                        {myReviews.length === 0 ? (
                           <div className="pf-empty">
                              <p className="pf-empty-title">작성한 리뷰가 없습니다</p>
                              <p className="pf-empty-desc">체험 완료 예약에서 리뷰를 작성할 수 있습니다.</p>
                              <button type="button" className="pf-ghost" onClick={() => setTab('reservations')}>
                                 예약 보기
                              </button>
                           </div>
                        ) : (
                           <ul className="pf-review-list">
                              {myReviews.map((r) => {
                                 const isEditing = editingReviewId === r.id;

                                 return (
                                    <li className="pf-review-item" key={r.id}>
                                       <div className="pf-review-top">
                                          <div className="pf-review-meta">
                                             <span className="pf-review-date">{r.date ? dayjs(r.date).format('YYYY.MM.DD') : ''}</span>
                                             {r.editedAt ? <span className="pf-review-edited">수정됨</span> : null}
                                          </div>

                                          <div className="pf-review-actions">
                                             {!isEditing ? (
                                                <>
                                                   <button type="button" className="pf-mini" onClick={() => startEditReview(r)}>
                                                      수정
                                                   </button>
                                                   <button type="button" className="pf-mini-danger" onClick={() => deleteMyReview(r.id)}>
                                                      삭제
                                                   </button>
                                                </>
                                             ) : (
                                                <>
                                                   <button type="button" className="pf-mini" onClick={() => saveEditReview(r.id)}>
                                                      저장
                                                   </button>
                                                   <button type="button" className="pf-mini" onClick={cancelEditReview}>
                                                      취소
                                                   </button>
                                                </>
                                             )}
                                          </div>
                                       </div>

                                       {!isEditing ? (
                                          <p className="pf-review-content">{r.content}</p>
                                       ) : (
                                          <textarea
                                             className="pf-review-editor"
                                             value={editingContent}
                                             onChange={(e) => setEditingContent(e.target.value)}
                                             placeholder="리뷰 내용을 입력해 주세요"
                                          />
                                       )}

                                       {Array.isArray(r.images) && r.images.length > 0 && (
                                          <div className="pf-review-imgs">
                                             {r.images.slice(0, 6).map((src, idx) => (
                                                <img key={`${r.id}_${idx}`} src={src} alt={`review-${idx}`} />
                                             ))}
                                          </div>
                                       )}
                                    </li>
                                 );
                              })}
                           </ul>
                        )}
                     </div>
                  )}

                  {/* bookmarks */}
                  {tab === 'bookmarks' && (
                     <div className="pf-panel">
                        <div className="pf-panel-head">
                           <h3 className="pf-panel-title">찜(북마크)</h3>
                        </div>

                        {bookmarks.length === 0 ? (
                           <div className="pf-empty">
                              <p className="pf-empty-title">찜한 체험이 없습니다</p>
                              <p className="pf-empty-desc">마음에 드는 체험을 북마크해 보세요.</p>
                              <button type="button" className="pf-ghost" onClick={() => navigate('/list')}>
                                 체험 보러가기
                              </button>
                           </div>
                        ) : (
                           <div className="pf-list">
                              {bookmarks.map((b) => (
                                 <div className="pf-item" key={b.programId}>
                                    <div className="pf-item-main">
                                       <p className="pf-item-title">{b.title || `체험 #${b.programId}`}</p>
                                       <p className="pf-item-sub">저장일: {b.savedAt ? dayjs(b.savedAt).format('YYYY.MM.DD') : '-'}</p>

                                       <div className="pf-item-actions">
                                          <button type="button" className="pf-linkbtn" onClick={() => navigate(`/list/${b.programId}`)}>
                                             상세
                                          </button>
                                          <button type="button" className="pf-linkbtn" onClick={() => removeBookmark(b.programId)}>
                                             북마크 해제
                                          </button>
                                       </div>
                                    </div>

                                    <span className="pf-chip is-wait">북마크</span>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  )}

                  {/* security */}
                  {tab === 'security' && (
                     <div className="pf-panel">
                        <div className="pf-panel-head">
                           <h3 className="pf-panel-title">설정/보안</h3>
                        </div>

                        <div className="pf-actions">
                           <button type="button" className="pf-btn" onClick={() => alert('준비중입니다')}>
                              비밀번호 변경
                           </button>
                           <button type="button" className="pf-btn" onClick={() => alert('준비중입니다')}>
                              로그인 기록 보기
                           </button>
                           <button type="button" className="pf-btn" onClick={() => navigate('/support')}>
                              고객센터
                           </button>
                        </div>

                        <div className="pf-divider" />

                        {/* ✅ 회원탈퇴: 맨 아래 우측 */}
                        <div className="pf-withdraw-row">
                           <button type="button" className="pf-btn is-danger" onClick={() => alert('준비중입니다')}>
                              회원 탈퇴
                           </button>
                        </div>
                     </div>
                  )}
               </section>
            </div>
         </div>
      </main>
   );
}

export default Mypage;
