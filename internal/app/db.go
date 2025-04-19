package app

import (
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
	"github.com/saneechka/ManageSubscription/internal/models"
	gormysql "gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)


var DB *gorm.DB


func InitDB() {
	var err error


	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	dbUser := getEnv("DB_USER", "root")
	dbPassword := getEnv("DB_PASSWORD", "")
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "3306")
	dbName := getEnv("DB_NAME", "subscription_manager")


	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		dbUser, dbPassword, dbHost, dbPort, dbName)

	log.Printf("Attempting to connect to MySQL at %s:%s...", dbHost, dbPort)


	gormLogger := logger.Default
	if getEnv("DEBUG", "false") == "true" {
		gormLogger = logger.Default.LogMode(logger.Info)
	}


	maxRetries := 5
	for i := 0; i < maxRetries; i++ {
		DB, err = gorm.Open(gormysql.Open(dsn), &gorm.Config{
			Logger: gormLogger,
		})

		if err == nil {
			break
		}

		log.Printf("Failed to connect to database (attempt %d/%d): %v", i+1, maxRetries, err)


		if i == 1 {
			tryCreateDatabase(dbUser, dbPassword, dbHost, dbPort, dbName)
		}

		if i < maxRetries-1 {
			log.Println("Retrying in 3 seconds...")
			time.Sleep(3 * time.Second)
		}
	}

	if err != nil {
		log.Fatalf("Failed to connect to database after %d attempts: %v", maxRetries, err)
	}


	sqlDB, err := DB.DB()
	if err != nil {
		log.Fatalf("Failed to get database connection: %v", err)
	}
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)


	log.Println("Auto-migrating database schema...")
	err = DB.AutoMigrate(&models.User{}, &models.Plan{}, &models.Subscription{})
	if err != nil {
		log.Fatalf("Failed to migrate database schema: %v", err)
	}


	SeedPopularSubscriptions()

	log.Println("Database connection established successfully")
}


func tryCreateDatabase(dbUser, dbPassword, dbHost, dbPort, dbName string) {
	log.Printf("Attempting to create database %s if it doesn't exist...", dbName)


	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/", dbUser, dbPassword, dbHost, dbPort)


	dialector := gormysql.Open(dsn)
	db, err := gorm.Open(dialector, &gorm.Config{})

	if err != nil {
		log.Printf("Failed to connect to MySQL server: %v", err)
		return
	}


	err = db.Exec(fmt.Sprintf("CREATE DATABASE IF NOT EXISTS %s", dbName)).Error
	if err != nil {
		log.Printf("Failed to create database: %v", err)
	} else {
		log.Printf("Database %s created or already exists", dbName)
	}


	sqlDB, _ := db.DB()
	if sqlDB != nil {
		sqlDB.Close()
	}
}


func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}


func CloseDB() {
	if DB != nil {
		sqlDB, err := DB.DB()
		if err == nil && sqlDB != nil {
			sqlDB.Close()
			log.Println("Database connection closed")
		}
	}
}
