import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Badge, Tabs, Tab, Form, InputGroup, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Search, XCircle, SortDown, ArrowDownUp } from 'react-bootstrap-icons';
import { subscriptionsAPI } from '../utils/api';


const SERVICE_ICONS = {
  'яндекс': '🔍',
  'netflix': '📺',
  'spotify': '🎵',
  'apple': '🍎',
  'google': '☁️',
  'кинопоиск': '🎬',
  'амедиатека': '📽️',
  'amediateka': '📽️',
  'ivi': '🎦',
  'premier': '🎞️',
  'default': '📱' 
};

const Dashboard = ({ user }) => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [activeSubscriptions, setActiveSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [stats, setStats] = useState({
    active_count: 0,
    total_monthly_spending: 0
  });
  

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [isSearching, setIsSearching] = useState(false);
  
  useEffect(() => {

    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Получаем все подписки без фильтрации по периоду
      const subsData = await subscriptionsAPI.getAll();
                let allSubs = subsData.subscriptions || [];
      
      // Фильтруем подписки без плана или с некорректными данными
      allSubs = allSubs.filter(sub => sub && sub.plan && sub.plan.name && sub.plan.price !== undefined);
      
      setSubscriptions(allSubs);
      

      // Получаем активные подписки без фильтрации по периоду
      const activeData = await subscriptionsAPI.getActive();
      let activeSubs = activeData.active_subscriptions || [];
      
      // Фильтруем активные подписки без плана или с некорректными данными
      activeSubs = activeSubs.filter(sub => sub && sub.plan && sub.plan.name && sub.plan.price !== undefined);
      
      setActiveSubscriptions(activeSubs);
      

      // Получаем статистику
      const statsData = await subscriptionsAPI.getStats();
      

      const finalStats = statsData.stats || {
        active_count: activeSubs.length,
        total_monthly_spending: activeSubs.reduce((total, sub) => {
          if (!sub || !sub.plan || typeof sub.plan.price !== 'number') {
            return total;
          }
          // Конвертируем годовую стоимость в ежемесячную для правильного расчета
          return total + (sub.plan.period_type === 'years' ? sub.plan.price / 12 : sub.plan.price);
        }, 0)
      };
      

      if (finalStats.active_count !== activeSubs.length) {
        finalStats.active_count = activeSubs.length;
        finalStats.total_monthly_spending = activeSubs.reduce((total, sub) => {
          if (!sub || !sub.plan || typeof sub.plan.price !== 'number') {
            return total;
          }
          // Конвертируем годовую стоимость в ежемесячную для правильного расчета
          return total + (sub.plan.period_type === 'years' ? sub.plan.price / 12 : sub.plan.price);
        }, 0);
      }
      
      setStats(finalStats);
      

      localStorage.setItem('subscription_stats', JSON.stringify(finalStats));
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    
    try {
      const data = await subscriptionsAPI.search(searchQuery, statusFilter, sortBy);
      // Отображаем все подписки без фильтрации по длительности
      const filteredSubs = data.subscriptions || [];
      
      setSubscriptions(filteredSubs);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  };
  

  const sortSubscriptions = (subs, sortType) => {
    if (!subs || subs.length === 0) return [];
    
    // Фильтруем подписки с некорректными данными
    const validSubs = subs.filter(sub => sub && sub.plan && sub.plan.name && sub.plan.price !== undefined);
    
    if (validSubs.length === 0) return [];
    
    const sorted = [...validSubs];
    
    switch (sortType) {
      case 'price_asc':
        return sorted.sort((a, b) => (a.plan.price || 0) - (b.plan.price || 0));
      case 'price_desc':
        return sorted.sort((a, b) => (b.plan.price || 0) - (a.plan.price || 0));
      case 'date_asc':
        return sorted.sort((a, b) => new Date(a.start_date || 0) - new Date(b.start_date || 0));
      case 'date_desc':
        return sorted.sort((a, b) => new Date(b.start_date || 0) - new Date(a.start_date || 0));
      case 'name_asc':
        return sorted.sort((a, b) => (a.plan.name || '').localeCompare(b.plan.name || ''));
      case 'name_desc':
        return sorted.sort((a, b) => (b.plan.name || '').localeCompare(a.plan.name || ''));
      default:
        return sorted;
    }
  };
  

  const handleSort = (sortType) => {
    setSortBy(sortType);
    setSubscriptions(sortSubscriptions(subscriptions, sortType));
    setActiveSubscriptions(sortSubscriptions(activeSubscriptions, sortType));
  };
  

  const handleLocalSearch = (query) => {
    setSearchQuery(query);
    
    if (!query.trim() && !statusFilter) {
      fetchDashboardData();
      return;
    }
    
    subscriptionsAPI.getAll().then(data => {
      let filteredSubs = (data.subscriptions || []);
      
      // Фильтруем подписки с некорректными данными
      filteredSubs = filteredSubs.filter(sub => sub && sub.plan && sub.plan.name && sub.plan.price !== undefined);

      // Убираем фильтр по длительности, чтобы отображались все подписки, включая годовые
      
      if (query.trim()) {
        filteredSubs = filteredSubs.filter(sub => 
          sub.plan.name.toLowerCase().includes(query.toLowerCase())
        );
      }
      

      if (statusFilter) {
        filteredSubs = filteredSubs.filter(sub => 
          sub.status === statusFilter
        );
      }
      

      filteredSubs = sortSubscriptions(filteredSubs, sortBy);
      
      setSubscriptions(filteredSubs);
      

      const activeSubs = filteredSubs.filter(sub => sub.status === 'active');
      setActiveSubscriptions(activeSubs);
    }).catch(err => {
      setError(err.message);
    });
  };
  

  const resetSearch = () => {
    setSearchQuery('');
    setStatusFilter('');
    setSortBy('date_desc');
    fetchDashboardData();
  };
  
  const handleCancelSubscription = async (subscriptionId) => {
    if (!window.confirm('Вы уверены, что хотите отменить подписку?')) {
      return;
    }
    
    setError('');
    setActionSuccess('');
    
    try {
      const data = await subscriptionsAPI.cancel(subscriptionId);
      setActionSuccess('Подписка успешно отменена');
      

      fetchDashboardData();
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleToggleAutoRenewal = async (subscriptionId, currentAutoRenew) => {
    setError('');
    setActionSuccess('');
    
    try {
      const data = await subscriptionsAPI.updateAutoRenewal(subscriptionId, !currentAutoRenew);
      setActionSuccess(`Автопродление ${!currentAutoRenew ? 'включено' : 'отключено'} успешно`);
      

      fetchDashboardData();
    } catch (err) {
      setError(err.message);
    }
  };
  

  const handleRenewSubscription = async (subscriptionId) => {
    if (!window.confirm('Вы хотите продлить эту подписку?')) {
      return;
    }
    
    setError('');
    setActionSuccess('');
    
    try {
      const data = await subscriptionsAPI.renew(subscriptionId);
      setActionSuccess('Подписка успешно продлена');
      

      fetchDashboardData();
    } catch (err) {
      setError(err.message);
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };


  const getStatusInRussian = (status) => {
    switch(status) {
      case 'active': return 'Активна';
      case 'cancelled': return 'Отменена';
      case 'expired': return 'Истекла';
      default: return status;
    }
  };


  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'success';
      case 'cancelled': return 'warning';
      case 'expired': return 'secondary';
      default: return 'info';
    }
  };
  

  const getServiceIcon = (serviceName) => {
    if (!serviceName) return SERVICE_ICONS.default;
    
    const name = serviceName.toLowerCase();
    
    for (const [key, icon] of Object.entries(SERVICE_ICONS)) {
      if (key !== 'default' && name.includes(key)) {
        return icon;
      }
    }
    
    return SERVICE_ICONS.default;
  };
  

  const getSortName = (sortValue) => {
    switch(sortValue) {
      case 'price_asc': return 'Цена (по возрастанию)';
      case 'price_desc': return 'Цена (по убыванию)';
      case 'date_asc': return 'Дата (старые сначала)';
      case 'date_desc': return 'Дата (новые сначала)';
      case 'name_asc': return 'Название (А-Я)';
      case 'name_desc': return 'Название (Я-А)';
      default: return 'По умолчанию';
    }
  };

  return (
    <Container className="py-5">
      <h1 className="mb-4">Управление подписками</h1>
      
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>
        <Alert.Heading>Ошибка!</Alert.Heading>
        <p>{error}</p>
      </Alert>}
      
      {actionSuccess && <Alert variant="success" dismissible onClose={() => setActionSuccess('')}>
        <Alert.Heading>Успешно!</Alert.Heading>
        <p>{actionSuccess}</p>
      </Alert>}
      
      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Загрузка...</span>
          </div>
        </div>
      ) : (
        <>
          <Row className="mb-4">
            <Col md={6} lg={3} className="mb-3">
              <Card className="subscription-stat-card h-100">
                <Card.Body className="text-center">
                  <h6>Активные подписки</h6>
                  <div className="display-4">{stats.active_count}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} lg={3} className="mb-3">
              <Card className="subscription-stat-card h-100">
                <Card.Body className="text-center">
                  <h6>Ежемесячные расходы</h6>
                  <div className="display-4">{stats.total_monthly_spending ? stats.total_monthly_spending.toFixed(2) : 0} ₽</div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={6} className="mb-3 d-flex align-items-center justify-content-end">
              <Button as={Link} to="/plans" variant="primary">
                Добавить новую подписку
              </Button>
            </Col>
          </Row>
          
          {/* Панель поиска и фильтрации */}
          <Row className="mb-4">
            <Col xs={12}>
              <Card>
                <Card.Body>
                  <Form>
                    <Row className="align-items-end">
                      <Col md={4} className="mb-3 mb-md-0">
                        <Form.Group>
                          <Form.Label>Поиск по названию</Form.Label>
                          <InputGroup>
                            <Form.Control
                              type="text"
                              value={searchQuery}
                              onChange={e => handleLocalSearch(e.target.value)}
                              placeholder="Например: Netflix, Яндекс..."
                            />
                            <Button variant="outline-secondary" onClick={() => setSearchQuery('')}>
                              {searchQuery ? <XCircle /> : <Search />}
                            </Button>
                          </InputGroup>
                        </Form.Group>
                      </Col>
                      <Col md={3} className="mb-3 mb-md-0">
                        <Form.Group>
                          <Form.Label>Статус</Form.Label>
                          <Form.Select 
                            value={statusFilter}
                            onChange={e => {
                              setStatusFilter(e.target.value);
                              handleLocalSearch(searchQuery); 
                            }}
                          >
                            <option value="">Все статусы</option>
                            <option value="active">Активные</option>
                            <option value="cancelled">Отменённые</option>
                            <option value="expired">Истекшие</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={3} className="mb-3 mb-md-0">
                        <Form.Group>
                          <Form.Label>Сортировка</Form.Label>
                          <Dropdown>
                            <Dropdown.Toggle variant="outline-secondary" id="dropdown-sort" className="w-100 text-start">
                              <ArrowDownUp className="me-2" />
                              {getSortName(sortBy)}
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="w-100">
                              <Dropdown.Item onClick={() => handleSort('date_desc')}>Дата (новые сначала)</Dropdown.Item>
                              <Dropdown.Item onClick={() => handleSort('date_asc')}>Дата (старые сначала)</Dropdown.Item>
                              <Dropdown.Item onClick={() => handleSort('price_desc')}>Цена (по убыванию)</Dropdown.Item>
                              <Dropdown.Item onClick={() => handleSort('price_asc')}>Цена (по возрастанию)</Dropdown.Item>
                              <Dropdown.Item onClick={() => handleSort('name_asc')}>Название (А-Я)</Dropdown.Item>
                              <Dropdown.Item onClick={() => handleSort('name_desc')}>Название (Я-А)</Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </Form.Group>
                      </Col>
                      <Col md={2} className="d-flex justify-content-end">
                        <Button variant="outline-secondary" onClick={resetSearch} className="w-100">
                          Сбросить <XCircle />
                        </Button>
                      </Col>
                    </Row>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Tabs defaultActiveKey="active" id="subscriptions-tabs" className="mb-4">
            <Tab eventKey="active" title={`Активные (${activeSubscriptions.length})`}>
              {activeSubscriptions.length > 0 ? (
                <Row>
                  {activeSubscriptions.map(subscription => 
                    subscription && subscription.plan ? (
                      <Col md={6} lg={4} key={subscription.id} className="mb-4">
                        <Card className="subscription-card h-100">
                          <Card.Header className="d-flex justify-content-between align-items-center">
                            <div className="fw-bold d-flex align-items-center">
                              <span className="me-2" style={{ fontSize: '1.5rem' }}>
                                {getServiceIcon(subscription.plan.name || '')}
                              </span>
                              {subscription.plan.name || 'Неизвестная подписка'}
                            </div>
                            <Badge bg={getStatusColor(subscription.status)}>
                              {getStatusInRussian(subscription.status)}
                            </Badge>
                          </Card.Header>
                          <Card.Body>
                            <div className="mb-3">
                              <div className="d-flex justify-content-between">
                                <div>Стоимость:</div>
                                <div className="fw-bold">
                                  {subscription.plan.period_type === 'years' ? 
                                    `${(subscription.plan.price || 0).toFixed(2)} ₽/год (${((subscription.plan.price || 0) / 12).toFixed(2)} ₽/мес)` : 
                                    `${(subscription.plan.price || 0).toFixed(2)} ₽/месяц`
                                  }
                                </div>
                              </div>
                              <div className="d-flex justify-content-between">
                                <div>Дата окончания:</div>
                                <div>{formatDate(subscription.end_date)}</div>
                              </div>
                              <div className="d-flex justify-content-between">
                                <div>Автопродление:</div>
                                <Badge bg={subscription.auto_renew ? "success" : "secondary"}>
                                  {subscription.auto_renew ? "Включено" : "Отключено"}
                                </Badge>
                              </div>
                            </div>
                            <div>{subscription.plan.description || ''}</div>
                          </Card.Body>
                          <Card.Footer>
                            <div className="d-flex flex-column gap-2">
                              <Button 
                                variant={subscription.auto_renew ? "outline-warning" : "outline-success"}
                                onClick={() => handleToggleAutoRenewal(subscription.id, subscription.auto_renew)}
                                size="sm"
                              >
                                {subscription.auto_renew ? "Отключить автопродление" : "Включить автопродление"}
                              </Button>
                              <Button 
                                variant="outline-primary" 
                                onClick={() => handleRenewSubscription(subscription.id)}
                                size="sm"
                              >
                                Продлить сейчас
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                onClick={() => handleCancelSubscription(subscription.id)}
                                size="sm"
                              >
                                Отменить подписку
                              </Button>
                            </div>
                          </Card.Footer>
                        </Card>
                      </Col>
                    ) : null
                  )}
                </Row>
              ) : (
                <div className="text-center py-5">
                  <p>У вас нет активных подписок.</p>
                  <Button as={Link} to="/plans" variant="primary">
                    Просмотреть доступные подписки
                  </Button>
                </div>
              )}
            </Tab>
            <Tab eventKey="all" title="Все подписки">
              {subscriptions.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Название</th>
                        <th>Дата начала</th>
                        <th>Дата окончания</th>
                        <th>Статус</th>
                        <th>Стоимость</th>
                        <th>Автопродление</th>
                        <th>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscriptions.map(sub => 
                        sub && sub.plan ? (
                          <tr key={sub.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <span className="me-2">{getServiceIcon(sub.plan.name || '')}</span>
                                {sub.plan.name || 'Неизвестная подписка'}
                              </div>
                            </td>
                            <td>{formatDate(sub.start_date)}</td>
                            <td>{formatDate(sub.end_date)}</td>
                            <td>
                              <Badge bg={getStatusColor(sub.status)}>
                                {getStatusInRussian(sub.status)}
                              </Badge>
                            </td>
                            <td>
                              {sub.plan.period_type === 'years' ? 
                                `${(sub.plan.price || 0).toFixed(2)} ₽/год (${((sub.plan.price || 0) / 12).toFixed(2)} ₽/мес)` : 
                                `${(sub.plan.price || 0).toFixed(2)} ₽/месяц`
                              }
                            </td>
                            <td>
                              <Badge bg={sub.auto_renew ? "success" : "secondary"}>
                                {sub.auto_renew ? "Да" : "Нет"}
                              </Badge>
                            </td>
                            <td>
                              {sub.status === 'active' && (
                                <div className="d-flex gap-1">
                                  <Button
                                    size="sm"
                                    variant={sub.auto_renew ? "outline-warning" : "outline-success"}
                                    onClick={() => handleToggleAutoRenewal(sub.id, sub.auto_renew)}
                                  >
                                    {sub.auto_renew ? "Отключить" : "Включить"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline-primary"
                                    onClick={() => handleRenewSubscription(sub.id)}
                                  >
                                    Продлить
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline-danger"
                                    onClick={() => handleCancelSubscription(sub.id)}
                                  >
                                    Отменить
                                  </Button>
                                </div>
                              )}
                              {sub.status === 'expired' && (
                                <Button
                                  size="sm"
                                  variant="outline-primary"
                                  onClick={() => handleRenewSubscription(sub.id)}
                                >
                                  Возобновить
                                </Button>
                              )}
                            </td>
                          </tr>
                        ) : null
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <p>У вас нет подписок.</p>
                </div>
              )}
            </Tab>
          </Tabs>
        </>
      )}
    </Container>
  );
};

export default Dashboard;