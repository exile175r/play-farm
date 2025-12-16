// src/components/List.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './List.css';
import dayjs from 'dayjs';
import { getAllPrograms } from '../../services/programApi';
import { getImagePath } from '../../utils/imagePath';

function List() {
   const [programs, setPrograms] = useState([]);
   const [page, setPage] = useState(1);
   const [error, setError] = useState(null);

   // 중복 호출 방지
   const isLoadingRef = useRef(false);

   // 전체 프로그램 목록 조회
   const fetchPrograms = useCallback(async (pageNum = 1) => {
      // 이미 로딩 중이면 중복 호출 방지
      if (isLoadingRef.current) return;

      isLoadingRef.current = true;
      setError(null);

      try {
         const result = await getAllPrograms(pageNum, 20);

         if (result.success) {
            // 텍스트 패턴 치환
            const replaceText = { 체험: ' 체험', 및: ' 및 ' };
            result.data.forEach((data) => {
               try {
                  data.program_nm = JSON.parse(data.program_nm)
                     .map((v) => v.replace(/체험|및/g, (match) => replaceText[match]))
                     .join(', ');
               } catch (error) {
                  data.program_nm = data.program_nm.replace(/체험|및/g, (match) => replaceText[match]);
               }
            });
            setPrograms(result.data || []);
         } else {
            setError(result.error || '데이터를 불러오는데 실패했습니다.');
            setPrograms([]);
         }
      } catch (err) {
         setError('프로그램 목록을 불러오는 중 오류가 발생했습니다.');
         setPrograms([]);
      } finally {
         isLoadingRef.current = false;
      }
   }, []); // 의존성 배열이 비어있어서 함수가 한 번만 생성됨

   useEffect(() => {
      fetchPrograms(page);
   }, [page, fetchPrograms]);

   // 전체 데이터 중 앞에서 10개만 잘라오기
   // const list = (farmData?.DATA || []).slice(0, 10);

   // const program = (data) => {
   //   const p = Array.isArray(data.PROGRAM_NM) ? data.PROGRAM_NM[0] : data.PROGRAM_NM;
   //   const pTxt = p
   //     .split("체험")
   //     .map((v) => (v === "" ? (v = "체험") : v))
   //     .join(" ");
   //   return pTxt;
   // };

   return (
      <section className="list-wrap">
         <div className="list-inner">
            <h2 className="list-title">전체 체험 목록</h2>

            <div className="list-grid">
               {programs.map((data, index) => (
                  <div className="list-card" key={data.id}>
                     {/* 이미지 영역 */}
                     <div className="list-card-img">{data.images && data.images.length > 0 && <img src={getImagePath(data.images[0])} alt={data.program_nm} loading="lazy" />}</div>

                     {/* 텍스트 영역 */}
                     <div className="list-card-body">
                        <h3 className="list-title">{data.program_nm}</h3>
                        <p className="list-sub">{data.side_activities}</p>
                        <p className="list-date">{dayjs(data.reqst_endde).format('YYYY.MM.DD')}</p>

                        {/* 버튼 영역 */}
                        <div className="list-btn-wrap">
                           <Link to={`/list/${data.id}`} className="list-btn outline">
                              상세보기
                           </Link>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </section>
   );
}

export default List;
