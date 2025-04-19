package models

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestGetMonthlyPrice(t *testing.T) {
	cases := []struct {
		periodType string
		duration   int
		price      float64
		expected   float64
	}{
		{"months", 1, 300, 300},
		{"years", 1, 1200, 100},
		{"days", 30, 300, 300},
		{"", 30, 300, 300},
	}

	for _, c := range cases {
		p := Plan{PeriodType: c.periodType, Duration: c.duration, Price: c.price}
		assert.Equal(t, c.expected, p.GetMonthlyPrice(), "PeriodType: %s, Duration: %d", c.periodType, c.duration)
	}
}



func TestGetFormattedPeriod(t *testing.T) {
	cases := []struct {
		periodType string
		duration   int
		expected   string
	}{
		{"months", 1, "месяц"},
		{"months", 2, "2 месяца"},
		{"months", 5, "5 месяцев"},
		{"years", 1, "год"},
		{"years", 3, "3 года"},
		{"", 30, "месяц"},
		{"", 90, "3 месяца"},
		{"", 365, "год"},
		{"", 45, "45 дней"},
	}

	for _, c := range cases {
		p := Plan{PeriodType: c.periodType, Duration: c.duration}
		assert.Equal(t, c.expected, p.GetFormattedPeriod(), "PeriodType: %s, Duration: %d", c.periodType, c.duration)
	}
}

func TestGetFormattedPeriodDefaultSpecials(t *testing.T) {
	cases := []struct {
		duration int
		expected string
	}{
		{31, "месяц"},
		{91, "3 месяца"},
		{180, "6 месяцев"},
		{182, "6 месяцев"},
		{366, "год"},
		{20, "20 дней"},
	}
	for _, c := range cases {
		p := Plan{PeriodType: "", Duration: c.duration}
		assert.Equal(t, c.expected, p.GetFormattedPeriod(), "Duration: %d", c.duration)
	}
}

func TestCalculateEndDate(t *testing.T) {
	start := time.Date(2022, 1, 1, 12, 0, 0, 0, time.UTC)

	p1 := Plan{PeriodType: "months", Duration: 2}
	exp1 := start.AddDate(0, 2, 0)
	assert.Equal(t, exp1, p1.CalculateEndDate(start))

	p2 := Plan{PeriodType: "years", Duration: 1}
	exp2 := start.AddDate(1, 0, 0)
	assert.Equal(t, exp2, p2.CalculateEndDate(start))

	p3 := Plan{PeriodType: "", Duration: 30}
	exp3 := start.AddDate(0, 1, 0)
	assert.Equal(t, exp3, p3.CalculateEndDate(start))

	p4 := Plan{PeriodType: "", Duration: 90}
	exp4 := start.AddDate(0, 3, 0)
	assert.Equal(t, exp4, p4.CalculateEndDate(start))

	p5 := Plan{PeriodType: "", Duration: 10}
	exp5 := start.AddDate(0, 0, 10)
	assert.Equal(t, exp5, p5.CalculateEndDate(start))
}

func TestCalculateEndDateDefaultSpecials(t *testing.T) {
	start := time.Date(2022, 1, 1, 0, 0, 0, 0, time.UTC)
	cases := []struct {
		duration int
		expected time.Time
	}{
		{31, start.AddDate(0, 1, 0)},
		{92, start.AddDate(0, 3, 0)},
		{180, start.AddDate(0, 6, 0)},
		{182, start.AddDate(0, 6, 0)},
		{366, start.AddDate(1, 0, 0)},
		{20, start.AddDate(0, 0, 20)},
	}
	for _, c := range cases {
		p := Plan{PeriodType: "", Duration: c.duration}
		assert.Equal(t, c.expected, p.CalculateEndDate(start), "Duration: %d", c.duration)
	}
}
