// src/components/shop/StoreDetail.js
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "./StoreDetail.css";

import { getProductById } from "../../services/productApi";
import { addToCart as addToCartApi } from "../../services/cartApi";
import { getMyOrders } from "../../services/orderApi";
import CheckoutModal from "../checkout/CheckoutModal";

function StoreDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // detail | buy | shipping | review
  const [activeTab, setActiveTab] = useState("detail");
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

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

  const displayName = user?.nickname || user?.name || user?.user_id || "익명";

  // ===== 상품 로드 =====
  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      try {
        const result = await getProductById(id);
        if (result.success) {
          setProduct(result.data);
        } else {
          console.error("상품 조회 실패:", result.error);
          setProduct(null);
        }
      } catch (error) {
        console.error("상품 조회 오류:", error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProduct();
    }
  }, [id]);

  // ===== 옵션/가격 =====
  const getDisplayPrice = useCallback((item) => {
    if (!item) return 0;
    const opts = Array.isArray(item.options) ? item.options : [];
    if (opts.length > 0) {
      const min = Math.min(...opts.map((o) => Number(o.price || 0)));
      return Number.isFinite(min) ? min : 0;
    }
    return Number(item.price || 0);
  }, []);

  const hasOptions = useMemo(() => {
    return !!(product && Array.isArray(product.options) && product.options.length > 0);
  }, [product]);

  const [selectedOptionId, setSelectedOptionId] = useState("");

  const selectedOption = useMemo(() => {
    if (!product) return null;
    const opts = Array.isArray(product.options) ? product.options : [];
    return opts.find((o) => String(o.id) === String(selectedOptionId)) || null;
  }, [product, selectedOptionId]);

  const finalPrice = useMemo(() => {
    if (!product) return 0;
    if (selectedOption) return Number(selectedOption.price || 0);
    return getDisplayPrice(product);
  }, [product, selectedOption, getDisplayPrice]);

  const unitPrice = useMemo(() => {
    if (selectedOption) return Number(selectedOption.unitPrice || 0);
    // 옵션이 있는데 선택이 없으면, 최저가 옵션 기준으로 보여주기
    if (product?.options?.length) {
      const sorted = [...product.options].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
      return Number(sorted[0]?.unitPrice || 0);
    }
    return 0;
  }, [selectedOption, product]);

  const unitLabel = useMemo(() => {
    // "2kg" 같은 단위를 표시(옵션 label 우선)
    if (selectedOption?.label) return selectedOption.label;
    if (product?.options?.length) return product.options[0]?.label || "";
    return "";
  }, [selectedOption, product]);

  const amount = useMemo(() => {
    if (selectedOption && typeof selectedOption.amount === "number") return selectedOption.amount;
    if (product?.options?.length && typeof product.options[0]?.amount === "number") return product.options[0].amount;
    return null;
  }, [selectedOption, product]);

  const unit = useMemo(() => {
    if (selectedOption?.unit) return selectedOption.unit;
    if (product?.options?.length) return product.options[0]?.unit || "";
    return "";
  }, [selectedOption, product]);

  // ✅ 수량
  const [qty, setQty] = useState(1);
  const incQty = () => setQty((v) => Math.min(999, v + 1));
  const decQty = () => setQty((v) => Math.max(1, v - 1));

  const totalPrice = useMemo(() => {
    return Math.max(1, Number(qty || 1)) * Number(finalPrice || 0);
  }, [qty, finalPrice]);

  // ✅ 총중량(kg 단위일 때만 계산해서 보여줌)
  const totalAmountText = useMemo(() => {
    if (typeof amount !== "number" || !unit) return "정보가 제공되지 않았습니다.";
    const total = amount * Math.max(1, Number(qty || 1));
    // 소수면 보기 좋게
    const pretty = Number.isInteger(total) ? total : total.toFixed(2);
    return `${pretty}${unit}`;
  }, [amount, unit, qty]);

  // ===== 이미지 처리 =====
  const heroImg = useMemo(() => {
    const src = product?.image || "";
    if (!src) return "";
    return src;
  }, [product]);

  // ===== 상품 로드 후 기본 옵션 선택 =====
  useEffect(() => {
    if (!product) return;

    if (Array.isArray(product.options) && product.options.length > 0) {
      setSelectedOptionId(String(product.options[0].id));
    } else {
      setSelectedOptionId("");
    }
    setQty(1);
  }, [product]);

  // ===== ✅ 구매 여부(주문내역 기준): 구매 완료된 상품만 리뷰 작성 가능 =====
  const [hasPurchased, setHasPurchased] = useState(false);

  useEffect(() => {
    const checkPurchase = async () => {
      if (!isLoggedIn || !id) {
        setHasPurchased(false);
        return;
      }

      try {
        const result = await getMyOrders();
        if (result.success) {
          const orders = result.data || [];
          const purchased = orders.some((o) => {
            if (o?.status !== "PAID") return false;
            const items = Array.isArray(o.items) ? o.items : [];
            return items.some((it) => String(it.productId) === String(id));
          });
          setHasPurchased(purchased);
        }
      } catch (error) {
        console.error("주문 내역 조회 오류:", error);
        setHasPurchased(false);
      }
    };

    checkPurchase();
  }, [isLoggedIn, id]);

  // ===== 리뷰 (로컬스토리지) =====
  const REVIEW_KEY = "reviews_store";
  const [reviews, setReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState("");

  const readReviews = useCallback(() => {
    try {
      const raw = localStorage.getItem(REVIEW_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  const writeReviews = useCallback((next) => {
    localStorage.setItem(REVIEW_KEY, JSON.stringify(next));
  }, []);

  const loadReviews = useCallback(() => {
    const all = readReviews();
    const mine = all.filter((r) => String(r.productId) === String(id));
    setReviews(mine);
  }, [readReviews, id]);

  useEffect(() => {
    if (!id) return;
    loadReviews();
  }, [id, loadReviews]);

  const renderStarsText = (rating = 0) => "★".repeat(rating) + "☆".repeat(Math.max(0, 5 - rating));

  const handleSubmitReview = (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      alert("로그인 후 후기를 작성하실 수 있습니다.");
      return;
    }

    // ✅ 구매 완료된 상품만 작성 가능
    if (!hasPurchased) {
      alert("구매 완료된 상품만 후기를 작성하실 수 있습니다.");
      return;
    }

    const content = reviewContent.trim();
    if (!content) {
      alert("후기 내용을 입력해 주시기 바랍니다.");
      return;
    }

    const all = readReviews();
    const next = [
      {
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        productId: String(id),
        user: displayName,
        rating: reviewRating,
        content,
        date: new Date().toISOString(),
      },
      ...all,
    ];

    writeReviews(next);
    setReviewRating(5);
    setReviewContent("");
    loadReviews();
  };

  const handleDeleteReview = (reviewId) => {
    const all = readReviews();
    const target = all.find((r) => r.id === reviewId);
    if (!target) return;

    if (!isLoggedIn || (target.user || "") !== displayName) {
      alert("본인 후기만 삭제하실 수 있습니다.");
      return;
    }

    if (!window.confirm("후기를 삭제하시겠습니까?")) return;

    const next = all.filter((r) => r.id !== reviewId);
    writeReviews(next);
    loadReviews();
  };

  // ✅ 옵션 선택 검증
  const validateOption = () => {
    if (!product) return false;
    if (hasOptions && !selectedOptionId) {
      alert("옵션을 선택해 주시기 바랍니다.");
      setActiveTab("buy");
      return false;
    }
    return true;
  };

  // ✅ 장바구니 담기
  const handleAddCart = async () => {
    if (!product) return;
    if (!validateOption()) return;
    if (!isLoggedIn) {
      alert("로그인 후 장바구니에 담을 수 있습니다.");
      return;
    }

    try {
      const result = await addToCartApi({
        productId: String(product.id),
        optionId: selectedOptionId || null,
        quantity: Number(qty || 1),
      });

      if (result.success) {
        alert("상품이 장바구니에 담겼습니다.");
      } else {
        alert(result.error?.message || "장바구니 담기에 실패했습니다.");
      }
    } catch (error) {
      console.error("장바구니 담기 오류:", error);
      alert("장바구니 담기에 실패했습니다.");
    }
  };

  // ✅ 구매하기: 결제 모달 열기
  const handleBuyNow = () => {
    if (!product) return;
    if (!validateOption()) return;
    if (!isLoggedIn) {
      alert("로그인 후 구매할 수 있습니다.");
      return;
    }

    setCheckoutModalOpen(true);
  };

  // 결제 모달에서 사용할 상품 정보
  const buyNowItem = useMemo(() => {
    if (!product) return null;
    return {
      id: String(product.id),
      name: product.name,
      image: heroImg,
      optionId: selectedOptionId || null,
      optionName: selectedOption?.label || null,
      price: Number(finalPrice || 0),
      qty: Number(qty || 1),
    };
  }, [product, heroImg, selectedOptionId, selectedOption, finalPrice, qty]);

  // 결제 완료 후 처리
  const handleCheckoutSuccess = () => {
    // 임시 데이터 삭제 (혹시 있을 경우)
    localStorage.removeItem('buyNow_temp');
    // 마이페이지로 이동
    navigate('/mypage', { state: { openTab: 'store_orders' } });
  };

  // ===== 탭 이동 (tabs 위치로 스크롤) =====
  const tabsRef = useRef(null);
  const handleTab = (tab) => {
    setActiveTab(tab);
    requestAnimationFrame(() => {
      tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  if (loading) {
    return (
      <section className="sd-wrap">
        <div className="sd-inner">
          <p className="sd-muted">상품 정보를 불러오는 중...</p>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="sd-wrap">
        <div className="sd-inner">
          <p className="sd-muted">상품 정보를 찾을 수 없습니다.</p>
          <button className="sd-btn sd-btn-outline" type="button" onClick={() => navigate(-1)}>
            이전 페이지로 이동
          </button>
        </div>
      </section>
    );
  }

  const categoryText = product.category || "정보 없음";
  const descText = product.desc || "상품 설명이 제공되지 않았습니다.";

  return (
    <section className="sd-wrap">
      <div className="sd-inner">
        {/* ===== breadcrumb ===== */}
        <div className="sd-bread">
          <Link to="/shop" className="sd-bread-link">
            스토어
          </Link>
          <span className="sd-bread-sep">/</span>
          <span className="sd-bread-current">{product.name}</span>
        </div>

        {/* ===== top: 이미지 우측 최소 정보 ===== */}
        <div className="sd-top">
          <div className="sd-img">
            {heroImg ? (
              <img
                src={heroImg}
                alt={product.name}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="sd-img-fallback" />
            )}
          </div>

          <div className="sd-info">
            <div className="sd-headline">
              <span className="sd-badge">{categoryText}</span>
            </div>

            <h1 className="sd-title">{product.name}</h1>
            <p className="sd-desc">{descText}</p>

            <div className="sd-price-row">
              <span className="sd-price-label">판매가</span>
              <span className="sd-price">{finalPrice.toLocaleString()}원</span>
            </div>

            <div className="sd-backline">
              <Link to="/shop" className="sd-link">
                목록으로 이동
              </Link>
            </div>
          </div>
        </div>

        {/* ===== tabs ===== */}
        <div className="sd-tabs" ref={tabsRef}>
          <button className={activeTab === "detail" ? "sd-tab active" : "sd-tab"} onClick={() => handleTab("detail")}>
            상세정보
          </button>
          <button className={activeTab === "buy" ? "sd-tab active" : "sd-tab"} onClick={() => handleTab("buy")}>
            구매하기
          </button>
          <button
            className={activeTab === "shipping" ? "sd-tab active" : "sd-tab"}
            onClick={() => handleTab("shipping")}
          >
            배송/교환
          </button>
          <button className={activeTab === "review" ? "sd-tab active" : "sd-tab"} onClick={() => handleTab("review")}>
            후기
          </button>
        </div>

        <div className="sd-tab-content">
          {/* ===== detail ===== */}
          {activeTab === "detail" && (
            <div className="sd-panel">
              <h3 className="sd-panel-title">상품 상세 정보</h3>

              <div className="sd-info-grid">
                <div className="sd-info-row">
                  <strong>카테고리</strong>
                  <span>{categoryText}</span>
                </div>

                <div className="sd-info-row">
                  <strong>상품명</strong>
                  <span>{product.name}</span>
                </div>

                <div className="sd-info-row">
                  <strong>판매 단위</strong>
                  <span>{hasOptions ? "옵션 선택형 상품입니다." : "정보가 제공되지 않았습니다."}</span>
                </div>

                {/* ✅ 중량/단위: 너 데이터 기준 options.amount + options.unit */}
                <div className="sd-info-row">
                  <strong>중량(옵션 기준)</strong>
                  <span>{unitLabel ? unitLabel : "옵션 정보가 제공되지 않았습니다."}</span>
                </div>

                <div className="sd-info-row">
                  <strong>단가</strong>
                  <span>
                    {unitPrice ? `${unitPrice.toLocaleString()}원 / ${unit || "단위"}` : "정보가 제공되지 않았습니다."}
                  </span>
                </div>

                <div className="sd-info-row">
                  <strong>산지/농가 정보</strong>
                  <span>{product.origin || product.farm || "정보가 제공되지 않았습니다."}</span>
                </div>

                <div className="sd-info-row">
                  <strong>보관 방법</strong>
                  <span>{product.storage || "보관 방법 정보가 제공되지 않았습니다."}</span>
                </div>
              </div>

              <div className="sd-divider" />

              <h3 className="sd-panel-title small">유의사항</h3>
              <ul className="sd-check-list">
                <li>신선식품 특성상 단순 변심에 의한 교환 및 환불은 제한될 수 있습니다.</li>
                <li>수령 즉시 상품 상태를 확인해 주시기 바랍니다.</li>
                <li>보관 방법은 상품 안내에 따라 주시기 바랍니다.</li>
              </ul>
            </div>
          )}

          {/* ===== buy ===== */}
          {activeTab === "buy" && (
            <div className="sd-panel sd-buy-panel">
              <h3 className="sd-panel-title">구매 설정</h3>

              <div className="sd-buy-grid">
                {/* 좌측: 옵션/수량/요약 */}
                <div className="sd-buy-left">
                  <div className="sd-buybox">
                    {hasOptions && (
                      <div className="sd-field">
                        <label className="sd-label" htmlFor="optionSelect">
                          옵션
                        </label>
                        <select
                          id="optionSelect"
                          className="sd-select"
                          value={selectedOptionId}
                          onChange={(e) => setSelectedOptionId(e.target.value)}
                        >
                          <option value="">옵션을 선택해 주시기 바랍니다.</option>
                          {product.options.map((o) => (
                            <option key={o.id} value={String(o.id)}>
                              {o.label} · {Number(o.price || 0).toLocaleString()}원
                            </option>
                          ))}
                        </select>
                        <p className="sd-hint">옵션에 따라 중량 및 가격이 달라질 수 있습니다.</p>
                      </div>
                    )}

                    <div className="sd-field">
                      <span className="sd-label">수량</span>
                      <div className="sd-qty">
                        <button type="button" className="sd-qty-btn" onClick={decQty} aria-label="수량 감소">
                          −
                        </button>
                        <div className="sd-qty-val">{qty}</div>
                        <button type="button" className="sd-qty-btn" onClick={incQty} aria-label="수량 증가">
                          +
                        </button>
                      </div>
                    </div>

                    {/* ✅ 중량/단가/총중량: 데이터 기반으로 표시 */}
                    <div className="sd-buy-meta">
                      <div className="sd-buy-meta-row">
                        <span className="k">선택 옵션</span>
                        <span className="v">{selectedOption?.label || "선택되지 않았습니다."}</span>
                      </div>
                      <div className="sd-buy-meta-row">
                        <span className="k">단가</span>
                        <span className="v">
                          {unitPrice
                            ? `${unitPrice.toLocaleString()}원 / ${unit || "단위"}`
                            : "정보가 제공되지 않았습니다."}
                        </span>
                      </div>
                      <div className="sd-buy-meta-row">
                        <span className="k">중량(1개 기준)</span>
                        <span className="v">
                          {typeof amount === "number" && unit ? `${amount}${unit}` : "정보가 제공되지 않았습니다."}
                        </span>
                      </div>
                      <div className="sd-buy-meta-row">
                        <span className="k">총 중량</span>
                        <span className="v">{totalAmountText}</span>
                      </div>
                    </div>

                    <div className="sd-buy-notice">
                      <div className="t">구매 전 확인</div>
                      <ul>
                        <li>옵션 선택 후 장바구니 담기 및 구매 진행이 가능합니다.</li>
                        <li>신선식품은 수령 즉시 상태 확인을 권장드립니다.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 우측: 결제 요약 sticky */}
                <aside className="sd-buy-right">
                  <div className="sd-buy-sticky">
                    <div className="sd-buy-sum">
                      <div className="row">
                        <span className="k">총 결제 금액</span>
                        <span className="v">{totalPrice.toLocaleString()}원</span>
                      </div>
                      <div className="row sub">
                        <span className="k">배송</span>
                        <span className="v">{product.shipping || "평균 1~3일 이내 출고됩니다."}</span>
                      </div>
                    </div>

                    <div className="sd-btns sd-btns-vertical">
                      <button type="button" className="sd-btn sd-btn-outline" onClick={handleAddCart}>
                        장바구니에 담기
                      </button>
                      <button type="button" className="sd-btn sd-btn-primary" onClick={handleBuyNow}>
                        바로 구매하기
                      </button>
                    </div>

                    {hasOptions && !selectedOptionId && <p className="sd-buy-warn">옵션 선택이 필요합니다.</p>}
                  </div>
                </aside>
              </div>
            </div>
          )}

          {/* ===== shipping ===== */}
          {activeTab === "shipping" && (
            <div className="sd-panel">
              <h3 className="sd-panel-title">배송/교환 안내</h3>

              <div className="sd-ship-card">
                <div className="sd-ship-row">
                  <span className="sd-ship-label">배송</span>
                  <span className="sd-ship-value">
                    {product.shipping || "주문 완료 후 평균 1~3일 이내 출고됩니다."}
                  </span>
                </div>

                <div className="sd-ship-row">
                  <span className="sd-ship-label">교환/환불</span>
                  <span className="sd-ship-value">
                    {product.refund || "상품 하자 발생 시 사진과 함께 고객센터로 문의해 주시기 바랍니다."}
                  </span>
                </div>

                <div className="sd-ship-row">
                  <span className="sd-ship-label">고객센터</span>
                  <span className="sd-ship-value">문의는 고객지원 페이지를 이용해 주시기 바랍니다.</span>
                </div>
              </div>
            </div>
          )}

          {/* ===== review ===== */}
          {activeTab === "review" && (
            <div className="sd-panel">
              <h3 className="sd-panel-title">상품 후기</h3>

              {/* ✅ 구매 완료된 상품만 리뷰 작성 폼 노출 */}
              {isLoggedIn && hasPurchased ? (
                <form className="sd-review-form" onSubmit={handleSubmitReview}>
                  <div className="sd-review-form-row">
                    <div className="sd-review-userline">
                      <span className="sd-review-username">{displayName}</span>
                    </div>

                    <div className="sd-rating" role="radiogroup" aria-label="별점 선택">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          className={`sd-star ${reviewRating >= n ? "is-on" : ""}`}
                          onClick={() => setReviewRating(n)}
                          aria-label={`${n}점`}
                        >
                          {reviewRating >= n ? "★" : "☆"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    className="sd-review-textarea"
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    placeholder="후기 내용을 입력해 주시기 바랍니다."
                    rows={4}
                  />

                  <button className="sd-review-submit" type="submit" disabled={!reviewContent.trim()}>
                    후기 등록하기
                  </button>
                </form>
              ) : !isLoggedIn ? (
                <p className="sd-muted">후기 작성은 로그인 후 가능합니다.</p>
              ) : (
                <p className="sd-muted">구매 완료된 상품만 후기 작성이 가능합니다.</p>
              )}

              {!reviews || reviews.length === 0 ? (
                <p className="sd-muted">아직 등록된 후기가 없습니다.</p>
              ) : (
                <ul className="sd-review-list">
                  {reviews.map((r) => {
                    const canDelete = isLoggedIn && (r.user || "") === displayName;

                    return (
                      <li key={r.id} className="sd-review-item">
                        <div className="sd-review-top">
                          <div className="sd-review-left">
                            <span className="sd-review-user">{r.user || "익명"}</span>
                            <span className="sd-review-date">
                              {r.date ? new Date(r.date).toLocaleDateString() : ""}
                            </span>
                          </div>

                          <div className="sd-review-right">
                            <span className="sd-review-stars">{renderStarsText(r.rating || 0)}</span>

                            {canDelete && (
                              <button type="button" className="sd-review-del" onClick={() => handleDeleteReview(r.id)}>
                                삭제하기
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="sd-review-content">{r.content}</p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 결제 모달 */}
      {checkoutModalOpen && buyNowItem && (
        <CheckoutModal
          open={checkoutModalOpen}
          onClose={() => setCheckoutModalOpen(false)}
          items={[buyNowItem]}
          onSuccess={handleCheckoutSuccess}
        />
      )}
    </section>
  );
}

export default StoreDetail;
