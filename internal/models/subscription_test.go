package models

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestSubscriptionActiveExpiredDays(t *testing.T) {
	now := time.Now()

	sub := Subscription{
		StartDate: now.Add(-2 * time.Hour),
		EndDate:   now.Add(48 * time.Hour),
		Status:    "active",
	}
	assert.True(t, sub.IsActive(), "Subscription should be active when now between start and end and status active")
	assert.False(t, sub.IsExpired(), "Subscription should not be expired when end date in future")
	days := sub.DaysRemaining()
	assert.GreaterOrEqual(t, days, 1, "DaysRemaining should be at least 1 for future end date")

	expiredSub := Subscription{
		StartDate: now.Add(-48 * time.Hour),
		EndDate:   now.Add(-1 * time.Hour),
		Status:    "active",
	}
	assert.False(t, expiredSub.IsActive(), "Subscription should not be active when end date in past")
	assert.True(t, expiredSub.IsExpired(), "Subscription should be expired when end date in past")
	assert.Equal(t, 0, expiredSub.DaysRemaining(), "DaysRemaining should be 0 for expired subscription")
}
