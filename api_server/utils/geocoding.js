// server/utils/geocoding.js
// 카카오 Geocoding API를 사용하여 주소를 좌표로 변환

/**
 * 주소를 위도/경도로 변환
 * @param {string} address - 변환할 주소
 * @returns {Promise<{lat: number, lng: number} | null>} - 위도/경도 객체 또는 null
 */
async function addressToCoordinates(address) {
  if (!address || !address.trim()) {
    console.log('[Geocoding] 주소가 없어 좌표 변환을 건너뜁니다.');
    return null;
  }

  const REST_API_KEY = process.env.KAKAO_CLIENT_ID || process.env.KAKAO_REST_API_KEY;

  if (!REST_API_KEY) {
    console.error('[Geocoding] 카카오 REST API 키가 설정되지 않았습니다.');
    console.error('[Geocoding] 환경 변수 KAKAO_CLIENT_ID 또는 KAKAO_REST_API_KEY를 확인해주세요.');
    return null;
  }

  try {
    const encodedAddress = encodeURIComponent(address.trim());
    const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodedAddress}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `KakaoAK ${REST_API_KEY}`
      }
    });

    console.log('[Geocoding] API 응답 상태:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Geocoding] API 호출 실패:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log('[Geocoding] API 응답 데이터:', JSON.stringify(data, null, 2));

    if (!data.documents || data.documents.length === 0) {
      console.warn('[Geocoding] 주소에 대한 검색 결과가 없습니다.');
      return null;
    }

    // 첫 번째 결과 사용
    const firstResult = data.documents[0];
    const lat = parseFloat(firstResult.y); // 위도
    const lng = parseFloat(firstResult.x); // 경도

    if (isNaN(lat) || isNaN(lng)) {
      console.error('[Geocoding] 좌표 변환 실패: 유효하지 않은 좌표 값');
      console.error('[Geocoding] 위도:', firstResult.y, '경도:', firstResult.x);
      return null;
    }

    console.log('[Geocoding] 좌표 변환 성공!');
    console.log('[Geocoding] 위도:', lat);
    console.log('[Geocoding] 경도:', lng);
    console.log('[Geocoding] 변환된 주소:', firstResult.address_name || firstResult.road_address?.address_name || 'N/A');

    return { lat, lng };
  } catch (error) {
    console.error('[Geocoding] 좌표 변환 중 오류 발생:');
    console.error('[Geocoding] 오류 타입:', error.constructor.name);
    console.error('[Geocoding] 오류 메시지:', error.message);
    console.error('[Geocoding] 오류 스택:', error.stack);
    return null;
  }
}

module.exports = {
  addressToCoordinates
};

