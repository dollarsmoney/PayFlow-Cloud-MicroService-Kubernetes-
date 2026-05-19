package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/payflow/payment-service/internal/interfaces/http"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	router := gin.Default()

	// Health check — required by Kubernetes readiness/liveness probes
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Setup routes
	api := router.Group("/api/v1/payments")
	{
		api.POST("/process", http.ProcessPayment)
		api.GET("/:id/status", http.GetPaymentStatus)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Payment Service running on port %s", port)
	router.Run(":" + port)
}
