import { getApiBaseUrl, fetchWithAuthAndRetry } from '../utils/apiConfig';

const API_Base_URL = getApiBaseUrl();

// 비밀번호 변경
export const changePassword = async (currentPassword, newPassword) => {
    try {
        const response = await fetchWithAuthAndRetry(`${API_Base_URL}/users/change-password`, {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword }),
        });
        const data = await response.json();
        if (!response.ok) {
            return { success: false, error: data.message || '비밀번호 변경 실패' };
        }
        return { success: true, message: data.message };
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, error: error.message };
    }
};

// 회원 탈퇴
export const deleteAccount = async (password) => {
    try {
        const response = await fetchWithAuthAndRetry(`${API_Base_URL}/users/me`, {
            method: 'DELETE',
            body: JSON.stringify({ password }),
        });
        const data = await response.json();
        if (!response.ok) {
            return { success: false, error: data.message || '회원 탈퇴 실패' };
        }
        return { success: true, message: data.message };
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, error: error.message };
    }
};

// 프로필 업데이트 (이미지 등)
export const updateMyProfile = async (profileData) => {
    try {
        const response = await fetchWithAuthAndRetry(`${API_Base_URL}/users/me`, {
            method: 'PUT',
            body: JSON.stringify(profileData),
        });
        const data = await response.json();
        if (!response.ok) {
            return { success: false, error: data.message || '프로필 수정 실패' };
        }
        return { success: true, message: data.message };
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, error: error.message };
    }
};

// 내 정보 조회
export const getMyProfile = async () => {
    try {
        const response = await fetchWithAuthAndRetry(`${API_Base_URL}/users/me`, {
            method: 'GET',
        });
        const data = await response.json();

        // 성공 여부와 관계없이 응답 반환 (처리 로직은 호출부에서)
        if (!response.ok) {
            return { success: false, error: data.message || '프로필 조회 실패' };
        }
        return { success: true, data: data.data };
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, error: error.message };
    }
};
