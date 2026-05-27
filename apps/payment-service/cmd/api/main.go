package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	infradb "github.com/payflow/payment-service/internal/infrastructure/db"
	httphandlers "github.com/payflow/payment-service/internal/interfaces/http"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Connect to Postgres (with retry)
	infradb.Connect()

	router := gin.Default()

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "payment-service"})
	})

	// Payment routes
	api := router.Group("/api/v1/payments")
	{
		api.POST("/process",            httphandlers.ProcessPayment)
		api.GET("/:id/status",          httphandlers.GetPaymentStatus)
		api.GET("/user/:userId",         httphandlers.GetUserPayments)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("[PaymentService] Running on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
