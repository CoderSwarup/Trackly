import { API_BASE_URL as ENV_API_BASE_URL, SOCKET_URL as ENV_SOCKET_URL } from '@env';

export const API_BASE_URL = ENV_API_BASE_URL;
export const SOCKET_URL = ENV_SOCKET_URL;

// API endpoints
export const API_ENDPOINTS = {
  LOGIN: "/users/auth",
  GET_MESSAGES: "/chat/messages",
  SEND_MESSAGE: "/chat/messages",
  GET_ACTIVE_USERS: "/users/active",
} as const;

export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
};
