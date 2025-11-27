/**
 * Public URL을 포함한 이미지 경로를 생성하는 유틸리티 함수
 * @param {string} imagePath - /images/... 형태의 이미지 경로
 * @returns {string} PUBLIC_URL을 포함한 전체 이미지 경로
 */
export const getImagePath = (imagePath) => {
  const publicUrl = process.env.PUBLIC_URL || '';
  return `${publicUrl}${imagePath}`;
};

