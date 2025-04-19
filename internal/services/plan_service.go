package services

import (
	"errors"

	"github.com/saneechka/ManageSubscription/internal/app"
	"github.com/saneechka/ManageSubscription/internal/models"
)


type PlanService struct{}


func NewPlanService() *PlanService {
	return &PlanService{}
}


func (s *PlanService) GetAllPlans() ([]models.Plan, error) {
	var plans []models.Plan
	if err := app.DB.Find(&plans).Error; err != nil {
		return nil, err
	}
	return plans, nil
}


func (s *PlanService) GetPlanByID(id uint) (*models.Plan, error) {
	var plan models.Plan
	result := app.DB.First(&plan, id)
	if result.Error != nil {
		return nil, errors.New("plan not found")
	}
	return &plan, nil
}


func (s *PlanService) CreatePlan(plan *models.Plan) error {
	return app.DB.Create(plan).Error
}


func (s *PlanService) UpdatePlan(plan *models.Plan) error {
	var existingPlan models.Plan
	result := app.DB.First(&existingPlan, plan.ID)
	if result.Error != nil {
		return errors.New("plan not found")
	}
	return app.DB.Save(plan).Error
}


func (s *PlanService) DeletePlan(id uint) error {
	var plan models.Plan
	result := app.DB.First(&plan, id)
	if result.Error != nil {
		return errors.New("plan not found")
	}


	return app.DB.Delete(&plan).Error
}


func (s *PlanService) GetPlansByPrice(minPrice, maxPrice float64) ([]models.Plan, error) {
	var plans []models.Plan
	if err := app.DB.Where("price >= ? AND price <= ?", minPrice, maxPrice).
		Find(&plans).Error; err != nil {
		return nil, err
	}
	return plans, nil
}
