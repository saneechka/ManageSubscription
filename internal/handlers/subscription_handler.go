package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/saneechka/ManageSubscription/internal/services"
)

type SubscriptionHandler struct {
	subscriptionService *services.SubscriptionService
}

func NewSubscriptionHandler() *SubscriptionHandler {
	return &SubscriptionHandler{
		subscriptionService: services.NewSubscriptionService(),
	}
}

func (h *SubscriptionHandler) GetUserSubscriptions(c *gin.Context) {

	userID := c.MustGet("userID").(uint)

	subscriptions, err := h.subscriptionService.GetUserSubscriptions(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error retrieving subscriptions: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"subscriptions": subscriptions,
	})
}

func (h *SubscriptionHandler) GetActiveSubscriptions(c *gin.Context) {
	userID := c.MustGet("userID").(uint)

	subscriptions, err := h.subscriptionService.GetActiveSubscriptions(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error retrieving active subscriptions: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"active_subscriptions": subscriptions,
	})
}

func (h *SubscriptionHandler) GetSubscriptionStats(c *gin.Context) {

	userID := c.MustGet("userID").(uint)

	stats, err := h.subscriptionService.GetSubscriptionStats(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error retrieving subscription stats: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"stats": stats,
	})
}

type SubscribeRequest struct {
	PlanID    uint   `json:"plan_id"`
	PaymentID string `json:"payment_id"`
}

func (h *SubscriptionHandler) Subscribe(c *gin.Context) {

	userID := c.MustGet("userID").(uint)

	var request SubscribeRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data: " + err.Error(),
		})
		return
	}

	subscription, err := h.subscriptionService.Subscribe(userID, request.PlanID, request.PaymentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error creating subscription: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"subscription": subscription,
		"message":      "Подписка успешно оформлена",
	})
}

func (h *SubscriptionHandler) CancelSubscription(c *gin.Context) {

	userID := c.MustGet("userID").(uint)

	subscriptionID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid subscription ID",
		})
		return
	}

	subscription, err := h.subscriptionService.GetSubscriptionByID(uint(subscriptionID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error verifying subscription: " + err.Error(),
		})
		return
	}

	if subscription.UserID != userID {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Subscription not found or not owned by user",
		})
		return
	}

	err = h.subscriptionService.CancelSubscription(uint(subscriptionID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error cancelling subscription: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Подписка успешно отменена",
	})
}

type AutoRenewRequest struct {
	AutoRenew bool `json:"auto_renew"`
}

func (h *SubscriptionHandler) UpdateAutoRenewal(c *gin.Context) {

	userID := c.MustGet("userID").(uint)

	subscriptionID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid subscription ID",
		})
		return
	}

	subscription, err := h.subscriptionService.GetSubscriptionByID(uint(subscriptionID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error verifying subscription: " + err.Error(),
		})
		return
	}

	if subscription.UserID != userID {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Subscription not found or not owned by user",
		})
		return
	}

	var request AutoRenewRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data: " + err.Error(),
		})
		return
	}

	err = h.subscriptionService.UpdateAutoRenewal(uint(subscriptionID), request.AutoRenew)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error updating auto-renewal: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Настройки автопродления успешно обновлены",
	})
}

func (h *SubscriptionHandler) GetSubscriptionByID(c *gin.Context) {

	userID := c.MustGet("userID").(uint)

	subscriptionID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Неверный ID подписки",
		})
		return
	}

	subscription, err := h.subscriptionService.GetSubscriptionByID(uint(subscriptionID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка при получении подписки: " + err.Error(),
		})
		return
	}

	if subscription.UserID != userID {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Подписка не найдена или не принадлежит пользователю",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"subscription": subscription,
	})
}

func (h *SubscriptionHandler) SearchSubscriptions(c *gin.Context) {

	userID := c.MustGet("userID").(uint)

	query := c.Query("query")
	status := c.Query("status")
	sortBy := c.Query("sort_by")

	subscriptions, err := h.subscriptionService.SearchSubscriptions(
		userID,
		query,
		status,
		sortBy,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка при поиске подписок: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"subscriptions": subscriptions,
	})
}

func (h *SubscriptionHandler) RenewSubscription(c *gin.Context) {

	userID := c.MustGet("userID").(uint)

	subscriptionID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Неверный ID подписки",
		})
		return
	}

	subscription, err := h.subscriptionService.GetSubscriptionByID(uint(subscriptionID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка при получении подписки: " + err.Error(),
		})
		return
	}

	if subscription.UserID != userID {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Подписка не найдена или не принадлежит пользователю",
		})
		return
	}

	if err := h.subscriptionService.RenewSubscription(uint(subscriptionID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка при продлении подписки: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Подписка успешно продлена",
	})
}

// GetRelatedPlans возвращает все планы, связанные с указанным планом (месячные/годовые варианты)
func (h *SubscriptionHandler) GetRelatedPlans(c *gin.Context) {
	// Получаем ID плана из параметра запроса
	planIDStr := c.Param("planId")
	planID, err := strconv.ParseUint(planIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Неверный ID плана: " + err.Error(),
		})
		return
	}

	// Получаем связанные планы через сервис
	relatedPlans, err := h.subscriptionService.GetRelatedPlans(uint(planID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка при получении связанных планов: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"related_plans": relatedPlans,
	})
}

// GetPlansForService возвращает все планы для указанного сервиса
func (h *SubscriptionHandler) GetPlansForService(c *gin.Context) {
	// Получаем название сервиса из запроса
	serviceName := c.Query("name")
	if serviceName == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Название сервиса не указано",
		})
		return
	}

	// Получаем все планы для сервиса
	plans, err := h.subscriptionService.GetPlansForService(serviceName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка при получении планов: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"plans": plans,
	})
}
