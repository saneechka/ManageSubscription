import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Badge, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Search } from 'react-bootstrap-icons';
import { plansAPI, subscriptionsAPI } from '../utils/api';


const POPULAR_SERVICES = [
  { 
    id: 'yandex-plus', 
    name: 'Яндекс Плюс',
    icon: '🔍', 
    color: '#ffcc00' 
  },
  { 
    id: 'google-one', 
    name: 'Google One',
    icon: '☁️',
    color: '#4285F4' 
  },
  { 
    id: 'spotify', 
    name: 'Spotify Premium',
    icon: '🎵',
    color: '#1ED760' 
  },
  { 
    id: 'netflix', 
    name: 'Netflix',
    icon: '📺',
    color: '#E50914' 
  },
  { 
    id: 'apple-one', 
    name: 'Apple One',
    icon: '🍎',
    color: '#A2AAAD' 
  },
  {
    id: 'kinopoisk',
    name: 'Кинопоиск HD',
    icon: '🎬',
    color: '#f60'
  },
  {
    id: 'amediateka',
    name: 'Amediateka',
    icon: '📽️',
    color: '#000000'
  },
  {
    id: 'ivi',
    name: 'IVI',
    icon: '🎦',
    color: '#ea003d'
  },
  {
    id: 'premier',
    name: 'Premier',
    icon: '🎞️',
    color: '#6236ff'
  }
];

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [actionSuccess, setActionSuccess] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlans();
  }, []);

  // Применяем фильтр при изменении запроса или категории
  useEffect(() => {
    if (plans.length > 0) {
      // Сначала фильтруем, оставляя только месячные подписки (примерно 30 дней)
      let monthlyPlans = plans.filter(plan => 
        (plan.duration >= 28 && plan.duration <= 31) || 
        (plan.period_type === 'months' && plan.duration === 1)
      );
      
      // Затем применяем фильтры поиска
      let filtered = [...monthlyPlans];
      
      // Применяем поиск по имени
      if (searchQuery) {
        filtered = filtered.filter(plan => 
          plan.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Применяем фильтр по категории
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(plan => {
          // Соотносим план с категорией
          const serviceName = plan.name.toLowerCase();
          
          switch(selectedCategory) {
            case 'video':
              return ['netflix', 'кинопоиск', 'ivi', 'amediateka', 'premier', 'кино'].some(
                keyword => serviceName.includes(keyword)
              );
            case 'music':
              return ['spotify', 'яндекс музыка', 'apple music', 'музыка'].some(
                keyword => serviceName.includes(keyword)
              );
            case 'storage':
              return ['google one', 'яндекс диск', 'icloud', 'облако', 'хранилище'].some(
                keyword => serviceName.includes(keyword)
              );
            default:
              return true;
          }
        });
      }
      
      setFilteredPlans(filtered);
    }
  }, [searchQuery, selectedCategory, plans]);

  const fetchPlans = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await plansAPI.getAll();
      const availablePlans = data.plans || [];
      
      setPlans(availablePlans);
      // Фильтрация будет происходить в useEffect
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    // Проверяем авторизацию пользователя
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login', { state: { redirectTo: '/plans' } });
      return;
    }

    // Сразу оформляем подписку
    try {
      setLoading(true);
      
      // Convert planId to number and validate it
      const numPlanId = Number(planId);
      if (isNaN(numPlanId) || numPlanId <= 0) {
        throw new Error('Недопустимый ID плана');
      }
      
      // Make sure we're sending an object with the exact required format
      const response = await subscriptionsAPI.subscribe(numPlanId);
      setActionSuccess('Подписка успешно оформлена!');
      
      // Обновляем кеш статистики в localStorage, чтобы Dashboard корректно обновил счетчики
      try {
        // Получаем текущую статистику с сервера
        const statsData = await subscriptionsAPI.getStats();
        
        // Сохраняем обновленную статистику в localStorage для Dashboard
        if (statsData && statsData.stats) {
          localStorage.setItem('subscription_stats', JSON.stringify(statsData.stats));
        }
      } catch (statsErr) {
        console.error('Failed to update stats cache:', statsErr);
      }
      
      // После успешной подписки перенаправляем на дашборд
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatFeatures = (featuresString) => {
    if (!featuresString) return [];
    
    try {
      return JSON.parse(featuresString);
    } catch {
      // Если не валидный JSON, разделяем по запятым или возвращаем как одну функцию
      return featuresString.includes(',') 
        ? featuresString.split(',').map(f => f.trim())
        : [featuresString];
    }
  };

  // Форматирование периода подписки - только месяц
  const formatPeriod = (days) => {
    return 'месяц';
  };

  return (
    <Container className="py-5">
      <h1 className="text-center mb-5">Популярные ежемесячные подписки</h1>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>
        <Alert.Heading>Ошибка!</Alert.Heading>
        <p>{error}</p>
      </Alert>}

      {actionSuccess && <Alert variant="success" dismissible onClose={() => setActionSuccess('')}>
        <Alert.Heading>Успешно!</Alert.Heading>
        <p>{actionSuccess}</p>
      </Alert>}

      <Row className="mb-4">
        <Col md={6}>
          <Form.Group>
            <InputGroup>
              <Form.Control 
                type="text" 
                placeholder="Поиск по названию сервиса..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button variant="outline-secondary">
                <Search />
              </Button>
            </InputGroup>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">Все сервисы</option>
              <option value="video">Видеосервисы</option>
              <option value="music">Музыкальные</option>
              <option value="storage">Облачные хранилища</option>
              <option value="other">Другое</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      {/* Секция популярных сервисов */}
      <div className="mb-5">
        <h3 className="mb-3">Популярные сервисы</h3>
        <Row className="g-4">
          {POPULAR_SERVICES.map(service => (
            <Col key={service.id} xs={6} md={3} lg={2}>
              <Card 
                className="service-icon-card text-center h-100"
                onClick={() => setSearchQuery(service.name)}
                style={{ cursor: 'pointer', borderColor: service.color }}
              >
                <Card.Body className="d-flex flex-column justify-content-center align-items-center">
                  <div className="service-icon mb-2" style={{ fontSize: '2rem' }}>
                    {service.icon}
                  </div>
                  <div className="service-name">
                    {service.name}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Загрузка...</span>
          </div>
        </div>
      ) : filteredPlans.length > 0 ? (
        <Row className="g-4">
          {filteredPlans.map(plan => (
            <Col md={6} lg={4} key={plan.id} className="mb-4">
              <Card className="plan-card h-100">
                <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
                  {plan.name}
                </Card.Header>
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="mb-3">
                    <span className="display-6">{plan.price.toFixed(2)} ₽</span>
                    <small className="text-muted"> / месяц</small>
                  </Card.Title>
                  <Card.Text>{plan.description}</Card.Text>
                  
                  <div className="mt-3 mb-4">
                    <h6>Что включено:</h6>
                    <ul>
                      {formatFeatures(plan.features).map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <Button 
                    variant="primary" 
                    onClick={() => handleSubscribe(plan.id)}
                    className="mt-auto"
                    disabled={loading}
                  >
                    {loading ? 'Подождите...' : 'Оформить подписку'}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <div className="text-center my-5">
          <p>Нет подписок, соответствующих вашим критериям.</p>
          <Button variant="outline-secondary" onClick={() => {
            setSearchQuery('');
            setSelectedCategory('all');
          }}>
            Сбросить фильтры
          </Button>
        </div>
      )}
    </Container>
  );
};

export default Plans;