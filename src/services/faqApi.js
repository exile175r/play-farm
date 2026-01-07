import { getApiBaseUrl, fetchWithAuthAndRetry, basicFetch } from "../utils/apiConfig";

const API_BASE_URL = getApiBaseUrl() + "/faqs";

export const getAllFaqs = async (category = "ALL") => {
    const query = category !== "ALL" ? `?category=${category}` : "";
    const result = await basicFetch(`${API_BASE_URL}${query}`);
    return result;
};

export const createFaq = async (data) => {
    const response = await fetchWithAuthAndRetry(API_BASE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const updateFaq = async (id, data) => {
    const response = await fetchWithAuthAndRetry(`${API_BASE_URL}/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const deleteFaq = async (id) => {
    const response = await fetchWithAuthAndRetry(`${API_BASE_URL}/${id}`, {
        method: "DELETE",
    });
    return await response.json();
};
