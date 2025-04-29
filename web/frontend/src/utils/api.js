// API utility for making requests to our backend

/**
 * Makes a request to the API
 * @param {string} endpoint - API endpoint to call
 * @param {Object} options - Request options
 * @returns {Promise} - Promise that resolves to the API response
 */
export const apiRequest = async (endpoint, options = {}) => {
  // Get the auth token if it exists
  const token = localStorage.getItem('token');
  
  // Default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Add auth token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers,
    });
    
    // Parse the JSON response
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }
    
    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// User API methods
export const userAPI = {
  register: (userData) => apiRequest('/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  
  login: (credentials) => apiRequest('/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  
  getProfile: () => apiRequest('/profile'),
  
  updateProfile: (userData) => apiRequest('/profile', {
    method: 'PUT',
    body: JSON.stringify(userData),
  }),
};


export const plansAPI = {
  getAll: () => apiRequest('/plans'),
  
  getById: (id) => apiRequest(`/plans/${id}`),
  
  filterByPrice: (minPrice, maxPrice) => apiRequest(`/plans/filter?min=${minPrice}&max=${maxPrice}`),
};


export const subscriptionsAPI = {
  getAll: () => apiRequest('/subscriptions'),
  
  getActive: () => apiRequest('/subscriptions/active'),
  
  getById: (id) => apiRequest(`/subscriptions/${id}`),
  
  getStats: () => apiRequest('/subscriptions/stats'),
  
  search: (query = '', status = '', sortBy = '') => {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (status) params.append('status', status);
    if (sortBy) params.append('sort_by', sortBy);
    
    return apiRequest(`/subscriptions/search?${params.toString()}`);
  },
  
  renew: (subscriptionId) => apiRequest(`/subscriptions/${subscriptionId}/renew`, {
    method: 'PUT',
  }),
  
  subscribe: (planId, paymentId = '') => {
    // Проверка на NaN и корректность числовых значений
    if (isNaN(planId) || planId === null || planId === undefined) {
      throw new Error('Invalid planId: must be a valid number');
    }
    
    // Обеспечиваем корректный формат данных для JSON
    const plan_id = Number(planId);
    const payment_id = paymentId || '';
    
    return apiRequest('/subscriptions', {
      method: 'POST',
      body: JSON.stringify({ plan_id, payment_id }),
    });
  },
  
  cancel: (subscriptionId) => apiRequest(`/subscriptions/${subscriptionId}/cancel`, {
    method: 'PUT',
  }),
  
  updateAutoRenewal: (subscriptionId, autoRenew) => apiRequest(`/subscriptions/${subscriptionId}/auto-renew`, {
    method: 'PUT',
    body: JSON.stringify({ auto_renew: autoRenew }),
  }),
};


export const adminAPI = {
  createPlan: (planData) => apiRequest('/admin/plans', {
    method: 'POST',
    body: JSON.stringify(planData),
  }),
  
  updatePlan: (planId, planData) => apiRequest(`/admin/plans/${planId}`, {
    method: 'PUT',
    body: JSON.stringify(planData),
  }),
  
  deletePlan: (planId) => apiRequest(`/admin/plans/${planId}`, {
    method: 'DELETE',
  }),
};