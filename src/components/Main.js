// src/components/Main.js
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import './Main.css';
import { useNavigate } from 'react-router-dom';

import EventSection from './layout/EventSection';
import { getImagePath } from '../utils/imagePath';

// 실제 데이터
import { getAllPrograms } from '../services/programApi';
import shopData from './data/StoreData';
import dayjs from 'dayjs';

const heroImage = getImagePath('/benner/benner1.png');

// 메인 추천용 기본 체험 데이터 (DB/로컬에 아무것도 없을 때)
const DEFAULT_PROGRAMS = [
  {
    id: 'demo-1',
    program_nm: '딸기 수확 & 디저트 만들기',
    side_activities: '딸기 따기 + 생크림 디저트 만들기',
    reqst_endde: '2025-12-31',
    images: ['/images/list/strawberry.jpg'],
  },
  {
    id: 'demo-2',
    program_nm: '주말 농장 투어',
    side_activities: '동물 먹이주기 · 트랙터 투어',
    reqst_endde: '2025-12-31',
    images: ['/images/list/farm-tour.jpg'],
  },
  {
    id: 'demo-3',
    program_nm: '고구마 캐기 체험',
    side_activities: '고구마 수확 + 군고구마 시식',
    reqst_endde: '2025-12-31',
    images: ['/images/list/sweet-potato.jpg'],
  },
];

function Main() {
  const navigate = useNavigate();

  const [programs, setPrograms] = useState([]);

  // 가로 스크롤 DOM 참조
  const expRowRef = useRef(null);
  const storeRowRef = useRef(null);

  // 체험명 가공 (List.js 로직 축약)
  const processProgramData = useCallback((data) => {
    if (!data || !Array.isArray(data)) return [];

    const replaceText = { 체험: ' 체험', 및: ' 및 ' };
    return data.map((item) => {
      const newItem = { ...item };
      try {
        if (typeof JSON.parse(newItem.program_nm)) {
          newItem.program_nm = JSON.parse(newItem.program_nm).map((v) => v.replace(/체험|및/g, (match) => replaceText[match] || match)).join(', ');
        }
      } catch {
        if (typeof newItem.program_nm === 'string') {
          newItem.program_nm = newItem.program_nm.replace(/체험|및/g, (match) => replaceText[match] || match);
        }
      }
      return newItem;
    });
  }, []);

  // 체험 데이터 불러오기
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // List.js 기준: getAllPrograms(page, limit)
        const result = await getAllPrograms(1, 12);

        if (!mounted) return;

        if (!result || result.success === false) {
          console.error('메인: getAllPrograms 실패', result?.error);
          setPrograms(processProgramData(DEFAULT_PROGRAMS));
          return;
        }

        const raw = Array.isArray(result.data) ? result.data : [];
        const processed = processProgramData(raw);

        if (processed.length === 0) {
          setPrograms(processProgramData(DEFAULT_PROGRAMS));
        } else {
          setPrograms(processed);
        }
      } catch (err) {
        console.error('메인: 체험 데이터 불러오는 중 오류', err);
        if (mounted) setPrograms(processProgramData(DEFAULT_PROGRAMS));
      }
    })();

    return () => {
      mounted = false;
    };
  }, [processProgramData]);

  // 메인에서 보여줄 추천 체험
  const featuredPrograms = useMemo(() => {
    return programs.slice(0, 8).map((p) => ({
      ...p,
      formattedDate: p.reqst_endde ? dayjs(p.reqst_endde).format('YYYY.MM.DD') : '',
    }));
  }, [programs]);

  // 스토어 추천 상품
  const featuredProducts = useMemo(() => {
    return shopData.slice(0, 8);
  }, []);

  const goPrograms = () => navigate('/list');
  const goStore = () => navigate('/shop');
  const goProgramDetail = (id) => navigate(`/list/${id}`);
  const goProductDetail = (id) => navigate(`/shop/${id}`);

  // 가로 스크롤 버튼 핸들러
  const scrollRow = (ref, direction) => {
    const el = ref.current;
    if (!el) return;

    const amount = direction === 'left' ? -260 : 260;
    el.scrollBy({
      left: amount,
      behavior: 'smooth',
    });
  };

  // 상품 최소가 계산 (옵션 배열 기준)
  const getDisplayPrice = (product) => {
    if (!product || !Array.isArray(product.options) || product.options.length === 0) {
      return null;
    }
    const prices = product.options.map((opt) => opt.price).filter((p) => typeof p === 'number');
    if (prices.length === 0) return null;
    const min = Math.min(...prices);
    return `${min.toLocaleString()}원~`;
  };

  return (
    <main className="main-wrap">
      {/* 1) 상단 Hero - 헤더 바로 아래 붙는 배너 */}
      <section className="hero">
        <div className="hero-shell" style={{ '--hero-image': `url(${heroImage})` }}>
          <div className="hero-inner">
            <div className="hero-left">
              <p className="hero-eyebrow">Farm Experience & Local Market</p>
              <h1 className="hero-title">
                농촌 체험과 산지 직송을
                <br />한 번에, PlayFarm
              </h1>
              <p className="hero-sub">예약부터 결제, 스토어 구매까지 한 곳에서 간편하게 이용해 보세요.</p>

              <div className="hero-actions">
                <button className="pf-btn-primary" onClick={goPrograms}>
                  체험 둘러보기
                </button>
                <button className="pf-btn-outline" onClick={goStore}>
                  스토어 바로가기
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2) 추천 농촌 체험 – 아웃라인 박스 + 가로 스크롤 */}
      <section className="home-section home-row-section">
        <div className="pf-container">
          <div className="home-row-panel">
            <div className="home-row-head">
              <div>
                <p className="home-row-eyebrow">Farm Experience</p>
                <h2 className="home-row-title">추천 농촌 체험</h2>
              </div>
              <button className="home-link" onClick={goPrograms}>
                전체 체험 보기 ›
              </button>
            </div>

            <div className="home-row-shell">
              <button type="button" className="home-row-arrow home-row-arrow--left" onClick={() => scrollRow(expRowRef, 'left')}>
                ‹
              </button>

              <div className="home-row-scroll" ref={expRowRef}>
                {featuredPrograms.map((program, index) => {
                  const title = program.program_nm || program.title || '이름 없는 체험';

                  const metaText = program.side_activities || program.formattedDate || '상세 정보는 상세 페이지에서 확인해 주세요.';

                  const hasImage = Array.isArray(program.images) && program.images.length > 0;

                  const fallbackClass =
                    index % 3 === 0 ? 'home-row-thumb-fallback--spring' : index % 3 === 1 ? 'home-row-thumb-fallback--family' : 'home-row-thumb-fallback--night';

                  return (
                    <article key={program.id || index} className="home-row-card pf-card pf-card-hover" onClick={() => program.id && goProgramDetail(program.id)}>
                      <div className="home-row-thumb">
                        {hasImage ? (
                          <img src={getImagePath(program.images[0])} alt={title} loading="lazy" />
                        ) : (
                          <div className={`home-row-thumb-fallback ${fallbackClass}`} />
                        )}
                      </div>
                      <div className="home-row-body">
                        <p className="home-row-card-title">{title}</p>
                        <p className="home-row-card-meta">{metaText}</p>
                      </div>
                    </article>
                  );
                })}

                {featuredPrograms.length === 0 && <div className="home-row-empty">등록된 농촌 체험이 없습니다. 나중에 다시 확인해 주세요.</div>}
              </div>

              <button type="button" className="home-row-arrow home-row-arrow--right" onClick={() => scrollRow(expRowRef, 'right')}>
                ›
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3) 산지 직송 스토어 – 아웃라인 박스 + 가로 스크롤 */}
      <section className="home-section home-row-section">
        <div className="pf-container">
          <div className="home-row-panel">
            <div className="home-row-head">
              <div>
                <p className="home-row-eyebrow">Local Market</p>
                <h2 className="home-row-title">산지 직송 스토어</h2>
              </div>
              <button className="home-link" onClick={goStore}>
                스토어 바로가기 ›
              </button>
            </div>

            <div className="home-row-shell">
              <button type="button" className="home-row-arrow home-row-arrow--left" onClick={() => scrollRow(storeRowRef, 'left')}>
                ‹
              </button>

              <div className="home-row-scroll" ref={storeRowRef}>
                {featuredProducts.map((product, index) => {
                  const priceText = getDisplayPrice(product);
                  const metaParts = [product.category, priceText].filter(Boolean);
                  const metaText = metaParts.length > 0 ? metaParts.join(' · ') : product.desc || '';

                  const hasImage = !!product.image;

                  const fallbackClass =
                    index % 3 === 0 ? 'home-row-thumb-fallback--vegi' : index % 3 === 1 ? 'home-row-thumb-fallback--fruit' : 'home-row-thumb-fallback--grain';

                  return (
                    <article key={product.id} className="home-row-card pf-card pf-card-hover" onClick={() => goProductDetail(product.id)}>
                      <div className="home-row-thumb">
                        {hasImage ? <img src={product.image} alt={product.name} loading="lazy" /> : <div className={`home-row-thumb-fallback ${fallbackClass}`} />}
                      </div>
                      <div className="home-row-body">
                        <p className="home-row-card-title">{product.name}</p>
                        <p className="home-row-card-meta">{metaText}</p>
                      </div>
                    </article>
                  );
                })}
              </div>

              <button type="button" className="home-row-arrow home-row-arrow--right" onClick={() => scrollRow(storeRowRef, 'right')}>
                ›
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4) 진행 이벤트 – 기존 EventSection 활용 */}
      <section className="home-section home-section-events">
        <div className="pf-container">
          <EventSection />
        </div>
      </section>
    </main>
  );
}

export default Main;
