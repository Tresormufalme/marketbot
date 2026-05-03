// frontend/utils/api.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Helper pour gérer les réponses
async function handleResponse(response: Response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Erreur HTTP ${response.status}`);
  }
  return response.json();
}

// API pour les produits
export const api = {
  // Products
  getProducts: () => fetch(`${API_URL}/admin/products/`).then(handleResponse),
  createProduct: (data: any) =>
    fetch(`${API_URL}/admin/products/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handleResponse),
  updateProduct: (id: number, data: any) =>
    fetch(`${API_URL}/admin/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handleResponse),
  deleteProduct: (id: number) =>
    fetch(`${API_URL}/admin/products/${id}`, {
      method: "DELETE",
    }).then(handleResponse),

  // Orders
  getOrders: () => fetch(`${API_URL}/admin/orders/`).then(handleResponse),
  updateOrderStatus: (id: number, status: string) =>
    fetch(`${API_URL}/admin/orders/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).then(handleResponse),

  // Stats
  getStats: () => fetch(`${API_URL}/admin/stats/`).then(handleResponse),
};

// API pour le bot (corrigé pour correspondre au backend)
export const botApi = {
  startSession: async () => {
    const response = await fetch(`${API_URL}/bot/session`, {
      // Changé de /bot/start à /bot/session
      method: "POST",
    });
    return handleResponse(response);
  },

  sendMessage: async (sessionId: string, message: string) => {
    const response = await fetch(`${API_URL}/bot/session/${sessionId}/reply`, {
      // Changé pour correspondre
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }), // Changé de { session_id, message } à { message }
    });
    return handleResponse(response);
  },
};
