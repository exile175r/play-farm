import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProgramById } from '../../services/programApi';
import './ListDetail.css';
import { getImagePath } from '../../utils/imagePath';
import dayjs from 'dayjs';

function ListDetail() {
   const [data, setData] = useState(null);
   const { id } = useParams();

   const [activeTab, setActiveTab] = useState('schedule');
   const mapContainer = useRef(null);
   const mapInstance = useRef(null);
   const [mapLoaded, setMapLoaded] = useState(false);

   const fetchProgramDetail = async (id) => {
      try {
         const result = await getProgramById(id);
         if (result.success) {
            const replaceText = { 체험: ' 체험', 및: ' 및 ' };
            try {
               result.data.program_nm = JSON.parse(result.data.program_nm)
                  .map((v) => v.replace(/체험|및/g, (match) => replaceText[match]))
                  .join(', ');
            } catch (error) {
               result.data.program_nm = result.data.program_nm.replace(/체험|및/g, (match) => replaceText[match]);
            }
            setData(result.data || null);
         }
      } catch (err) {
         console.error(err);
      }
   };

   useEffect(() => {
      if (!id) return;
      let isMounted = true;

      fetchProgramDetail(id).then(() => {
         if (!isMounted) return;
      });

      return () => {
         isMounted = false;
      };
   }, [id]);

   // 카카오맵 API 스크립트 로드
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

      const script = document.createElement('script');
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

      script.onerror = () => console.error('카카오맵 API 스크립트 로드 실패');
      document.head.appendChild(script);
   }, []);

   // 지도 초기화 및 마커 표시
   useEffect(() => {
      if (
         activeTab === 'location' &&
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
                     if (typeof window.kakao.maps.LatLng !== 'function') return;

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
                  <div style="font-weight:600;margin-bottom:4px;">${data.village_nm || '위치'}</div>
                  <div style="font-size:12px;color:#666;">${data.address || ''}</div>
                </div>`,
                     });
                     infowindow.open(mapInstance.current, marker);
                  }
               } catch (error) {
                  console.error('지도 초기화 오류:', error);
               }
            }, 200);

            return () => clearTimeout(timer);
         }
      }
   }, [activeTab, data, mapLoaded]);

   // 표시용 값들
   const programTypesText = Array.isArray(data?.program_types) && data.program_types.length > 0 ? data.program_types.join(', ') : '정보 없음';

   const feeText = data?.chrge ? data.chrge : '정보 없음';

   const reqPeriodText = data?.reqst_bgnde && data?.reqst_endde ? `${dayjs(data.reqst_bgnde).format('YYYY.MM.DD')} ~ ${dayjs(data.reqst_endde).format('YYYY.MM.DD')}` : '정보 없음';

   const hasLocation = !!(data?.refine_wgs84_lat && data?.refine_wgs84_logt);

   return (
      <section className="detail-wrap">
         <div className="detail-inner">
            {data && (
               <>
                  <div className="detail-top">
                     <div className="detail-img">{data.images && data.images.length > 0 && <img src={getImagePath(data.images[0])} alt={data.program_nm} />}</div>

                     <div className="detail-info">
                        <div className="detail-headline">
                           <span className="detail-badge">{data.village_nm}</span>
                        </div>

                        <h1 className="detail-title">{data.program_nm}</h1>

                        <div className="detail-main-text">
                           <p>프로그램 구분 : {programTypesText}</p>
                           <p>인원 : {data.max_personnel || '정보 없음'}</p>
                           <p>신청 기간 : {reqPeriodText}</p>
                           <p>주소 : {data.address || '주소 정보 없음'}</p>
                           <p>소요시간 : {data.use_time || '정보 없음'}</p>
                           <p>이용 요금 : {feeText}</p>
                        </div>

                        <div className="detail-btns">
                           <Link to="/list" className="detail-btn outline">
                              돌아가기
                           </Link>
                           <button className="detail-btn primary">예약하기</button>
                        </div>
                     </div>
                  </div>
               </>
            )}

            {/* 탭 */}
            <div className="detail-tabs">
               <button className={activeTab === 'schedule' ? 'tab active' : 'tab'} onClick={() => setActiveTab('schedule')}>
                  프로그램 일정
               </button>
               <button className={activeTab === 'location' ? 'tab active' : 'tab'} onClick={() => setActiveTab('location')}>
                  위치정보
               </button>
               <button className={activeTab === 'info' ? 'tab active' : 'tab'} onClick={() => setActiveTab('info')}>
                  상세정보
               </button>
               <button className={activeTab === 'notice' ? 'tab active' : 'tab'} onClick={() => setActiveTab('notice')}>
                  유의사항
               </button>
            </div>

            {/* 탭 컨텐츠 */}
            <div className="detail-tab-content">
               {/* 일정 */}
               {activeTab === 'schedule' && (
                  <div className="detail-panel">
                     <div className="panel-head">
                        <h3 className="panel-title">프로그램 진행 흐름</h3>
                        <span className="panel-chip">Schedule</span>
                     </div>

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

               {/* 위치 */}
               {activeTab === 'location' && (
                  <div className="detail-panel">
                     <div className="panel-head">
                        <h3 className="panel-title">위치 안내</h3>
                        <span className="panel-chip">Location</span>
                     </div>

                     <div className="location-card">
                        <div className="location-row">
                           <span className="location-label">주소</span>
                           <span className="location-value">{data?.address || '주소 없음'}</span>
                        </div>

                        {!hasLocation ? <p className="muted">위치 정보가 없습니다.</p> : <div id="map" ref={mapContainer} className="kakao-map"></div>}

                        {hasLocation && (
                           <a
                              className="map-link"
                              href={`https://map.kakao.com/link/map/${encodeURIComponent(data?.village_nm || '위치')},${data.refine_wgs84_lat},${data.refine_wgs84_logt}`}
                              target="_blank"
                              rel="noreferrer">
                              카카오맵에서 보기
                           </a>
                        )}
                     </div>
                  </div>
               )}

               {/* 상세정보 */}
               {activeTab === 'info' && (
                  <div className="detail-panel">
                     <div className="panel-head">
                        <h3 className="panel-title">프로그램 상세 정보</h3>
                        <span className="panel-chip">Info</span>
                     </div>

                     <div className="info-grid">
                        <div className="info-row">
                           <strong>마을</strong>
                           <span>{data?.village_nm || '정보 없음'}</span>
                        </div>

                        <div className="info-row">
                           <strong>프로그램명</strong>
                           <span>{data?.program_nm || '정보 없음'}</span>
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
                           <span>{data?.use_time || '정보 없음'}</span>
                        </div>

                        <div className="info-row">
                           <strong>인원</strong>
                           <span>
                              {data?.min_personnel || '-'} ~ {data?.max_personnel || '-'}
                           </span>
                        </div>
                     </div>

                     {data?.side_activities && (
                        <div className="sub-card">
                           <p className="sub-title">부가 활동</p>
                           <p className="sub-desc">{data.side_activities}</p>
                        </div>
                     )}
                  </div>
               )}

               {/* 유의사항 */}
               {activeTab === 'notice' && (
                  <div className="detail-panel">
                     <div className="panel-head">
                        <h3 className="panel-title">유의사항</h3>
                        <span className="panel-chip">Notice</span>
                     </div>

                     <ul className="check-list">
                        <li>취소·환불 규정은 운영 농장 정책을 따릅니다.</li>
                        <li>우천 시 일정 변경될 수 있음.</li>
                        <li>편한 복장 권장.</li>
                        <li>알레르기 시 사전문의 필요.</li>
                     </ul>
                  </div>
               )}
            </div>
         </div>
      </section>
   );
}

export default ListDetail;
