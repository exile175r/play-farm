## 깃 명령어 정리

```
# 브랜치 이름 변경 (master → main)
git branch -m master main

# 원격 저장소 연결
git remote add origin https://github.com/exile175r/play-farm

# 다른 저장소 이력 강제로 당겨오기
git pull origin main --allow-unrelated-histories

# 상태 확인
git status

# 파일 추가
git add src/components/test.css

# 커밋 메시지 작성
git commit -m "test add"

# 원격 저장소로 push
git push origin main
```
