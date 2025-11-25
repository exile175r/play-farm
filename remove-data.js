const fs = require('fs');
const path = require('path');

console.log('📖 data.json 파일 읽는 중...');
const filePath = path.join(__dirname, 'src', 'data.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

console.log(`원본 데이터 개수: ${data.DATA.length}`);

// 제거할 데이터 타입 목록
const removeTypes = ['관광농원지정현황', '경기농정통합시스템체험프로그램정보'];

// 제거 전 각 타입별 개수 확인
removeTypes.forEach(type => {
  const count = data.DATA.filter(item => item.DATA === type).length;
  console.log(`  - ${type}: ${count}개`);
});

// DATA.DATA가 제거 목록에 있는 항목 제거
const filteredData = data.DATA.filter(item => !removeTypes.includes(item.DATA));

console.log(`필터링 후 데이터 개수: ${filteredData.length}`);
console.log(`제거된 데이터 개수: ${data.DATA.length - filteredData.length}`);

// 필터링된 데이터로 업데이트
data.DATA = filteredData;

console.log('💾 파일 저장 중...');
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

console.log('✅ 완료!');

