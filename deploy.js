const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 빌드 시작...');
try {
  // 빌드 실행
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ 빌드 완료!');
  
  // Git 상태 확인
  console.log('📦 Git 상태 확인...');
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf-8' });
  
  if (gitStatus.trim()) {
    console.log('📝 변경사항 커밋 중...');
    execSync('git add .', { stdio: 'inherit' });
    const timestamp = new Date().toLocaleString('ko-KR');
    execSync(`git commit -m "빌드 및 배포: ${timestamp}"`, { stdio: 'inherit' });
    console.log('✅ 커밋 완료!');
  } else {
    console.log('ℹ️  커밋할 변경사항이 없습니다.');
  }
  
  // 현재 브랜치 가져오기
  const currentBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
  
  // GitHub에 푸시
  console.log('⬆️  GitHub에 푸시 중...');
  execSync(`git push origin ${currentBranch}`, { stdio: 'inherit' });
  console.log('✅ 배포 완료!');
  
} catch (error) {
  console.error('❌ 오류 발생:', error.message);
  process.exit(1);
}

