import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Badge, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Search } from 'react-bootstrap-icons';
import { plansAPI, subscriptionsAPI } from '../utils/api';
import SubscriptionPeriodModal from '../components/SubscriptionPeriodModal';
// Импорт иконок из библиотеки React Icons - с исправленными иконками
import { 
  SiGoogle, 
  SiSpotify, 
  SiNetflix, 
  SiApple
} from 'react-icons/si';
import { FaYandex, FaFilm, FaVideo, FaPlayCircle } from 'react-icons/fa';
import { RiMovie2Fill } from 'react-icons/ri';
import { MdMovieFilter } from 'react-icons/md';


const POPULAR_SERVICES = [
  { 
    id: 'yandex-plus', 
    name: 'Яндекс Плюс',
    icon: <FaYandex />, 
    color: '#ffcc00' 
  },
  { 
    id: 'google-one', 
    name: 'Google One',
    icon: <SiGoogle />,
    color: '#4285F4' 
  },
  { 
    id: 'spotify', 
    name: 'Spotify Premium',
    icon: <SiSpotify />,
    color: '#1ED760' 
  },
  { 
    id: 'netflix', 
    name: 'Netflix',
    icon: <SiNetflix />,
    color: '#E50914' 
  },
  { 
    id: 'apple-one', 
    name: 'Apple One',
    icon: <SiApple />,
    color: '#A2AAAD' 
  },
  {
    id: 'kinopoisk',
    name: 'Кинопоиск HD',
    icon: <FaFilm />,
    color: '#f60'
  },
  {
    id: 'amediateka',
    name: 'Amediateka',
    icon: <RiMovie2Fill />,
    color: '#000000'
  },
  {
    id: 'ivi',
    name: 'IVI',
    icon: <FaPlayCircle />,
    color: '#ea003d'
  },
  {
    id: 'premier',
    name: 'Premier',
    icon: <MdMovieFilter />,
    color: '#6236ff'
  }
];

const Plans = () => {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [actionSuccess, setActionSuccess] = useState('');
  const [hoveredServiceId, setHoveredServiceId] = useState(null);
  
  // Состояния для модального окна выбора тарифа
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [monthlyPlan, setMonthlyPlan] = useState(null);
  const [yearlyPlan, setYearlyPlan] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchServices();
  }, []);

  // Применяем фильтр при изменении запроса или категории
  useEffect(() => {
    if (services.length > 0) {
      let filtered = [...services];
      
      // Применяем поиск по имени
      if (searchQuery) {
        filtered = filtered.filter(service => 
          service.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Применяем фильтр по категории
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(service => {
          const serviceName = service.name.toLowerCase();
          
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
      
      setFilteredServices(filtered);
    }
  }, [searchQuery, selectedCategory, services]);

  // Получаем список доступных сервисов
  const fetchServices = async () => {
    setLoading(true);
    setError('');

    try {
      // Получаем все планы и группируем их по названию сервиса
      const data = await plansAPI.getAll();
      const availablePlans = data.plans || [];
      
      // Создаем список уникальных сервисов с агрегированной информацией
      const serviceMap = new Map();
      
      availablePlans.forEach(plan => {
        // Очищаем название подписки от информации о периоде в скобках
        const cleanName = plan.name.replace(/\s*\([^)]*\)\s*$/, '');
        
        if (!serviceMap.has(cleanName)) {
          serviceMap.set(cleanName, {
            id: plan.id, // Используем ID первого найденного плана для этого сервиса
            name: cleanName, // Используем очищенное имя
            description: plan.description,
            features: plan.features
          });
        }
      });
      
      const uniqueServices = Array.from(serviceMap.values());
      setServices(uniqueServices);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Открываем модальное окно с выбором плана
  const openSubscriptionModal = async (service) => {
    // Проверяем авторизацию пользователя
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login', { state: { redirectTo: '/plans' } });
      return;
    }

    try {
      setLoading(true);

      // Получаем все планы для выбранного сервиса
      const response = await plansAPI.getServicePlans(service.name);
      const servicePlans = response.plans || [];
      
      if (servicePlans.length === 0) {
        throw new Error('Нет доступных планов для этого сервиса');
      }
      
      // Находим месячный и годовой планы
      const monthPlan = servicePlans.find(p => 
        (p.period_type === 'months' && p.duration === 1) || 
        (p.duration >= 28 && p.duration <= 31)
      );
      
      const yearPlan = servicePlans.find(p => 
        (p.period_type === 'years' && p.duration === 1) || 
        (p.duration >= 364 && p.duration <= 366)
      );
      
      // Получаем иконку и цвет для сервиса
      const serviceIcon = getServiceIcon(service.name);
      const serviceColor = getServiceColor(service.name);
      
      setMonthlyPlan(monthPlan || null);
      setYearlyPlan(yearPlan || null);
      setSelectedService({ 
        name: service.name,
        icon: serviceIcon,
        color: serviceColor 
      });
      setShowPeriodModal(true);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    try {
      setLoading(true);
      
      // Проверка корректности ID плана
      const numPlanId = Number(planId);
      if (isNaN(numPlanId) || numPlanId <= 0) {
        throw new Error('Недопустимый ID плана');
      }
      
      const response = await subscriptionsAPI.subscribe(numPlanId);
      setActionSuccess('Подписка успешно оформлена!');
      
      // Обновляем кеш статистики в localStorage
      try {
        const statsData = await subscriptionsAPI.getStats();
        
        if (statsData && statsData.stats) {
          localStorage.setItem('subscription_stats', JSON.stringify(statsData.stats));
        }
      } catch (statsErr) {
        console.error('Failed to update stats cache:', statsErr);
      }
      
      // Закрываем модальное окно
      setShowPeriodModal(false);
      
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

  // Находим иконку для сервиса из списка популярных
  const getServiceIcon = (serviceName) => {
    const service = POPULAR_SERVICES.find(s => 
      serviceName.toLowerCase().includes(s.name.toLowerCase()) || 
      s.name.toLowerCase().includes(serviceName.toLowerCase())
    );
    
    // Используем соответствующую иконку из списка популярных или иконку по умолчанию
    if (service) {
      return service.icon;
    } else {
      // Определяем категорию сервиса по имени и выбираем соответствующую иконку
      const name = serviceName.toLowerCase();
      if (name.includes('кино') || name.includes('видео') || name.includes('фильм') || name.includes('тв')) {
        return <RiMovie2Fill />;
      } else if (name.includes('музыка') || name.includes('аудио')) {
        return <SiSpotify />;
      } else if (name.includes('хранилище') || name.includes('диск') || name.includes('облако')) {
        return <SiGoogle />; 
      } else {
        // Импортируем дополнительно иконку приложения по умолчанию
        const { FaMobileAlt } = require('react-icons/fa');
        return <FaMobileAlt />;
      }
    }
  };

  // Находим цвет для сервиса из списка популярных
  const getServiceColor = (serviceName) => {
    const service = POPULAR_SERVICES.find(s => 
      serviceName.toLowerCase().includes(s.name.toLowerCase()) || 
      s.name.toLowerCase().includes(serviceName.toLowerCase())
    );
    return service ? service.color : '#6c757d';
  };

  return (
    <Container className="py-5">
      <h1 className="text-center mb-5">Каталог доступных подписок</h1>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>
        <Alert.Heading>Ошибка!</Alert.Heading>
        <p>{error}</p>
      </Alert>}

      {actionSuccess && <Alert variant="success" dismissible onClose={() => setActionSuccess('')}>
        <Alert.Heading>Успешно!</Alert.Heading>
        <p>{actionSuccess}</p>
      </Alert>}

      {/* Модальное окно выбора срока подписки */}
      <SubscriptionPeriodModal 
        show={showPeriodModal}
        onHide={() => setShowPeriodModal(false)}
        service={selectedService}
        monthlyPlan={monthlyPlan}
        yearlyPlan={yearlyPlan}
        onSubscribe={handleSubscribe}
                  serviceIcon={selectedService?.icon}
        serviceColor={selectedService?.color}
      />

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
                  <div 
                    className="service-icon mb-2" 
                    style={{ 
                      fontSize: '2.5rem', 
                      color: service.color,
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      borderRadius: '50%',
                      width: '60px',
                      height: '60px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 3px 8px rgba(0,0,0,0.1)'
                    }}
                  >
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
      ) : filteredServices.length > 0 ? (
        <Row className="g-4">
          {filteredServices.map(service => (
            <Col md={6} lg={4} key={service.id} className="mb-4">
              <Card 
                className="service-card h-100" 
                style={{ 
                  borderColor: getServiceColor(service.name),
                  transition: 'all 0.3s ease',
                  transform: hoveredServiceId === service.id ? 'translateY(-5px)' : 'none',
                  boxShadow: hoveredServiceId === service.id ? '0 5px 15px rgba(0,0,0,0.1)' : 'none',
                  backgroundColor: hoveredServiceId === service.id ? '#f8f9fa' : 'white',
                  cursor: 'pointer'
                }}
                onClick={() => openSubscriptionModal(service)}
                onMouseEnter={() => setHoveredServiceId(service.id)}
                onMouseLeave={() => setHoveredServiceId(null)}
              >
                <Card.Header as="h5" className="d-flex align-items-center">
                  <div 
                    className="me-3" 
                    style={{ 
                      fontSize: '1.8rem', 
                      color: getServiceColor(service.name),
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      borderRadius: '50%',
                      width: '45px',
                      height: '45px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.08)'
                    }}
                  >
                    {getServiceIcon(service.name)}
                  </div>
                  {service.name}
                </Card.Header>
                <Card.Body className="d-flex flex-column">
                  <Card.Text className="mb-3">{service.description}</Card.Text>
                  
                  <div className="mt-3 mb-4">
                    <h6>Что включено:</h6>
                    <ul>
                      {formatFeatures(service.features).map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <Button 
                    variant="primary" 
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