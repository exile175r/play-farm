const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');
const fs = require('fs');
const path = require('path');

/**
 * Multer 메모리 스토리지의 버퍼를 Cloudinary로 직접 업로드합니다.
 */
const uploadFromBuffer = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `playfarm/${folder}`,
        resource_type: 'auto'
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
};

/**
 * 이미지 URL을 분석하여 로컬 파일 또는 Cloudinary 이미지를 삭제합니다.
 * @param {string} imageUrl DB에 저장된 이미지 URL
 */
const deleteImage = async (imageUrl) => {
  if (!imageUrl) return;

  try {
    if (imageUrl.includes('res.cloudinary.com')) {
      // Cloudinary 이미지 삭제
      // URL 예시: https://res.cloudinary.com/cloud_name/image/upload/v12345/playfarm/folder/public_id.jpg
      const parts = imageUrl.split('/');
      const filename = parts[parts.length - 1]; // public_id.jpg
      const publicId = filename.split('.')[0]; // public_id

      // 폴더 구조 포함 (URL 조각들에서 추출)
      // v12345678/playfarm/folder/public_id.jpg -> playfarm/folder/public_id
      const folderPathMatch = imageUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i);
      const fullPublicId = folderPathMatch ? folderPathMatch[1] : publicId;

      console.log(`[deleteImage] Cloudinary 삭제 시도: ${fullPublicId}`);
      await cloudinary.uploader.destroy(fullPublicId);
    } else if (imageUrl.startsWith('/images/')) {
      // 로컬 이미지 삭제 (하위 호환성)
      const localPath = path.join(__dirname, '../../public', imageUrl);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        console.log(`[deleteImage] 로컬 파일 삭제 완료: ${localPath}`);
      }
    }
  } catch (error) {
    console.error(`[deleteImage] 이미지 삭제 중 오류:`, error);
    // 삭제 실패해도 본 로직에는 지장을 주지 않도록 throw 하지 않음
  }
};

module.exports = {
  uploadFromBuffer,
  deleteImage
};
