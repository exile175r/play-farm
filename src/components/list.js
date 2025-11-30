import React from "react";
import "./list.css";

function List() {
  const products = [
    {
      id: 1,
      title: "딸기 수확 체험",
      subtitle: "봄 제철 딸기 따기",
      date: "신청마감 2025-03-10",
      image: "/images/img.png",
    },
    {
      id: 2,
      title: "고구마 캐기 체험",
      subtitle: "직접 캐서 가져가는 고구마",
      date: "신청마감 2025-04-02",
      image: "/images/img.png",
    },
    {
      id: 3,
      title: "감귤 수확 체험",
      subtitle: "제주 감귤밭에서 따기",
      date: "신청마감 2025-05-11",
      image: "/images/img.png",
    },
    {
      id: 4,
      title: "사과 수확 체험",
      subtitle: "사과밭 포토존 & 수확",
      date: "신청마감 2025-04-28",
      image: "/images/img.png",
    },
    {
      id: 5,
      title: "방울토마토 수확 체험",
      subtitle: "아이들이 좋아하는 토마토 따기",
      date: "신청마감 2025-04-15",
      image: "/images/img.png",
    },
    {
      id: 6,
      title: "허브 화분 만들기 체험",
      subtitle: "직접 심고 가져가는 허브",
      date: "신청마감 2025-03-25",
      image: "/images/img.png",
    },
    {
      id: 7,
      title: "봄꽃 수확 & 꽃다발 체험",
      subtitle: "농장에서 꽃 따서 만들기",
      date: "신청마감 2025-04-20",
      image: "/images/img.png",
    },
    {
      id: 8,
      title: "농장 수확 투어 체험",
      subtitle: "여러 작물 수확 체험 코스",
      date: "신청마감 2025-06-01",
      image: "/images/img.png",
    },
  ];

  return (
    <main className="list-wrap">
      <div className="list-inner">
        <section className="list-grid">
          {products.map((item) => (
            <article key={item.id} className="list-card">
              <div className="list-card-img">
                <img src={item.image} alt={item.title} />
              </div>

              <div className="list-card-body">
                <p className="list-title">{item.title}</p>
                <p className="list-sub">{item.subtitle}</p>
                <p className="list-date">{item.date}</p>

                <div className="list-btn-wrap">
                  <button className="list-btn outline">상세보기</button>
                  <button className="list-btn primary">예약하기</button>
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
