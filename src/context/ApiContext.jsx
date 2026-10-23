import { createContext, useContext } from "react";

export const ApiContext = createContext(null);

export function useApiConfig() {
  const config = useContext(ApiContext);
  if (!config) {
    throw new Error("useApiConfig must be used inside ApiContext.Provider");
  }
  return config;
}

export function handleAdminUnauthorized() {
  sessionStorage.removeItem("adminToken");
  window.dispatchEvent(new Event("admin-session-expired"));
}

export async function adminFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = sessionStorage.getItem("adminToken");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, { ...options, headers });
  if (response.status === 401 && token) {
    handleAdminUnauthorized();
  }
  return response;
}
