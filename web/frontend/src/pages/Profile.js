import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Card, Row, Col, Badge } from 'react-bootstrap';
import { userAPI } from '../utils/api';

// Популярные сервисы для настройки предпочтений
const POPULAR_SERVICES = [
  { id: 'yandex-plus', name: 'Яндекс Плюс' },
  { id: 'google-one', name: 'Google One' },
  { id: 'spotify', name: 'Spotify Premium' },
  { id: 'netflix', name: 'Netflix' },
  { id: 'apple-one', name: 'Apple One' },
  { id: 'kinopoisk', name: 'Кинопоиск HD' },
  { id: 'ivi', name: 'IVI' },
  { id: 'amediateka', name: 'Amediateka' }
];

const Profile = ({ user, setUser }) => {
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    renewalReminder: true,
    priceChanges: true,
    promotionalOffers: false
  });
  
  const [preferredServices, setPreferredServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Здесь можно загрузить сохраненные настройки пользователя
    if (user) {
      // Это просто заглушка для примера
      setPreferredServices(['yandex-plus', 'netflix', 'spotify']);
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Обновляем профиль через API
      await userAPI.updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name
      });

      // Обновляем данные пользователя в контексте
      setUser({
        ...user,
        first_name: formData.first_name,
        last_name: formData.last_name
      });
      
      setSuccess('Профиль успешно обновлен');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleServicePreference = (serviceId) => {
    setPreferredServices(prevState => {
      if (prevState.includes(serviceId)) {
        return prevState.filter(id => id !== serviceId);
      } else {
        return [...prevState, serviceId];
      }
    });
  };

  const handleNotificationChange = (e) => {
    setNotificationSettings({
      ...notificationSettings,
      [e.target.name]: e.target.checked
    });
  };

  return (
    <Container className="py-5">
      <h1 className="mb-4">Мой профиль</h1>
      
      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <div className="mb-4">
                <p><strong>Email:</strong> {user?.email}</p>
              </div>
              
              <h4 className="mb-3">Редактировать профиль</h4>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="formFirstName">
                      <Form.Label>Имя</Form.Label>
                      <Form.Control 
                        type="text" 
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="formLastName">
                      <Form.Label>Фамилия</Form.Label>
                      <Form.Control 
                        type="text" 
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Button 
                  variant="primary" 
                  type="submit" 
                  disabled={loading}
                >
                  {loading ? 'Сохранение...' : 'Сохранить изменения'}
                </Button>
              </Form>
              
              <hr className="my-4" />
              
              <h4 className="mb-3">Настройки уведомлений</h4>
              <Form>
                <Form.Check 
                  type="switch"
                  id="renewal-reminder"
                  name="renewalReminder"
                  label="Напоминать о продлении подписок за 3 дня"
                  checked={notificationSettings.renewalReminder}
                  onChange={handleNotificationChange}
                  className="mb-2"
                />
                <Form.Check 
                  type="switch"
                  id="price-changes"
                  name="priceChanges"
                  label="Уведомлять об изменении цен сервисов"
                  checked={notificationSettings.priceChanges}
                  onChange={handleNotificationChange}
                  className="mb-2"
                />
                <Form.Check 
                  type="switch"
                  id="promotional-offers"
                  name="promotionalOffers"
                  label="Получать информацию о выгодных предложениях"
                  checked={notificationSettings.promotionalOffers}
                  onChange={handleNotificationChange}
                  className="mb-2"
                />
              </Form>
              
              <hr className="my-4" />
              
              <h4 className="mb-3">Настройки аккаунта</h4>
              <Button variant="outline-danger" className="me-2 mb-2">Изменить пароль</Button>
              <Button variant="outline-secondary" className="mb-2">Удалить аккаунт</Button>
            </Card.Body>
          </Card>
        </Col>

        

          
        
      </Row>
    </Container>
  );
};

export default Profile;