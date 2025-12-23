// src/components/data/StoreData.js
import { getImagePath } from "../../utils/imagePath";

const shopData = [
  {
    id: 1,
    name: "유기농 감자",
    desc: "포슬포슬한 국내산 유기농 감자",
    category: "채소",
    image: getImagePath("/images/store/potato.png"),
    options: [
      { id: "2kg", label: "2kg", amount: 2, unit: "kg", unitPrice: 6500, price: 13000 },
      { id: "3kg", label: "3kg", amount: 3, unit: "kg", unitPrice: 6000, price: 18000 },
      { id: "5kg", label: "5kg", amount: 5, unit: "kg", unitPrice: 5200, price: 26000 },
    ],
  },
  {
    id: 2,
    name: "제주 감귤",
    desc: "산지 직송, 당도 높은 제주 감귤",
    category: "과일",
    image: getImagePath("/images/store/tangerine.png"),
    options: [
      { id: "3kg", label: "3kg", amount: 3, unit: "kg", unitPrice: 6333, price: 19000 },
      { id: "5kg", label: "5kg", amount: 5, unit: "kg", unitPrice: 5800, price: 29000 },
      { id: "10kg", label: "10kg", amount: 10, unit: "kg", unitPrice: 5200, price: 52000 },
    ],
  },
  {
    id: 3,
    name: "쌀(신동진)",
    desc: "밥맛 좋은 신동진 쌀",
    category: "곡물",
    image: getImagePath("/images/store/rice.png"),
    options: [
      { id: "5kg", label: "5kg", amount: 5, unit: "kg", unitPrice: 4380, price: 21900 },
      { id: "10kg", label: "10kg", amount: 10, unit: "kg", unitPrice: 3990, price: 39900 },
    ],
  },
  {
    id: 4,
    name: "샤인머스캣",
    desc: "씨 없고 달콤한 프리미엄 포도",
    category: "과일",
    image: getImagePath("/images/store/grape.png"),
    options: [
      { id: "1송이", label: "1송이", amount: 1, unit: "송이", unitPrice: 22000, price: 22000 },
      { id: "2송이", label: "2송이", amount: 2, unit: "송이", unitPrice: 20500, price: 41000 },
    ],
  },
  {
    id: 5,
    name: "양파",
    desc: "요리 필수템, 저장성 좋은 양파",
    category: "채소",
    image: getImagePath("/images/store/onion.png"),
    options: [
      { id: "3kg", label: "3kg", amount: 3, unit: "kg", unitPrice: 3300, price: 9900 },
      { id: "5kg", label: "5kg", amount: 5, unit: "kg", unitPrice: 2980, price: 14900 },
      { id: "10kg", label: "10kg", amount: 10, unit: "kg", unitPrice: 2690, price: 26900 },
    ],
  },
  {
    id: 6,
    name: "설향 딸기",
    desc: "신선 선별, 달콤한 설향 딸기",
    category: "과일",
    image: getImagePath("/images/store/strawberry.png"),
    options: [
      { id: "500g", label: "500g", amount: 0.5, unit: "kg", unitPrice: 30000, price: 15000 },
      { id: "1kg", label: "1kg", amount: 1, unit: "kg", unitPrice: 27000, price: 27000 },
    ],
  },
  {
    id: 7,
    name: "표고버섯",
    desc: "향이 진한 국내산 표고버섯",
    category: "버섯",
    image: getImagePath("/images/store/shiitake.jpg"),
    options: [
      { id: "300g", label: "300g", amount: 0.3, unit: "kg", unitPrice: 33000, price: 9900 },
      { id: "600g", label: "600g", amount: 0.6, unit: "kg", unitPrice: 29833, price: 17900 },
    ],
  },
  {
    id: 8,
    name: "사과(부사)",
    desc: "아삭하고 단맛이 좋은 부사 사과",
    category: "과일",
    image: getImagePath("/images/store/apple.png"),
    options: [
      { id: "2kg", label: "2kg", amount: 2, unit: "kg", unitPrice: 8000, price: 16000 },
      { id: "5kg", label: "5kg", amount: 5, unit: "kg", unitPrice: 6800, price: 34000 },
    ],
  },
  {
    id: 9,
    name: "대파",
    desc: "진한 향, 국/볶음용 대파",
    category: "채소",
    image: getImagePath("/images/store/green-onion.png"),
    options: [
      { id: "1단", label: "1단", amount: 1, unit: "단", unitPrice: 4500, price: 4500 },
      { id: "3단", label: "3단", amount: 3, unit: "단", unitPrice: 3967, price: 11900 },
    ],
  },
  {
    id: 10,
    name: "현미",
    desc: "고소한 풍미, 건강한 현미",
    category: "곡물",
    image: getImagePath("/images/store/brown-rice.png"),
    options: [
      { id: "2kg", label: "2kg", amount: 2, unit: "kg", unitPrice: 6950, price: 13900 },
      { id: "5kg", label: "5kg", amount: 5, unit: "kg", unitPrice: 6180, price: 30900 },
    ],
  },
  {
    id: 11,
    name: "천도 복숭아",
    desc: "향긋한 과즙, 여름 제철 복숭아",
    category: "과일",
    image: getImagePath("/images/store/peach.jpg"),
    options: [
      { id: "2kg", label: "2kg", amount: 2, unit: "kg", unitPrice: 11500, price: 23000 },
      { id: "4kg", label: "4kg", amount: 4, unit: "kg", unitPrice: 10250, price: 41000 },
    ],
  },
  {
    id: 12,
    name: "마늘",
    desc: "알이 굵은 국내산 마늘",
    category: "채소",
    image: getImagePath("/images/store/garlic.png"),
    options: [
      { id: "500g", label: "500g", amount: 0.5, unit: "kg", unitPrice: 19800, price: 9900 },
      { id: "1kg", label: "1kg", amount: 1, unit: "kg", unitPrice: 17900, price: 17900 },
    ],
  },
  {
    id: 13,
    name: "새송이버섯",
    desc: "쫄깃한 식감의 새송이버섯",
    category: "버섯",
    image: getImagePath("/images/store/king-oyster-mushroom.png"),
    options: [
      { id: "500g", label: "500g", amount: 0.5, unit: "kg", unitPrice: 11800, price: 5900 },
      { id: "1kg", label: "1kg", amount: 1, unit: "kg", unitPrice: 10900, price: 10900 },
    ],
  },
  {
    id: 14,
    name: "고구마",
    desc: "달콤한 국내산 밤고구마",
    category: "채소",
    image: getImagePath("/images/store/sweetpotato.jpg"),
    options: [
      { id: "2kg", label: "2kg", amount: 2, unit: "kg", unitPrice: 7950, price: 15900 },
      { id: "5kg", label: "5kg", amount: 5, unit: "kg", unitPrice: 6780, price: 33900 },
    ],
  },
  {
    id: 15,
    name: "배(신고)",
    desc: "시원한 과즙의 신고배",
    category: "과일",
    image: getImagePath("/images/store/pear01.jpg"),
    options: [
      { id: "3kg", label: "3kg", amount: 3, unit: "kg", unitPrice: 8000, price: 24000 },
      { id: "5kg", label: "5kg", amount: 5, unit: "kg", unitPrice: 7200, price: 36000 },
    ],
  },
  {
    id: 16,
    name: "서리태(검은콩)",
    desc: "국내산 서리태, 콩자반/두유용",
    category: "곡물",
    image: getImagePath("/images/store/black-bean.png"),
    options: [
      { id: "500g", label: "500g", amount: 0.5, unit: "kg", unitPrice: 19800, price: 9900 },
      { id: "1kg", label: "1kg", amount: 1, unit: "kg", unitPrice: 17900, price: 17900 },
    ],
  },
  {
    id: 17,
    name: "오이",
    desc: "아삭한 식감, 샐러드용 오이",
    category: "채소",
    image: getImagePath("/images/store/cucumber02.png"),
    options: [
      { id: "5개", label: "5개", amount: 5, unit: "개", unitPrice: 1180, price: 5900 },
      { id: "10개", label: "10개", amount: 10, unit: "개", unitPrice: 1090, price: 10900 },
    ],
  },
  {
    id: 18,
    name: "블루베리",
    desc: "상큼한 블루베리",
    category: "과일",
    image: getImagePath("/images/store/blueberry01.jpg"),
    options: [
      { id: "250g", label: "250g", amount: 0.25, unit: "kg", unitPrice: 39600, price: 9900 },
      { id: "500g", label: "500g", amount: 0.5, unit: "kg", unitPrice: 35800, price: 17900 },
    ],
  },
  {
    id: 19,
    name: "찹쌀",
    desc: "떡/죽에 좋은 찹쌀",
    category: "곡물",
    image: getImagePath("/images/store/glutinousrice.png"),
    options: [
      { id: "2kg", label: "2kg", amount: 2, unit: "kg", unitPrice: 7450, price: 14900 },
      { id: "5kg", label: "5kg", amount: 5, unit: "kg", unitPrice: 6580, price: 32900 },
    ],
  },
  {
    id: 20,
    name: "토마토",
    desc: "샐러드에 좋은 완숙 토마토",
    category: "과일",
    image: getImagePath("/images/store/tomato02.jpg"),
    options: [
      { id: "2kg", label: "2kg", amount: 2, unit: "kg", unitPrice: 6500, price: 13000 },
      { id: "5kg", label: "5kg", amount: 5, unit: "kg", unitPrice: 5800, price: 29000 },
    ],
  },
  {
    id: 21,
    name: "무화과",
    desc: "부드럽고 달콤한 국내산 무화과",
    category: "채소",
    image: getImagePath("/images/store/figs01.jpg"),
    options: [
      { id: "3개", label: "3개", amount: 3, unit: "개", unitPrice: 2300, price: 6900 },
      { id: "6개", label: "6개", amount: 6, unit: "개", unitPrice: 2150, price: 12900 },
    ],
  },
  {
    id: 22,
    name: "아몬드",
    desc: "바삭 고소한 아몬드",
    category: "견과",
    image: getImagePath("/images/store/almond.png"),
    options: [
      { id: "500g", label: "500g", amount: 0.5, unit: "kg", unitPrice: 27800, price: 13900 },
      { id: "1kg", label: "1kg", amount: 1, unit: "kg", unitPrice: 25900, price: 25900 },
    ],
  },
  {
    id: 23,
    name: "호두",
    desc: "고소한 호두, 베이킹용",
    category: "견과",
    image: getImagePath("/images/store/walnut.png"),
    options: [
      { id: "500g", label: "500g", amount: 0.5, unit: "kg", unitPrice: 27800, price: 13900 },
      { id: "1kg", label: "1kg", amount: 1, unit: "kg", unitPrice: 25900, price: 25900 },
    ],
  },
  {
    id: 24,
    name: "당근",
    desc: "달큰한 국내산 당근",
    category: "채소",
    image: getImagePath("/images/store/carrot.png"),
    options: [
      { id: "1kg", label: "1kg", amount: 1, unit: "kg", unitPrice: 8900, price: 8900 },
      { id: "3kg", label: "3kg", amount: 3, unit: "kg", unitPrice: 7300, price: 21900 },
    ],
  },
];

export default shopData;
