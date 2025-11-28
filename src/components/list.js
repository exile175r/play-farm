import React from "react";
import "./list.css";

function List() {
  const products = [
    {
      id: 1,
      title: "딸기 따기 체험",
      subtitle: "가족 체험 추천",
      date: "신청마감 2025-03-10",
      image: "/images/benner1.png",
    },
    {
      id: 2,
      title: "고구마 수확 체험",
      subtitle: "초등학생 인기",
      date: "신청마감 2025-04-02",
      image: "/images/benner2.png",
    },
    {
      id: 3,
      title: "감귤 따기 체험",
      subtitle: "제주도 농장",
      date: "신청마감 2025-05-11",
      image: "/images/benner3.png",
    },
    {
      id: 4,
      title: "사과 농장 체험",
      subtitle: "포토존 인기",
      date: "신청마감 2025-04-28",
      image: "/images/benner4.png",
    },
    {
      id: 5,
      title: "방울토마토 수확",
      subtitle: "아이들 체험",
      date: "신청마감 2025-04-15",
      image: "/images/benner5.png",
    },
    {
      id: 6,
      title: "수제 화분 만들기",
      subtitle: "실내 체험",
      date: "신청마감 2025-03-25",
      image: "/images/swtpott.jpg",
    },
    {
      id: 7,
      title: "봄맞이 꽃 체험",
      subtitle: "꽃다발 만들기",
      date: "신청마감 2025-04-20",
      image: "/images/farm.jpg",
    },
    {
      id: 8,
      title: "농장 투어",
      subtitle: "1시간 투어",
      date: "신청마감 2025-06-01",
      image: "/images/strbr.jpg",
    },
  ];

  return (
    <main className="pf-list">
      <div className="pf-list-inner">
        <section className="pf-card-grid">
          {products.map((item) => (
            <article key={item.id} className="pf-card">
              <div className="pf-card-image-wrap">
                <img src={item.image} alt={item.title} />
              </div>

              <div className="pf-card-body">
                <p className="pf-card-title">{item.title}</p>
                <p className="pf-card-sub">{item.subtitle}</p>
                <p className="pf-card-date">{item.date}</p>

                <div className="pf-card-buttons">
                  <button type="button" className="pf-card-btn pf-btn-outline">
                    상세보기
                  </button>
                  <button type="button" className="pf-card-btn pf-btn-primary">
                    예약하기
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

export default List;
