import { getImagePath } from '../../utils/imagePath';

export const eventSections = [
   {
      id: 'discount',
      title: '체험 단일 할인',
      items: [
         {
            id: 1,
            titleLine1: '딸기따기 체험',
            titleLine2: '경기 이천 농가',
            subText: '당일 수확 딸기 500g 포함',
            price: 12000, // 할인가
            original: 15000, // 정상가 (지금 화면에 안 써도 데이터로는 보관)
            unit: '1인',
            tag: '#가족추천 #겨울제철딸기',
            image: getImagePath('events/strawberry-farm.jpg'),
         },
         {
            id: 2,
            titleLine1: '감자캐기 체험',
            titleLine2: '평창 고랭지',
            subText: '수확 감자 2kg 제공',
            price: 9000,
            original: 12000,
            unit: '1인',
            tag: '#시원한바람 #힐링',
            image: getImagePath('events/potato-farm.jpg'),
         },
         {
            id: 3,
            titleLine1: '옥수수 수확 체험',
            titleLine2: '철원 농가',
            subText: '찰옥수수 4개 포함',
            price: 7000,
            original: 10000,
            unit: '1인',
            tag: '#달콤옥수수 #어린이최애',
            image: getImagePath('events/corn-farm.jpg'),
         },
      ],
   },
   {
      id: 'package',
      title: '체험 패키지 할인',
      items: [
         {
            id: 4,
            titleLine1: '딸기 + 초코만들기',
            titleLine2: '스위트 패키지',
            subText: '딸기 수확 + 디저트 만들기',
            price: 18000,
            original: 25000,
            unit: '1인 패키지',
            tag: '#커플추천 #사진맛집',
            image: getImagePath('events/strawberry-choco.jpg'),
         },
         {
            id: 5,
            titleLine1: '고구마 + 감자캐기',
            titleLine2: '이중 수확 패키지',
            subText: '고구마 1kg + 감자 1kg 제공',
            price: 15000,
            original: 22000,
            unit: '1인 패키지',
            tag: '#가성비갑 #두배로즐기기',
            image: getImagePath('events/sweetpotato-potato.jpg'),
         },
         {
            id: 6,
            titleLine1: '토마토농장 + 허브비누',
            titleLine2: '웰빙 공방 패키지',
            subText: '수확 체험 + 허브비누 만들기',
            price: 20000,
            original: 30000,
            unit: '1인 패키지',
            tag: '#힐링체험 #향기좋음',
            image: getImagePath('events/tomato-herb.jpg'),
         },
      ],
   },
];
