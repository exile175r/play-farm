// src/components/List.js
import React from "react";
import { Link } from "react-router-dom";
import "./List.css";
import { getImagePath } from "../utils/imagePath";

function List({ farmData }) {
  // 전체 데이터 중 앞에서 10개만 잘라오기
  const list = (farmData?.DATA || []).slice(0, 10);

  const program = (data) => {
    const p = Array.isArray(data.PROGRAM_NM) ? data.PROGRAM_NM[0] : data.PROGRAM_NM;
    const pTxt = p
      .split("체험")
      .map((v) => (v === "" ? (v = "체험") : v))
      .join(" ");
    return pTxt;
  };

  return (
    <section className="list-wrap">
      <div className="list-inner">
        <h2 className="list-title">전체 체험 목록</h2>

        <div className="list-grid">
          {list.map((data, index) => (
            <div className="list-card" key={data.PROGRAM_ID || index}>
              {/* 이미지 영역 */}
              <div className="list-card-img">
                {data.IMAGES && data.IMAGES.length > 0 && (
                  <img src={getImagePath(data.IMAGES[0])} alt={data.PROGRAM_NM} />
                )}
              </div>

              {/* 텍스트 영역 */}
              <div className="list-card-body">
                <h3 className="list-title">{program(data)}</h3>
                <p className="list-sub">{data.SIDE_ACTIVITIES}</p>
                <p className="list-date">{data.REQST_ENDDE}</p>

                {/* 버튼 영역 */}
                <div className="list-btn-wrap">
                  <Link to={`/list/${index + 1}`} className="list-btn outline">
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
