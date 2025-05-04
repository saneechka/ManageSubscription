package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/saneechka/ManageSubscription/internal/models"
	"github.com/saneechka/ManageSubscription/internal/services"
	serializer "github.com/saneechka/serializer/gin"
)

type UserHandler struct {
	userService services.UserService
}

func NewUserHandler() *UserHandler {
	return &UserHandler{
		userService: services.UserService{},
	}
}

func (h *UserHandler) Register(c *gin.Context) {
	var user models.User
	if err := serializer.MyBindJSON(c, &user); err != nil {
		serializer.MyJSON(c, http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.userService.Register(&user); err != nil {
		serializer.MyJSON(c, http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	serializer.MyJSON(c, http.StatusCreated, gin.H{
		"message": "Регистрация прошла успешно. Проверьте вашу электронную почту для подтверждения аккаунта.",
		"user":    user,
	})
}

func (h *UserHandler) VerifyEmail(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		serializer.MyJSON(c, http.StatusBadRequest, gin.H{"error": "Токен подтверждения отсутствует"})
		return
	}

	if err := h.userService.VerifyEmail(token); err != nil {
		serializer.MyJSON(c, http.StatusBadRequest, gin.H{"error": "Ошибка подтверждения email: " + err.Error()})
		return
	}

	serializer.MyJSON(c, http.StatusOK, gin.H{"message": "Email успешно подтвержден. Теперь вы можете войти в систему."})
}

func (h *UserHandler) ResendVerification(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}

	if err := serializer.MyBindJSON(c, &req); err != nil {
		serializer.MyJSON(c, http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.userService.ResendVerificationEmail(req.Email); err != nil {
		serializer.MyJSON(c, http.StatusBadRequest, gin.H{"error": "Ошибка отправки письма: " + err.Error()})
		return
	}

	serializer.MyJSON(c, http.StatusOK, gin.H{"message": "Письмо с подтверждением отправлено повторно. Проверьте вашу электронную почту."})
}

func (h *UserHandler) Login(c *gin.Context) {
	var credentials struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := serializer.MyBindJSON(c, &credentials); err != nil {
		serializer.MyJSON(c, http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	token, err := h.userService.Login(credentials.Email, credentials.Password)
	if err != nil {
		serializer.MyJSON(c, http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	serializer.MyJSON(c, http.StatusOK, gin.H{"token": token})
}

func (h *UserHandler) GetProfile(c *gin.Context) {
	userID, _ := c.Get("userID")

	user, err := h.userService.GetUserByID(userID.(uint))
	if err != nil {
		serializer.MyJSON(c, http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	serializer.MyJSON(c, http.StatusOK, gin.H{"user": user})
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID, _ := c.Get("userID")

	var userData struct {
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
	}

	if err := serializer.MyBindJSON(c, &userData); err != nil {
		serializer.MyJSON(c, http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.userService.GetUserByID(userID.(uint))
	if err != nil {
		serializer.MyJSON(c, http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	user.FirstName = userData.FirstName
	user.LastName = userData.LastName

	if err := h.userService.UpdateUser(user); err != nil {
		serializer.MyJSON(c, http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	serializer.MyJSON(c, http.StatusOK, gin.H{"message": "Profile updated successfully", "user": user})
}
