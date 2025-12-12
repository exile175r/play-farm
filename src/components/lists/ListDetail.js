import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
// import { products } from "../data/ListData";
import { getProgramById } from '../../services/programApi';
import "./ListDetail.css";
import { getImagePath } from "../../utils/imagePath";
import dayjs from "dayjs";

function ListDetail() {
  const [data, setData] = useState(null);
  const { id } = useParams();

  const [activeTab, setActiveTab] = useState("schedule");

  // const item = products.find((p) => p.id === id);
  // if (!farmData || !farmData.DATA) return null;

  // const data = farmData.DATA[id - 1];
  // if (!item || !data) return null;

  const fetchProgramDetail = async (id) => {
    try {
      const result = await getProgramById(id);
      if (result.success) {
        console.log("🔍 ~ ListDetail ~ play-farm/src/components/lists/ListDetail.js:22 ~ result:", result.data);
        setData(result.data || null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (id) fetchProgramDetail(id);
  }, [id]);

  return (
    <section className="detail-wrap">
      <div className="detail-inner">
        {data && (
          <>
            <div className="detail-top">
              <div className="detail-img">
                {data.images && data.images.length > 0 && <img src={getImagePath(data.images[0])} alt={data.program_nm} />}
              </div>

              <div className="detail-info">
                <p className="detail-label">{data.village_nm}</p>

                <h1 className="detail-title">{data.program_nm}</h1>

                <div className="detail-main-text">
                  <p>프로그램 구분 : {data.PROGRAM_SE || "정보 없음"}</p>
                  <p>인원 : {data.max_personnel || "정보 없음"}</p>
                  <p>신청 기간 : {data.reqst_bgnde || "?"} ~ {data.reqst_endde || "?"}</p>
                  <p>주소 : {data.address || "주소 정보 없음"}</p>
                  <p>소요시간 : {data.use_time || "정보 없음"}</p>
                  <p>이용 요금 : {data.chrge ? `${data.chrge}원` : "정보 없음"}</p>
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
          <button className={activeTab === "schedule" ? "tab active" : "tab"} onClick={() => setActiveTab("schedule")}>
            프로그램 일정
          </button>

          <button className={activeTab === "location" ? "tab active" : "tab"} onClick={() => setActiveTab("location")}>
            위치정보
          </button>

          <button className={activeTab === "info" ? "tab active" : "tab"} onClick={() => setActiveTab("info")}>
            상세정보
          </button>

          <button className={activeTab === "notice" ? "tab active" : "tab"} onClick={() => setActiveTab("notice")}>
            유의사항
          </button>
        </div>

        <div className="detail-tab-content">
          {activeTab === "schedule" && (
            <div className="detail-panel">
              <ul>
                <li>01. 입소 및 안전교육</li>
                <li>02. 체험 활동 진행</li>
                <li>03. 간식 시간 및 휴식</li>
                <li>04. 마무리 및 정리</li>
              </ul>
            </div>
          )}

          {activeTab === "location" && (
            <div className="detail-panel">
              <p>{data.address || "주소 없음"}</p>
              {data.refine_wgs84_lat && data.refine_wgs84_logt && (
                <p>
                  위도·경도: {data.refine_wgs84_lat}, {data.refine_wgs84_logt}
                </p>
              )}
              {data.address && (
                <a href={`https://map.kakao.com/link/to/${data.refine_wgs84_lat},${data.refine_wgs84_logt}`} target="_blank" rel="noreferrer">
                  지도보기
                </a>
              )}
            </div>
          )}

          {activeTab === "info" && (
            <div className="detail-panel info-grid">
              {Object.keys(data)
                .filter((key) => !["images", "data_source", "cn", "address", "column_comments", "id", "created_at", "updated_at"].includes(key))
                .map((key) => (
                  <div key={key} className="info-row">
                    <strong>{data.column_comments[key] || key} : </strong>
                    <span>{key !== "reqst_bgnde" && key !== "reqst_endde" ? data[key] : dayjs(data[key]).format('YYYY.MM.DD')}</span>
                  </div>
                ))}
            </div>
          )}

          {activeTab === "notice" && (
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
