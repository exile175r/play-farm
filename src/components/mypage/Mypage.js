// src/components/mypage/Mypage.js
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import './Mypage.css';

import { listMyReservations, cancelReservation, refundReservation, normalizeReservationStatus } from '../../services/reservationApi';
import { getMyBookmarks, toggleBookmark as toggleBookmarkApi } from '../../services/bookmarkApi';
import { getMyReviews, updateReview, deleteReview } from '../../services/reviewApi';
import { getMyOrders } from '../../services/orderApi';
import { getMyPoints } from '../../services/pointApi';
import { getMyCart, updateCartItem, removeCartItem, clearCart as clearCartApi } from '../../services/cartApi';
import { changePassword, deleteAccount, updateMyProfile, getMyProfile } from '../../services/userApi';
import { getApiBaseUrl } from '../../utils/apiConfig';

function Mypage() {
   const navigate = useNavigate();
   const location = useLocation();

   // ===== auth =====
   const isLoggedIn = !!localStorage.getItem('token');

   // DB에서 최신 정보를 가져오기 위해 초기값 null 설정 (로컬 스토리지 사용 X)
   const [user, setUser] = useState(null);

   // 프로그램 이름 parse
   const programNameParsed = (list, name) => {
      const replaceText = { 체험: ' 체험', 및: ' 및 ' };
      return list.map((item) => {
         const newItem = { ...item };
         try {
            if (typeof newItem[name] === 'string' && newItem[name].includes(' 체험')) {
               return newItem;
            }
            newItem[name] = JSON.parse(newItem[name])
               .map((v) => v.replace(/체험|및/g, (match) => replaceText[match] || match))
               .join(', ');
         } catch (error) {
            if (typeof newItem[name] === 'string' && !newItem[name].includes(' 체험')) {
               newItem[name] = newItem[name].replace(/체험|및/g, (match) => replaceText[match] || match);
            }
         }
         return newItem;
      });
   };

   // Format: USER + SignupDate(YYYYMMDD) + id(6digits)
   const displayId = useMemo(() => {
      if (!user) return '-';

      // user가 이미 unwrapped 된 상태라고 가정하고 직접 구조분해
      const { created_at, id } = user;

      // 가입일 포맷
      const dateStr = created_at ? dayjs(created_at).format('YYYYMMDD') : dayjs().format('YYYYMMDD');
      // ID 포맷 (6자리 0 패딩)
      const idStr = String(id).padStart(6, '0');

      return `USER${dateStr}${idStr}`;
   }, [user]);

   // 소셜 로그인 여부 (user_id가 social_로 시작하면 소셜 로그인)
   const isSocialLogin = useMemo(() => {
      return user?.user_id && String(user.user_id).startsWith('social_');
   }, [user]);

   const baseDisplayName = user?.nickname || user?.name || user?.user_id || '회원';
   const userId = user?.user_id || user?.id || user?.email || '';

   // 프로필 이미지 URL 변환 헬퍼
   const getFullPhotoUrl = (photoPath) => {
      if (!photoPath) return null;
      if (photoPath.startsWith('data:') || photoPath.startsWith('http')) return photoPath;
      const baseUrl = getApiBaseUrl().replace('/api', '');
      return `${baseUrl}${photoPath}`;
   };

   // Fetch User Profile
   useEffect(() => {
      if (!isLoggedIn) return;

      getMyProfile().then(res => {
         if (res.success && res.data) {
            const userData = res.data.user || res.data;
            setUser(userData);

            // 폼 데이터 초기화
            setAccountForm({
               photo: userData.profile_image || '',
               nickname: userData.nickname || userData.name || userData.user_id || '',
               phone: userData.phone || '',
               email: userData.email || '',
               loginProvider: userData.loginProvider || 'LOCAL',
               lastLoginAt: userData.lastLoginAt || '',
            });

            localStorage.setItem('user', JSON.stringify(userData));
         }
      });
   }, [isLoggedIn]);


   // ===== tabs =====
   // ✅ 기존 tab: account | reservations | reviews | bookmarks | security
   // ✅ 추가 tab: cart (스토어 장바구니)
   // ✅ 추가 tab: store_orders (스토어 주문내역)
   const [tab, setTab] = useState('account');

   // ✅ 상단 섹션 탭: experience | store
   //    - experience: reservations/reviews/bookmarks 중심
   //    - store: cart/store_orders 중심
   const [topSection, setTopSection] = useState('experience');

   // ✅ ListDetail에서 navigate('/mypage', { state: { openTab: 'reservations' } })로 넘어오면 탭 자동 오픈
   useEffect(() => {
      const openTab = location.state?.openTab;
      if (openTab) setTab(openTab);
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   // ✅ tab 변화에 따라 상단 섹션 자동 동기화
   useEffect(() => {
      // store 쪽 탭이면 store 활성화
      if (tab === 'cart' || tab === 'store_orders') {
         if (topSection !== 'store') setTopSection('store');
         return;
      }
      // experience 쪽 탭이면 experience 활성화
      if (tab === 'reservations' || tab === 'reviews' || tab === 'bookmarks') {
         if (topSection !== 'experience') setTopSection('experience');
      }
      // account/security는 공통이라 topSection 유지
   }, [tab, topSection]);

   // ✅ 상단 섹션 탭 클릭 시 대표 탭으로 이동(가독성/UX)
   const goTopExperience = () => {
      setTopSection('experience');
      // experience 대표 탭
      if (!(tab === 'reservations' || tab === 'reviews' || tab === 'bookmarks')) setTab('reservations');
   };

   const goTopStore = () => {
      setTopSection('store');
      // store 대표 탭
      if (!(tab === 'cart' || tab === 'store_orders')) setTab('cart');
   };

   // ===== reservations (localStorage 기반) =====
   const [reservations, setReservations] = useState([]);
   const isLoadingReservationsRef = useRef(false);

   const fetchMyReservations = async () => {
      // 이미 로딩 중이면 중복 요청 방지 (동기적으로 체크)
      if (isLoadingReservationsRef.current) {
         return;
      }

      isLoadingReservationsRef.current = true;
      try {
         const res = await listMyReservations({ userId });
         if (!res?.success) {
            setReservations([]);
            return;
         }

         const rawList = Array.isArray(res.data) ? res.data : [];

         // ✅ (선택) 예약일 "당일 포함 과거" BOOKED+PAID -> COMPLETED 자동 전환(포트폴리오용)
         const { next, changed } = normalizeReservationStatus(rawList);
         if (changed) {
            localStorage.setItem('reservations_program', JSON.stringify(next));
         }

         const parsedList = programNameParsed(next, 'title');

         setReservations(parsedList);
      } catch (error) {
         console.error('예약 목록 조회 실패:', error);
         setReservations([]);
      } finally {
         isLoadingReservationsRef.current = false;
      }
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
   const [myReviews, setMyReviews] = useState([]);
   const [reviewsLoading, setReviewsLoading] = useState(false);

   // 내 후기 로드
   useEffect(() => {
      if (tab === 'reviews' && isLoggedIn) {
         loadMyReviews();
      }
   }, [tab, isLoggedIn]);

   const loadMyReviews = async () => {
      setReviewsLoading(true);
      const result = await getMyReviews();
      if (result.success) {
         setMyReviews(result.data || []);
      }
      setReviewsLoading(false);
   };

   // ===== bookmarks =====
   const [bookmarks, setBookmarks] = useState([]);

   // 서버에서 북마크 목록 가져오기
   const fetchMyBookmarks = useCallback(async () => {
      if (!isLoggedIn) {
         setBookmarks([]);
         return;
      }
      try {
         const res = await getMyBookmarks();
         if (res?.success) {
            const bookmarkList = Array.isArray(res.data?.bookmarks) ? res.data.bookmarks : [];
            const newBookmarkList = programNameParsed(bookmarkList, 'program_nm');
            setBookmarks(newBookmarkList);
         } else {
            setBookmarks([]);
         }
      } catch (error) {
         console.error('북마크 목록 조회 실패:', error);
         setBookmarks([]);
      }
   }, [isLoggedIn]);

   // 북마크 탭이 열릴 때 목록 가져오기
   useEffect(() => {
      if (tab === 'bookmarks' && isLoggedIn) {
         fetchMyBookmarks();
      }
   }, [tab, isLoggedIn, fetchMyBookmarks]);

   const removeBookmark = async (programId) => {
      if (!window.confirm('북마크를 해제하시겠습니까?')) return;

      try {
         const result = await toggleBookmarkApi(programId);
         if (result.success) {
            await fetchMyBookmarks();
         } else {
            console.error(result.message || '북마크 해제에 실패했습니다.');
         }
      } catch (error) {
         console.error(error.message || '북마크 해제에 실패했습니다.');
      }
   };

   // ===== reservation filter =====
   // ✅ 요구사항 반영:
   // - 전체: ALL
   // - 진행중(예약진행중): BOOKED만
   // - 완료(취소완료/체험완료): CANCELLED + COMPLETED
   const [resvFilter, setResvFilter] = useState('ALL'); // ALL | BOOKED | DONE

   // ✅ 완료탭 정렬: 최근 결제일(paidAt) 우선, 없으면 체험일(date) 기준 내림차순
   const getDoneSortTime = (r) => {
      const paid = r?.paidAt ? dayjs(r.paidAt).valueOf() : 0;
      if (paid) return paid;
      const date = r?.date ? dayjs(r.date).valueOf() : 0;
      return date || 0;
   };

   const filteredReservations = useMemo(() => {
      if (resvFilter === 'BOOKED') return reservations.filter((r) => r.paymentStatus !== 'PAID');

      if (resvFilter === 'DONE') {
         const done = reservations.filter((r) => r.paymentStatus === 'PAID');
         return [...done].sort((a, b) => getDoneSortTime(b) - getDoneSortTime(a));
      }

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

   const [selectedFile, setSelectedFile] = useState(null);

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

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
         setAccountForm((prev) => ({ ...prev, photo: String(reader.result) }));
      };
      reader.readAsDataURL(file);
   };

   const saveAccount = async () => {
      const formData = new FormData();
      formData.append('nickname', accountForm.nickname.trim());
      formData.append('phone', accountForm.phone.trim());
      formData.append('email', accountForm.email.trim());

      if (selectedFile) {
         formData.append('profile_image', selectedFile);
      }

      const result = await updateMyProfile(formData);

      if (!result.success) {
         alert(result.error || '정보 수정에 실패했습니다.');
         return;
      }

      // 성공 후 최신 정보 다시 불러오기
      const updated = await getMyProfile();
      if (updated.success) {
         const userData = updated.data.user || updated.data;
         setUser(userData);
         setAccountForm((prev) => ({
            ...prev,
            photo: userData.profile_image || '',
            nickname: userData.nickname || userData.name || userData.user_id || '',
            phone: userData.phone || '',
            email: userData.email || '',
         }));
         localStorage.setItem('user', JSON.stringify(userData));
      }

      setSelectedFile(null);
      setIsEditingAccount(false);
      alert('회원 정보가 수정되었습니다.');
   };

   // ===== security (password change / delete account) =====
   const [pwForm, setPwForm] = useState({
      current: '',
      newPw: '',
      confirmPw: ''
   });
   const [deletePw, setDeletePw] = useState('');

   const handleChangePw = async () => {
      if (!pwForm.current || !pwForm.newPw || !pwForm.confirmPw) {
         alert('모든 항목을 입력해주세요.');
         return;
      }
      if (pwForm.newPw !== pwForm.confirmPw) {
         alert('새 비밀번호가 일치하지 않습니다.');
         return;
      }
      // 비밀번호 유효성 검사 (Signup.js 참조)
      const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
      if (!passwordRegex.test(pwForm.newPw)) {
         alert("비밀번호는 8자 이상, 영문/숫자/특수문자를 포함해야 합니다.");
         return;
      }

      const res = await changePassword(pwForm.current, pwForm.newPw);
      if (res.success) {
         alert('비밀번호가 변경되었습니다. 다시 로그인해주세요.');
         localStorage.removeItem('token');
         localStorage.removeItem('user');
         navigate('/user/login');
      } else {
         alert(res.error);
      }
   };

   const handleDeleteAccount = async () => {
      if (!window.confirm('정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

      // 로컬 로그인 유저만 비밀번호 체크
      if (!isSocialLogin && !deletePw) {
         alert('비밀번호를 입력해주세요.');
         return;
      }

      // 소셜 로그인은 비밀번호 없이(null/empty) 요청
      const res = await deleteAccount(isSocialLogin ? null : deletePw);
      if (res.success) {
         alert('회원 탈퇴가 완료되었습니다.');
         localStorage.removeItem('token');
         localStorage.removeItem('user');
         navigate('/');
         // 필요시 window.location.reload()를 호출하여 상단 헤더 등 상태 초기화 보장
         window.location.reload();
      } else {
         alert(res.error);
      }
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

   const saveEditReview = async (reviewId) => {
      const nextContent = editingContent.trim();
      if (!nextContent) {
         alert('리뷰 내용을 입력해 주세요.');
         return;
      }

      // API로 수정 (이미지는 수정 시 재업로드 필요하지만, 여기서는 내용만 수정)
      const review = myReviews.find((r) => r.id === reviewId);
      if (!review) return;

      const result = await updateReview(reviewId, {
         rating: review.rating,
         content: nextContent,
         images: [], // 이미지는 수정하지 않음
      });

      if (result.success) {
         await loadMyReviews();
         cancelEditReview();
      } else {
         alert(result.error || '후기 수정에 실패했습니다.');
      }
   };

   const deleteMyReview = async (reviewId) => {
      if (!window.confirm('리뷰를 삭제하시겠습니까?')) return;

      const result = await deleteReview(reviewId);
      if (result.success) {
         await loadMyReviews();
         if (editingReviewId === reviewId) cancelEditReview();
      } else {
         alert(result.error || '후기 삭제에 실패했습니다.');
      }
   };

   // ===== helpers =====
   // const logout = () => {
   //   localStorage.removeItem("token");
   //   navigate("/");
   // };

   const goWriteReview = (programId) => {
      navigate(`/list/${programId}`, { state: { openTab: 'review', openComposer: true } });
   };

   // ✅ 결제 상태 라벨
   const paymentLabel = (ps) => {
      if (ps === 'PAID') return '결제 완료';
      if (ps === 'UNPAID') return '결제 필요';
      if (ps === 'FAILED') return '결제 실패';
      if (ps === 'REFUNDED') return '환불';
      return '결제 필요';
   };

   // ✅ 결제 실패 문구 강화: "결제 실패 · 재시도 필요"
   const paymentChipText = (ps) => {
      if (ps === 'FAILED') return '결제 실패 · 재시도 필요';
      return paymentLabel(ps);
   };

   // ✅ 상태칩 메인 문구(요구사항 반영)
   // - BOOKED + PAID : "결제 완료" 단독
   // - BOOKED + (UNPAID/FAILED) : "예약 진행중 · 결제 필요/실패…"
   // - COMPLETED : "체험 완료" (결제상태 표시 제거)
   // - CANCELLED : "취소" (결제상태 표시 제거)
   const chipText = (status, paymentStatus) => {
      if (status === 'BOOKED' && paymentStatus === 'PAID') return '결제 완료';
      if (status === 'BOOKED') return `예약 진행중 · ${paymentChipText(paymentStatus)}`;

      if (status === 'COMPLETED') return '체험 완료';
      if (status === 'CANCELLED') return '취소';

      return '진행중';
   };

   // ✅ 결제 실패면 칩 색도 강하게: is-fail
   const statusClass = (status, paymentStatus) => {
      if (status === 'BOOKED' && paymentStatus === 'FAILED') return 'is-fail';
      if (status === 'COMPLETED') return 'is-ok';
      if (status === 'CANCELLED') return 'is-cancel';
      if (status === 'BOOKED') return 'is-wait';
      return 'is-wait';
   };

   // ✅ 예약 취소(미결제)
   const handleCancelReservation = async (bookingId) => {
      if (!window.confirm('예약을 취소하시겠습니까?')) return;

      const res = await cancelReservation({ bookingId, userId });
      if (!res?.success) {
         alert(res?.error?.message || '예약 취소에 실패했습니다. 잠시 후 다시 시도해 주세요.');
         return;
      }

      await fetchMyReservations();
   };

   // ✅ 결제 취소(환불)
   const handleRefundReservation = async (bookingId) => {
      if (!window.confirm('결제를 취소(환불)하시겠습니까?')) return;

      const res = await refundReservation({ bookingId, userId, reason: '사용자 요청' });
      if (!res?.success) {
         alert(res?.error?.message || '환불 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.');
         return;
      }

      alert('결제 취소(환불)가 정상적으로 처리되었습니다.');
      await fetchMyReservations();
   };

   // ===== store cart (API 기반) =====
   const [cartItems, setCartItems] = useState([]);
   const [cartLoading, setCartLoading] = useState(false);

   const loadCart = useCallback(async () => {
      if (!isLoggedIn) {
         setCartItems([]);
         return;
      }
      setCartLoading(true);
      try {
         const result = await getMyCart();
         if (result.success) {
            setCartItems(Array.isArray(result.data) ? result.data : []);
         } else {
            console.error('장바구니 조회 실패:', result.error);
            setCartItems([]);
         }
      } catch (error) {
         console.error('장바구니 조회 오류:', error);
         setCartItems([]);
      } finally {
         setCartLoading(false);
      }
   }, [isLoggedIn]);

   useEffect(() => {
      if (tab === 'cart' && isLoggedIn) {
         loadCart();
      }
   }, [tab, isLoggedIn, loadCart]);

   const calcCartItemTotal = (it) => {
      const price = Number(it.price || 0);
      const qty = Number(it.qty || 1);
      return price * qty;
   };

   const cartTotal = useMemo(() => {
      return cartItems.reduce((sum, it) => sum + calcCartItemTotal(it), 0);
   }, [cartItems]);

   const updateCartQty = async (cartItemId, nextQty) => {
      const qty = Math.max(1, Number(nextQty || 1));
      try {
         const result = await updateCartItem(cartItemId, { quantity: qty });
         if (result.success) {
            await loadCart(); // API에서 다시 조회
         } else {
            alert(result.error?.message || '수량 수정에 실패했습니다.');
         }
      } catch (error) {
         console.error('수량 수정 오류:', error);
         alert('수량 수정에 실패했습니다.');
      }
   };

   const removeCartItemHandler = async (cartItemId) => {
      if (!window.confirm('장바구니에서 삭제하시겠습니까?')) return;
      try {
         const result = await removeCartItem(cartItemId);
         if (result.success) {
            await loadCart(); // API에서 다시 조회
         } else {
            alert(result.error?.message || '삭제에 실패했습니다.');
         }
      } catch (error) {
         console.error('삭제 오류:', error);
         alert('삭제에 실패했습니다.');
      }
   };

   const clearCart = async () => {
      if (!window.confirm('장바구니를 비우시겠습니까?')) return;
      try {
         const result = await clearCartApi();
         if (result.success) {
            await loadCart(); // API에서 다시 조회
         } else {
            alert(result.error?.message || '장바구니 비우기에 실패했습니다.');
         }
      } catch (error) {
         console.error('장바구니 비우기 오류:', error);
         alert('장바구니 비우기에 실패했습니다.');
      }
   };

   const goShop = () => {
      navigate('/shop');
   };

   // ✅ 스토어 결제하기 → CheckoutPage(shop)
   const goStoreCheckout = () => {
      if (cartItems.length === 0) {
         alert('장바구니가 비어 있습니다.');
         return;
      }
      navigate('/checkout?type=shop');
   };

   // ===== store orders (API) =====
   const [storeOrders, setStoreOrders] = useState([]);
   const [storeOrdersLoading, setStoreOrdersLoading] = useState(false);

   const loadStoreOrders = useCallback(async () => {
      if (!isLoggedIn) {
         setStoreOrders([]);
         return;
      }
      setStoreOrdersLoading(true);
      try {
         const result = await getMyOrders();
         if (result.success) {
            setStoreOrders(Array.isArray(result.data) ? result.data : []);
         } else {
            console.error('주문 내역 조회 실패:', result.error);
            setStoreOrders([]);
         }
      } catch (error) {
         console.error('주문 내역 조회 오류:', error);
         setStoreOrders([]);
      } finally {
         setStoreOrdersLoading(false);
      }
   }, [isLoggedIn]);

   useEffect(() => {
      if (tab === 'store_orders' && isLoggedIn) {
         loadStoreOrders();
      }
   }, [tab, isLoggedIn, loadStoreOrders]);

   // ===== points =====
   const [points, setPoints] = useState(0);
   const [pointsLoading, setPointsLoading] = useState(false);

   const loadPoints = useCallback(async () => {
      if (!isLoggedIn) {
         setPoints(0);
         return;
      }
      setPointsLoading(true);
      try {
         const result = await getMyPoints();
         if (result.success) {
            setPoints(Number(result.data?.points || 0));
         } else {
            console.error('포인트 조회 실패:', result.error);
         }
      } catch (error) {
         console.error('포인트 조회 오류:', error);
      } finally {
         setPointsLoading(false);
      }
   }, [isLoggedIn]);

   useEffect(() => {
      if (isLoggedIn) {
         loadPoints();
      }

      // 포인트 업데이트 이벤트 리스너
      const handlePointUpdate = () => {
         loadPoints();
      };
      window.addEventListener('pointUpdated', handlePointUpdate);

      return () => {
         window.removeEventListener('pointUpdated', handlePointUpdate);
      };
   }, [isLoggedIn, loadPoints]);

   // ===== not logged in =====
   if (!isLoggedIn) {
      return (
         <main className="pf-mypage">
            <div className="pf-mypage-inner">
               <header className="pf-head">
                  <h2 className="pf-title">마이페이지</h2>
                  <div className="pf-divider" />
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
            <style>{`
               .pf-security-section { padding: 20px 0; }
               .pf-sec-title { font-size: 18px; font-weight: 600; margin-bottom: 12px; }
               .pf-sec-title.danger { color: #e74c3c; }
               .pf-sec-desc { font-size: 14px; color: #666; margin-bottom: 16px; }
               .pf-form-row { margin-bottom: 16px; max-width: 400px; }
               .pf-form-row label { display: block; font-size: 14px; margin-bottom: 6px; font-weight: 500; }
               .pf-btn-small { padding: 8px 16px; background: #333; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
               .pf-btn-small.danger { background: #e74c3c; }
            `}</style>
            <header className="pf-head">
               <h2 className="pf-title">마이페이지</h2>
               <div className="pf-divider" />

               {/* ✅ 상단 섹션 탭(체험/스토어) */}
               <div className="pf-top-tabs">
                  <button type="button" className={`pf-top-tab ${topSection === 'experience' ? 'is-active' : ''}`} onClick={goTopExperience}>
                     체험
                  </button>
                  <button type="button" className={`pf-top-tab ${topSection === 'store' ? 'is-active' : ''}`} onClick={goTopStore}>
                     스토어
                  </button>
               </div>
            </header>

            <div className="pf-grid">
               <aside className="pf-left">
                  <div className="pf-profile">
                     <div className="pf-avatar">{accountForm.photo ? <img src={getFullPhotoUrl(accountForm.photo)} alt="profile" /> : <span>{String(baseDisplayName).slice(0, 1)}</span>}</div>
                     <div className="pf-profile-meta">
                        <p className="pf-profile-name">{baseDisplayName}</p>
                        {/* 
                           User ID Display Rule: 
                           1. If user_id exists (e.g. manually signed up), show it.
                           2. If not, generate 'MEMBER_{id}' formatted string.
                        */}
                        <p className="pf-profile-id">ID: {displayId}</p>
                        {!pointsLoading && (
                           <p className="pf-profile-points" style={{ marginTop: '4px', color: '#666', fontSize: '14px' }}>
                              보유 포인트: {points.toLocaleString()}P
                           </p>
                        )}
                     </div>
                  </div>

                  {/* ✅ 상단 섹션에 따라 왼쪽 메뉴가 바뀜 */}
                  <nav className="pf-tabs">
                     {topSection === 'experience' && (
                        <>
                           <button type="button" className={`pf-tab ${tab === 'reservations' ? 'is-active' : ''}`} onClick={() => setTab('reservations')}>
                              예약/체험관리
                           </button>
                           <button type="button" className={`pf-tab ${tab === 'bookmarks' ? 'is-active' : ''}`} onClick={() => setTab('bookmarks')}>
                              북마크
                           </button>
                           <button type="button" className={`pf-tab ${tab === 'reviews' ? 'is-active' : ''}`} onClick={() => setTab('reviews')}>
                              리뷰
                           </button>
                        </>
                     )}

                     {topSection === 'store' && (
                        <>
                           <button type="button" className={`pf-tab ${tab === 'cart' ? 'is-active' : ''}`} onClick={() => setTab('cart')}>
                              장바구니
                           </button>

                           <button type="button" className={`pf-tab ${tab === 'store_orders' ? 'is-active' : ''}`} onClick={() => setTab('store_orders')}>
                              주문내역
                           </button>
                        </>
                     )}

                     <div className="pf-tabs-divider" />

                     <button type="button" className={`pf-tab ${tab === 'account' ? 'is-active' : ''}`} onClick={() => setTab('account')}>
                        프로필/계정
                     </button>
                     <button type="button" className={`pf-tab ${tab === 'security' ? 'is-active' : ''}`} onClick={() => setTab('security')}>
                        설정/보안
                     </button>
                     {/* 관리자 링크 (localStorage isAdmin 체크) */}
                     {localStorage.getItem('isAdmin') === 'true' && (
                        <button type="button" className="pf-tab admin-link-btn" onClick={() => window.location.href = '/admin'}>
                           관리자 페이지
                        </button>
                     )}
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
                                    <img src={getFullPhotoUrl(accountForm.photo)} alt="profile" />
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
                                 // ✅ 1안: 결제 완료 + 체험 완료만 리뷰 작성 가능
                                 const canWrite = it.status === 'COMPLETED' && it.paymentStatus === 'PAID';

                                 // ✅ BOOKED + 결제 전(UNPAID/FAILED)만 취소 가능
                                 const canCancel = it.status === 'BOOKED' && it.paymentStatus !== 'PAID';

                                 // ✅ BOOKED + PAID는 “환불(결제취소)” 가능
                                 const canRefund = it.status === 'BOOKED' && it.paymentStatus === 'PAID';

                                 // ✅ 결제하기: BOOKED + UNPAID/FAILED 만
                                 const needPay = it.status === 'BOOKED' && it.paymentStatus !== 'PAID';

                                 // ✅ 완료탭(DONE)에서는 결제 버튼 숨김
                                 const hidePayBtn = resvFilter === 'DONE' || it.status !== 'BOOKED';

                                 // ✅ 결제 실패면 "재결제" 문구
                                 const payBtnText = it.paymentStatus === 'FAILED' ? '재결제' : '결제하기';

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

                                             {/* ✅ 완료탭(DONE)에서는 결제 버튼 숨김 */}
                                             {!hidePayBtn && (
                                                <button
                                                   type="button"
                                                   className={`pf-linkbtn ${needPay ? '' : 'is-disabled'}`}
                                                   onClick={() => {
                                                      if (!needPay) return;
                                                      navigate(`/checkout/${it.bookingId}`);
                                                   }}
                                                   disabled={!needPay}
                                                   title={!needPay ? '이미 결제 완료된 예약입니다.' : ''}>
                                                   {payBtnText}
                                                </button>
                                             )}

                                             {/* ✅ 결제 완료된 예약은 “예약 취소” 대신 “결제 취소(환불)” */}
                                             {canRefund ? (
                                                <button type="button" className="pf-linkbtn" onClick={() => handleRefundReservation(it.bookingId)}>
                                                   결제 취소
                                                </button>
                                             ) : null}

                                             <button
                                                type="button"
                                                className={`pf-linkbtn ${canWrite ? '' : 'is-disabled'}`}
                                                onClick={() => goWriteReview(it.programId)}
                                                disabled={!canWrite}
                                                title={!canWrite ? '결제 완료 + 체험 완료 후 리뷰 작성이 가능합니다.' : ''}>
                                                리뷰 작성
                                             </button>

                                             {/* ✅ 미결제/실패만 예약 취소 가능 */}
                                             {canCancel ? (
                                                <button type="button" className="pf-linkbtn" onClick={() => handleCancelReservation(it.bookingId)}>
                                                   예약 취소
                                                </button>
                                             ) : null}
                                          </div>
                                       </div>

                                       {/* ✅ 상태칩 */}
                                       <span className={`pf-chip ${statusClass(it.status, it.paymentStatus)}`}>{chipText(it.status, it.paymentStatus)}</span>
                                    </div>
                                 );
                              })}
                           </div>
                        )}
                     </div>
                  )}

                  {/* cart */}
                  {tab === 'cart' && (
                     <div className="pf-panel">
                        <div className="pf-panel-head">
                           <h3 className="pf-panel-title">장바구니</h3>

                           <div className="pf-cart-head-actions">
                              <button type="button" className={`pf-ghost ${cartItems.length === 0 ? 'is-disabled' : ''}`} onClick={clearCart} disabled={cartItems.length === 0 || cartLoading}>
                                 비우기
                              </button>
                              <button type="button" className="pf-ghost" onClick={goShop}>
                                 스토어 가기
                              </button>
                           </div>
                        </div>

                        {cartLoading ? (
                           <div className="pf-empty">
                              <p className="pf-empty-title">장바구니를 불러오는 중...</p>
                           </div>
                        ) : cartItems.length === 0 ? (
                           <div className="pf-empty">
                              <p className="pf-empty-title">장바구니가 비어 있습니다</p>
                              <p className="pf-empty-desc">스토어에서 상품을 담아 보세요.</p>
                              <button type="button" className="pf-ghost" onClick={goShop}>
                                 스토어 보러가기
                              </button>
                           </div>
                        ) : (
                           <>
                              <div className="pf-list">
                                 {cartItems.map((it) => {
                                    const lineTotal = calcCartItemTotal(it);
                                    return (
                                       <div className="pf-item" key={it.cartItemId}>
                                          <div className="pf-item-main">
                                             <p className="pf-item-title">{it.name || it.title || `상품 #${it.id}`}</p>

                                             <p className="pf-item-sub">
                                                {it.optionName ? `옵션: ${it.optionName} · ` : ''}
                                                단가 {Number(it.price || 0).toLocaleString()}원 · 합계 {Number(lineTotal).toLocaleString()}원
                                             </p>

                                             <div className="pf-item-actions">
                                                <button type="button" className="pf-linkbtn" onClick={() => navigate(`/shop/${it.id}`)}>
                                                   상세
                                                </button>

                                                <div className="pf-qty">
                                                   <button type="button" className="pf-qty-btn" onClick={() => updateCartQty(it.cartItemId, Number(it.qty || 1) - 1)}>
                                                      −
                                                   </button>
                                                   <input
                                                      className="pf-qty-input"
                                                      value={Number(it.qty || 1)}
                                                      onChange={(e) => updateCartQty(it.cartItemId, e.target.value)}
                                                      inputMode="numeric"
                                                   />
                                                   <button type="button" className="pf-qty-btn" onClick={() => updateCartQty(it.cartItemId, Number(it.qty || 1) + 1)}>
                                                      +
                                                   </button>
                                                </div>

                                                <button type="button" className="pf-linkbtn" onClick={() => removeCartItemHandler(it.cartItemId)}>
                                                   삭제
                                                </button>
                                             </div>
                                          </div>

                                          <span className="pf-chip is-wait">스토어</span>
                                       </div>
                                    );
                                 })}
                              </div>

                              <div className="pf-cart-summary">
                                 <div className="pf-cart-sum-row">
                                    <span className="k">총 결제 금액</span>
                                    <span className="v">{cartTotal.toLocaleString()}원</span>
                                 </div>

                                 <button type="button" className="pf-cta" onClick={goStoreCheckout}>
                                    결제하기
                                 </button>
                              </div>
                           </>
                        )}
                     </div>
                  )}

                  {/* store_orders */}
                  {tab === 'store_orders' && (
                     <div className="pf-panel">
                        <div className="pf-panel-head">
                           <h3 className="pf-panel-title">주문내역</h3>
                           <button type="button" className="pf-ghost" onClick={loadStoreOrders}>
                              새로고침
                           </button>
                        </div>

                        {storeOrdersLoading ? (
                           <div className="pf-empty">
                              <p className="pf-empty-title">주문내역을 불러오는 중...</p>
                           </div>
                        ) : storeOrders.length === 0 ? (
                           <div className="pf-empty">
                              <p className="pf-empty-title">주문내역이 없습니다</p>
                              <p className="pf-empty-desc">스토어에서 결제한 주문이 이곳에 표시됩니다.</p>
                              <button type="button" className="pf-ghost" onClick={() => setTab('cart')}>
                                 장바구니 보기
                              </button>
                           </div>
                        ) : (
                           <div className="pf-list">
                              {storeOrders.map((o) => {
                                 const items = Array.isArray(o.items) ? o.items : [];
                                 const firstTitle = items[0]?.productTitle || '상품';
                                 const count = items.length;

                                 // ✅ 상태 표시 강화: PAID/CANCELLED/REFUNDED 반영
                                 const statusText = o.status === 'PAID' ? '결제 완료' : o.status === 'CANCELLED' ? '취소' : o.status === 'REFUNDED' ? '환불' : '처리중';

                                 const chipClass = o.status === 'PAID' ? 'is-ok' : o.status === 'REFUNDED' ? 'is-fail' : o.status === 'CANCELLED' ? 'is-cancel' : 'is-wait';

                                 return (
                                    <div className="pf-item" key={o.orderId}>
                                       <div className="pf-item-main">
                                          <p className="pf-item-title">
                                             {firstTitle}
                                             {count > 1 ? ` 외 ${count - 1}개` : ''}
                                          </p>

                                          <p className="pf-item-sub">
                                             주문번호: {o.orderId}
                                             {' · '}주문일: {o.createdAt ? dayjs(o.createdAt).format('YYYY.MM.DD HH:mm') : '-'}
                                             {' · '}결제수단: {o.payment?.method || '-'}
                                             {' · '}결제금액: {Number(o.totalAmount || 0).toLocaleString()}원
                                          </p>

                                          {/* ✅ NEW: 주문 상세로 이동 */}
                                          <div className="pf-item-actions">
                                             <button type="button" className="pf-linkbtn" onClick={() => navigate(`/orders/${o.orderId}`)}>
                                                주문 상세
                                             </button>

                                             {items?.[0]?.productId ? (
                                                <button type="button" className="pf-linkbtn" onClick={() => navigate(`/shop/${items[0].productId}`)}>
                                                   상품 상세
                                                </button>
                                             ) : null}
                                          </div>
                                       </div>

                                       <span className={`pf-chip ${chipClass}`}>{statusText}</span>
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

                        {reviewsLoading ? (
                           <div className="pf-empty">
                              <p className="pf-empty-title">리뷰를 불러오는 중입니다</p>
                              <p className="pf-empty-desc">잠시만 기다려 주세요.</p>
                           </div>
                        ) : myReviews.length === 0 ? (
                           <div className="pf-empty">
                              <p className="pf-empty-title">작성한 리뷰가 없습니다</p>
                              <p className="pf-empty-desc">체험 완료 + 결제 완료 예약에서 리뷰를 작성할 수 있습니다.</p>
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
                                             {r.images.map((src, idx) => (
                                                <img key={`${r.id}_${idx}`} src={`${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}${src}`} alt={`review-${idx}`} />
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
                                             <button type="button" className="pf-linkbtn" onClick={() => removeBookmark(programId)}>
                                                북마크 해제
                                             </button>
                                          </div>
                                       </div>

                                       <span className="pf-chip is-wait">북마크</span>
                                    </div>
                                 );
                              })}
                           </div>
                        )}
                     </div>
                  )}

                  {/* security */}
                  {/* security */}
                  {/* 소셜 로그인 유저는 비밀번호 변경 불가 (비밀번호가 없거나 관리되지 않음) */}
                  {tab === 'security' && (
                     <div className="pf-panel">
                        <div className="pf-panel-head">
                           <h3 className="pf-panel-title">설정/보안</h3>
                        </div>

                        {!isSocialLogin && (
                           <div className="pf-security-section">
                              <h4 className="pf-sec-title">비밀번호 변경</h4>
                              <div className="pf-form-row">
                                 <label>현재 비밀번호</label>
                                 <input
                                    type="password"
                                    className="pf-input"
                                    value={pwForm.current}
                                    onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                                 />
                              </div>
                              <div className="pf-form-row">
                                 <label>새 비밀번호</label>
                                 <input
                                    type="password"
                                    className="pf-input"
                                    placeholder="8자 이상, 영문/숫자/특수문자 포함"
                                    value={pwForm.newPw}
                                    onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })}
                                 />
                              </div>
                              <div className="pf-form-row">
                                 <label>새 비밀번호 확인</label>
                                 <input
                                    type="password"
                                    className="pf-input"
                                    value={pwForm.confirmPw}
                                    onChange={(e) => setPwForm({ ...pwForm, confirmPw: e.target.value })}
                                 />
                              </div>
                              <button type="button" className="pf-btn-small" onClick={handleChangePw}>변경하기</button>
                           </div>
                        )}

                        {!isSocialLogin && <div className="pf-divider" />}

                        <div className="pf-security-section delete-account">
                           <h4 className="pf-sec-title danger">회원 탈퇴</h4>
                           <p className="pf-sec-desc">탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.</p>

                           {!isSocialLogin ? (
                              <div className="pf-form-row">
                                 <label>비밀번호 확인</label>
                                 <input
                                    type="password"
                                    className="pf-input"
                                    placeholder="본인 확인을 위해 비밀번호를 입력해주세요"
                                    value={deletePw}
                                    onChange={(e) => setDeletePw(e.target.value)}
                                 />
                              </div>
                           ) : (
                              <p className="pf-sec-desc" style={{ color: '#666', marginBottom: '10px' }}>
                                 소셜 로그인 사용자는 비밀번호 입력 없이 탈퇴할 수 있습니다.
                              </p>
                           )}

                           <button type="button" className="pf-btn-small danger" onClick={handleDeleteAccount}>회원 탈퇴</button>
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
