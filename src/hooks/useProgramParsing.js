import { useCallback } from 'react';

/**
 * DB에서 배열 형테(JSON string)로 저장된 체험명(program_nm 또는 title)을 
 * 파싱하고 포맷팅하는 공통 Hook
 */
export const useProgramParsing = () => {
  
  const replaceText = { '체험': ' 체험', '및': ' 및 ' };

  /**
   * 단일 프로그램 이름 문자열을 파싱 및 포맷팅
   * @param {string|any} rawName JSON 문자열 또는 가공된 문자열
   * @returns {string} 가공된 문자열
   */
  const parseProgramName = useCallback((rawName) => {
    if (!rawName) return '';
    
    // 이미 가공된 형태(" 체험" 포함)라면 그대로 반환
    if (typeof rawName === 'string' && rawName.includes(' 체험')) {
      return rawName;
    }

    try {
      // JSON 파싱 시도
      const parsed = JSON.parse(rawName);
      if (Array.isArray(parsed)) {
        return parsed
          .map((v) => v.replace(/체험|및/g, (match) => replaceText[match] || match))
          .join(', ');
      }
      // 파싱 결과가 배열이 아니면 문자열로 가공
      return String(parsed).replace(/체험|및/g, (match) => replaceText[match] || match);
    } catch (error) {
      // JSON 파싱 실패 시 일반 문자열로 취급하여 가공
      if (typeof rawName === 'string') {
        return rawName.replace(/체험|및/g, (match) => replaceText[match] || match);
      }
      return String(rawName);
    }
  }, []);

  /**
   * 프로그램 리스트 배열의 특정 필드를 일괄 파싱 및 포맷팅
   * @param {Array} list 프로그램 객체 배열
   * @param {string} fieldName 파싱할 필드 이름 (기본값: 'program_nm')
   * @returns {Array} 필드가 가공된 새 배열
   */
  const parseProgramList = useCallback((list, fieldName = 'program_nm') => {
    if (!list || !Array.isArray(list)) return [];
    
    return list.map((item) => ({
      ...item,
      [fieldName]: parseProgramName(item[fieldName])
    }));
  }, [parseProgramName]);

  return { parseProgramName, parseProgramList };
};

export default useProgramParsing;
