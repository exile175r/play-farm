"""
이미지 다운로드 테스트 스크립트 (10개 데이터만)
- public/images/item_{index}/ 폴더에 각 데이터의 이미지 저장
- JSON의 IMAGES 배열을 경로로 업데이트
"""
import json
import os
import requests
from pathlib import Path
import time
from urllib.parse import urlparse

def download_image(url: str, save_path: Path) -> bool:
    """
    이미지 다운로드
    
    Args:
        url: 이미지 URL
        save_path: 저장할 파일 경로
    
    Returns:
        성공 여부
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10, stream=True)
        response.raise_for_status()
        
        # Content-Type 확인
        content_type = response.headers.get('Content-Type', '')
        if 'image' not in content_type.lower():
            print(f"      ✗ 이미지가 아님: {content_type}")
            return False
        
        # 파일 확장자 결정
        parsed = urlparse(url)
        ext = Path(parsed.path).suffix.lower()
        if ext not in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
            ext = '.jpg'
        
        # 확장자 추가
        if not save_path.suffix:
            save_path = save_path.with_suffix(ext)
        
        # 이미지 저장
        with open(save_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        
        print(f"      ✓ 다운로드 완료: {save_path.name}")
        return True
        
    except Exception as e:
        print(f"      ✗ 다운로드 실패: {str(e)}")
        return False

def process_images(input_file: Path, output_file: Path = None, start_idx: int = 0, limit: int = 10):
    """
    이미지 다운로드 및 JSON 업데이트
    
    Args:
        input_file: 입력 JSON 파일 경로
        output_file: 출력 JSON 파일 경로 (None이면 입력 파일에 덮어쓰기)
        start_idx: 시작 인덱스 (0부터 시작)
        limit: 처리할 데이터 개수
    """
    if output_file is None:
        output_file = input_file
    
    print(f"JSON 파일 읽는 중: {input_file}")
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    items = data.get('DATA', [])
    total = len(items)
    
    # 시작 인덱스와 limit 확인
    if start_idx >= total:
        print(f"오류: 시작 인덱스({start_idx})가 전체 데이터 개수({total})보다 큽니다.")
        return
    
    end_idx = min(start_idx + limit, total)
    process_count = end_idx - start_idx
    
    print(f"처리할 항목: {process_count}개 (전체 {total}개 중, {start_idx}번째부터)")
    
    # public/images/item 폴더 생성
    base_dir = Path(__file__).parent
    images_dir = base_dir / 'public' / 'images' / 'item'
    images_dir.mkdir(parents=True, exist_ok=True)
    
    processed = 0
    success_count = 0
    
    # 원본 데이터에서 URL 읽기
    original_data_file = base_dir.parent / 'data_modification' / 'data_final.json'
    original_items = []
    
    if original_data_file.exists():
        try:
            print(f"원본 데이터 파일 읽는 중: {original_data_file}")
            with open(original_data_file, 'r', encoding='utf-8') as f:
                original_data = json.load(f)
                original_items = original_data.get('DATA', [])
            print(f"원본 데이터 {len(original_items)}개 항목 로드 완료")
        except Exception as e:
            print(f"원본 데이터 읽기 실패: {e}")
    
    for local_idx in range(process_count):
        # 실제 데이터 인덱스
        idx = start_idx + local_idx
        item = items[idx]
        village_nm = item.get('VILLAGE_NM', 'unknown')
        program_nm = item.get('PROGRAM_NM', ['unknown'])[0] if isinstance(item.get('PROGRAM_NM'), list) else item.get('PROGRAM_NM', 'unknown')
        
        # item_1부터 시작 (idx + 1)
        item_number = idx + 1
        
        print(f"\n[{local_idx + 1}/{process_count}] (전체 {idx + 1}번째) 처리 중: {village_nm} - {program_nm} (item_{item_number})")
        
        # 원본 데이터에서 이미지 URL 가져오기
        image_urls = []
        if idx < len(original_items):
            original_item = original_items[idx]
            if original_item.get('IMAGES') and isinstance(original_item['IMAGES'], list):
                image_urls = original_item['IMAGES']
        
        # IMAGES 배열 확인
        if not image_urls or len(image_urls) == 0:
            print(f"  이미지 없음, 건너뜀")
            continue
        
        # 데이터별 폴더 생성 (item_1부터 시작)
        item_folder = images_dir / f'item_{item_number}'
        item_folder.mkdir(exist_ok=True)
        
        # 이미지 다운로드
        downloaded_paths = []
        
        print(f"  이미지 {len(image_urls)}개 다운로드 시작...")
        for img_idx, img_url in enumerate(image_urls):
            # 이미 경로인 경우 건너뛰기 (이미 다운로드된 경우)
            if img_url and isinstance(img_url, str) and img_url.startswith('/images/'):
                print(f"  [{img_idx + 1}] 이미 다운로드된 경로, 건너뜀: {img_url}")
                downloaded_paths.append(img_url)
                continue
            
            # URL이 아닌 경우 건너뛰기
            if not img_url or not isinstance(img_url, str) or not img_url.startswith('http'):
                print(f"  [{img_idx + 1}] 유효하지 않은 URL, 건너뜀: {img_url[:50] if img_url else 'None'}")
                continue
            
            # 파일명 생성
            filename = f'img_{img_idx}.jpg'
            save_path = item_folder / filename
            
            # 다운로드
            if download_image(img_url, save_path):
                # 상대 경로 저장 (public 기준, item_1부터 시작)
                relative_path = f'/images/item/item_{item_number}/{save_path.name}'
                downloaded_paths.append(relative_path)
            
            # 딜레이 (서버 부하 방지)
            time.sleep(0.5)
        
        # JSON 업데이트
        if downloaded_paths:
            item['IMAGES'] = downloaded_paths
            success_count += 1
            print(f"  ✓ 완료: {len(downloaded_paths)}개 이미지 저장됨")
        else:
            print(f"  ✗ 실패: 다운로드된 이미지 없음")
            item['IMAGES'] = []
        
        processed += 1
    
    print(f"\n처리 완료: {processed}개 항목, {success_count}개 성공")
    
    # JSON 저장
    print(f"\nJSON 파일 저장 중: {output_file}")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print("완료!")

if __name__ == "__main__":
    base_dir = Path(__file__).parent
    input_file = base_dir / 'src' / 'data_final.json'
    
    if not input_file.exists():
        print(f"오류: 파일을 찾을 수 없습니다: {input_file}")
        exit(1)
    
    # 다음 10개 처리 (item_11부터 item_20까지, start_idx=10)
    process_images(input_file, start_idx=10, limit=10)

