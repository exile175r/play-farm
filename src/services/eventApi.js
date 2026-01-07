// src/services/eventApi.js
import { getApiBaseUrl, basicFetch } from "../utils/apiConfig";

const API_BASE_URL = getApiBaseUrl() + "/events";

export const getAllEvents = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `${API_BASE_URL}?${queryString}` : API_BASE_URL;
  return await basicFetch(url);
};

export const getEventById = async (id) => {
  return await basicFetch(`${API_BASE_URL}/${id}`);
};
