import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { plansAPI } from '../utils/api';
import { 
  SiGoogle, 
  SiSpotify, 
  SiNetflix, 
  SiApple
} from 'react-icons/si';
import { FaYandex, FaFilm, FaVideo, FaPlayCircle } from 'react-icons/fa';
import { RiMovie2Fill } from 'react-icons/ri';
import { MdMovieFilter } from 'react-icons/md';

const serviceIcons = [
  {
    name: 'Яндекс Плюс',
    icon: <FaYandex />, 
  },
  {
    name: 'Netflix',
 icon: <SiNetflix />,
  },
  {
    name: 'Spotify',
  icon: <SiSpotify />,
  },
  {
    name: 'Apple One',
 icon: <SiApple />,
  },
  {
    name: 'Google One',
      icon: <SiGoogle />,
  },
  {
    name: 'Кинопоиск',
  icon: <FaFilm />,
  }
];

const Home = () => {
  const [popularPlans, setPopularPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Загружаем популярные планы
    const fetchPopularPlans = async () => {
      try {
        const data = await plansAPI.getAll();
        // Получаем все планы
        const plans = data.plans || [];
        
        // Фильтруем только месячные подписки (около 30 дней)
        const monthlyPlans = plans.filter(plan => 
          (plan.duration >= 28 && plan.duration <= 31) || 
          (plan.period_type === 'months' && plan.duration === 1)
        );
        
        // Сортируем по флагу is_popular если он есть
        const sortedPlans = monthlyPlans.sort((a, b) => (b.is_popular || 0) - (a.is_popular || 0));
        setPopularPlans(sortedPlans.slice(0, 3)); // Берем только первые 3
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularPlans();
  }, []);

  return (
    <div>
      <div className="bg-light py-5">
        <Container>
          <Row className="align-items-center">
            <Col lg={6}>
              <h1 className="display-4 fw-bold">Управляйте всеми подписками в одном месте</h1>
              <p className="lead">
                Централизованное управление ежемесячными подписками на популярные сервисы: Яндекс Плюс, Netflix, Spotify, 
                Google One и многие другие. Отслеживайте сроки, экономьте деньги и не пропускайте важные платежи.
              </p>
              <div className="d-grid gap-2 d-md-flex justify-content-md-start mt-4">
                <Button as={Link} to="/plans" variant="primary" size="lg" className="px-4 me-md-2">Выбрать сервис</Button>
                <Button as={Link} to="/register" variant="outline-secondary" size="lg" className="px-4">Начать пользоваться</Button>
              </div>
            </Col>
            <Col lg={6} className="mt-4 mt-lg-0">
              <div className="service-logos-container p-4 bg-white rounded shadow">
                <h4 className="text-center mb-4">Поддерживаемые сервисы</h4>
                <Row className="g-4 justify-content-center">
                  {serviceIcons.map((service, index) => (
                    <Col key={index} xs={4} md={4} className="text-center">
                      <div className="service-icon mb-2" style={{ fontSize: '2.5rem' }}>
                        {service.icon}
                      </div>
                      <div className="service-name small">{service.name}</div>
                    </Col>
                  ))}
                </Row>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      
    </div>
  );
};

export default Home;