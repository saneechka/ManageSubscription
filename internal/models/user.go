package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type User struct {
	ID                uint           `gorm:"primarykey;type:int unsigned" json:"id"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `gorm:"index" json:"-"`
	Email             string         `gorm:"type:varchar(100);uniqueIndex" json:"email"`
	Password          string         `gorm:"type:varchar(100)" json:"password"`
	FirstName         string         `gorm:"type:varchar(100)" json:"first_name"`
	LastName          string         `gorm:"type:varchar(100)" json:"last_name"`
	ActivePlan        *Subscription  `gorm:"foreignkey:UserID;references:ID" json:"active_plan,omitempty"`
	PaymentMethod     string         `json:"payment_method,omitempty"`
	IsEmailVerified   bool           `gorm:"default:false" json:"is_email_verified"`
	VerificationToken string         `gorm:"type:varchar(100)" json:"-"`
	TokenExpiresAt    *time.Time     `json:"-"`
}

func (u *User) HashPassword() error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(hashedPassword)
	return nil
}

func (u *User) CheckPassword(password string) error {
	return bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
}
