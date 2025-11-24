const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 빌드 시작...');
try {
  // 현재 브랜치 저장
  const currentBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
  
  // 빌드 실행
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ 빌드 완료!');
  
  // master 브랜치로 전환 (없으면 생성)
  console.log('📦 master 브랜치로 전환...');
  try {
    execSync('git checkout master', { stdio: 'inherit' });
  } catch (e) {
    // master 브랜치가 없으면 생성
    execSync('git checkout -b master', { stdio: 'inherit' });
  }
  
  // build 폴더의 내용을 루트로 복사
  console.log('📁 빌드 파일 복사 중...');
  const buildPath = path.join(__dirname, 'build');
  const files = fs.readdirSync(buildPath);
  
  // 기존 파일들 제거 (소스 파일 제외)
  const keepFiles = ['.git', 'node_modules', 'src', 'public', 'package.json', 'package-lock.json', '.gitignore'];
  const allFiles = fs.readdirSync(__dirname);
  allFiles.forEach(file => {
    if (!keepFiles.includes(file) && file !== 'build') {
      const filePath = path.join(__dirname, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(filePath);
      }
    }
  });
  
  // build 폴더의 내용을 루트로 복사
  function copyRecursive(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    
    if (isDirectory) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      fs.readdirSync(src).forEach(childItemName => {
        copyRecursive(
          path.join(src, childItemName),
          path.join(dest, childItemName)
        );
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  }
  
  files.forEach(file => {
    const srcPath = path.join(buildPath, file);
    const destPath = path.join(__dirname, file);
    copyRecursive(srcPath, destPath);
  });
  
  // .gitignore에 build 추가 (이미 있으면 무시)
  const gitignorePath = path.join(__dirname, '.gitignore');
  let gitignore = '';
  if (fs.existsSync(gitignorePath)) {
    gitignore = fs.readFileSync(gitignorePath, 'utf-8');
  }
  if (!gitignore.includes('build')) {
    gitignore += '\nbuild\n';
    fs.writeFileSync(gitignorePath, gitignore);
  }
  
  // 변경사항 커밋 및 푸시
  console.log('📝 변경사항 커밋 중...');
  execSync('git add .', { stdio: 'inherit' });
  const timestamp = new Date().toLocaleString('ko-KR');
  execSync(`git commit -m "빌드 및 배포: ${timestamp}"`, { stdio: 'inherit' });
  console.log('✅ 커밋 완료!');
  
  // master 브랜치에 푸시
  console.log('⬆️  GitHub에 푸시 중...');
  execSync('git push origin master --force', { stdio: 'inherit' });
  console.log('✅ 배포 완료!');
  
  // 원래 브랜치로 돌아가기
  console.log(`🔄 ${currentBranch} 브랜치로 복귀...`);
  execSync(`git checkout ${currentBranch}`, { stdio: 'inherit' });
  
} catch (error) {
  console.error('❌ 오류 발생:', error.message);
  process.exit(1);
}

