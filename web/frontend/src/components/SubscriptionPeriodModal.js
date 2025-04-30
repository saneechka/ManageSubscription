import React, { useState } from 'react';
import { Modal, Button, Card, Row, Col, Badge } from 'react-bootstrap';
// Импортируем иконки по умолчанию для случаев, когда иконка не передана
import { FaMobileAlt } from 'react-icons/fa';

/**
 * Модальное окно для выбора срока подписки (месяц/год)
 */
const SubscriptionPeriodModal = ({ show, onHide, service, monthlyPlan, yearlyPlan, onSubscribe, serviceIcon, serviceColor }) => {
  const [hoveredPlan, setHoveredPlan] = useState(null);

  // Вычисляем экономию для годового плана если есть и месячный и годовой планы
  const calculateSavings = () => {
    if (!monthlyPlan || !yearlyPlan) return null;
    
    const yearlyPrice = yearlyPlan.price;
    const monthlyPriceForYear = monthlyPlan.price * 12;
    
    if (yearlyPrice < monthlyPriceForYear) {
      const savings = Math.round((monthlyPriceForYear - yearlyPrice) / monthlyPriceForYear * 100);
      return `Экономия ${savings}%`;
    }
    return null;
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

  const savings = calculateSavings();

  // Если нет ни одного плана, показываем сообщение
  if (!monthlyPlan && !yearlyPlan) {
    return (
      <Modal show={show} onHide={onHide} centered>
        <Modal.Header closeButton>
          <Modal.Title>Информация о подписке</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-center">Информация о подписке не найдена.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Закрыть</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  // Общие стили для карточек планов
  const getPlanCardStyle = (planId) => {
    return {
      transition: 'all 0.3s ease',
      backgroundColor: hoveredPlan === planId ? '#f8f9fa' : 'white',
      transform: hoveredPlan === planId ? 'translateY(-5px)' : 'none',
      boxShadow: hoveredPlan === planId ? '0 5px 15px rgba(0,0,0,0.1)' : 'none',
      cursor: 'pointer',
      borderColor: hoveredPlan === planId ? '#0d6efd' : '#dee2e6',
      borderWidth: '2px',
      display: 'flex',
      flexDirection: 'column'
    };
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <div className="d-flex align-items-center">
          {serviceIcon && (
            <div 
              className="me-3" 
              style={{ 
                fontSize: '1.8rem', 
                color: serviceColor || '#6c757d',
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
              {serviceIcon || <FaMobileAlt />}
            </div>
          )}
          <Modal.Title>Подписка на {service?.name || 'сервис'}</Modal.Title>
        </div>
      </Modal.Header>
      <Modal.Body>
        <Row className="d-flex align-items-stretch">
          {monthlyPlan && (
            <Col md={yearlyPlan ? 6 : 12} className="mb-3 mb-md-0">
              <Card 
                className="subscription-plan-card h-100"
                style={getPlanCardStyle(monthlyPlan.id)}
                onMouseEnter={() => setHoveredPlan(monthlyPlan.id)}
                onMouseLeave={() => setHoveredPlan(null)}
                onClick={() => onSubscribe(monthlyPlan.id)}
              >
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div className="fw-bold">Месячная подписка</div>
                </Card.Header>
                <Card.Body className="d-flex flex-column">
                  <div className="flex-grow-1">
                    <Card.Title className="mb-3">
                      <span className="display-6">{monthlyPlan.price.toFixed(2)} ₽</span>
                      <small className="text-muted"> / месяц</small>
                    </Card.Title>
                    
                    {monthlyPlan.description && (
                      <Card.Text className="mb-3">{monthlyPlan.description}</Card.Text>
                    )}
                    
                    <div className="mt-3 mb-4">
                      <h6>Что включено:</h6>
                      <ul>
                        {formatFeatures(monthlyPlan.features).map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-auto">
                    <Button 
                      variant="primary" 
                      className="w-100 mt-2"
                    >
                      Оформить подписку
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          )}
          
          {yearlyPlan && (
            <Col md={monthlyPlan ? 6 : 12}>
              <Card 
                className="subscription-plan-card h-100"
                style={getPlanCardStyle(yearlyPlan.id)}
                onMouseEnter={() => setHoveredPlan(yearlyPlan.id)}
                onMouseLeave={() => setHoveredPlan(null)}
                onClick={() => onSubscribe(yearlyPlan.id)}
              >
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div className="fw-bold">Годовая подписка</div>
                  {savings && <Badge bg="success">{savings}</Badge>}
                </Card.Header>
                <Card.Body className="d-flex flex-column">
                  <div className="flex-grow-1">
                    <Card.Title className="mb-3">
                      <span className="display-6">{yearlyPlan.price.toFixed(2)} ₽</span>
                      <small className="text-muted"> / год</small>
                      <div className="text-muted fs-6">
                        ({(yearlyPlan.price / 12).toFixed(2)} ₽ / месяц)
                      </div>
                    </Card.Title>
                    
                    {yearlyPlan.description && (
                      <Card.Text className="mb-3">{yearlyPlan.description}</Card.Text>
                    )}
                    
                    <div className="mt-3 mb-4">
                      <h6>Что включено:</h6>
                      <ul>
                        {formatFeatures(yearlyPlan.features).map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-auto">
                    <Button 
                      variant="primary" 
                      className="w-100 mt-2"
                    >
                      Оформить подписку
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Закрыть
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SubscriptionPeriodModal;