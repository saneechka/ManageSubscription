import React, { useState } from 'react';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { userAPI } from '../utils/api';

const Register = ({ onRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

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

    // Проверка наличия пароля
    if (!formData.password || formData.password.trim() === '') {
      setError('Пароль обязателен для регистрации');
      setLoading(false);
      return;
    }

    // Проверка минимальной длины пароля
    if (formData.password.length < 8) {
      setError('Пароль должен содержать не менее 8 символов');
      setLoading(false);
      return;
    }

    try {
      // Register the user without getting token
      const registerResponse = await userAPI.register(formData);

      if (!registerResponse || registerResponse.error) {
        throw new Error(registerResponse?.error || 'Ошибка регистрации');
      }
      
      // Show success message
      setSuccess('Регистрация прошла успешно! Проверьте вашу электронную почту для подтверждения аккаунта. После подтверждения вы сможете войти в систему.');
      
      // After 5 seconds, redirect to login page
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            email: formData.email,
            registrationSuccess: true,
            needEmailVerification: true 
          } 
        });
      }, 5000);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Произошла ошибка при регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="content">
      <div className="auth-form">
        <h2 className="text-center mb-4">Регистрация</h2>
        
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formFirstName">
            <Form.Label>Имя</Form.Label>
            <Form.Control 
              type="text" 
              placeholder="Введите имя" 
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formLastName">
            <Form.Label>Фамилия</Form.Label>
            <Form.Control 
              type="text" 
              placeholder="Введите фамилию" 
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formEmail">
            <Form.Label>Электронная почта</Form.Label>
            <Form.Control 
              type="email" 
              placeholder="Введите email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formPassword">
            <Form.Label>Пароль</Form.Label>
            <Form.Control 
              type="password" 
              placeholder="Пароль" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <Form.Text className="text-muted">
              Пароль должен содержать не менее 8 символов.
            </Form.Text>
          </Form.Group>

          <Button 
            variant="primary" 
            type="submit" 
            className="w-100 mt-3"
            disabled={loading}
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </Button>
        </Form>
        
        <div className="text-center mt-3">
          <p>Уже есть аккаунт? <Link to="/login">Войдите</Link></p>
        </div>
      </div>
    </Container>
  );
};

export default Register;