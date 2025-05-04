import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Card } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { userAPI } from '../utils/api';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [resendError, setResendError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [needVerification, setNeedVerification] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get URL for redirection after successful login
  const redirectTo = location.state?.redirectTo || '/dashboard';
  
  // Check if coming from registration page and autofill email
  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
    
    if (location.state?.registrationSuccess) {
      setRegistrationSuccess(true);
    }

    if (location.state?.needEmailVerification) {
      setNeedVerification(true);
    }
  }, [location.state]);

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendError('');
    setResendSuccess('');

    try {
      const response = await fetch('/api/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Не удалось отправить письмо с подтверждением');
      }
      
      setResendSuccess(data.message || 'Письмо с подтверждением отправлено. Пожалуйста, проверьте вашу почту.');
    } catch (err) {
      console.error('Error resending verification email:', err);
      setResendError(err.message || 'Произошла ошибка при отправке письма');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Trim whitespace from inputs to avoid issues
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();
      
      if (!trimmedEmail || !trimmedPassword) {
        throw new Error('Email и пароль обязательны');
      }

      // Проверка формата email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        throw new Error('Пожалуйста, введите корректный email адрес');
      }

      console.log('Attempting login with:', { email: trimmedEmail });
      
      // Use userAPI.login with trimmed values
      const loginData = await userAPI.login({ 
        email: trimmedEmail, 
        password: trimmedPassword 
      });

      // Проверяем наличие токена в ответе
      if (!loginData || !loginData.token) {
        throw new Error('Сервер не вернул токен авторизации. Пожалуйста, попробуйте снова.');
      }

      // Save token to localStorage
      localStorage.setItem('token', loginData.token);
      
      // Also save user data if included in response
      if (loginData.user) {
        localStorage.setItem('user', JSON.stringify(loginData.user));
      }

      console.log('Login successful, redirecting to:', redirectTo);
      
      // Update authentication status
      onLogin();

      // Redirect user
      navigate(redirectTo);
    } catch (err) {
      console.error('Login error:', err);
      
      // Более подробная обработка ошибок
      if (err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
        setError('Проблема с подключением к серверу. Пожалуйста, проверьте интернет-соединение.');
      } else if (err.message.includes('invalid email or password')) {
        setError('Неверный email или пароль. Пожалуйста, проверьте правильность ввода данных.');
      } else if (err.message.includes('email not verified')) {
        setError('Email не подтвержден. Пожалуйста, проверьте вашу почту или запросите новое письмо с подтверждением.');
        setNeedVerification(true);
      } else {
        setError(err.message || 'Произошла ошибка при входе. Пожалуйста, попробуйте снова.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="content">
      <div className="auth-form">
        <h2 className="text-center mb-4">Вход в систему</h2>
        
        {registrationSuccess && !needVerification && (
          <Alert variant="success" onClose={() => setRegistrationSuccess(false)} dismissible>
            Регистрация прошла успешно! Пожалуйста, войдите в систему, используя ваш email и пароль.
          </Alert>
        )}
        
        {needVerification && (
          <Card className="mb-4 border-warning">
            <Card.Body>
              <Card.Title>Требуется подтверждение email</Card.Title>
              <Card.Text>
                Для входа в систему необходимо подтвердить ваш email. Проверьте папку "Входящие" и "Спам" на наличие письма с подтверждением.
              </Card.Text>
              
              {resendError && <Alert variant="danger" className="mt-2">{resendError}</Alert>}
              {resendSuccess && <Alert variant="success" className="mt-2">{resendSuccess}</Alert>}
              
              <Button 
                variant="outline-primary" 
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="mt-2"
              >
                {resendLoading ? 'Отправка...' : 'Отправить письмо повторно'}
              </Button>
            </Card.Body>
          </Card>
        )}
        
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formEmail">
            <Form.Label>Электронная почта</Form.Label>
            <Form.Control 
              type="email" 
              placeholder="Введите email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formPassword">
            <Form.Label>Пароль</Form.Label>
            <Form.Control 
              type="password" 
              placeholder="Пароль" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>

          <Button 
            variant="primary" 
            type="submit" 
            className="w-100 mt-3"
            disabled={loading}
          >
            {loading ? 'Вход...' : 'Войти'}
          </Button>
        </Form>
        
        <div className="text-center mt-3">
          <p>Ещё нет аккаунта? <Link to="/register">Зарегистрируйтесь</Link></p>
        </div>
      </div>
    </Container>
  );
};

export default Login;