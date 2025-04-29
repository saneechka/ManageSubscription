import React, { useState } from 'react';
import { Modal, Button, Card, Row, Col, Badge } from 'react-bootstrap';

/**
 * Модальное окно для выбора срока подписки (месяц/год)
 */
const SubscriptionPeriodModal = ({ show, onHide, service, monthlyPlan, yearlyPlan, onSubscribe }) => {
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

  // Выбираем только один план для отображения (предпочтительно месячный)
  const planToShow = monthlyPlan || yearlyPlan;
  
  if (!planToShow) {
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

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Подписка на {service?.name || 'сервис'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row className="justify-content-center">
          <Col xs={12}>
            <Card 
              className="subscription-plan-card h-100" 
              style={{
                transition: 'background-color 0.3s',
                backgroundColor: hoveredPlan === planToShow.id ? '#f8f9fa' : 'white',
                cursor: 'pointer',
                borderColor: '#0d6efd'
              }}
              onMouseEnter={() => setHoveredPlan(planToShow.id)}
              onMouseLeave={() => setHoveredPlan(null)}
              onClick={() => onSubscribe(planToShow.id)}
            >
              <Card.Header className="d-flex justify-content-between align-items-center">
                <div>
                  {planToShow.period_type === 'years' ? 'Годовая подписка' : 'Месячная подписка'}
                </div>
                {planToShow === yearlyPlan && savings && <Badge bg="success">{savings}</Badge>}
              </Card.Header>
              <Card.Body>
                <Card.Title className="mb-3">
                  <span className="display-6">{planToShow.price.toFixed(2)} ₽</span>
                  <small className="text-muted">
                    {planToShow.period_type === 'years' ? ' / год' : ' / месяц'}
                  </small>
                  {planToShow === yearlyPlan && (
                    <div className="text-muted fs-6">
                      ({(planToShow.price / 12).toFixed(2)} ₽ / месяц)
                    </div>
                  )}
                </Card.Title>
                
                {planToShow.description && (
                  <Card.Text className="mb-3">{planToShow.description}</Card.Text>
                )}
                
                <div className="mt-3 mb-4">
                  <h6>Что включено:</h6>
                  <ul>
                    {formatFeatures(planToShow.features).map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
                
                <Button 
                  variant="primary" 
                  className="w-100 mt-2"
                >
                  {planToShow.period_type === 'years' ? 'Оформить подписку на год' : 'Оформить подписку'}
                </Button>
              </Card.Body>
            </Card>
          </Col>
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