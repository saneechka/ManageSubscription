import React, { useState, useEffect } from 'react';
import { Container, Alert, Card, Button } from 'react-bootstrap';
import { useSearchParams, Link } from 'react-router-dom';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Токен подтверждения отсутствует.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/verify-email?token=${token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Не удалось подтвердить email');
        }
        
        setStatus('success');
        setMessage(data.message || 'Ваш email успешно подтвержден! Теперь вы можете войти в систему.');
      } catch (err) {
        console.error('Error verifying email:', err);
        setStatus('error');
        setMessage(err.message || 'Произошла ошибка при подтверждении email');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <Container className="py-5">
      <Card className="mx-auto" style={{ maxWidth: '600px' }}>
        <Card.Body className="text-center p-5">
          <h2 className="mb-4">Подтверждение email</h2>
          
          {status === 'loading' && (
            <div className="text-center my-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Загрузка...</span>
              </div>
              <p className="mt-3">Проверка токена подтверждения...</p>
            </div>
          )}
          
          {status === 'success' && (
            <>
              <Alert variant="success">{message}</Alert>
              <div className="d-flex justify-content-center mt-4">
                <Button as={Link} to="/login" variant="primary">
                  Перейти к странице входа
                </Button>
              </div>
            </>
          )}
          
          {status === 'error' && (
            <>
              <Alert variant="danger">{message}</Alert>
              <div className="d-flex justify-content-center mt-4">
                <Button as={Link} to="/login" variant="outline-primary" className="me-2">
                  Перейти к странице входа
                </Button>
                <Button as={Link} to="/register" variant="outline-secondary">
                  Регистрация
                </Button>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default VerifyEmail;