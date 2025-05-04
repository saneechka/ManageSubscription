package email

import (
	"context"
	"fmt"
	"os"
	"strconv"
	"time"

	gomail "gopkg.in/mail.v2"
)

// Config содержит настройки для отправки электронной почты
type Config struct {
	SMTPHost     string
	SMTPPort     int
	SMTPUsername string
	SMTPPassword string
	FromEmail    string
	FromName     string
	Timeout      time.Duration
}

// GetConfig возвращает конфигурацию для отправки email из переменных окружения
func GetConfig() Config {
	portStr := os.Getenv("SMTP_PORT")
	port, err := strconv.Atoi(portStr)
	if err != nil || port == 0 {
		port = 587 // Стандартный порт для SMTP с TLS
	}

	timeoutStr := os.Getenv("SMTP_TIMEOUT")
	timeout, err := strconv.Atoi(timeoutStr)
	if err != nil || timeout == 0 {
		timeout = 10 // Стандартный таймаут 10 секунд
	}

	config := Config{
		SMTPHost:     getEnvOrDefault("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:     port,
		SMTPUsername: getEnvOrDefault("SMTP_USERNAME", "your-email@example.com"),
		SMTPPassword: getEnvOrDefault("SMTP_PASSWORD", "your-password"),
		FromEmail:    getEnvOrDefault("MAIL_FROM_EMAIL", "noreply@subscriptionmanager.com"),
		FromName:     getEnvOrDefault("MAIL_FROM_NAME", "Subscription Manager"),
		Timeout:      time.Duration(timeout) * time.Second,
	}

	// Выводим информацию о конфигурации (но без пароля)
	fmt.Printf("Email Config: SMTP=%s:%d, Username=%s, FromEmail=%s, FromName=%s\n",
		config.SMTPHost, config.SMTPPort, config.SMTPUsername, config.FromEmail, config.FromName)

	return config
}

// Helper для получения переменной окружения с значением по умолчанию
func getEnvOrDefault(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// SendVerificationEmail отправляет письмо с ссылкой для подтверждения регистрации
// Используется как асинхронная обертка над синхронным методом
func SendVerificationEmail(toEmail, userName, token string) error {
	// Создаем канал для получения результата отправки
	errChan := make(chan error, 1)

	// Запускаем горутину для отправки письма
	go func() {
		fmt.Printf("Начинаем асинхронную отправку письма на адрес %s\n", toEmail)
		err := sendVerificationEmailSync(toEmail, userName, token)
		if err != nil {
			fmt.Printf("Ошибка при отправке письма: %v\n", err)
		} else {
			fmt.Printf("Письмо успешно отправлено на %s\n", toEmail)
		}
		errChan <- err
	}()

	// Для обратной совместимости возвращаем nil
	return nil
}

// sendVerificationEmailSync - синхронная функция отправки письма
func sendVerificationEmailSync(toEmail, userName, token string) error {
	config := GetConfig()

	// Создаем контекст с таймаутом
	ctx, cancel := context.WithTimeout(context.Background(), config.Timeout)
	defer cancel()

	// Формируем url для подтверждения с переданным токеном
	appURL := getEnvOrDefault("APP_URL", "http://localhost:8080")
	verificationURL := fmt.Sprintf("%s/verify-email?token=%s", appURL, token)

	fmt.Printf("URL для подтверждения: %s\n", verificationURL)

	// Создаем объект для отправки email
	m := gomail.NewMessage()
	m.SetHeader("From", fmt.Sprintf("%s <%s>", config.FromName, config.FromEmail))
	m.SetHeader("To", toEmail)
	m.SetHeader("Subject", "Подтверждение регистрации")

	// Формируем HTML-тело письма
	body := fmt.Sprintf(`
		<html>
			<body>
				<h2>Здравствуйте, %s!</h2>
				<p>Благодарим вас за регистрацию в нашем сервисе управления подписками.</p>
				<p>Для подтверждения вашего email и активации аккаунта, пожалуйста, 
				<a href="%s">нажмите на эту ссылку</a>.</p>
				<p>Если вы не регистрировались в нашем сервисе, просто проигнорируйте это письмо.</p>
				<p>Ссылка действительна в течение 24 часов.</p>
				<br>
				<p>С уважением,<br>
				Команда Subscription Manager</p>
			</body>
		</html>
	`, userName, verificationURL)

	m.SetBody("text/html", body)

	// Создаем диалер с настройками SMTP
	d := gomail.NewDialer(config.SMTPHost, config.SMTPPort, config.SMTPUsername, config.SMTPPassword)

	// Дополнительная отладочная информация
	fmt.Printf("Attempting to send email to %s via %s:%d\n",
		toEmail, config.SMTPHost, config.SMTPPort)

	// Запускаем отправку с таймаутом
	errChan := make(chan error, 1)
	go func() {
		errChan <- d.DialAndSend(m)
	}()

	// Ожидаем результат или таймаут
	select {
	case err := <-errChan:
		// Обрабатываем результат отправки
		if err != nil {
			fmt.Printf("Error sending email: %v\n", err)
			return fmt.Errorf("failed to send email: %w", err)
		}
		fmt.Printf("Email to %s sent successfully\n", toEmail)
		return nil
	case <-ctx.Done():
		// Произошел таймаут
		return fmt.Errorf("timeout sending email after %v", config.Timeout)
	}
}
