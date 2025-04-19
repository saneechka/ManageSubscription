package main

import (
	"log"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/saneechka/ManageSubscription/internal/app"
	"github.com/saneechka/ManageSubscription/internal/handlers"
	"github.com/saneechka/ManageSubscription/internal/middleware"
)

func main() {
	
	projectRoot, _ := filepath.Abs(filepath.Join(filepath.Dir(os.Args[0]), ".."))
	if err := godotenv.Load(filepath.Join(projectRoot, ".env")); err != nil {
		log.Printf("Warning: .env file not found at %s, using environment variables", filepath.Join(projectRoot, ".env"))


		if err := godotenv.Load(); err != nil {
			log.Println("Warning: .env file not found in current directory, using environment variables")
		}
	}


	app.InitDB()
	defer app.CloseDB()


	router := gin.Default()


	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Origin, Authorization, Content-Type")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})


	router.Static("/static", "./web/frontend/build/static")
	router.StaticFile("/favicon.ico", "./web/frontend/build/favicon.ico")
	router.StaticFile("/manifest.json", "./web/frontend/build/manifest.json")
	router.StaticFile("/logo192.png", "./web/frontend/build/logo192.png")
	router.StaticFile("/logo512.png", "./web/frontend/build/logo512.png")


	userHandler := handlers.NewUserHandler()
	planHandler := handlers.NewPlanHandler()
	subscriptionHandler := handlers.NewSubscriptionHandler()


	api := router.Group("/api")
	{

		api.POST("/register", userHandler.Register)
		api.POST("/login", userHandler.Login)


		api.GET("/plans", planHandler.GetAllPlans)
		api.GET("/plans/:id", planHandler.GetPlanByID)
		api.GET("/plans/filter", planHandler.FilterPlansByPrice)


		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware())
		{

			protected.GET("/profile", userHandler.GetProfile)
			protected.PUT("/profile", userHandler.UpdateProfile)


			protected.GET("/subscriptions", subscriptionHandler.GetUserSubscriptions)
			protected.GET("/subscriptions/active", subscriptionHandler.GetActiveSubscriptions)
			protected.GET("/subscriptions/search", subscriptionHandler.SearchSubscriptions)
			protected.GET("/subscriptions/:id", subscriptionHandler.GetSubscriptionByID)
			protected.POST("/subscriptions", subscriptionHandler.Subscribe)
			protected.PUT("/subscriptions/:id/cancel", subscriptionHandler.CancelSubscription)
			protected.PUT("/subscriptions/:id/auto-renew", subscriptionHandler.UpdateAutoRenewal)
			protected.PUT("/subscriptions/:id/renew", subscriptionHandler.RenewSubscription)
			protected.GET("/subscriptions/stats", subscriptionHandler.GetSubscriptionStats)


			admin := protected.Group("/admin")
			admin.Use(middleware.AdminRequired())
			{
				admin.POST("/plans", planHandler.CreatePlan)
				admin.PUT("/plans/:id", planHandler.UpdatePlan)
				admin.DELETE("/plans/:id", planHandler.DeletePlan)
			}
		}
	}


	router.NoRoute(func(c *gin.Context) {
		c.File("./web/frontend/build/index.html")
	})


	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server running on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
