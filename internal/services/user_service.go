package services

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt"
	"github.com/saneechka/ManageSubscription/internal/app"
	"github.com/saneechka/ManageSubscription/internal/models"
	"github.com/saneechka/ManageSubscription/pkg/email"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type JWTClaims struct {
	UserID uint `json:"user_id"`
	jwt.StandardClaims
}

type UserService struct{}

// Register регистрирует нового пользователя и отправляет письмо с подтверждением
func (s *UserService) Register(user *models.User) error {
	if app.DB == nil {
		return errors.New("database connection is nil")
	}

	// Добавляем логирование
	fmt.Println("Регистрация пользователя:", user.Email)
	fmt.Println("Исходная длина пароля:", len(user.Password))

	var existingUser models.User
	result := app.DB.Where("email = ?", user.Email).First(&existingUser)
	if result.Error == nil {
		return errors.New("user with this email already exists")
	} else if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return fmt.Errorf("database error while checking existing user: %w", result.Error)
	}

	// Хешируем пароль
	plainPassword := user.Password // сохраняем обычный пароль для проверки
	if err := user.HashPassword(); err != nil {
		return fmt.Errorf("error hashing password: %w", err)
	}
	fmt.Println("Хешированная длина пароля:", len(user.Password))

	// Проверка, что хеширование работает
	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(plainPassword))
	if err != nil {
		fmt.Println("ВНИМАНИЕ: Проверка хеширования не прошла:", err)
	} else {
		fmt.Println("Хеширование пароля работает корректно")
	}

	// Генерируем токен подтверждения
	token, err := s.generateVerificationToken()
	if err != nil {
		return fmt.Errorf("error generating verification token: %w", err)
	}

	// Устанавливаем токен и дату истечения срока (24 часа)
	user.VerificationToken = token
	expiresAt := time.Now().Add(24 * time.Hour)
	user.TokenExpiresAt = &expiresAt
	user.IsEmailVerified = false

	// Создаем пользователя в базе данных
	if err := app.DB.Create(user).Error; err != nil {
		return fmt.Errorf("error creating user: %w", err)
	}

	// Отправляем письмо с подтверждением асинхронно
	userName := user.FirstName
	if userName == "" {
		userName = "пользователь"
	}

	// Асинхронная отправка, не блокирующая основной поток
	if err := email.SendVerificationEmail(user.Email, userName, token); err != nil {
		// Просто логируем ошибку, но не возвращаем её, чтобы не блокировать регистрацию
		fmt.Printf("Ошибка отправки письма с подтверждением: %v\n", err)
	} else {
		fmt.Printf("Письмо с подтверждением для %s будет отправлено асинхронно\n", user.Email)
	}

	return nil
}

// Login аутентифицирует пользователя и проверяет подтверждение email
func (s *UserService) Login(email, password string) (string, error) {
	masterEmail := os.Getenv("MASTER_EMAIL")
	masterPassword := os.Getenv("MASTER_PASSWORD")

	if masterEmail == "" {
		masterEmail = "admin@example.com"
	}
	if masterPassword == "" {
		masterPassword = "admin123"
	}

	if email == masterEmail && password == masterPassword {
		// Успешный вход администратора
		adminID := uint(1)
		token, err := s.GenerateJWT(adminID)
		if err != nil {
			return "", err
		}
		return token, nil
	}

	// Добавляем логирование для отладки
	fmt.Println("Попытка входа:", email)

	var user models.User
	result := app.DB.Where("email = ?", email).First(&user)
	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		fmt.Println("Пользователь не найден:", email)
		return "", errors.New("invalid email or password")
	} else if result.Error != nil {
		fmt.Println("Ошибка базы данных:", result.Error)
		return "", result.Error
	}

	fmt.Println("Длина хеша пароля:", len(user.Password))

	err := user.CheckPassword(password)
	if err != nil {
		fmt.Println("Ошибка стандартной проверки пароля:", err)

		if user.Password == password {
			fmt.Println("Незахешированный пароль совпадает! Исправляем ситуацию...")

			oldPass := user.Password
			if err := user.HashPassword(); err != nil {
				fmt.Println("Не удалось захешировать пароль:", err)

			} else {

				if err := app.DB.Save(&user).Error; err != nil {
					fmt.Println("Ошибка при обновлении пароля:", err)

					user.Password = oldPass
				}
			}

			if !user.IsEmailVerified {
				return "", errors.New("email not verified. please check your email for verification link")
			}

			token, err := s.GenerateJWT(user.ID)
			if err != nil {
				return "", err
			}
			return token, nil
		}

		return "", errors.New("invalid email or password")
	}

	// Проверяем, подтвержден ли email
	if !user.IsEmailVerified {
		return "", errors.New("email not verified. please check your email for verification link")
	}

	token, err := s.GenerateJWT(user.ID)
	if err != nil {
		return "", err
	}

	return token, nil
}

func (s *UserService) GetSecretKey() []byte {
	key := os.Getenv("JWT_SECRET_KEY")
	if key == "" {
		key = "secure_jwt_secret_key_for_subscription_manager"
	}
	return []byte(key)
}

func (s *UserService) GenerateJWT(userID uint) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour)

	claims := &JWTClaims{
		UserID: userID,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expirationTime.Unix(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	tokenString, err := token.SignedString(s.GetSecretKey())
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

func (s *UserService) GetUserByID(id uint) (*models.User, error) {
	if id == 1 {
		var adminUser models.User
		result := app.DB.First(&adminUser, id)

		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			masterEmail := os.Getenv("MASTER_EMAIL")
			if masterEmail == "" {
				masterEmail = "admin@example.com"
			}

			return &models.User{
				ID:              1,
				Email:           masterEmail,
				FirstName:       "Admin",
				LastName:        "User",
				CreatedAt:       time.Now(),
				UpdatedAt:       time.Now(),
				IsEmailVerified: true,
			}, nil
		} else if result.Error != nil {
			return nil, result.Error
		}

		return &adminUser, nil
	}

	var user models.User
	result := app.DB.First(&user, id)
	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return nil, errors.New("user not found")
	} else if result.Error != nil {
		return nil, result.Error
	}

	var subscription models.Subscription
	subResult := app.DB.Where("user_id = ? AND status = 'active'", id).
		Preload("Plan").First(&subscription)
	if subResult.Error == nil {
		user.ActivePlan = &subscription
	}

	return &user, nil
}

func (s *UserService) UpdateUser(user *models.User) error {
	return app.DB.Save(user).Error
}

// VerifyEmail проверяет токен верификации и активирует аккаунт пользователя
func (s *UserService) VerifyEmail(token string) error {
	if token == "" {
		return errors.New("verification token is required")
	}

	var user models.User
	result := app.DB.Where("verification_token = ?", token).First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return errors.New("invalid verification token")
		}
		return result.Error
	}

	// Проверяем, не истек ли срок действия токена
	if user.TokenExpiresAt != nil && user.TokenExpiresAt.Before(time.Now()) {
		return errors.New("verification token has expired")
	}

	// Устанавливаем флаг подтверждения email и очищаем токен
	user.IsEmailVerified = true
	user.VerificationToken = ""
	user.TokenExpiresAt = nil

	return app.DB.Save(&user).Error
}

// ResendVerificationEmail отправляет новое письмо с подтверждением
func (s *UserService) ResendVerificationEmail(userEmail string) error {
	var user models.User
	result := app.DB.Where("email = ?", userEmail).First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return errors.New("user not found")
		}
		return result.Error
	}

	// Если email уже подтвержден, вернуть ошибку
	if user.IsEmailVerified {
		return errors.New("email already verified")
	}

	// Генерируем новый токен
	token, err := s.generateVerificationToken()
	if err != nil {
		return fmt.Errorf("error generating verification token: %w", err)
	}

	// Обновляем токен и срок действия
	user.VerificationToken = token
	expiresAt := time.Now().Add(24 * time.Hour)
	user.TokenExpiresAt = &expiresAt

	if err := app.DB.Save(&user).Error; err != nil {
		return err
	}

	// Отправляем новое письмо
	userName := user.FirstName
	if userName == "" {
		userName = "пользователь"
	}

	return email.SendVerificationEmail(user.Email, userName, token)
}

// generateVerificationToken создает новый случайный токен
func (s *UserService) generateVerificationToken() (string, error) {
	b := make([]byte, 16)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

// NewUserService создает новый экземпляр сервиса пользователей
func NewUserService() *UserService {
	return &UserService{}
}
