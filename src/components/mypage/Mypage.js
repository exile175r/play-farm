// src/components/mypage/Mypage.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import './Mypage.css';

import { listMyReservations, cancelReservation } from '../../services/reservationApi';
import { getMyBookmarks } from '../../services/bookmarkApi';
import { useBookmark } from '../../hooks/useBookmark';

function Mypage() {
   const navigate = useNavigate();
   const location = useLocation();

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
   const userId = user?.user_id || user?.id || user?.email || '';

   // ===== tabs =====
   const [tab, setTab] = useState('account'); // account | reservations | reviews | bookmarks | security

   // ✅ ListDetail에서 navigate('/mypage', { state: { openTab: 'reservations' } })로 넘어오면 탭 자동 오픈
   useEffect(() => {
      const openTab = location.state?.openTab;
      if (openTab) setTab(openTab);
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   // ===== reservations (✅ mock 제거, localStorage 기반) =====
   const [reservations, setReservations] = useState([]);

   const fetchMyReservations = async () => {
      const res = await listMyReservations({ userId });
      if (res?.success) setReservations(Array.isArray(res.data) ? res.data : []);
      else setReservations([]);
   };

   useEffect(() => {
      if (!isLoggedIn) return;
      fetchMyReservations();
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [isLoggedIn, userId]);

   // 다른 탭/페이지에서 예약이 추가되었을 때 반영(같은 탭에서라면 storage 이벤트는 안 뜰 수 있음)
   useEffect(() => {
      const onStorage = (e) => {
         if (e.key !== 'reservations_program') return;
         fetchMyReservations();
      };
      window.addEventListener('storage', onStorage);
      return () => window.removeEventListener('storage', onStorage);
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [userId]);

   // ===== reviews =====
   const [myReviews, setMyReviews] = useState(() => {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith('reviews_program_'));
      let merged = [];
      keys.forEach((k) => {
         try {
            const list = JSON.parse(localStorage.getItem(k) || '[]');
            if (Array.isArray(list)) merged = merged.concat(list);
         } catch {}
      });
      return merged.filter((r) => (r?.user || '').trim() === baseDisplayName).sort((a, b) => (b?.date || '').localeCompare(a?.date || ''));
   });

   // ===== bookmarks =====
   const [bookmarks, setBookmarks] = useState([]);
   
   // 서버에서 북마크 목록 가져오기
   const fetchMyBookmarks = async () => {
      if (!isLoggedIn) {
         setBookmarks([]);
         return;
      }
      try {
         const res = await getMyBookmarks();
         if (res?.success) {
            const bookmarkList = Array.isArray(res.data?.bookmarks) ? res.data.bookmarks : [];
            const replaceText = { 체험: " 체험", 및: " 및 " };
            const newBookmarkList = bookmarkList.map((item) => {
               const newItem = { ...item };
               try {
                  if (typeof newItem.program_nm === "string" && newItem.program_nm.includes(" 체험")) {
                     return newItem;
                  }
                  newItem.program_nm = JSON.parse(newItem.program_nm)
                     .map((v) => v.replace(/체험|및/g, (match) => replaceText[match] || match))
                     .join(", ");
               } catch (error) {
                  if (typeof newItem.program_nm === "string" && !newItem.program_nm.includes(" 체험")) {
                     newItem.program_nm = newItem.program_nm.replace(/체험|및/g, (match) => replaceText[match] || match);
                  }
               }
               return newItem;
            });
            setBookmarks(newBookmarkList);
         } else {
            setBookmarks([]);
         }
      } catch (error) {
         console.error('북마크 목록 조회 실패:', error);
         setBookmarks([]);
      }
   };
   // 북마크 탭이 열릴 때 목록 가져오기
   useEffect(() => {
      if (tab === 'bookmarks' && isLoggedIn) {
         fetchMyBookmarks();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [tab, isLoggedIn]);
      
      // ✅ 북마크 훅 사용
   // 북마크 목록에서 program_id 추출 (서버 응답 형식에 맞게 조정)
   const programIds = useMemo(() => {
      return bookmarks.map((b) => b.program_id || b.programId).filter(Boolean);
   }, [bookmarks]);
   
   // isBookmarked: 북마크 상태, toggleBookmark: 북마크 토글, isLoggedIn: 로그인 여부
   const { isBookmarked, toggleBookmark } = useBookmark(programIds);

   // ✅ 북마크 토글 핸들러
   const handleToggleBookmark = useCallback(
      async (bookmarkData) => {
         if (!isLoggedIn) return;
         
         const programId = bookmarkData.program_id || bookmarkData.programId;
         if (!programId) return;
         
         const result = await toggleBookmark(programId, bookmarkData);
         
         if (result.success) {
            // 북마크 목록 갱신
            await fetchMyBookmarks();
         } else if (result.requiresLogin) {
            alert('북마크 기능을 사용하려면 로그인이 필요합니다.');
         }
      },
      [toggleBookmark, isLoggedIn]
   );

   const removeBookmark = async (programId) => {
      if (!window.confirm('북마크를 해제하시겠습니까?')) return;
      
      const result = await toggleBookmark(programId);
      if (result.success) {
         // 북마크 목록 갱신
         await fetchMyBookmarks();
      } else {
         alert(result.message || '북마크 해제에 실패했습니다.');
      }
   };

   // ===== reservation filter =====
   // ✅ 요구사항 반영:
   // - 전체: ALL
   // - 진행중(예약진행중): BOOKED만
   // - 완료(취소완료/체험완료): CANCELLED + COMPLETED
   const [resvFilter, setResvFilter] = useState('ALL'); // ALL | BOOKED | DONE
   const filteredReservations = useMemo(() => {
      if (resvFilter === 'BOOKED') return reservations.filter((r) => r.status === 'BOOKED');
      if (resvFilter === 'DONE') return reservations.filter((r) => r.status === 'COMPLETED' || r.status === 'CANCELLED');
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

      const keys = Object.keys(localStorage).filter((k) => k.startsWith('reviews_program_'));
      keys.forEach((k) => {
         try {
            const list = JSON.parse(localStorage.getItem(k) || '[]');
            if (!Array.isArray(list)) return;

            const next = list.map((r) => {
               if (r.id !== reviewId) return r;
               return { ...r, content: nextContent, editedAt: new Date().toISOString() };
            });

            localStorage.setItem(k, JSON.stringify(next));
         } catch {}
      });

      setMyReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, content: nextContent, editedAt: new Date().toISOString() } : r)));

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

   // ✅ 예약 취소
   const handleCancelReservation = async (bookingId) => {
      if (!window.confirm('예약을 취소하시겠습니까?')) return;

      const res = await cancelReservation({ bookingId, userId });
      if (!res?.success) {
         alert(res?.error?.message || '예약 취소 실패');
         return;
      }

      // 화면 갱신
      await fetchMyReservations();
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
                     <p className="pf-empty-desc">내 정보, 예약 내역, 북마크 목록을 확인하려면 로그인해 주세요.</p>
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
            <header className="pf-head">
               <div className="pf-head-row">
                  <h2 className="pf-title">마이페이지</h2>
               </div>
            </header>

            <div className="pf-grid">
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
                        북마크
                     </button>
                     <button type="button" className={`pf-tab ${tab === 'security' ? 'is-active' : ''}`} onClick={() => setTab('security')}>
                        설정/보안
                     </button>
                  </nav>
               </aside>

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
                              <button type="button" className={`pf-seg-btn ${resvFilter === 'BOOKED' ? 'is-active' : ''}`} onClick={() => setResvFilter('BOOKED')}>
                                 진행중
                              </button>
                              <button type="button" className={`pf-seg-btn ${resvFilter === 'DONE' ? 'is-active' : ''}`} onClick={() => setResvFilter('DONE')}>
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

                                 // ✅ BOOKED만 취소 가능
                                 const canCancel = it.status === 'BOOKED';

                                 return (
                                    <div className="pf-item" key={it.bookingId}>
                                       <div className="pf-item-main">
                                          <p className="pf-item-title">{it.title}</p>
                                          <p className="pf-item-sub">
                                             체험일: {it.date ? dayjs(it.date).format('YYYY.MM.DD') : '-'}
                                             {it.time ? ` · ${it.time}` : ''}
                                             {' · '}인원 {it.people}명 {' · '}
                                             {Number(it.price || 0).toLocaleString()}원
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
                                                className={`pf-linkbtn ${canCancel ? '' : 'is-disabled'}`}
                                                onClick={() => {
                                                   if (!canCancel) return;
                                                   handleCancelReservation(it.bookingId);
                                                }}
                                                disabled={!canCancel}
                                                title={!canCancel ? '진행중(BOOKED) 예약만 취소할 수 있습니다.' : ''}>
                                                예약 취소
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
                           <h3 className="pf-panel-title">북마크</h3>
                        </div>

                        {bookmarks.length === 0 ? (
                           <div className="pf-empty">
                              <p className="pf-empty-title">북마크한 체험이 없습니다</p>
                              <p className="pf-empty-desc">마음에 드는 체험을 북마크해 보세요.</p>
                              <button type="button" className="pf-ghost" onClick={() => navigate('/list')}>
                                 체험 보러가기
                              </button>
                           </div>
                        ) : (
                           <div className="pf-list">
                              {bookmarks.map((b) => {
                                 const programId = b.program_id || b.programId;
                                 const bookmarked = isBookmarked(programId); // ✅ 북마크 상태 확인
                                 
                                 return (
                                    <div className="pf-item" key={b.id || programId}>
                                       <div className="pf-item-main">
                                          <p className="pf-item-title">{b.program_nm || b.title || `체험 #${programId}`}</p>
                                          <p className="pf-item-sub">
                                             {b.village_nm ? `${b.village_nm} · ` : ''}
                                             저장일: {b.created_at ? dayjs(b.created_at).format('YYYY.MM.DD') : '-'}
                                          </p>

                                          <div className="pf-item-actions">
                                             <button type="button" className="pf-linkbtn" onClick={() => navigate(`/list/${programId}`)}>
                                                상세
                                             </button>
                                             {/* ✅ handleToggleBookmark 사용 (또는 removeBookmark) */}
                                             <button 
                                                type="button" 
                                                className="pf-linkbtn" 
                                                onClick={() => removeBookmark(programId)}
                                             >
                                                북마크 해제
                                             </button>
                                          </div>
                                       </div>

                                       <span className={`pf-chip ${bookmarked ? 'is-wait' : ''}`}>
                                          북마크
                                       </span>
                                    </div>
                                 );
                              })}
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
