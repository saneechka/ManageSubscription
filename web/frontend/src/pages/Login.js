import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { userAPI } from '../utils/api';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
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
  }, [location.state]);

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
        
        {registrationSuccess && (
          <Alert variant="success" onClose={() => setRegistrationSuccess(false)} dismissible>
            Регистрация прошла успешно! Пожалуйста, войдите в систему, используя ваш email и пароль.
          </Alert>
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