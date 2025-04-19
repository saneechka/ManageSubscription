package models

import (
	"time"

	"gorm.io/gorm"
)


type Subscription struct {
	ID          uint           `json:"id" gorm:"primarykey;type:int unsigned;auto_increment"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
	UserID      uint           `json:"user_id" gorm:"column:user_id;type:bigint unsigned"`
	PlanID      uint           `json:"plan_id" gorm:"column:plan_id;type:bigint unsigned"`
	Plan        Plan           `json:"plan"`
	StartDate   time.Time      `json:"start_date"`
	EndDate     time.Time      `json:"end_date"`
	Status      string         `gorm:"type:varchar(20)" json:"status"` 
	RenewalDate *time.Time     `json:"renewal_date,omitempty"`
	CancelledAt *time.Time     `json:"cancelled_at,omitempty"`
	PaymentID   string         `json:"payment_id,omitempty" gorm:"type:longtext"`
	StripeSubID string         `json:"stripe_sub_id,omitempty" gorm:"type:longtext"`
	AutoRenew   bool           `gorm:"default:true" json:"auto_renew"`
}


func (s *Subscription) IsActive() bool {
	now := time.Now()
	return s.Status == "active" && now.After(s.StartDate) && now.Before(s.EndDate)
}


func (s *Subscription) IsExpired() bool {
	return time.Now().After(s.EndDate)
}


func (s *Subscription) DaysRemaining() int {
	now := time.Now()
	if !s.IsActive() {
		return 0
	}

	
	remainingHours := s.EndDate.Sub(now).Hours()
	if remainingHours <= 0 {
		return 0
	}


	remainingDays := int((remainingHours + 23) / 24)
	return remainingDays
}
