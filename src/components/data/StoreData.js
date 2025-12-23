// src/components/data/StoreData.js
import { getImagePath } from '../../utils/imagePath';

const shopData = [
   {
      id: 1,
      name: '유기농 감자',
      desc: '포슬포슬한 국내산 유기농 감자',
      category: '채소',
      image: getImagePath('/images/store/potato.png'),
      options: [
         { id: '2kg', label: '2kg', price: 13000 },
         { id: '3kg', label: '3kg', price: 18000 },
         { id: '5kg', label: '5kg', price: 26000 },
      ],
   },
   {
      id: 2,
      name: '제주 감귤',
      desc: '산지 직송, 당도 높은 제주 감귤',
      category: '과일',
      image: getImagePath('./images/store/tangerine.png'),
      options: [
         { id: '3kg', label: '3kg', price: 19000 },
         { id: '5kg', label: '5kg', price: 29000 },
         { id: '10kg', label: '10kg', price: 52000 },
      ],
   },
   {
      id: 3,
      name: '쌀(신동진)',
      desc: '밥맛 좋은 신동진 쌀',
      category: '곡물',
      image: getImagePath('/images/store/rice.png'),
      options: [
         { id: '5kg', label: '5kg', price: 21900 },
         { id: '10kg', label: '10kg', price: 39900 },
      ],
   },
   {
      id: 4,
      name: '샤인머스캣',
      desc: '씨 없고 달콤한 프리미엄 포도',
      category: '과일',
      image: getImagePath('/images/store/grape.png'),
      options: [
         { id: '1송이', label: '1송이', price: 22000 },
         { id: '2송이', label: '2송이', price: 41000 },
      ],
   },
   {
      id: 5,
      name: '양파',
      desc: '요리 필수템, 저장성 좋은 양파',
      category: '채소',
      image: getImagePath('/images/store/onion.png'),
      options: [
         { id: '3kg', label: '3kg', price: 9900 },
         { id: '5kg', label: '5kg', price: 14900 },
         { id: '10kg', label: '10kg', price: 26900 },
      ],
   },
   {
      id: 6,
      name: '설향 딸기',
      desc: '신선 선별, 달콤한 설향 딸기',
      category: '과일',
      image: getImagePath('/images/store/strawberry.png'),
      options: [
         { id: '500g', label: '500g', price: 15000 },
         { id: '1kg', label: '1kg', price: 27000 },
      ],
   },
   {
      id: 7,
      name: '표고버섯',
      desc: '향이 진한 국내산 표고버섯',
      category: '버섯',
      image: getImagePath('/images/store/shiitake.jpg'),
      options: [
         { id: '300g', label: '300g', price: 9900 },
         { id: '600g', label: '600g', price: 17900 },
      ],
   },
   {
      id: 8,
      name: '사과(부사)',
      desc: '아삭하고 단맛이 좋은 부사 사과',
      category: '과일',
      image: getImagePath('/images/store/apple.png'),
      options: [
         { id: '2kg', label: '2kg', price: 16000 },
         { id: '5kg', label: '5kg', price: 34000 },
      ],
   },
   {
      id: 9,
      name: '대파',
      desc: '진한 향, 국/볶음용 대파',
      category: '채소',
      image: getImagePath('/images/store/green-onion.png'),
      options: [
         { id: '1단', label: '1단', price: 4500 },
         { id: '3단', label: '3단', price: 11900 },
      ],
   },
   {
      id: 10,
      name: '현미',
      desc: '고소한 풍미, 건강한 현미',
      category: '곡물',
      image: getImagePath('/images/store/brown-rice.png'),
      options: [
         { id: '2kg', label: '2kg', price: 13900 },
         { id: '5kg', label: '5kg', price: 30900 },
      ],
   },
   {
      id: 11,
      name: '천도 복숭아',
      desc: '향긋한 과즙, 여름 제철 복숭아',
      category: '과일',
      image: getImagePath('/images/store/peach.jpg'),
      options: [
         { id: '2kg', label: '2kg', price: 23000 },
         { id: '4kg', label: '4kg', price: 41000 },
      ],
   },
   {
      id: 12,
      name: '마늘',
      desc: '알이 굵은 국내산 마늘',
      category: '채소',
      image: getImagePath('/images/store/garlic.png'),
      options: [
         { id: '500g', label: '500g', price: 9900 },
         { id: '1kg', label: '1kg', price: 17900 },
      ],
   },
   {
      id: 13,
      name: '새송이버섯',
      desc: '쫄깃한 식감의 새송이버섯',
      category: '버섯',
      image: getImagePath('/images/store/king-oyster-mushroom.png'),
      options: [
         { id: '500g', label: '500g', price: 5900 },
         { id: '1kg', label: '1kg', price: 10900 },
      ],
   },
   {
      id: 14,
      name: '고구마',
      desc: '달콤한 국내산 밤고구마',
      category: '채소',
      image: getImagePath('/images/store/sweetpotato.jpg'),
      options: [
         { id: '2kg', label: '2kg', price: 15900 },
         { id: '5kg', label: '5kg', price: 33900 },
      ],
   },
   {
      id: 15,
      name: '배(신고)',
      desc: '시원한 과즙의 신고배',
      category: '과일',
      image: getImagePath('/images/store/pear01.jpg'),
      options: [
         { id: '3kg', label: '3kg', price: 24000 },
         { id: '5kg', label: '5kg', price: 36000 },
      ],
   },
   {
      id: 16,
      name: '서리태(검은콩)',
      desc: '국내산 서리태, 콩자반/두유용',
      category: '곡물',
      image: getImagePath('/images/store/black-bean.png'),
      options: [
         { id: '500g', label: '500g', price: 9900 },
         { id: '1kg', label: '1kg', price: 17900 },
      ],
   },
   {
      id: 17,
      name: '오이',
      desc: '아삭한 식감, 샐러드용 오이',
      category: '채소',
      image: getImagePath('/images/store/cucumber02.png'),
      options: [
         { id: '5개', label: '5개', price: 5900 },
         { id: '10개', label: '10개', price: 10900 },
      ],
   },
   {
      id: 18,
      name: '블루베리',
      desc: '상큼한 블루베리',
      category: '과일',
      image: getImagePath('/images/store/blueberry01.jpg'),
      options: [
         { id: '250g', label: '250g', price: 9900 },
         { id: '500g', label: '500g', price: 17900 },
      ],
   },
   {
      id: 19,
      name: '찹쌀',
      desc: '떡/죽에 좋은 찹쌀',
      category: '곡물',
      image: getImagePath('/images/store/glutinous-rice.png'),
      options: [
         { id: '2kg', label: '2kg', price: 14900 },
         { id: '5kg', label: '5kg', price: 32900 },
      ],
   },
   {
      id: 20,
      name: '토마토',
      desc: '샐러드에 좋은 완숙 토마토',
      category: '과일',
      image: getImagePath('/images/store/tomato02.jpg'),
      options: [
         { id: '2kg', label: '2kg', price: 13000 },
         { id: '5kg', label: '5kg', price: 29000 },
      ],
   },
   {
      id: 21,
      name: '무화과',
      desc: '부드럽고 달콤한 국내산 무화과',
      category: '채소',
      image: getImagePath('/images/store/figs01.jpg'),
      options: [
         { id: '3개', label: '3개', price: 6900 },
         { id: '6개', label: '6개', price: 12900 },
      ],
   },
   {
      id: 22,
      name: '아몬드',
      desc: '바삭 고소한 아몬드',
      category: '견과',
      image: getImagePath('/images/store/almond.png'),
      options: [
         { id: '500g', label: '500g', price: 13900 },
         { id: '1kg', label: '1kg', price: 25900 },
      ],
   },
   {
      id: 23,
      name: '호두',
      desc: '고소한 호두, 베이킹용',
      category: '견과',
      image: getImagePath('/images/store/walnut.png'),
      options: [
         { id: '500g', label: '500g', price: 13900 },
         { id: '1kg', label: '1kg', price: 25900 },
      ],
   },
   {
      id: 24,
      name: '당근',
      desc: '달큰한 국내산 당근',
      category: '채소',
      image: getImagePath('/images/store/carrot.png'),
      options: [
         { id: '1kg', label: '1kg', price: 8900 },
         { id: '3kg', label: '3kg', price: 21900 },
      ],
   },
];

export default shopData;
