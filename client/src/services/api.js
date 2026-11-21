const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('bidx_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = `${API_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  auth: {
    login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    getMe: () => request('/auth/me'),
    getDemoUsers: () => request('/auth/demo-users'),
  },
  auctions: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/auctions${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/auctions/${id}`),
    create: (auctionData) => request('/auctions', { method: 'POST', body: JSON.stringify(auctionData) }),
    delete: (id) => request(`/auctions/${id}`, { method: 'DELETE' }),
    getStats: () => request('/auctions/stats/overview'),
    extendDemoTimers: (minutes = 10) => request('/auctions/demo/extend-all', { method: 'POST', body: JSON.stringify({ minutes }) }),
  },
  bids: {
    getByAuction: (auctionId) => request(`/bids/auction/${auctionId}`),
    placeBid: (bidData) => request('/bids', { method: 'POST', body: JSON.stringify(bidData) }),
  },
};
