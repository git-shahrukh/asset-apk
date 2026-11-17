import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { QueryClient } from '@tanstack/react-query';

export class ApiError extends Error {
  constructor(message: string, public status?: number, public errors?: unknown) {
    super(message);
  }
}

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 20000,
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't retry 4xx errors (401/403/404/422); retry network/server errors once.
      retry: (count, error) =>
        !(error instanceof ApiError && error.status && error.status < 500) && count < 1,
    },
  },
});

// ---------- Storage (Keychain on iOS / Keystore on Android) ----------
// expo-secure-store only works on phones. In the browser (pressing `w` in Expo) it falls back
// to localStorage, which is NOT encrypted — fine for development, never for real users.
const isWeb = Platform.OS === 'web';

export const storage = {
  get: (key: string): Promise<string | null> =>
    isWeb ? Promise.resolve(localStorage.getItem(key)) : SecureStore.getItemAsync(key),
  set: (key: string, value: string): Promise<void> =>
    isWeb ? Promise.resolve(localStorage.setItem(key, value)) : SecureStore.setItemAsync(key, value),
  remove: (key: string): Promise<void> =>
    isWeb ? Promise.resolve(localStorage.removeItem(key)) : SecureStore.deleteItemAsync(key),
};

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';
let accessToken: string | null = null;

export const tokenStorage = {
  async load() {
    accessToken = await storage.get(ACCESS_KEY);
    return accessToken;
  },
  async save(access: string, refresh?: string) {
    accessToken = access;
    await storage.set(ACCESS_KEY, access);
    if (refresh) await storage.set(REFRESH_KEY, refresh);
  },
  async clear() {
    accessToken = null;
    await storage.remove(ACCESS_KEY);
    await storage.remove(REFRESH_KEY);
  },
};

// authStore registers this so the client can log the user out without importing it.
let onSessionExpired = () => {};
export const setOnSessionExpired = (fn: () => void) => {
  onSessionExpired = fn;
};

// ---------- Interceptors ----------
api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken() {
  const refresh = await storage.get(REFRESH_KEY);
  if (!refresh) return null;
  try {
    // Plain axios (not `api`) so this call doesn't go through the interceptors.
    // ADJUST: refresh endpoint and response keys.
    const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken: refresh });
    const token: string | undefined = data.data?.token ?? data.token;
    if (!token) return null;
    await tokenStorage.save(token, data.data?.refreshToken ?? data.refreshToken);
    return token;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => {
    // Your backend returns { success: false, message } for some errors.
    if (response.data?.success === false) {
      console.warn(`API rejected ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
      return Promise.reject(new ApiError(response.data.message, response.status, response.data.errors));
    }
    return response;
  },
  async (error: AxiosError<any>) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401 while signed in = session expired. (Without a token it's just wrong credentials.)
    if (error.response?.status === 401 && original && !original._retry && accessToken) {
      original._retry = true;
      // Many requests can fail at once; they all wait for the same single refresh.
      refreshing ??= refreshAccessToken().finally(() => (refreshing = null));
      const token = await refreshing;
      if (token) return api(original);
      onSessionExpired();
    }

    const status = error.response?.status;
    const data = error.response?.data;
    const url = `${original?.method?.toUpperCase()} ${original?.url}`;
    // Shows exactly which request failed in the Metro terminal.
    console.warn(`API error ${status ?? 'network'} on ${url}`, typeof data === 'string' ? data.slice(0, 200) : data);

    let message: string = data?.message;
    if (!message && status === 404) message = `Not found (404): ${url}`;
    if (!message) message = status ? `Request failed (${status})` : 'No internet connection';
    return Promise.reject(new ApiError(message, status, data?.errors));
  },
);
