package services

import (
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt"
	"github.com/saneechka/ManageSubscription/internal/app"
	"github.com/saneechka/ManageSubscription/internal/models"
	"gorm.io/gorm"
)


type JWTClaims struct {
	UserID uint `json:"user_id"`
	jwt.StandardClaims
}


type UserService struct{}


func (s *UserService) Register(user *models.User) error {

	if app.DB == nil {
		return errors.New("database connection is nil")
	}


	var existingUser models.User
	result := app.DB.Where("email = ?", user.Email).First(&existingUser)
	if result.Error == nil {
		return errors.New("user with this email already exists")
	} else if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return fmt.Errorf("database error while checking existing user: %w", result.Error)
	}


	if err := user.HashPassword(); err != nil {
		return fmt.Errorf("error hashing password: %w", err)
	}


	if err := app.DB.Create(user).Error; err != nil {
		return fmt.Errorf("error creating user: %w", err)
	}

	return nil
}


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

		adminID := uint(1) 


		token, err := s.GenerateJWT(adminID)
		if err != nil {
			return "", err
		}

		return token, nil
	}


	var user models.User
	result := app.DB.Where("email = ?", email).First(&user)
	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return "", errors.New("invalid email or password")
	} else if result.Error != nil {
		return "", result.Error
	}


	if err := user.CheckPassword(password); err != nil {
		return "", errors.New("invalid email or password")
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
				ID:        1,
				Email:     masterEmail,
				FirstName: "Admin",
				LastName:  "User",
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
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
