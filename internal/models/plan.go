package models

import (
	"strconv"
	"time"

	"gorm.io/gorm"
)

type Plan struct {
	ID          uint           `json:"id" gorm:"primarykey;type:int unsigned"`
	Name        string         `json:"name" gorm:"type:varchar(255);not null"`
	Description string         `json:"description" gorm:"type:varchar(1000)"`
	Price       float64        `json:"price" gorm:"type:decimal(10,2);not null"`
	Duration    int            `json:"duration" gorm:"not null"`
	PeriodType  string         `json:"period_type" gorm:"type:varchar(20);default:'days'"`
	Features    string         `json:"features" gorm:"type:text"`
	IsPopular   bool           `json:"is_popular" gorm:"default:false"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
	IsActive    bool           `json:"is_active" gorm:"default:true"`
	ServiceIcon string         `json:"service_icon" gorm:"type:varchar(255)"`
	ServiceType string         `json:"service_type" gorm:"type:varchar(100)"`
	ServiceURL  string         `json:"service_url" gorm:"type:varchar(255)"`
}

func (p *Plan) GetMonthlyPrice() float64 {
	switch p.PeriodType {
	case "months":
		// Предотвращение деления на ноль
		if p.Duration <= 0 {
			return p.Price
		}
		return p.Price / float64(p.Duration)
	case "years":
		// Предотвращение деления на ноль
		if p.Duration <= 0 {
			return p.Price / 12 // По умолчанию делим на 12 месяцев
		}
		return p.Price / (float64(p.Duration) * 12)
	default:
		// Предотвращение деления на ноль
		if p.Duration <= 0 {
			return p.Price
		}
		return (p.Price * 30) / float64(p.Duration)
	}
}

func (p *Plan) GetFormattedPeriod() string {
	switch p.PeriodType {
	case "months":
		if p.Duration == 1 {
			return "месяц"
		} else if p.Duration > 1 && p.Duration < 5 {
			return strconv.Itoa(p.Duration) + " месяца"
		} else {
			return strconv.Itoa(p.Duration) + " месяцев"
		}
	case "years":
		if p.Duration == 1 {
			return "год"
		} else if p.Duration > 1 && p.Duration < 5 {
			return strconv.Itoa(p.Duration) + " года"
		} else {
			return strconv.Itoa(p.Duration) + " лет"
		}
	default:
		if p.Duration == 30 || p.Duration == 31 {
			return "месяц"
		} else if p.Duration == 90 || p.Duration == 91 {
			return "3 месяца"
		} else if p.Duration == 180 || p.Duration == 182 {
			return "6 месяцев"
		} else if p.Duration == 365 || p.Duration == 366 {
			return "год"
		} else {
			return strconv.Itoa(p.Duration) + " дней"
		}
	}
}

func (p *Plan) CalculateEndDate(startDate time.Time) time.Time {
	switch p.PeriodType {
	case "months":
		return startDate.AddDate(0, p.Duration, 0)
	case "years":
		return startDate.AddDate(p.Duration, 0, 0)
	default:
		if p.Duration >= 28 && p.Duration <= 31 {

			return startDate.AddDate(0, 1, 0)
		} else if p.Duration >= 89 && p.Duration <= 92 {

			return startDate.AddDate(0, 3, 0)
		} else if p.Duration >= 179 && p.Duration <= 182 {

			return startDate.AddDate(0, 6, 0)
		} else if p.Duration >= 364 && p.Duration <= 366 {

			return startDate.AddDate(1, 0, 0)
		} else {

			return startDate.AddDate(0, 0, p.Duration)
		}
	}
}
