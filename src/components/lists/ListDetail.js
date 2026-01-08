// src/components/lists/ListDetail.js
import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import "./ListDetail.css";
import { getProgramById } from "../../services/programApi";
import { createReview, getReviewsByProgram, deleteReview } from "../../services/reviewApi";
import { getImagePath } from "../../utils/imagePath";
import { useBookmark } from "../../hooks/useBookmark";
import dayjs from "dayjs";

import ReservationModal from "../reservation/ReservationModal";

// ✅ 추가: 체험 완료 여부(내 예약) 체크용
import { listMyReservations, normalizeReservationStatus } from "../../services/reservationApi";
import { useProgramParsing } from "../../hooks/useProgramParsing";

function ListDetail() {
  const [data, setData] = useState(null);
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("schedule");

  // ✅ 예약 모달
  const [isReserveOpen, setIsReserveOpen] = useState(false);

  // ✅ 이미지 상세 보기 모달
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  // kakao map
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // 로그인 여부
  const isLoggedIn = !!localStorage.getItem("token");

  // 유저 정보
  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  // 화면 표시 이름
  const displayName = user?.nickname || user?.name || user?.user_id || "익명";

  // ✅ “본인 판별용” ID: DB의 PK(id)를 최우선으로 사용해야 함
  const myUserId = user?.id || user?.user_id || user?.email || null;

  // ✅ 북마크 훅 사용 (단일 프로그램)
  const { isBookmarked, toggleBookmark, loadBookmarkStatus } = useBookmark();

  // ✅ 프로그램 상세 로드 시 북마크 상태 확인
  useEffect(() => {
    if (id && isLoggedIn) {
      loadBookmarkStatus(id);
    }
  }, [id, isLoggedIn, loadBookmarkStatus]);

  // ✅ 북마크 토글 핸들러
  const handleToggleBookmark = useCallback(async () => {
    if (!data || !id || !isLoggedIn) return;
    const result = await toggleBookmark(id, data);
    if (!result.success && result.requiresLogin) {
      // 로그인 필요 시 처리 (선택사항)
      // alert('로그인이 필요합니다.');
    }
  }, [data, id, toggleBookmark, isLoggedIn]);

  // reviews
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // ✅ 추가: 내 예약(체험 완료 여부 판단용)
  const [myReservations, setMyReservations] = useState([]);
  const [myResvLoading, setMyResvLoading] = useState(false);

  // review form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState("");
  const [reviewFiles, setReviewFiles] = useState([]);
  const [reviewPreviews, setReviewPreviews] = useState([]);

  // 체험명 가공 Hook
  const { parseProgramName } = useProgramParsing();

  const fetchProgramDetail = async (programId) => {
    try {
      const result = await getProgramById(programId);
      if (result.success) {
        if (result.data) {
          result.data.program_nm = parseProgramName(result.data.program_nm);
        }
        setData(result.data || null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchProgramDetail(id);
  }, [id]);

  const loadReviews = useCallback(async () => {
    setReviewsLoading(true);
    const result = await getReviewsByProgram(id);
    if (result.success) {
      setReviews(result.data || []);
    }
    setReviewsLoading(false);
  }, [id]);

  useEffect(() => {
    const openTab = location.state?.openTab;
    if (openTab) setActiveTab(openTab);
  }, [location.state?.openTab]);

  // 후기 목록 로드
  useEffect(() => {
    if (!id) return;
    loadReviews();
  }, [id, loadReviews]);

  // ✅ 추가: 내 예약 로드 (체험 완료된 예약만 리뷰 작성 가능)
  useEffect(() => {
    if (!isLoggedIn || !myUserId) {
      setMyReservations([]);
      return;
    }

    (async () => {
      setMyResvLoading(true);

      const result = await listMyReservations({ userId: myUserId });
      const list = result.success ? result.data || [] : [];

      // ✅ 예약일 지난 BOOKED+PAID를 COMPLETED로 자동 정규화(프론트 편의용)
      const normalized = normalizeReservationStatus(list);
      setMyReservations(normalized.next);

      setMyResvLoading(false);
    })();
  }, [isLoggedIn, myUserId]);

  // ✅ 추가: 이 프로그램에 대해 내 예약(상태 불문)이 하나라도 있는지 여부
  const hasAnyReservation = useMemo(() => {
    if (!isLoggedIn || !myUserId) return false;
    return (myReservations || []).some((r) => String(r.programId ?? r.program_id ?? r.programID) === String(id));
  }, [myReservations, isLoggedIn, myUserId, id]);

  // ✅ 추가: 이 프로그램에 대해 “체험 완료(COMPLETED)” 된 내 예약이 있는지
  const hasCompletedReservation = useMemo(() => {
    if (!isLoggedIn || !myUserId) return false;
    return (myReservations || []).some((r) => {
      const sameProgram = String(r.programId ?? r.program_id ?? r.programID) === String(id);
      return sameProgram && r.status === "COMPLETED";
    });
  }, [myReservations, isLoggedIn, myUserId, id]);

  // ✅ 추가: 이미 이 프로그램에 대해 후기를 작성했는지 여부
  const hasAlreadyReviewed = useMemo(() => {
    if (!isLoggedIn || !myUserId || !reviews.length) return false;
    return reviews.some((r) => {
      // numeric ID 비교 (Number로 통일하여 타입 불일치 방지)
      if (r.userId && myUserId) return Number(r.userId) === Number(myUserId);
      return (r.user || "") === displayName;
    });
  }, [reviews, isLoggedIn, myUserId, displayName]);

  // kakao map script
  useEffect(() => {
    if (window.kakao && window.kakao.maps && window.kakao.maps.LatLng) {
      setMapLoaded(true);
      return;
    }

    const existingScript = document.querySelector('script[src*="dapi.kakao.com"]');
    if (existingScript) {
      existingScript.onload = () => {
        if (window.kakao && window.kakao.maps) {
          window.kakao.maps.load(() => setMapLoaded(true));
        }
      };
      return;
    }

    const script = document.createElement("script");
    const apiKey = process.env.REACT_APP_KAKAO_MAP_API_KEY;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false`;
    script.async = true;

    script.onload = () => {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          if (window.kakao.maps.LatLng) setMapLoaded(true);
        });
      }
    };

    script.onerror = () => console.error("카카오맵 API 스크립트 로드 실패");
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (
      activeTab === "location" &&
      data &&
      data.refine_wgs84_lat &&
      data.refine_wgs84_logt &&
      mapContainer.current &&
      mapLoaded &&
      window.kakao &&
      window.kakao.maps &&
      window.kakao.maps.LatLng &&
      window.kakao.maps.Map
    ) {
      const lat = parseFloat(data.refine_wgs84_lat);
      const lng = parseFloat(data.refine_wgs84_logt);

      if (!isNaN(lat) && !isNaN(lng)) {
        const timer = setTimeout(() => {
          try {
            if (mapInstance.current) mapInstance.current = null;

            if (mapContainer.current && mapContainer.current.children.length === 0) {
              const options = {
                center: new window.kakao.maps.LatLng(lat, lng),
                level: 3,
              };

              mapInstance.current = new window.kakao.maps.Map(mapContainer.current, options);

              const markerPosition = new window.kakao.maps.LatLng(lat, lng);
              const marker = new window.kakao.maps.Marker({ position: markerPosition });
              marker.setMap(mapInstance.current);

              const infowindow = new window.kakao.maps.InfoWindow({
                content: `<div style="padding:8px;font-size:13px;min-width:150px;">
                  <div style="font-weight:600;margin-bottom:4px;">${data.village_nm || "위치"}</div>
                  <div style="font-size:12px;color:#666;">${data.address || ""}</div>
                </div>`,
              });
              infowindow.open(mapInstance.current, marker);
            }
          } catch (error) {
            console.error("지도 초기화 오류:", error);
          }
        }, 200);

        return () => clearTimeout(timer);
      }
    }
  }, [activeTab, data, mapLoaded]);

  const programTypesText =
    Array.isArray(data?.program_types) && data.program_types.length > 0 ? data.program_types.join(", ") : "정보 없음";

  const feeText = data?.chrge ? data.chrge : "정보 없음";

  const reqPeriodText =
    data?.reqst_bgnde && data?.reqst_endde
      ? `${dayjs(data.reqst_bgnde).format("YYYY.MM.DD")} ~ ${dayjs(data.reqst_endde).format("YYYY.MM.DD")}`
      : "정보 없음";

  const hasLocation = !!(data?.refine_wgs84_lat && data?.refine_wgs84_logt);

  const renderStars = (rating = 0) => "★".repeat(rating) + "☆".repeat(Math.max(0, 5 - rating));

  const isMyReview = (review) => {
    if (!isLoggedIn) return false;
    if (review?.userId && myUserId) return Number(review.userId) === Number(myUserId);
    return (review?.user || "") === displayName;
  };

  const handleReviewFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    reviewPreviews.forEach((url) => URL.revokeObjectURL(url));

    const nextFiles = files.slice(0, 6);
    const nextPreviews = nextFiles.map((f) => URL.createObjectURL(f));

    setReviewFiles(nextFiles);
    setReviewPreviews(nextPreviews);
  };

  const removePreviewAt = (idx) => {
    setReviewFiles((prev) => prev.filter((_, i) => i !== idx));
    setReviewPreviews((prev) => {
      const target = prev[idx];
      if (target) URL.revokeObjectURL(target);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) return;

    // ✅ 체험 완료된 예약이 없으면 작성 막기 (UI 가드 + 안전 가드)
    if (!hasCompletedReservation) return;

    const content = reviewContent.trim();
    if (!content) return;

    // Base64 변환 제거하고 파일 그대로 전송
    const result = await createReview({
      program_id: id,
      rating: reviewRating,
      content: content,
      images: reviewFiles,
    });

    if (result.success) {
      // 성공 시 후기 목록 새로고침
      await loadReviews();

      // 폼 초기화
      setReviewRating(5);
      setReviewContent("");
      setReviewFiles([]);
      reviewPreviews.forEach((url) => URL.revokeObjectURL(url));
      setReviewPreviews([]);
    } else {
      alert(result.error || "후기 등록에 실패했습니다.");
    }
  };

  const handleDeleteReview = async (reviewId) => {
    const target = reviews.find((r) => r.id === reviewId);
    if (!target) return;
    if (!isMyReview(target)) return;

    if (!window.confirm("후기를 삭제하시겠습니까?")) return;

    const result = await deleteReview(reviewId);
    if (result.success) {
      await loadReviews();
    } else {
      alert(result.error || "후기 삭제에 실패했습니다.");
    }
  };

  useEffect(() => {
    return () => {
      reviewPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="detail-wrap">
      <div className="detail-inner">
        {data && (
          <div className="detail-top">
            <div className="detail-img">
              {data.images && data.images.length > 0 && (
                <img src={getImagePath(data.images[0])} alt={data.program_nm} />
              )}

              <button
                type="button"
                className="detail-zoom-btn"
                aria-label="상세 이미지 보기"
                onClick={() => {
                  setCurrentImageIdx(0);
                  setIsImageModalOpen(true);
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>

              <button
                type="button"
                className={`detail-heart-btn ${isBookmarked(id) ? "is-on" : ""}`}
                aria-label={isBookmarked(id) ? "찜 해제" : "찜하기"}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleToggleBookmark();
                }}
              >
                {isBookmarked(id) ? "♥" : "♡"}
              </button>
            </div>

            <div className="detail-info">
              <div className="detail-headline">
                <span className="detail-badge">{data.village_nm}</span>
              </div>

              <h1 className="detail-title">{data.program_nm}</h1>

              <div className="detail-main-text">
                <p>프로그램 구분 : {programTypesText}</p>
                <p>인원 : {data.max_personnel || "정보 없음"}</p>
                <p>신청 기간 : {reqPeriodText}</p>
                <p>주소 : {data.address || "주소 정보 없음"}</p>
                <p>소요시간 : {data.use_time || "정보 없음"}</p>
                <p>이용 요금 : {feeText}</p>
              </div>

              <div className="detail-btns">
                <Link to="/list" className="detail-btn outline">
                  돌아가기
                </Link>

                <button type="button" className="detail-btn primary" onClick={() => setIsReserveOpen(true)}>
                  예약하기
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="detail-tabs">
          <button className={activeTab === "schedule" ? "tab active" : "tab"} onClick={() => setActiveTab("schedule")}>
            프로그램 일정
          </button>
          <button className={activeTab === "detail" ? "tab active" : "tab"} onClick={() => setActiveTab("detail")}>
            상세정보
          </button>
          <button className={activeTab === "location" ? "tab active" : "tab"} onClick={() => setActiveTab("location")}>
            위치정보
          </button>
          <button className={activeTab === "review" ? "tab active" : "tab"} onClick={() => setActiveTab("review")}>
            체험 후기
          </button>
        </div>

        <div className="detail-tab-content">
          {activeTab === "schedule" && (
            <div className="detail-panel">
              <h3 className="panel-title">프로그램 진행 흐름</h3>

              <ul className="step-list">
                <li>
                  <div className="step-no">01</div>
                  <div className="step-body">
                    <p className="step-title">입소 및 안전교육</p>
                    <p className="step-desc">안전 수칙 안내 + 준비물 확인</p>
                  </div>
                </li>
                <li>
                  <div className="step-no">02</div>
                  <div className="step-body">
                    <p className="step-title">체험 활동 진행</p>
                    <p className="step-desc">프로그램 메인 체험 진행</p>
                  </div>
                </li>
                <li>
                  <div className="step-no">03</div>
                  <div className="step-body">
                    <p className="step-title">간식 시간 및 휴식</p>
                    <p className="step-desc">휴식 + 정리 시간</p>
                  </div>
                </li>
                <li>
                  <div className="step-no">04</div>
                  <div className="step-body">
                    <p className="step-title">마무리 및 정리</p>
                    <p className="step-desc">체험 종료 + 안내사항 공유</p>
                  </div>
                </li>
              </ul>
            </div>
          )}

          {activeTab === "detail" && (
            <div className="detail-panel">
              <h3 className="panel-title">프로그램 상세 정보</h3>

              <div className="info-grid">
                <div className="info-row">
                  <strong>마을</strong>
                  <span>{data?.village_nm || "정보 없음"}</span>
                </div>

                <div className="info-row">
                  <strong>프로그램명</strong>
                  <span>{data?.program_nm || "정보 없음"}</span>
                </div>

                <div className="info-row">
                  <strong>신청 기간</strong>
                  <span>{reqPeriodText}</span>
                </div>

                <div className="info-row">
                  <strong>요금</strong>
                  <span>{feeText}</span>
                </div>

                <div className="info-row">
                  <strong>소요시간</strong>
                  <span>{data?.use_time || "정보 없음"}</span>
                </div>

                <div className="info-row">
                  <strong>인원</strong>
                  <span>
                    {data?.min_personnel || "-"} ~ {data?.max_personnel || "-"}
                  </span>
                </div>
              </div>

              <div className="divider-line" />

              <h3 className="panel-title small">유의사항</h3>
              <ul className="check-list">
                <li>취소·환불 규정은 운영 농장 정책을 따릅니다.</li>
                <li>우천 시 일정 변경될 수 있습니다.</li>
                <li>편한 복장으로 참여 하시길 권장 합니다.</li>
                <li>알레르기 발생우려 시 해당 체험관에 사전문의 해주십시오.</li>
              </ul>
            </div>
          )}

          {activeTab === "location" && (
            <div className="detail-panel">
              <h3 className="panel-title">위치 안내</h3>

              <div className="location-card">
                <div className="location-row">
                  <span className="location-label">주소</span>
                  <span className="location-value">{data?.address || "주소 없음"}</span>
                </div>

                {!hasLocation ? (
                  <p className="muted">위치 정보가 없습니다.</p>
                ) : (
                  <div id="map" ref={mapContainer} className="kakao-map" />
                )}

                {hasLocation && (
                  <a
                    className="map-link"
                    href={`https://map.kakao.com/link/map/${encodeURIComponent(data?.village_nm || "위치")},${data.refine_wgs84_lat
                      },${data.refine_wgs84_logt}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    카카오맵에서 보기
                  </a>
                )}
              </div>
            </div>
          )}

          {activeTab === "review" && (
            <div className="detail-panel">
              <h3 className="panel-title">체험 후기</h3>

              {/* ✅ 예약 상태 확인 중 */}
              {isLoggedIn && myResvLoading && <p className="muted">예약 정보를 확인하는 중...</p>}

              {/* ✅ 1. 작성 폼: 체험 완료(당일 포함) + 아직 안 썼을 때 만 노출 */}
              {isLoggedIn && !myResvLoading && hasCompletedReservation && !hasAlreadyReviewed && (
                <form className="review-form" onSubmit={handleSubmitReview}>
                  <div className="review-form-row">
                    <div className="review-userline">
                      <span className="review-username">{displayName}</span>
                    </div>

                    <div className="rating" role="radiogroup" aria-label="별점 선택">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          className={`star ${reviewRating >= n ? "is-on" : ""}`}
                          onClick={() => setReviewRating(n)}
                          aria-label={`${n}점`}
                        >
                          {reviewRating >= n ? "★" : "☆"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    className="review-textarea"
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    placeholder="내용을 적어주세요."
                    rows={4}
                  />

                  <div className="review-upload">
                    <label className="upload-btn">
                      사진 첨부 (최대 6장)
                      <input type="file" accept="image/*" multiple onChange={handleReviewFilesChange} />
                    </label>
                  </div>

                  {reviewPreviews.length > 0 && (
                    <div className="preview-grid">
                      {reviewPreviews.map((src, idx) => (
                        <div className="preview-item" key={src}>
                          <img src={src} alt={`preview-${idx}`} />
                          <button type="button" className="preview-remove" onClick={() => removePreviewAt(idx)}>
                            삭제
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button className="review-submit" type="submit" disabled={!reviewContent.trim()}>
                    후기 등록
                  </button>
                </form>
              )}

              {/* ✅ 2. 안내문: 예약은 했으나 아직 당일이 아니거나 미완료일 때 만 노출 (미작성 시) */}
              {isLoggedIn && !myResvLoading && hasAnyReservation && !hasCompletedReservation && !hasAlreadyReviewed && (
                <div className="review-status-notice">
                  <p className="muted">체험 완료(예약 당일) 후 리뷰를 작성할 수 있습니다.</p>
                </div>
              )}

              {reviewsLoading ? (
                <p className="muted">후기를 불러오는 중...</p>
              ) : !reviews || reviews.length === 0 ? (
                <p className="muted">아직 등록된 후기가 없습니다.</p>
              ) : (
                <ul className="review-list">
                  {reviews.map((r) => {
                    const canDelete = isMyReview(r);
                    return (
                      <li key={r.id} className="review-item">
                        <div className="review-top">
                          <div className="review-left">
                            <span className="review-user">{r.user || "익명"}</span>
                            <span className="review-date">{r.date ? dayjs(r.date).format("YYYY.MM.DD") : ""}</span>
                          </div>

                          <div className="review-right">
                            <span className="review-stars">{renderStars(r.rating || 0)}</span>

                            {canDelete && (
                              <button type="button" className="review-del" onClick={() => handleDeleteReview(r.id)}>
                                삭제
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="review-content">{r.content}</p>

                        {Array.isArray(r.images) && r.images.length > 0 && (
                          <div className="review-img-grid">
                            {r.images.map((src, idx) => (
                              <img
                                key={`${r.id}_${idx}`}
                                src={`${process.env.REACT_APP_API_BASE || "http://localhost:5000"}${src}`}
                                alt={`review-${idx}`}
                              />
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
        </div>
      </div>

      {/* ✅ 모달 파일을 “정상적으로” 사용 */}
      <ReservationModal
        open={isReserveOpen}
        onClose={() => setIsReserveOpen(false)}
        program={data}
        isLoggedIn={isLoggedIn}
        user={user}
        onSuccess={() => {
          // ✅ 예약 성공 -> 마이페이지 '예약/체험관리' 탭으로 이동
          setIsReserveOpen(false);
          navigate("/mypage", { state: { openTab: "reservations" } });
        }}
      />
      {/* ✅ 이미지 상세 보기 슬라이드 모달 */}
      {isImageModalOpen && data?.images && data.images.length > 0 && (
        <div className="image-modal-overlay" onClick={() => setIsImageModalOpen(false)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setIsImageModalOpen(false)}>
              ✕
            </button>

            <div className="modal-slider-wrap">
              {data.images.length > 1 && (
                <button
                  className="modal-arrow modal-arrow-left"
                  onClick={() =>
                    setCurrentImageIdx((prev) => (prev === 0 ? data.images.length - 1 : prev - 1))
                  }
                >
                  ‹
                </button>
              )}

              <div className="modal-image-container">
                <img
                  src={getImagePath(data.images[currentImageIdx])}
                  alt={`${data.program_nm} detail ${currentImageIdx + 1}`}
                />
              </div>

              {data.images.length > 1 && (
                <button
                  className="modal-arrow modal-arrow-right"
                  onClick={() =>
                    setCurrentImageIdx((prev) => (prev === data.images.length - 1 ? 0 : prev + 1))
                  }
                >
                  ›
                </button>
              )}
            </div>

            {data.images.length > 1 && (
              <div className="modal-indicator">
                {currentImageIdx + 1} / {data.images.length}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default ListDetail;
