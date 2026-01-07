import { getApiBaseUrl, fetchWithAuthAndRetry, basicFetch } from "../utils/apiConfig";

const API_BASE_URL = getApiBaseUrl() + "/notices";

export const getAllNotices = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const result = await basicFetch(`${API_BASE_URL}?${queryString}`);
    return result;
};

export const createNotice = async (data) => {
    const response = await fetchWithAuthAndRetry(API_BASE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const updateNotice = async (id, data) => {
    const response = await fetchWithAuthAndRetry(`${API_BASE_URL}/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const deleteNotice = async (id) => {
    const response = await fetchWithAuthAndRetry(`${API_BASE_URL}/${id}`, {
        method: "DELETE",
    });
    return await response.json();
};
