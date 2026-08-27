export const API_URL = import.meta.env.VITE_API_URL;
const TOKEN = import.meta.env.VITE_SANCTUM_TOKEN;

export async function fetchApi(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: 'Erro desconhecido ao chamar API' };
    }
    throw errorData;
  }

  if (response.status === 204) return null;
  
  return response.json();
}
