// API utility for making requests to our backend

/**
 * Проверяет, истек ли токен
 * @param {string} message - Сообщение об ошибке
 * @returns {boolean} - Истек ли токен
 */
const isTokenExpired = (message) => {
  const expiredMessages = [
    'token has expired',
    'invalid or expired token',
    'token expired',
    'jwt expired'
  ];
  return expiredMessages.some(msg => message.toLowerCase().includes(msg.toLowerCase()));
};

/**
 * Обрабатывает выход пользователя при истечении срока действия токена
 */
const handleTokenExpiration = () => {
  // Очищаем данные авторизации
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Уведомляем пользователя
  alert('Ваша сессия истекла. Пожалуйста, войдите снова.');
  
  // Перенаправляем на страницу логина
  window.location.href = '/login';
};

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
    const url = `/api${endpoint}`;
    console.log(`Making ${options.method || 'GET'} request to ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    // Parse the JSON response
    const contentType = response.headers.get("content-type");
    let data;
    
    if (contentType && contentType.indexOf("application/json") !== -1) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.warn('Non-JSON response:', text);
      data = { error: text || 'Unexpected response format from server' };
    }
    
    if (!response.ok) {
      // Проверяем истекший токен
      if (response.status === 401 && data.error && isTokenExpired(data.error)) {
        console.warn('Token expired, logging out user');
        handleTokenExpiration();
        throw new Error('Сессия истекла. Пожалуйста, выполните вход заново.');
      }
      
      console.error('API error status:', response.status, response.statusText);
      console.error('API error details:', data);
      
      const errorMsg = data.error || `Error ${response.status}: ${response.statusText}`;
      throw new Error(errorMsg);
    }
    
    console.log(`Successful API response from ${url}:`, data);
    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      console.error('Network error - unable to connect to API server');
      throw new Error('Не удалось подключиться к серверу. Проверьте соединение с интернетом.');
    }
    
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
  
  login: async (credentials) => {
    const response = await apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Сохраняем токен в localStorage
    if (response && response.token) {
      localStorage.setItem('token', response.token);
      
      // Запрашиваем профиль пользователя после успешного входа
      try {
        const profileData = await apiRequest('/profile');
        if (profileData && profileData.user) {
          localStorage.setItem('user', JSON.stringify(profileData.user));
        }
      } catch (error) {
        console.warn('Failed to fetch profile after login:', error);
      }
    }
    
    return response;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return Promise.resolve({ success: true });
  },
  
  getProfile: async () => {
    const response = await apiRequest('/profile');
    if (response && response.user) {
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    return response;
  },
  
  updateProfile: (userData) => apiRequest('/profile', {
    method: 'PUT',
    body: JSON.stringify(userData),
  }),
};


export const plansAPI = {
  getAll: () => apiRequest('/plans'),
  
  getById: (id) => apiRequest(`/plans/${id}`),
  
  filterByPrice: (minPrice, maxPrice) => apiRequest(`/plans/filter?min=${minPrice}&max=${maxPrice}`),
  
  // Обновлены маршруты API для соответствия обновленным эндпоинтам на бэкенде
  getRelatedPlans: (planId) => apiRequest(`/plans/related/${planId}`),
  
  getServicePlans: (serviceName) => apiRequest(`/plans/service?name=${encodeURIComponent(serviceName)}`),
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