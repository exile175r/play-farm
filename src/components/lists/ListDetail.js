import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
// import { products } from "../data/ListData";
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

   // const item = products.find((p) => p.id === id);
   // if (!farmData || !farmData.DATA) return null;

   // const data = farmData.DATA[id - 1];
   // if (!item || !data) return null;

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

      // cleanup 함수로 중복 요청 방지
      let isMounted = true;

      fetchProgramDetail(id).then(() => {
         // 컴포넌트가 언마운트되었으면 상태 업데이트 안 함
         if (!isMounted) return;
      });

      return () => {
         isMounted = false;
      };
   }, [id]);

   // 카카오맵 API 스크립트 로드
   useEffect(() => {
      // 이미 스크립트가 로드되어 있고 maps.load()도 완료되었는지 확인
      if (window.kakao && window.kakao.maps && window.kakao.maps.LatLng) {
         setMapLoaded(true);
         return;
      }

      // 이미 스크립트 태그가 있는지 확인
      const existingScript = document.querySelector('script[src*="dapi.kakao.com"]');
      if (existingScript) {
         // 기존 스크립트가 로드될 때까지 기다림
         existingScript.onload = () => {
            if (window.kakao && window.kakao.maps) {
               window.kakao.maps.load(() => {
                  console.log('카카오맵 API 로드 완료');
                  setMapLoaded(true);
               });
            }
         };
         return;
      }

      const script = document.createElement('script');
      const apiKey = process.env.REACT_APP_KAKAO_MAP_API_KEY;
      // HTTPS 프로토콜 명시
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false`;
      script.async = true;

      script.onload = () => {
         if (window.kakao && window.kakao.maps) {
            // maps.load()를 호출하여 API 완전 로드
            window.kakao.maps.load(() => {
               console.log('카카오맵 API 로드 완료');
               // LatLng가 사용 가능한지 확인
               if (window.kakao.maps.LatLng) {
                  setMapLoaded(true);
               } else {
                  console.error('카카오맵 LatLng를 사용할 수 없습니다.');
               }
            });
         }
      };

      script.onerror = () => {
         console.error('카카오맵 API 스크립트 로드 실패');
      };

      document.head.appendChild(script);

      return;
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
         window.kakao.maps.LatLng && // LatLng가 사용 가능한지 확인
         window.kakao.maps.Map // Map도 사용 가능한지 확인
      ) {
         const lat = parseFloat(data.refine_wgs84_lat);
         const lng = parseFloat(data.refine_wgs84_logt);

         if (!isNaN(lat) && !isNaN(lng)) {
            // 약간의 지연을 두어 DOM이 완전히 렌더링되도록 함
            const timer = setTimeout(() => {
               try {
                  // 기존 지도 인스턴스가 있으면 제거
                  if (mapInstance.current) {
                     mapInstance.current = null;
                  }

                  // 지도 컨테이너가 비어있는지 확인
                  if (mapContainer.current && mapContainer.current.children.length === 0) {
                     // LatLng와 Map이 실제로 constructor인지 확인
                     if (typeof window.kakao.maps.LatLng !== 'function') {
                        console.error('LatLng가 constructor가 아닙니다.');
                        return;
                     }

                     // 지도 생성
                     const options = {
                        center: new window.kakao.maps.LatLng(lat, lng),
                        level: 3,
                     };

                     mapInstance.current = new window.kakao.maps.Map(mapContainer.current, options);

                     // 마커 생성
                     const markerPosition = new window.kakao.maps.LatLng(lat, lng);
                     const marker = new window.kakao.maps.Marker({
                        position: markerPosition,
                     });
                     marker.setMap(mapInstance.current);

                     // 인포윈도우 생성
                     const infowindow = new window.kakao.maps.InfoWindow({
                        content: `<div style="padding:8px;font-size:13px;min-width:150px;">
                  <div style="font-weight:600;margin-bottom:4px;">${data.village_nm || '위치'}</div>
                  <div style="font-size:12px;color:#666;">${data.address || ''}</div>
                </div>`,
                     });
                     infowindow.open(mapInstance.current, marker);

                     console.log('지도 초기화 완료');
                  }
               } catch (error) {
                  console.error('지도 초기화 오류:', error);
               }
            }, 200);

            return () => clearTimeout(timer);
         }
      }
   }, [activeTab, data, mapLoaded]);

   return (
      <section className="detail-wrap">
         <div className="detail-inner">
            {data && (
               <>
                  <div className="detail-top">
                     <div className="detail-img">{data.images && data.images.length > 0 && <img src={getImagePath(data.images[0])} alt={data.program_nm} />}</div>

                     <div className="detail-info">
                        <p className="detail-label">{data.village_nm}</p>

                        <h1 className="detail-title">{data.program_nm}</h1>

                        <div className="detail-main-text">
                           <p>프로그램 구분 : {data.program_types.join(', ') || '정보 없음'}</p>
                           <p>인원 : {data.max_personnel || '정보 없음'}</p>
                           <p>
                              신청 기간 : {dayjs(data.reqst_bgnde).format('YYYY.MM.DD') || '?'} ~ {dayjs(data.reqst_endde).format('YYYY.MM.DD') || '?'}
                           </p>
                           <p>주소 : {data.address || '주소 정보 없음'}</p>
                           <p>소요시간 : {data.use_time || '정보 없음'}</p>
                           <p>이용 요금 : {data.chrge ? data.chrge : '정보 없음'}</p>
                        </div>

                        <div className="detail-btns">
                           <Link to="/" className="detail-btn outline">
                              돌아가기
                           </Link>
                           <button className="detail-btn primary">예약하기</button>
                        </div>
                     </div>
                  </div>
               </>
            )}

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

            <div className="detail-tab-content">
               {activeTab === 'schedule' && (
                  <div className="detail-panel">
                     <ul>
                        <li>01. 입소 및 안전교육</li>
                        <li>02. 체험 활동 진행</li>
                        <li>03. 간식 시간 및 휴식</li>
                        <li>04. 마무리 및 정리</li>
                     </ul>
                  </div>
               )}

               {activeTab === 'location' && (
                  <div className="detail-panel">
                     <p>{data.address || '주소 없음'}</p>
                     {/* {data.refine_wgs84_lat && data.refine_wgs84_logt && (
                <p>
                  위도·경도: {data.refine_wgs84_lat}, {data.refine_wgs84_logt}
                </p>
              )} */}
                     {data?.refine_wgs84_lat && data?.refine_wgs84_logt ? (
                        <div id="map" ref={mapContainer} className="kakao-map"></div>
                     ) : (
                        <p style={{ color: '#999', fontSize: '13px' }}>위치 정보가 없습니다.</p>
                     )}

                     {/* {data.address && (
                <a href={`https://map.kakao.com/link/to/${data.refine_wgs84_lat},${data.refine_wgs84_logt}`} target="_blank" rel="noreferrer">
                  지도보기
                </a>
              )} */}
                  </div>
               )}

               {activeTab === 'info' && (
                  <div className="detail-panel info-grid">
                     {Object.keys(data)
                        .filter((key) =>
                           ['village_nm', 'program_nm', 'reqst_bgnde', 'reqst_bgnde ', 'reqst_endde', 'chrge', 'use_time', 'min_personnel ', 'max_personnel'].includes(key)
                        )
                        .map(
                           (key) =>
                              key !== 'reqst_endde' && (
                                 <div key={key} className="info-row">
                                    {key !== 'reqst_bgnde' ? (
                                       <>
                                          <strong>{data.column_comments[key] || key} : </strong>
                                          <span>{data[key]}</span>
                                       </>
                                    ) : (
                                       <>
                                          <strong>신청일 : </strong>
                                          <span>
                                             {dayjs(data.reqst_bgnde).format('YYYY.MM.DD')} ~ {dayjs(data.reqst_endde).format('YYYY.MM.DD')}
                                          </span>
                                       </>
                                    )}
                                 </div>
                              )
                        )}
                  </div>
               )}

               {activeTab === 'notice' && (
                  <div className="detail-panel">
                     <ul>
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
