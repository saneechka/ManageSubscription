package services

import (
	"errors"
	"math"
	"time"

	"github.com/saneechka/ManageSubscription/internal/app"
	"github.com/saneechka/ManageSubscription/internal/models"
)

type SubscriptionService struct{}

func NewSubscriptionService() *SubscriptionService {
	return &SubscriptionService{}
}

func (s *SubscriptionService) GetUserSubscriptions(userID uint) ([]models.Subscription, error) {
	var subscriptions []models.Subscription
	result := app.DB.Where("user_id = ?", userID).
		Preload("Plan").
		Order("created_at desc").
		Find(&subscriptions)

	if result.Error != nil {
		return nil, result.Error
	}

	return subscriptions, nil
}

func (s *SubscriptionService) GetActiveSubscriptions(userID uint) ([]models.Subscription, error) {
	var subscriptions []models.Subscription
	result := app.DB.Where("user_id = ? AND status = ?", userID, "active").
		Preload("Plan").
		Order("end_date asc").
		Find(&subscriptions)

	if result.Error != nil {
		return nil, result.Error
	}

	return subscriptions, nil
}

func (s *SubscriptionService) GetSubscriptionStats(userID uint) (map[string]interface{}, error) {
	type PlanWithMonthlyPrice struct {
		models.Plan
		MonthlyPrice float64
	}

	// Получаем все активные подписки пользователя
	subscriptions, err := s.GetActiveSubscriptions(userID)
	if err != nil {
		return nil, err
	}

	// Рассчитываем общую ежемесячную стоимость
	var totalMonthlySpending float64 = 0
	for _, sub := range subscriptions {
		monthlyPrice := sub.Plan.GetMonthlyPrice()
		// Проверка на NaN и бесконечность
		if !math.IsNaN(monthlyPrice) && !math.IsInf(monthlyPrice, 0) {
			totalMonthlySpending += monthlyPrice
		}
	}

	// Создаем структуру статистики
	stats := map[string]interface{}{
		"active_count":           len(subscriptions),
		"total_monthly_spending": totalMonthlySpending,
	}

	return stats, nil
}

func (s *SubscriptionService) Subscribe(userID uint, planID uint, paymentID string) (*models.Subscription, error) {
	var plan models.Plan
	if err := app.DB.First(&plan, planID).Error; err != nil {
		return nil, errors.New("план подписки не найден")
	}

	now := time.Now()
	subscription := models.Subscription{
		UserID:    userID,
		PlanID:    planID,
		StartDate: now,
		EndDate:   plan.CalculateEndDate(now),
		Status:    "active",
		PaymentID: paymentID,
		AutoRenew: true,
	}

	if err := app.DB.Create(&subscription).Error; err != nil {
		return nil, err
	}

	// Загружаем связанный план в подписку для возврата в ответе
	if err := app.DB.Model(&subscription).Association("Plan").Find(&subscription.Plan); err != nil {
		return nil, err
	}

	return &subscription, nil
}

func (s *SubscriptionService) CancelSubscription(subscriptionID uint) error {
	var subscription models.Subscription
	if err := app.DB.First(&subscription, subscriptionID).Error; err != nil {
		return errors.New("подписка не найдена")
	}

	now := time.Now()
	subscription.Status = "cancelled"
	subscription.AutoRenew = false
	subscription.CancelledAt = &now

	return app.DB.Save(&subscription).Error
}

func (s *SubscriptionService) UpdateAutoRenewal(subscriptionID uint, autoRenew bool) error {
	var subscription models.Subscription
	if err := app.DB.First(&subscription, subscriptionID).Error; err != nil {
		return errors.New("подписка не найдена")
	}

	if subscription.Status != "active" {
		return errors.New("нельзя изменить настройки автопродления для неактивной подписки")
	}

	subscription.AutoRenew = autoRenew
	return app.DB.Save(&subscription).Error
}

func (s *SubscriptionService) RenewSubscriptions() error {

	var subscriptionsToRenew []models.Subscription
	now := time.Now()
	tomorrow := now.Add(24 * time.Hour)

	result := app.DB.Where("status = ? AND auto_renew = ? AND end_date BETWEEN ? AND ?",
		"active", true, now, tomorrow).
		Preload("Plan").
		Find(&subscriptionsToRenew)

	if result.Error != nil {
		return result.Error
	}

	for _, sub := range subscriptionsToRenew {

		renewalDate := now
		sub.StartDate = sub.EndDate
		sub.EndDate = sub.Plan.CalculateEndDate(sub.EndDate)
		sub.RenewalDate = &renewalDate

		if err := app.DB.Save(&sub).Error; err != nil {

			continue
		}
	}

	return nil
}

func (s *SubscriptionService) CheckExpiredSubscriptions() error {
	var expiredSubscriptions []models.Subscription
	now := time.Now()

	result := app.DB.Where("status = ? AND end_date < ?", "active", now).
		Find(&expiredSubscriptions)

	if result.Error != nil {
		return result.Error
	}

	for _, sub := range expiredSubscriptions {
		sub.Status = "expired"
		if err := app.DB.Save(&sub).Error; err != nil {

			continue
		}
	}

	return nil
}

func (s *SubscriptionService) GetSubscriptionByID(subscriptionID uint) (*models.Subscription, error) {
	var subscription models.Subscription
	result := app.DB.Where("id = ?", subscriptionID).
		Preload("Plan").
		First(&subscription)

	if result.Error != nil {
		return nil, errors.New("подписка не найдена")
	}

	return &subscription, nil
}

func (s *SubscriptionService) GetSubscriptionsByProviderName(userID uint, providerName string) ([]models.Subscription, error) {
	var subscriptions []models.Subscription

	result := app.DB.Joins("JOIN plans ON subscriptions.plan_id = plans.id").
		Where("subscriptions.user_id = ? AND plans.name LIKE ?", userID, "%"+providerName+"%").
		Preload("Plan").
		Find(&subscriptions)

	if result.Error != nil {
		return nil, result.Error
	}

	return subscriptions, nil
}

func (s *SubscriptionService) SearchSubscriptions(userID uint, query string, status string, sortBy string) ([]models.Subscription, error) {
	var subscriptions []models.Subscription

	dbQuery := app.DB.Where("user_id = ?", userID)

	if status != "" {
		dbQuery = dbQuery.Where("status = ?", status)
	}

	if query != "" {
		dbQuery = dbQuery.Joins("JOIN plans ON subscriptions.plan_id = plans.id").
			Where("plans.name LIKE ?", "%"+query+"%")
	}

	switch sortBy {
	case "price_asc":
		dbQuery = dbQuery.Joins("JOIN plans ON subscriptions.plan_id = plans.id").
			Order("plans.price ASC")
	case "price_desc":
		dbQuery = dbQuery.Joins("JOIN plans ON subscriptions.plan_id = plans.id").
			Order("plans.price DESC")
	case "date_asc":
		dbQuery = dbQuery.Order("created_at ASC")
	case "date_desc":
		dbQuery = dbQuery.Order("created_at DESC")
	default:
		dbQuery = dbQuery.Order("created_at DESC")
	}

	result := dbQuery.Preload("Plan").Find(&subscriptions)

	if result.Error != nil {
		return nil, result.Error
	}

	return subscriptions, nil
}

// RenewSubscription обновляет подписку на новый период
func (s *SubscriptionService) RenewSubscription(subscriptionID uint) error {
	var subscription models.Subscription
	if err := app.DB.Preload("Plan").First(&subscription, subscriptionID).Error; err != nil {
		return errors.New("подписка не найдена")
	}

	if subscription.Status != "active" && subscription.Status != "expired" {
		return errors.New("можно продлить только активную или истекшую подписку")
	}

	// Обновляем даты
	now := time.Now()
	newStartDate := now

	// Если подписка еще не истекла, продлеваем от даты окончания
	if subscription.Status == "active" && subscription.EndDate.After(now) {
		newStartDate = subscription.EndDate
	}

	subscription.StartDate = newStartDate
	subscription.EndDate = subscription.Plan.CalculateEndDate(newStartDate)
	subscription.Status = "active"
	subscription.RenewalDate = &now

	return app.DB.Save(&subscription).Error
}

// GetPlansForService возвращает все доступные планы подписки для указанного сервиса
// Это позволит получить как месячные, так и годовые варианты одного сервиса
func (s *SubscriptionService) GetPlansForService(serviceName string) ([]models.Plan, error) {
	var plans []models.Plan
	result := app.DB.Where("name = ? AND is_active = true", serviceName).
		Order("duration asc").
		Find(&plans)

	if result.Error != nil {
		return nil, result.Error
	}

	return plans, nil
}

// GetRelatedPlans возвращает все планы, связанные с указанным планом (по имени сервиса)
// Например, для месячного плана найдет годовой и наоборот
func (s *SubscriptionService) GetRelatedPlans(planID uint) ([]models.Plan, error) {
	var basePlan models.Plan
	if err := app.DB.First(&basePlan, planID).Error; err != nil {
		return nil, errors.New("план не найден")
	}

	var relatedPlans []models.Plan
	result := app.DB.Where("name = ? AND is_active = true AND id != ?", basePlan.Name, planID).
		Order("duration asc").
		Find(&relatedPlans)

	if result.Error != nil {
		return nil, result.Error
	}

	return relatedPlans, nil
}
